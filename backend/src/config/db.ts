import mongoose from "mongoose";
import { env, isProd } from "./env.js";

export async function connectDB(): Promise<void> {
  if (!env.MONGODB_URI) {
    if (isProd) {
      console.error("[DB] MONGODB_URI mancante in produzione. Arresto.");
      process.exit(1);
    }
    console.warn(
      "[DB] MONGODB_URI non configurata: avvio in modalità demo (solo sviluppo)."
    );
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("[DB] Connesso a MongoDB Atlas.");
  } catch (err) {
    console.error("[DB] Errore di connessione:", err);
    if (isProd) process.exit(1);
  }
}
