import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { cifra, decifra } from "../utils/crypto.js";
import { ai } from "./ai/index.js";
import type { CategoriaEmail } from "./ai/providers/AIProvider.js";

const dbAttivo = () => mongoose.connection.readyState === 1;

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface EmailGmail {
  id: string;
  mittente: string;
  mittenteEmail: string;
  oggetto: string;
  categoria: CategoriaEmail;
  priorita: "Alta" | "Media" | "Bassa";
  tempo: string;
  corpo: string;
}

// Cache della classificazione AI per messaggio (evita di rianalizzare a ogni
// caricamento). Per-processo: su Render free (istanza singola) è sufficiente.
const cacheClassificazione = new Map<
  string,
  { categoria: CategoriaEmail; priorita: "Alta" | "Media" | "Bassa" }
>();

/** Classifica un'email con l'AI (categoria + priorità), con cache per messaggio. */
async function classifica(email: EmailGmail): Promise<EmailGmail> {
  const cached = cacheClassificazione.get(email.id);
  if (cached) return { ...email, ...cached };
  try {
    const a = await ai.analizzaEmail({
      mittente: email.mittente,
      oggetto: email.oggetto,
      corpo: email.corpo,
    });
    const c = { categoria: a.categoria, priorita: a.priorita };
    cacheClassificazione.set(email.id, c);
    return { ...email, ...c };
  } catch {
    return email;
  }
}

/** La connessione Gmail richiede le credenziali OAuth e un database. */
export function configurato(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

// redirect_uri "postmessage": flusso "code" con popup di Google Identity Services.
function client(): OAuth2Client {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    "postmessage"
  );
}

