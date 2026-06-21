import { env, isProd } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Dietro il proxy di Render: necessario per IP reale (rate limit, log).
if (isProd) app.set("trust proxy", 1);

app.use(helmet());

// Allowlist CORS: origini esplicite da CLIENT_URL (separate da virgola).
const consentite = env.CLIENT_URL.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Anteprime Vercel: abilitate SOLO se VERCEL_PROJECT è configurato, e limitate
// ai sottodomini del progetto (es. inbox-ai-*.vercel.app). Senza questa variabile
// nessun wildcard è consentito, per non fidarsi di qualunque *.vercel.app.
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const anteprimaVercel = env.VERCEL_PROJECT
  ? new RegExp(`^${escapeRegExp(env.VERCEL_PROJECT)}[a-z0-9-]*\\.vercel\\.app$`)
  : null;

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      try {
        const host = new URL(origin).hostname;
        if (consentite.includes(origin) || anteprimaVercel?.test(host)) {
          return cb(null, true);
        }
      } catch {
        /* origine non valida */
      }
      cb(new Error("Origine non consentita dal CORS."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

async function avvia() {
  await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Inbox AI API in ascolto sulla porta ${env.PORT}`);
  });

  // Arresto controllato (Render invia SIGTERM ad ogni deploy).
  const arresta = (segnale: string) => {
    console.log(`[Server] ${segnale} ricevuto, arresto in corso...`);
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => arresta("SIGTERM"));
  process.on("SIGINT", () => arresta("SIGINT"));
}

avvia();
