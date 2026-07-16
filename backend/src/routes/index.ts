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
import { checkout } from "../controllers/billing.controller.js";
import { elenca as elencaInbox } from "../controllers/inbox.controller.js";
import { elenca as elencaNotifiche } from "../controllers/notifiche.controller.js";
import {
  connetti as connettiGmail,
  stato as statoGmail,
  disconnetti as disconnettiGmail,
  invia as inviaGmail,
} from "../controllers/gmail.controller.js";
import { requireAuth, csrfProtection } from "../middleware/auth.js";
import { aiLimiter, inboxLimiter, authLimiter } from "../middleware/rateLimit.js";
import { ah } from "../utils/asyncHandler.js";
import authRouter from "./auth.routes.js";
import offerteRouter from "./offerte.routes.js";
import opportunitaRouter from "./opportunita.routes.js";
import approvazioneRouter from "./approvazione.routes.js";

const router = Router();
const auth = ah(requireAuth);

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
router.use("/offerte", auth, csrfProtection, offerteRouter);
router.use("/crm", auth, csrfProtection, opportunitaRouter);
router.use("/approvazioni", auth, csrfProtection, approvazioneRouter);

// Inbox (sola lettura, protetta; rate limit: ogni lettura può innescare l'AI)
router.get("/inbox", auth, inboxLimiter, ah(elencaInbox));
router.get("/notifiche", auth, ah(elencaNotifiche));

// Integrazione Gmail (collegamento OAuth + lettura email reali)
router.get("/gmail/stato", auth, ah(statoGmail));
router.post("/gmail/connetti", auth, csrfProtection, ah(connettiGmail));
router.post("/gmail/disconnetti", auth, csrfProtection, ah(disconnettiGmail));
router.post("/gmail/invia", auth, csrfProtection, aiLimiter, ah(inviaGmail));

// Funzionalità AI (protette + rate limit)
router.post("/ai/analizza-email", auth, csrfProtection, aiLimiter, ah(analizzaEmail));
router.post("/ai/genera-offerta", auth, csrfProtection, aiLimiter, ah(generaOfferta));
router.post("/ai/genera-risposta", auth, csrfProtection, aiLimiter, ah(generaRisposta));
router.post("/ai/chat", auth, csrfProtection, aiLimiter, ah(chat));

// Abbonamenti: avvio del checkout Stripe dalla landing (pubblico, rate limit).
// Senza chiavi Stripe configurate risponde in modalità demo.
router.post("/billing/checkout", authLimiter, ah(checkout));

// KPI, serie mensile e attività della dashboard (protetti)
router.get("/dashboard/kpi", auth, ah(kpi));

export default router;
