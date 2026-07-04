import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

export const STATI_OFFERTA = [
  "Bozza",
  "In revisione",
  "Approvata",
  "Inviata",
] as const;

const offertaSchema = new Schema(
  {
    // Proprietario della risorsa (isolamento multi-utente).
    userId: { type: String },
    // Numero progressivo per utente/anno, assegnato dal servizio alla creazione.
    numero: { type: String, required: true },
    cliente: { type: String, required: true, trim: true },
    importo: { type: Number, required: true, min: 0 },
    stato: { type: String, enum: STATI_OFFERTA, default: "Bozza" },
    data: { type: Date, default: Date.now },
    // Contenuto dell'offerta generata dall'AI (per il documento/PDF).
    corpo: { type: String, default: "" },
    voci: {
      type: [{ descrizione: String, importo: Number }],
      default: [],
    },
    // Soft delete: se valorizzato, l'elemento è nel cestino.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Copre la query calda dell'elenco: filtro per proprietario+cestino, ordinato per data.
offertaSchema.index({ userId: 1, deletedAt: 1, createdAt: -1 });

export type OffertaAttrs = InferSchemaType<typeof offertaSchema>;
export type OffertaDoc = HydratedDocument<OffertaAttrs>;

export const Offerta = model("Offerta", offertaSchema);
