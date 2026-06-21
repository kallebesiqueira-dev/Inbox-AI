import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, UserDoc } from "../models/User.js";

export interface UtenteDTO {
  id: string;
  email: string;
  nome: string;
}

interface UtenteInterno extends UtenteDTO {
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
  return { id: u.id, email: u.email, nome: u.nome };
}

function fromDoc(d: UserDoc): UtenteInterno {
  return {
    id: d.id,
    email: d.email,
    nome: d.nome,
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
): Promise<UtenteDTO> {
  const esistente = await trovaPerEmail(email);
  if (esistente) return pubblico(esistente);

  const e = email.toLowerCase().trim();
  if (!dbAttivo()) {
    const u: UtenteInterno = { id: `demo-${Date.now()}`, email: e, nome, googleId };
    demo.push(u);
    return pubblico(u);
  }
  const doc = await User.create({ email: e, nome, googleId });
  return pubblico(fromDoc(doc));
}
