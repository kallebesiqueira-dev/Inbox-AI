import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

export const FASI_CRM = [
  "Nuovo",
  "In Analisi",
  "Offerta Inviata",
  "Negoziazione",
  "Chiuso",
] as const;

const opportunitaSchema = new Schema(
  {
    // Proprietario della risorsa (isolamento multi-utente).
    userId: { type: String },
    cliente: { type: String, required: true, trim: true },
    valore: { type: Number, required: true, min: 0 },
    fase: { type: String, enum: FASI_CRM, default: "Nuovo" },
    // Foto del cliente come data URL (immagine ridimensionata lato client).
    avatar: { type: String },
    // Soft delete: se valorizzato, l'elemento è nel cestino.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Copre la query calda dell'elenco: filtro per proprietario+cestino, ordinato per data.
opportunitaSchema.index({ userId: 1, deletedAt: 1, createdAt: -1 });

export type OpportunitaAttrs = InferSchemaType<typeof opportunitaSchema>;
export type OpportunitaDoc = HydratedDocument<OpportunitaAttrs>;

export const Opportunita = model("Opportunita", opportunitaSchema);
