import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { CookieOptions } from "express";
import { jwtSecret, isProd } from "../config/env.js";

const SETTE_GIORNI = 7 * 24 * 60 * 60 * 1000;

export const COOKIE_SESSIONE = "ia_session";
export const COOKIE_CSRF = "ia_csrf";

export function firmaToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "7d" });
}

export function verificaToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, jwtSecret);
    return typeof payload === "object" && payload.sub ? String(payload.sub) : null;
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
