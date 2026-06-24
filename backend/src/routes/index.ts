import { Router } from "express";
import mongoose from "mongoose";
import { isProd } from "../config/env.js";
import {
  analizzaEmail,
  generaOfferta,
  chat,
  generaRisposta,
} from "../controllers/ai.controller.js";
import { kpi } from "../controllers/dashboard.controller.js";
import { elenca as elencaInbox } from "../controllers/inbox.controller.js";
import {
  connetti as connettiGmail,
  stato as statoGmail,
  disconnetti as disconnettiGmail,
  invia as inviaGmail,
} from "../controllers/gmail.controller.js";
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

// Inbox (sola lettura, protetta)
router.get("/inbox", requireAuth, elencaInbox);

// Integrazione Gmail (collegamento OAuth + lettura email reali)
router.get("/gmail/stato", requireAuth, statoGmail);
router.post("/gmail/connetti", requireAuth, csrfProtection, connettiGmail);
router.post("/gmail/disconnetti", requireAuth, csrfProtection, disconnettiGmail);
router.post("/gmail/invia", requireAuth, csrfProtection, aiLimiter, inviaGmail);

// Funzionalità AI (protette + rate limit)
router.post("/ai/analizza-email", requireAuth, csrfProtection, aiLimiter, analizzaEmail);
router.post("/ai/genera-offerta", requireAuth, csrfProtection, aiLimiter, generaOfferta);
router.post("/ai/genera-risposta", requireAuth, csrfProtection, aiLimiter, generaRisposta);
router.post("/ai/chat", requireAuth, csrfProtection, aiLimiter, chat);

// KPI, serie mensile e attività della dashboard (protetti)
router.get("/dashboard/kpi", requireAuth, kpi);

export default router;
