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
  },
  { timestamps: true }
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;

export const User = model("User", userSchema);