async function bearer(token: string, url: string) {
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Gmail API ${r.status}`);
  return r.json();
}

/** Scambia il codice OAuth con i token e collega Gmail all'utente. */
export async function connetti(
  userId: string,
  code: string
): Promise<{ email: string } | null> {
  if (!dbAttivo() || !mongoose.isValidObjectId(userId)) return null;
  const oauth = client();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.access_token) return null;

  const profilo = (await bearer(tokens.access_token, `${GMAIL}/profile`)) as {
    emailAddress?: string;
  };
  const email = profilo.emailAddress ?? "";

  const update: Record<string, string> = { gmailEmail: email };
  // Il refresh token arriva solo al primo consenso: se assente, si mantiene quello esistente.
  if (tokens.refresh_token) update.gmailToken = cifra(tokens.refresh_token);
  await User.findByIdAndUpdate(userId, update);
  return { email };
}

export async function stato(
  userId: string
): Promise<{ connesso: boolean; email?: string }> {
  if (!dbAttivo() || !mongoose.isValidObjectId(userId)) return { connesso: false };
  const doc = await User.findById(userId);
  return doc?.gmailToken
    ? { connesso: true, email: (doc.gmailEmail as string) ?? undefined }
    : { connesso: false };
}

export async function disconnetti(userId: string): Promise<void> {
  if (!dbAttivo() || !mongoose.isValidObjectId(userId)) return;
  await User.findByIdAndUpdate(userId, {
    $unset: { gmailToken: "", gmailEmail: "" },
  });
}

/** Legge le email recenti dalla casella Gmail collegata. null = non collegato. */
export async function leggiEmail(userId: string): Promise<EmailGmail[] | null> {
  if (!dbAttivo() || !mongoose.isValidObjectId(userId)) return null;
  const doc = await User.findById(userId);
  const blob = doc?.gmailToken as string | undefined;
  if (!blob) return null;
  const refresh = decifra(blob);
  if (!refresh) return null;

  const oauth = client();
  oauth.setCredentials({ refresh_token: refresh });
  const { token } = await oauth.getAccessToken();
  if (!token) return null;

  const lista = (await bearer(
    token,
    `${GMAIL}/messages?maxResults=12&labelIds=INBOX`
  )) as { messages?: { id: string }[] };
  const ids = (lista.messages ?? []).map((m) => m.id);

  const email = await Promise.all(ids.map((id) => leggiSingola(token, id)));
  const valide = email.filter((e): e is EmailGmail => e !== null);
  // Classificazione automatica con l'AI (categoria + priorità), in parallelo.
  return Promise.all(valide.map(classifica));
}

async function leggiSingola(
  token: string,
  id: string
): Promise<EmailGmail | null> {
  try {
    const m = (await bearer(
      token,
      `${GMAIL}/messages/${id}?format=full`
    )) as GmailMessage;
    const headers = m.payload?.headers ?? [];
    const h = (n: string) =>
      headers.find((x) => x.name.toLowerCase() === n)?.value ?? "";
    return {
      id,
      mittente: pulisciMittente(h("from")),
      mittenteEmail: estraiEmail(h("from")),
      oggetto: h("subject") || "(senza oggetto)",
      categoria: "Altro",
      priorita: "Media",
      tempo: tempoRelativo(h("date")),
      corpo: (estraiTesto(m.payload) || m.snippet || "").slice(0, 4000),
    };
  } catch {
    return null;
  }
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
  headers?: { name: string; value: string }[];
}
interface GmailMessage {
  snippet?: string;
  payload?: GmailPart;
}

function decodeB64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8"
  );
}

/** Estrae il testo (text/plain, in fallback text/html ripulito) dal payload MIME. */
function estraiTesto(part?: GmailPart): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeB64(part.body.data);
  }
  if (part.parts) {
    for (const p of part.parts) {
      const t = estraiTesto(p);
      if (t) return t;
    }
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeB64(part.body.data)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

function pulisciMittente(from: string): string {
  const conNome = from.match(/^\s*"?([^"<]+?)"?\s*<.+>/);
  if (conNome) return conNome[1].trim();
  const soloEmail = from.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  return soloEmail ? soloEmail[1] : from || "Sconosciuto";
}

function estraiEmail(from: string): string {
  const m = from.match(/<([^<>\s]+@[^<>\s]+)>/) || from.match(/([^<>\s]+@[^<>\s]+)/);
  return m ? m[1] : "";
}

/** Invia (o risponde a) un'email tramite la casella Gmail collegata. */
export async function inviaEmail(
  userId: string,
  opts: { to: string; oggetto: string; corpo: string; threadId?: string }
): Promise<boolean> {
  if (!dbAttivo() || !mongoose.isValidObjectId(userId)) return false;
  const doc = await User.findById(userId);
  const blob = doc?.gmailToken as string | undefined;
  if (!blob) return false;
  const refresh = decifra(blob);
  if (!refresh) return false;

  const oauth = client();
  oauth.setCredentials({ refresh_token: refresh });
  const { token } = await oauth.getAccessToken();
  if (!token) return false;

  const raw = costruisciMessaggio((doc?.gmailEmail as string) ?? "me", opts);
  const corpoReq: Record<string, string> = { raw };
  if (opts.threadId) corpoReq.threadId = opts.threadId;

  const r = await fetch(`${GMAIL}/messages/send`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(corpoReq),
  });
  return r.ok;
}

function costruisciMessaggio(
  from: string,
  { to, oggetto, corpo }: { to: string; oggetto: string; corpo: string }
): string {
  // Oggetto codificato RFC 2047 per supportare accenti/UTF-8 negli header.
  const oggettoEnc = `=?UTF-8?B?${Buffer.from(oggetto, "utf8").toString("base64")}?=`;
  const messaggio = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${oggettoEnc}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    corpo,
  ].join("\r\n");
  return Buffer.from(messaggio, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function tempoRelativo(data: string): string {
  const t = Date.parse(data);
  if (Number.isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore} ${ore === 1 ? "ora" : "ore"}`;
  const giorni = Math.floor(ore / 24);
  return `${giorni} ${giorni === 1 ? "giorno" : "giorni"}`;
}
