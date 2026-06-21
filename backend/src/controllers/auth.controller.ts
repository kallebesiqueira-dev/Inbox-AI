import type { Request, Response } from "express";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import * as auth from "../services/auth.service.js";
import {
  firmaToken,
  generaCsrf,
  opzioniSessione,
  opzioniCsrf,
  COOKIE_SESSIONE,
  COOKIE_CSRF,
} from "../utils/token.js";

function avviaSessione(res: Response, userId: string) {
  res.cookie(COOKIE_SESSIONE, firmaToken(userId), opzioniSessione());
  res.cookie(COOKIE_CSRF, generaCsrf(), opzioniCsrf());
}

const registraSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio.").max(120),
  email: z.string().email("Email non valida."),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri."),
});

const loginSchema = z.object({
  email: z.string().email("Email non valida."),
  password: z.string().min(1, "Password obbligatoria."),
});

export async function registra(req: Request, res: Response) {
  const parsed = registraSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: parsed.error.flatten().fieldErrors });
  }
  const { nome, email, password } = parsed.data;
  const utente = await auth.registra(email, password, nome);
  if (!utente) {
    return res.status(409).json({ messaggio: "Email già registrata." });
  }
  avviaSessione(res, utente.id);
  res.status(201).json(utente);
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: parsed.error.flatten().fieldErrors });
  }
  const utente = await auth.autentica(parsed.data.email, parsed.data.password);
  if (!utente) {
    return res.status(401).json({ messaggio: "Email o password non corretti." });
  }
  avviaSessione(res, utente.id);
  res.json(utente);
}

export async function google(req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ messaggio: "Accesso con Google non configurato." });
  }
  const credential = z.string().safeParse(req.body?.credential);
  if (!credential.success) {
    return res.status(400).json({ messaggio: "Credenziale Google mancante." });
  }
  try {
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential.data,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ messaggio: "Token Google non valido." });
    }
    const utente = await auth.daGoogle(
      payload.sub,
      payload.email,
      payload.name ?? payload.email
    );
    avviaSessione(res, utente.id);
    res.json(utente);
  } catch {
    res.status(401).json({ messaggio: "Verifica Google fallita." });
  }
}

export async function me(req: Request, res: Response) {
  const utente = req.userId ? await auth.trovaPerId(req.userId) : null;
  if (!utente) {
    return res.status(401).json({ messaggio: "Non autenticato." });
  }
  res.json(utente);
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_SESSIONE, opzioniSessione());
  res.clearCookie(COOKIE_CSRF, opzioniCsrf());
  res.status(204).end();
}
