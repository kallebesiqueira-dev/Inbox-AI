import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
// Un unico file .env nella radice del progetto.
dotenv.config({ path: path.resolve(here, "../../../.env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  // Slug del progetto Vercel: se impostato, abilita le anteprime *.vercel.app
  // del solo progetto (es. "inbox-ai"). Se assente, nessun wildcard è consentito.
  VERCEL_PROJECT: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AI_PROVIDER: z.string().default("default"),
  AI_API_KEY: z.string().optional(),
  // Modello del provider AI (es. per Groq: "llama-3.3-70b-versatile").
  AI_MODEL: z.string().optional(),
  // SMTP per le email di sistema (es. reset password): Gmail + "password per le app".
  GMAIL_APP_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  // Impostata automaticamente da Render con l'URL pubblico del servizio.
  // Se presente, il server si auto-pinga per evitare lo spin-down del piano free.
  RENDER_EXTERNAL_URL: z.string().optional(),
  // Pagamenti Stripe (opzionali): senza chiavi il checkout resta in modalità demo.
  STRIPE_SECRET_KEY: z.string().optional(),
  // Price ID del piano unico (dashboard Stripe → Prodotti), es. "price_...".
  STRIPE_PRICE_ID: z.string().optional(),
  // Firma dei webhook Stripe (per la futura gestione degli eventi di abbonamento).
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[Config] Variabili d'ambiente non valide:",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

// In produzione alcune variabili sono obbligatorie: si arresta l'avvio se mancano,
// prima di derivare qualsiasi segreto.
if (isProd) {
  const mancanti = (["MONGODB_URI", "JWT_SECRET"] as const).filter(
    (k) => !env[k]
  );
  if (mancanti.length) {
    console.error(
      `[Config] Variabili obbligatorie mancanti in produzione: ${mancanti.join(", ")}`
    );
    process.exit(1);
  }
  // Un segreto troppo corto è inaccettabile quanto uno mancante.
  if ((env.JWT_SECRET as string).length < 32) {
    console.error(
      "[Config] JWT_SECRET deve essere lungo almeno 32 caratteri in produzione."
    );
    process.exit(1);
  }
  // Senza CLIENT_URL reale il CORS bloccherebbe il frontend e i link di reset
  // password punterebbero a localhost: meglio fallire subito e in modo chiaro.
  if (env.CLIENT_URL.includes("localhost")) {
    console.error(
      "[Config] CLIENT_URL deve essere impostata al dominio del frontend in produzione."
    );
    process.exit(1);
  }
}

// Segreto JWT: in produzione è garantito dal controllo sopra. In sviluppo si usa
// un fallback locale non vuoto. Nessun fallback a stringa vuota: firmare/verificare
// token con segreto vuoto deve essere impossibile per costruzione.
export const jwtSecret =
  env.JWT_SECRET ?? "dev-secret-non-usare-in-produzione";
