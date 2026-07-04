import rateLimit from "express-rate-limit";

/** Limite severo sugli endpoint di autenticazione (brute force / credential stuffing). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { messaggio: "Troppi tentativi. Riprova tra qualche minuto." },
});

/** Limite sugli endpoint AI (costo / abuso). */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { messaggio: "Troppe richieste AI. Riprova tra poco." },
});

/**
 * Limite sull'inbox: ogni lettura può innescare classificazioni AI delle email
 * (cache a parte), quindi non può restare senza tetto. Più permissivo del
 * limiter AI: la UI la aggiorna periodicamente.
 */
export const inboxLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { messaggio: "Troppe richieste. Riprova tra poco." },
});
