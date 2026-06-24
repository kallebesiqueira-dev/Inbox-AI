import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, UserDoc } from "../models/User.js";

export interface Impostazioni {
  nomeAzienda: string;
  emailAzienda: string;
  automazioni: {
    lettura: boolean;
    analisi: boolean;
    classificazione: boolean;
    elaborazione: boolean;
  };
}

export const IMPOSTAZIONI_DEFAULT: Impostazioni = {
  nomeAzienda: "",
  emailAzienda: "",
  automazioni: {
    lettura: true,
    analisi: true,
    classificazione: true,
    elaborazione: true,
  },
};

export interface UtenteDTO {
  id: string;
  email: string;
  nome: string;
  avatar?: string;
  impostazioni: Impostazioni;
}

interface UtenteInterno extends Omit<UtenteDTO, "impostazioni"> {
  impostazioni?: Impostazioni;
  passwordHash?: string;
  googleId?: string;
}

const dbAttivo = () => mongoose.connection.readyState === 1;

// Archivio in memoria: modalità demo (sviluppo senza MongoDB).
const demo: UtenteInterno[] = [];

// Hash fittizio usato per uniformare i tempi del login quando l'utente non esiste,
// evitando l'enumerazione degli account tramite analisi temporale.
const HASH_FITTIZIO = bcrypt.hashSync("inbox-ai-timing-guard", 12);

function pubblico(u: UtenteInterno): UtenteDTO {
  return {
    id: u.id,
    email: u.email,
    nome: u.nome,
    avatar: u.avatar,
    impostazioni: u.impostazioni ?? IMPOSTAZIONI_DEFAULT,
  };
}

function fromDoc(d: UserDoc): UtenteInterno {
  return {
    id: d.id,
    email: d.email,
    nome: d.nome,
    avatar: d.avatar ?? undefined,
    impostazioni: (d.impostazioni as Impostazioni) ?? IMPOSTAZIONI_DEFAULT,
    passwordHash: d.passwordHash ?? undefined,
    googleId: d.googleId ?? undefined,
  };
}

async function trovaPerEmail(email: string): Promise<UtenteInterno | null> {
  const e = email.toLowerCase().trim();
  if (!dbAttivo()) return demo.find((u) => u.email === e) ?? null;
  const doc = await User.findOne({ email: e });
  return doc ? fromDoc(doc) : null;
}

export async function trovaPerId(id: string): Promise<UtenteDTO | null> {
  if (!dbAttivo()) {
    const u = demo.find((x) => x.id === id);
    return u ? pubblico(u) : null;
  }
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await User.findById(id);
  return doc ? pubblico(fromDoc(doc)) : null;
}

/** Aggiorna la foto profilo (data URL) dell'utente. */
export async function aggiornaAvatar(
  id: string,
  avatar: string
): Promise<UtenteDTO | null> {
  if (!dbAttivo()) {
    const u = demo.find((x) => x.id === id);
    if (!u) return null;
    u.avatar = avatar;
    return pubblico(u);
  }
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await User.findByIdAndUpdate(id, { avatar }, { new: true });
  return doc ? pubblico(fromDoc(doc)) : null;
}

/** Aggiorna le impostazioni dell'organizzazione dell'utente. */
export async function aggiornaImpostazioni(
  id: string,
  impostazioni: Impostazioni
): Promise<UtenteDTO | null> {
  if (!dbAttivo()) {
    const u = demo.find((x) => x.id === id);
    if (!u) return null;
    u.impostazioni = impostazioni;
    return pubblico(u);
  }
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await User.findByIdAndUpdate(id, { impostazioni }, { new: true });
  return doc ? pubblico(fromDoc(doc)) : null;
}

export async function registra(
  email: string,
  password: string,
  nome: string
): Promise<UtenteDTO | null> {
  if (await trovaPerEmail(email)) return null; // email già in uso
  const passwordHash = await bcrypt.hash(password, 12);
  const e = email.toLowerCase().trim();

  if (!dbAttivo()) {
    const u: UtenteInterno = { id: `demo-${Date.now()}`, email: e, nome, passwordHash };
    demo.push(u);
    return pubblico(u);
  }
  const doc = await User.create({ email: e, nome, passwordHash });
  return pubblico(fromDoc(doc));
}

export async function autentica(
  email: string,
  password: string
): Promise<UtenteDTO | null> {
  const u = await trovaPerEmail(email);
  if (!u?.passwordHash) {
    // Confronto fittizio: stesso costo temporale del caso "utente esistente".
    await bcrypt.compare(password, HASH_FITTIZIO);
    return null;
  }
  const ok = await bcrypt.compare(password, u.passwordHash);
  return ok ? pubblico(u) : null;
}

/** Crea o recupera un utente a partire dai dati Google verificati. */
export async function daGoogle(
  googleId: string,
  email: string,
  nome: string
): Promise<{ utente: UtenteDTO; nuovo: boolean }> {
  const esistente = await trovaPerEmail(email);
  if (esistente) return { utente: pubblico(esistente), nuovo: false };

  const e = email.toLowerCase().trim();
  if (!dbAttivo()) {
    const u: UtenteInterno = { id: `demo-${Date.now()}`, email: e, nome, googleId };
    demo.push(u);
    return { utente: pubblico(u), nuovo: true };
  }
  const doc = await User.create({ email: e, nome, googleId });
  return { utente: pubblico(fromDoc(doc)), nuovo: true };
}
