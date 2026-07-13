import mongoose, { Model, HydratedDocument } from "mongoose";

const dbAttivo = () => mongoose.connection.readyState === 1;

/** Filtro semplice: uguaglianza o { $ne: valore } per campo. */
export type Filtro = Record<string, unknown>;

export interface OpzioniElenco {
  /** Numero massimo di elementi (i più recenti). */
  limite?: number;
  filtro?: Filtro;
  /**
   * Proiezione: carica solo questi campi dal DB (es. dashboard, che aggrega
   * migliaia di documenti e non deve trascinarsi avatar/corpo in memoria).
   * In modalità demo viene ignorata (i DTO sono già in memoria).
   */
  campi?: string[];
}

export interface Crud<TDTO, TInput> {
  elenca(userId: string, opzioni?: OpzioniElenco): Promise<TDTO[]>;
  /** Conteggio senza caricare i documenti (dashboard/notifiche). */
  conta(userId: string, filtro?: Filtro): Promise<number>;
  elencaCestino(userId: string): Promise<TDTO[]>;
  crea(userId: string, input: TInput): Promise<TDTO>;
  aggiorna(userId: string, id: string, patch: Partial<TInput>): Promise<TDTO | null>;
  /** Sposta nel cestino (soft delete). */
  elimina(userId: string, id: string): Promise<boolean>;
  /** Ripristina dal cestino. */
  ripristina(userId: string, id: string): Promise<TDTO | null>;
  /** Elimina definitivamente (svuota dal cestino). */
  eliminaDefinitivo(userId: string, id: string): Promise<boolean>;
}

// Valuta il filtro sul DTO in memoria (modalità demo): supporta uguaglianza e $ne.
function corrisponde(dto: Record<string, unknown>, filtro?: Filtro): boolean {
  if (!filtro) return true;
  return Object.entries(filtro).every(([campo, atteso]) => {
    if (atteso && typeof atteso === "object" && "$ne" in atteso) {
      return dto[campo] !== (atteso as { $ne: unknown }).$ne;
    }
    return dto[campo] === atteso;
  });
}

/**
 * CRUD generico per-utente (multi-tenant): ogni risorsa appartiene a un userId
 * e ogni operazione è filtrata per proprietario. Persistenza MongoDB con
 * fallback in memoria (modalità demo) e cestino (soft delete ripristinabile).
 */
export function creaCrud<
  TInput extends Record<string, unknown>,
  TDTO extends { id: string },
>(opts: {
  model: Model<TInput>;
  toDTO: (doc: HydratedDocument<TInput>) => TDTO;
  demo: (input: TInput, id: string) => TDTO;
}): Crud<TDTO, TInput> {
  interface Riga {
    dto: TDTO;
    userId: string;
    cestino: boolean;
  }
  const memoria: Riga[] = [];
  // userId/deletedAt non fanno parte di TInput: query su un modello "loose".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = opts.model as unknown as Model<any>;

  const crud: Crud<TDTO, TInput> = {
    async elenca(userId, opzioni) {
      if (!dbAttivo()) {
        const righe = memoria
          .filter(
            (r) =>
              r.userId === userId &&
              !r.cestino &&
              corrisponde(r.dto as Record<string, unknown>, opzioni?.filtro)
          )
          .map((r) => r.dto);
        return opzioni?.limite ? righe.slice(0, opzioni.limite) : righe;
      }
      let query = model
        .find({ userId, deletedAt: null, ...(opzioni?.filtro ?? {}) })
        .sort({ createdAt: -1 });
      if (opzioni?.campi) query = query.select(opzioni.campi.join(" "));
      if (opzioni?.limite) query = query.limit(opzioni.limite);
      const docs = await query;
      return docs.map(opts.toDTO);
    },
    async conta(userId, filtro) {
      if (!dbAttivo()) {
        return memoria.filter(
          (r) =>
            r.userId === userId &&
            !r.cestino &&
            corrisponde(r.dto as Record<string, unknown>, filtro)
        ).length;
      }
      return model.countDocuments({ userId, deletedAt: null, ...(filtro ?? {}) });
    },
    async elencaCestino(userId) {
      if (!dbAttivo())
        return memoria.filter((r) => r.userId === userId && r.cestino).map((r) => r.dto);
      const docs = await model
        .find({ userId, deletedAt: { $ne: null } })
        .sort({ deletedAt: -1 });
      return docs.map(opts.toDTO);
    },
    async crea(userId, input) {
      if (!dbAttivo()) {
        const dto = opts.demo(
          input,
          `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        );
        memoria.unshift({ dto, userId, cestino: false });
        return dto;
      }
      const doc = await opts.model.create({ ...input, userId });
      return opts.toDTO(doc);
    },
    async aggiorna(userId, id, patch) {
      if (!dbAttivo()) {
        const r = memoria.find(
          (x) => x.userId === userId && x.dto.id === id && !x.cestino
        );
        if (!r) return null;
        r.dto = { ...r.dto, ...patch } as TDTO;
        return r.dto;
      }
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await model.findOneAndUpdate(
        { _id: id, userId, deletedAt: null },
        patch,
        { new: true }
      );
      return doc ? opts.toDTO(doc) : null;
    },
    async elimina(userId, id) {
      if (!dbAttivo()) {
        const r = memoria.find(
          (x) => x.userId === userId && x.dto.id === id && !x.cestino
        );
        if (!r) return false;
        r.cestino = true;
        return true;
      }
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await model.findOneAndUpdate(
        { _id: id, userId, deletedAt: null },
        { deletedAt: new Date() }
      );
      return Boolean(doc);
    },
    async ripristina(userId, id) {
      if (!dbAttivo()) {
        const r = memoria.find(
          (x) => x.userId === userId && x.dto.id === id && x.cestino
        );
        if (!r) return null;
        r.cestino = false;
        return r.dto;
      }
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await model.findOneAndUpdate(
        { _id: id, userId, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true }
      );
      return doc ? opts.toDTO(doc) : null;
    },
    async eliminaDefinitivo(userId, id) {
      if (!dbAttivo()) {
        const i = memoria.findIndex(
          (x) => x.userId === userId && x.dto.id === id && x.cestino
        );
        if (i === -1) return false;
        memoria.splice(i, 1);
        return true;
      }
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await model.findOneAndDelete({ _id: id, userId });
      return Boolean(doc);
    },
  };

  return crud;
}
