import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

// Token di sessione revocati (es. al logout). Restano registrati fino alla loro
// naturale scadenza, poi vengono rimossi automaticamente dall'indice TTL.
const revokedTokenSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  // Indice TTL: MongoDB elimina il documento quando expiresAt è nel passato.
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export type RevokedTokenAttrs = InferSchemaType<typeof revokedTokenSchema>;
export type RevokedTokenDoc = HydratedDocument<RevokedTokenAttrs>;

export const RevokedToken = model("RevokedToken", revokedTokenSchema);
