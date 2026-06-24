import crypto from "crypto";
import { jwtSecret } from "../config/env.js";

// Chiave AES-256 derivata dal JWT_SECRET: nessuna chiave aggiuntiva da gestire.
const key = crypto.scryptSync(jwtSecret, "inbox-ai-gmail-v1", 32);

/** Cifra una stringa (es. refresh token Gmail) con AES-256-GCM. */
export function cifra(testo: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(testo, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

/** Decifra una stringa prodotta da `cifra`. Ritorna null se non valida. */
export function decifra(blob: string): string | null {
  try {
    const [ivB, tagB, encB] = blob.split(".");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivB, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(encB, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
