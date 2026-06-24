import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

export const TIPI_APPROVAZIONE = [
  "Invio offerta",
  "Invio documento",
  "Modifica critica",
  "Operazione finanziaria",
] as const;

export const FASI_APPROVAZIONE = [
  "Bozza",
  "Revisione",
  "Approvazione",
  "Esecuzione",
] as const;

const approvazioneSchema = new Schema(
  {
    // Proprietario della risorsa (isolamento multi-utente).
    userId: { type: String, index: true },
    tipo: { type: String, enum: TIPI_APPROVAZIONE, required: true },
    oggetto: { type: String, required: true, trim: true },
    fase: { type: String, enum: FASI_APPROVAZIONE, default: "Revisione" },
    richiedente: { type: String, default: "Sistema AI", trim: true },
    // Soft delete: se valorizzato, l'elemento è nel cestino.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type ApprovazioneAttrs = InferSchemaType<typeof approvazioneSchema>;
export type ApprovazioneDoc = HydratedDocument<ApprovazioneAttrs>;

export const Approvazione = model("Approvazione", approvazioneSchema);
