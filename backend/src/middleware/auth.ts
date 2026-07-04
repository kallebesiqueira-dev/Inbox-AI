import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { verificaToken, COOKIE_SESSIONE, COOKIE_CSRF } from "../utils/token.js";
import { eRevocato } from "../services/revocation.service.js";
import { passwordCambiataDopo } from "../services/auth.service.js";

/** Richiede una sessione valida, non revocata e non precedente a un cambio password; popola req.userId. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_SESSIONE];
    const sessione = token ? verificaToken(token) : null;
    if (!sessione || eRevocato(sessione.jti)) {
      return res.status(401).json({ messaggio: "Non autenticato." });
    }
    // Un cambio/reset password invalida tutte le sessioni emesse prima.
    if (await passwordCambiataDopo(sessione.sub, sessione.iat)) {
      return res.status(401).json({ messaggio: "Sessione scaduta. Accedi di nuovo." });
    }
    req.userId = sessione.sub;
    next();
  } catch (err) {
    next(err);
  }
}

const METODI_MUTANTI = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Protezione CSRF double-submit: header X-CSRF-Token deve combaciare col cookie. */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!METODI_MUTANTI.has(req.method)) return next();
  const cookie = req.cookies?.[COOKIE_CSRF];
  const header = req.get("x-csrf-token");
  // Confronto a tempo costante: nessun canale di timing sul confronto dei token.
  const a = Buffer.from(String(cookie ?? ""));
  const b = Buffer.from(String(header ?? ""));
  if (!cookie || !header || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ messaggio: "Token CSRF non valido." });
  }
  next();
}
