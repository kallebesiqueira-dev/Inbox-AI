import { env, isProd } from "./config/env.js";
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { caricaRevocati } from "./services/revocation.service.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Dietro il proxy di Render: necessario per IP reale (rate limit, log).
if (isProd) app.set("trust proxy", 1);

app.use(helmet());

// Gzip sulle risposte JSON. Escluso lo stream SSE della chat: la compressione
// bufferizza i chunk e romperebbe lo streaming incrementale.
app.use(
  compression({
    filter: (req, res) =>
      req.path !== "/api/ai/chat" && compression.filter(req, res),
  })
);

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
        // In sviluppo accetta qualunque porta locale: il dev server di Vite può
        // ripiegare su 5174/5175… se la 5173 è occupata, senza rompere il login.
        const localeDev =
          !isProd && (host === "localhost" || host === "127.0.0.1");
        if (
          localeDev ||
          consentite.includes(origin) ||
          anteprimaVercel?.test(host)
        ) {
          return cb(null, true);
        }
      } catch {
        /* origine non valida */
      }
      // Marcato 403: è un rifiuto previsto, non un errore interno da loggare
      // con stack trace.
      const rifiuto = new Error("Origine non consentita dal CORS.") as Error & {
        status?: number;
      };
      rifiuto.status = 403;
      cb(rifiuto);
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
  // Ripopola la cache delle revoche dei token (sopravvive a riavvii/deploy).
  await caricaRevocati();
  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Inbox AI API in ascolto sulla porta ${env.PORT}`);
  });

  // Dietro un reverse proxy (Render) il keep-alive di Node (default 5s) DEVE
  // superare l'idle timeout del proxy: altrimenti Node chiude il socket proprio
  // mentre il proxy inoltra una richiesta → reset di connessione intermittente.
  // I GET vengono ritentati dal browser, i POST no: login/registrazione
  // fallivano a caso con ERR_CONNECTION_CLOSED. headersTimeout > keepAliveTimeout.
  server.keepAliveTimeout = 120_000;
  server.headersTimeout = 125_000;

  // Anti spin-down (piano free di Render): il servizio si auto-pinga tramite
  // l'URL pubblico ogni 10 minuti, così il traffico in ingresso non si azzera
  // mai e il container non viene ibernato (niente cold start da ~30s).
  // Più affidabile di un cron esterno (i cron di GitHub Actions arrivano in
  // ritardo anche di 20+ minuti). unref(): non blocca l'arresto del processo.
  if (isProd && env.RENDER_EXTERNAL_URL) {
    const urlPing = `${env.RENDER_EXTERNAL_URL.replace(/\/$/, "")}/api/health`;
    const DIECI_MINUTI = 10 * 60 * 1000;
    setInterval(() => {
      fetch(urlPing, { signal: AbortSignal.timeout(30_000) }).catch((err) => {
        console.warn(`[KeepAlive] Ping fallito: ${err?.message ?? err}`);
      });
    }, DIECI_MINUTI).unref();
    console.log(`[KeepAlive] Auto-ping attivo ogni 10 minuti su ${urlPing}`);
  }

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
