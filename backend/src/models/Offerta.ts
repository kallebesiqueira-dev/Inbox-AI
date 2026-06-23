import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

export const STATI_OFFERTA = [
  "Bozza",
  "In revisione",
  "Approvata",
  "Inviata",
] as const;

const offertaSchema = new Schema(
  {
    numero: {
      type: String,
      required: true,
      default: () =>
        `${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    },
    cliente: { type: String, required: true, trim: true },
    importo: { type: Number, required: true, min: 0 },
    stato: { type: String, enum: STATI_OFFERTA, default: "Bozza" },
    data: { type: Date, default: Date.now },
    // Soft delete: se valorizzato, l'elemento è nel cestino.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type OffertaAttrs = InferSchemaType<typeof offertaSchema>;
export type OffertaDoc = HydratedDocument<OffertaAttrs>;

export const Offerta = model("Offerta", offertaSchema);
