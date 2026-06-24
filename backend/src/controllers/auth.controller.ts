import type { Request, Response } from "express";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import * as auth from "../services/auth.service.js";
import { seedUtente } from "../services/seed.service.js";
import {
  firmaToken,
  verificaToken,
  generaCsrf,
  opzioniSessione,
  opzioniCsrf,
  COOKIE_SESSIONE,
  COOKIE_CSRF,
} from "../utils/token.js";
import { revoca } from "../services/revocation.service.js";

// Avvia la sessione e ritorna il token CSRF. Viene inviato anche nel corpo della
// risposta perché il frontend, su dominio diverso dall'API, non può leggere il
// cookie CSRF via document.cookie: lo riceve qui e lo rispedisce nell'header.
function avviaSessione(res: Response, userId: string): string {
  const csrf = generaCsrf();
  res.cookie(COOKIE_SESSIONE, firmaToken(userId), opzioniSessione());
  res.cookie(COOKIE_CSRF, csrf, opzioniCsrf());
  return csrf;
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
  await seedUtente(utente.id);
  const csrfToken = avviaSessione(res, utente.id);
  res.status(201).json({ ...utente, csrfToken });
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
  const csrfToken = avviaSessione(res, utente.id);
  res.json({ ...utente, csrfToken });
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
    const { utente, nuovo } = await auth.daGoogle(
      payload.sub,
      payload.email,
      payload.name ?? payload.email
    );
    if (nuovo) await seedUtente(utente.id);
    const csrfToken = avviaSessione(res, utente.id);
    res.json({ ...utente, csrfToken });
  } catch {
    res.status(401).json({ messaggio: "Verifica Google fallita." });
  }
}

// Foto profilo: data URL di un'immagine, con limite di dimensione per contenere
// il payload (l'immagine è già ridimensionata lato client).
const avatarSchema = z.object({
  avatar: z
    .string()
    .startsWith("data:image/", "Formato immagine non valido.")
    .max(500_000, "Immagine troppo grande."),
});

const impostazioniSchema = z.object({
  nomeAzienda: z.string().trim().max(200).default(""),
  emailAzienda: z.string().trim().max(200).default(""),
  automazioni: z.object({
    lettura: z.boolean(),
    analisi: z.boolean(),
    classificazione: z.boolean(),
    elaborazione: z.boolean(),
  }),
});

export async function aggiornaImpostazioni(req: Request, res: Response) {
  const parsed = impostazioniSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: parsed.error.flatten().fieldErrors });
  }
  const utente = req.userId
    ? await auth.aggiornaImpostazioni(req.userId, parsed.data)
    : null;
  if (!utente) return res.status(401).json({ messaggio: "Non autenticato." });
  res.json(utente);
}

export async function aggiornaAvatar(req: Request, res: Response) {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: parsed.error.flatten().fieldErrors });
  }
  const utente = req.userId
    ? await auth.aggiornaAvatar(req.userId, parsed.data.avatar)
    : null;
  if (!utente) return res.status(401).json({ messaggio: "Non autenticato." });
  res.json(utente);
}

export async function me(req: Request, res: Response) {
  const utente = req.userId ? await auth.trovaPerId(req.userId) : null;
  if (!utente) {
    return res.status(401).json({ messaggio: "Non autenticato." });
  }
  // Re-idrata il token CSRF per il client (es. dopo un refresh di pagina).
  let csrfToken = req.cookies?.[COOKIE_CSRF] as string | undefined;
  if (!csrfToken) {
    csrfToken = generaCsrf();
    res.cookie(COOKIE_CSRF, csrfToken, opzioniCsrf());
  }
  res.json({ ...utente, csrfToken });
}

export async function logout(req: Request, res: Response) {
  // Revoca lato server: il token resta invalido fino alla scadenza naturale
  // anche se fosse stato esfiltrato (i cookie da soli non basterebbero).
  const token = req.cookies?.[COOKIE_SESSIONE] as string | undefined;
  const sessione = token ? verificaToken(token) : null;
  if (sessione) await revoca(sessione.jti, sessione.exp);

  res.clearCookie(COOKIE_SESSIONE, opzioniSessione());
  res.clearCookie(COOKIE_CSRF, opzioniCsrf());
  res.status(204).end();
}
