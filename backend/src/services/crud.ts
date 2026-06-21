import mongoose, { Model, HydratedDocument } from "mongoose";

const dbAttivo = () => mongoose.connection.readyState === 1;

export interface Crud<TDTO, TInput> {
  elenca(): Promise<TDTO[]>;
  crea(input: TInput): Promise<TDTO>;
  aggiorna(id: string, patch: Partial<TInput>): Promise<TDTO | null>;
  elimina(id: string): Promise<boolean>;
}

/**
 * CRUD generico con persistenza MongoDB e fallback in memoria (modalità demo).
 * Riusato da tutte le risorse per evitare duplicazione.
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
  const memoria: TDTO[] = [...opts.seed];

  return {
    async elenca() {
      if (!dbAttivo()) return [...memoria];
      const docs = await opts.model.find().sort({ createdAt: -1 });
      return docs.map(opts.toDTO);
    },
    async crea(input) {
      if (!dbAttivo()) {
        const dto = opts.demo(input, `demo-${Date.now()}`);
        memoria.unshift(dto);
        return dto;
      }
      const doc = await opts.model.create(input);
      return opts.toDTO(doc);
    },
    async aggiorna(id, patch) {
      if (!dbAttivo()) {
        const i = memoria.findIndex((m) => m.id === id);
        if (i === -1) return null;
        memoria[i] = { ...memoria[i], ...patch } as TDTO;
        return memoria[i];
      }
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await opts.model.findByIdAndUpdate(id, patch, { new: true });
      return doc ? opts.toDTO(doc) : null;
    },
    async elimina(id) {
      if (!dbAttivo()) {
        const i = memoria.findIndex((m) => m.id === id);
        if (i === -1) return false;
        memoria.splice(i, 1);
        return true;
      }
      if (!mongoose.isValidObjectId(id)) return false;
      const doc = await opts.model.findByIdAndDelete(id);
      return Boolean(doc);
    },
  };
}
