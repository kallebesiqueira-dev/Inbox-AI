import { Schema, model } from "mongoose";

// Contatori atomici (es. numerazione progressiva delle offerte per utente/anno).
const contatoreSchema = new Schema({
  chiave: { type: String, required: true, unique: true },
  valore: { type: Number, default: 0 },
});

export const Contatore = model("Contatore", contatoreSchema);
