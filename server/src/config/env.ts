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
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AI_PROVIDER: z.string().default("default"),
  AI_API_KEY: z.string().optional(),
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

// Segreto JWT: obbligatorio in produzione (vedi controllo sotto),
// fallback solo in sviluppo per non bloccare l'avvio locale.
export const jwtSecret =
  env.JWT_SECRET ?? (isProd ? "" : "dev-secret-non-usare-in-produzione");

// In produzione alcune variabili sono obbligatorie.
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
}
