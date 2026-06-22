import type { Request, Response, NextFunction } from "express";
import { verificaToken, COOKIE_SESSIONE, COOKIE_CSRF } from "../utils/token.js";
import { eRevocato } from "../services/revocation.service.js";

/** Richiede una sessione valida e non revocata; popola req.userId. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_SESSIONE];
  const sessione = token ? verificaToken(token) : null;
  if (!sessione || eRevocato(sessione.jti)) {
    return res.status(401).json({ messaggio: "Non autenticato." });
  }
  req.userId = sessione.sub;
  next();
}

const METODI_MUTANTI = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Protezione CSRF double-submit: header X-CSRF-Token deve combaciare col cookie. */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!METODI_MUTANTI.has(req.method)) return next();
  const cookie = req.cookies?.[COOKIE_CSRF];
  const header = req.get("x-csrf-token");
  if (!cookie || !header || cookie !== header) {
    return res.status(403).json({ messaggio: "Token CSRF non valido." });
  }
  next();
}
