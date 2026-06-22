import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { CookieOptions } from "express";
import { jwtSecret, isProd } from "../config/env.js";

const SETTE_GIORNI = 7 * 24 * 60 * 60 * 1000;

export const COOKIE_SESSIONE = "ia_session";
export const COOKIE_CSRF = "ia_csrf";

export interface SessionePayload {
  /** ID utente. */
  sub: string;
  /** ID univoco del token, usato per la revoca lato server. */
  jti: string;
  /** Scadenza in secondi epoch. */
  exp: number;
}

export function firmaToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, jwtSecret, {
    expiresIn: "7d",
  });
}

export function verificaToken(token: string): SessionePayload | null {
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (
      typeof payload !== "object" ||
      !payload.sub ||
      !payload.jti ||
      !payload.exp
    ) {
      return null;
    }
    return {
      sub: String(payload.sub),
      jti: String(payload.jti),
      exp: Number(payload.exp),
    };
  } catch {
    return null;
  }
}

export function generaCsrf(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Cookie di sessione: httpOnly, cross-site sicuro in produzione. */
export function opzioniSessione(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: SETTE_GIORNI,
    path: "/",
  };
}

/** Cookie CSRF: leggibile da JS (double-submit), stesse regole di sito. */
export function opzioniCsrf(): CookieOptions {
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: SETTE_GIORNI,
    path: "/",
  };
}
