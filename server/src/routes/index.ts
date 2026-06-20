import { Router } from "express";
import mongoose from "mongoose";
import { isProd } from "../config/env.js";
import { analizzaEmail, generaOfferta } from "../controllers/ai.controller.js";
import { requireAuth, csrfProtection } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import authRouter from "./auth.routes.js";
import offerteRouter from "./offerte.routes.js";
import opportunitaRouter from "./opportunita.routes.js";
import approvazioneRouter from "./approvazione.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  const dbConnesso = mongoose.connection.readyState === 1;
  // In produzione il DB è obbligatorio: se non è connesso il servizio è degradato.
  const sano = dbConnesso || !isProd;
  res.status(sano ? 200 : 503).json({
    stato: sano ? "ok" : "degradato",
    db: dbConnesso ? "connesso" : "non connesso",
    servizio: "Inbox AI API",
  });
});

// Autenticazione
router.use("/auth", authRouter);

// Risorse protette (sessione + CSRF)
router.use("/offerte", requireAuth, csrfProtection, offerteRouter);
router.use("/crm", requireAuth, csrfProtection, opportunitaRouter);
router.use("/approvazioni", requireAuth, csrfProtection, approvazioneRouter);

// Funzionalità AI (protette + rate limit)
router.post("/ai/analizza-email", requireAuth, csrfProtection, aiLimiter, analizzaEmail);
router.post("/ai/genera-offerta", requireAuth, csrfProtection, aiLimiter, generaOfferta);

// KPI di esempio per la dashboard (protetti)
router.get("/dashboard/kpi", requireAuth, (_req, res) => {
  res.json({
    emailElaborate: 1284,
    offerteGenerate: 86,
    opportunitaAperte: 37,
    oreRisparmiate: 142,
  });
});

export default router;
