import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    nome: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String },
    // Foto profilo come data URL (immagine ridimensionata lato client).
    avatar: { type: String },
    // Impostazioni dell'organizzazione (nome/email azienda + automazioni email).
    impostazioni: { type: Schema.Types.Mixed },
    // Gmail collegato: refresh token cifrato (AES-256-GCM) + indirizzo per la UI.
    gmailToken: { type: String },
    gmailEmail: { type: String },
    // Reset password: hash del token (mai in chiaro) + scadenza.
    resetTokenHash: { type: String },
    resetTokenExp: { type: Date },
    // Istante dell'ultimo cambio/reset password: i token emessi prima non valgono più.
    passwordCambiataAl: { type: Date },
  },
  { timestamps: true }
);

// Lookup del token di reset senza collection scan (sparse: solo chi ha un reset attivo).
userSchema.index({ resetTokenHash: 1 }, { sparse: true });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User = model("User", userSchema);
