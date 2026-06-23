import mongoose, { Model, HydratedDocument } from "mongoose";

const dbAttivo = () => mongoose.connection.readyState === 1;

export interface Crud<TDTO, TInput> {
  elenca(): Promise<TDTO[]>;
  elencaCestino(): Promise<TDTO[]>;
  crea(input: TInput): Promise<TDTO>;
  aggiorna(id: string, patch: Partial<TInput>): Promise<TDTO | null>;
  /** Sposta nel cestino (soft delete). */
  elimina(id: string): Promise<boolean>;
  /** Ripristina dal cestino. */
  ripristina(id: string): Promise<TDTO | null>;
  /** Elimina definitivamente (svuota dal cestino). */
  eliminaDefinitivo(id: string): Promise<boolean>;
}

/**
 * CRUD generico con persistenza MongoDB e fallback in memoria (modalità demo).
 * Supporta il cestino: l'eliminazione è "soft" (ripristinabile) finché non si
 * elimina in modo definitivo. Riusato da tutte le risorse.
 */
export function creaCrud<
  TInput extends Record<string, unknown>,
  TDTO extends { id: string },
>(opts: {
  model: Model<TInput>;
  toDTO: (doc: HydratedDocument<TInput>) => TDTO;
  seed: TDTO[];
  demo: (input: TInput, id: string) => TDTO;
}): Crud<TDTO, TInput> {
  const attivi: TDTO[] = [...opts.seed];
  const cestino: TDTO[] = [];
  // Il campo deletedAt non fa parte di TInput: query svolte su un modello "loose".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = opts.model as unknown as Model<any>;

  return {
    async elenca() {
      if (!dbAttivo()) return [...attivi];
      const docs = await model.find({ deletedAt: null }).sort({ createdAt: -1 });
      return docs.map(opts.toDTO);
    },
    async elencaCestino() {
      if (!dbAttivo()) return [...cestino];
      const docs = await model
        .find({ deletedAt: { $ne: null } })
        .sort({ deletedAt: -1 });
      return docs.map(opts.toDTO);
    },
    async crea(input) {
      if (!dbAttivo()) {
        const dto = opts.demo(input, `demo-${Date.now()}`);
        attivi.unshift(dto);
        return dto;
      }
      const doc = await opts.model.create(input);
      return opts.toDTO(doc);
    },
    async aggiorna(id, patch) {
      if (!dbAttivo()) {
        const i = attivi.findIndex((m) => m.id === id);
        if (i === -1) return null;
        attivi[i] = { ...attivi[i], ...patch } as TDTO;
        return attivi[i];
      }
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        patch,
        { new: true }
      );
      return doc ? opts.toDTO(doc) : null;
    },
    async elimina(id) {
      if (!dbAttivo()) {
        const i = attivi.findIndex((m) => m.id === id);
        if (i === -1) return false;
        cestino.unshift(attivi.splice(i, 1)[0]);
        return true;
      }
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() }
      );
      return Boolean(doc);
    },
    async ripristina(id) {
      if (!dbAttivo()) {
        const i = cestino.findIndex((m) => m.id === id);
        if (i === -1) return null;
        const dto = cestino.splice(i, 1)[0];
        attivi.unshift(dto);
        return dto;
      }
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await model.findByIdAndUpdate(
        id,
        { deletedAt: null },
        { new: true }
      );
      return doc ? opts.toDTO(doc) : null;
    },
    async eliminaDefinitivo(id) {
      if (!dbAttivo()) {
        const i = cestino.findIndex((m) => m.id === id);
        if (i === -1) return false;
        cestino.splice(i, 1);
        return true;
      }
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await opts.model.findByIdAndDelete(id);
      return Boolean(doc);
    },
  };
}
