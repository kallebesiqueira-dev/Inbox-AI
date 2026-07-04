import mongoose from "mongoose";
import crypto from "crypto";
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
  resetTokenHash?: string;
  resetTokenExp?: Date;
  passwordCambiataAl?: Date;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Cache (TTL breve) dell'istante dell'ultimo cambio password per utente:
// permette a requireAuth di invalidare i token emessi prima del cambio senza
// un giro in DB a ogni richiesta.
const cacheCambioPassword = new Map<string, { val: number | null; scade: number }>();
const TTL_CACHE_CAMBIO = 60_000;

function segnaCambioPassword(userId: string, quando: Date) {
  cacheCambioPassword.set(userId, {
    val: quando.getTime(),
    scade: Date.now() + TTL_CACHE_CAMBIO,
  });
}

/**
 * True se la password dell'utente è stata cambiata DOPO l'emissione del token
 * (iat in secondi). I token emessi nello stesso secondo del cambio restano
 * validi: è la nuova sessione aperta contestualmente al cambio.
 */
export async function passwordCambiataDopo(
  userId: string,
  iatSecondi: number
): Promise<boolean> {
  const ora = Date.now();
  let voce = cacheCambioPassword.get(userId);
  if (!voce || voce.scade < ora) {
    let val: number | null = null;
    if (!dbAttivo()) {
      const u = demo.find((x) => x.id === userId);
      if (!u) return true; // utente inesistente: sessione non valida
      val = u.passwordCambiataAl?.getTime() ?? null;
    } else {
      if (!mongoose.isValidObjectId(userId)) return true;
      const doc = await User.findById(userId).select("passwordCambiataAl").lean();
      if (!doc) return true; // utente eliminato: sessione non valida
      val = doc.passwordCambiataAl ? new Date(doc.passwordCambiataAl).getTime() : null;
    }
    // Cap difensivo: la cache non deve crescere senza limite.
    if (cacheCambioPassword.size > 5000) cacheCambioPassword.clear();
    voce = { val, scade: ora + TTL_CACHE_CAMBIO };
    cacheCambioPassword.set(userId, voce);
  }
  return voce.val !== null && (iatSecondi + 1) * 1000 <= voce.val;
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

/** Cambia la password verificando quella attuale. */
export async function cambiaPassword(
  id: string,
  attuale: string,
  nuova: string
): Promise<boolean> {
  let u: UtenteInterno | null;
  if (!dbAttivo()) {
    u = demo.find((x) => x.id === id) ?? null;
  } else {
    const doc = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
    u = doc ? fromDoc(doc) : null;
  }
  if (!u?.passwordHash) return false;
  if (!(await bcrypt.compare(attuale, u.passwordHash))) return false;

  const hash = await bcrypt.hash(nuova, 12);
  const adesso = new Date();
  if (!dbAttivo()) {
    u.passwordHash = hash;
    u.passwordCambiataAl = adesso;
  } else {
    await User.findByIdAndUpdate(id, { passwordHash: hash, passwordCambiataAl: adesso });
  }
  // Le sessioni emesse prima del cambio diventano subito invalide.
  segnaCambioPassword(id, adesso);
  return true;
}

/** Crea un token di reset (valido 1h) per l'email; ritorna il token in chiaro. */
export async function creaTokenReset(email: string): Promise<string | null> {
  const u = await trovaPerEmail(email);
  if (!u) return null;
  const token = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = hashToken(token);
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);
  if (!dbAttivo()) {
    const du = demo.find((x) => x.id === u.id);
    if (du) {
      du.resetTokenHash = resetTokenHash;
      du.resetTokenExp = resetTokenExp;
    }
  } else {
    await User.findByIdAndUpdate(u.id, { resetTokenHash, resetTokenExp });
  }
  return token;
}

/** Reimposta la password a partire da un token valido. */
export async function resetPassword(
  token: string,
  nuova: string
): Promise<boolean> {
  const hash = hashToken(token);
  const adesso = new Date();
  // Prima si valida il token, POI si paga il costo del bcrypt: niente ~250ms
  // di CPU regalati a ogni tentativo invalido su un endpoint pubblico.
  if (!dbAttivo()) {
    const u = demo.find(
      (x) =>
        x.resetTokenHash === hash &&
        x.resetTokenExp &&
        x.resetTokenExp.getTime() > Date.now()
    );
    if (!u) return false;
    u.passwordHash = await bcrypt.hash(nuova, 12);
    u.resetTokenHash = undefined;
    u.resetTokenExp = undefined;
    u.passwordCambiataAl = adesso;
    segnaCambioPassword(u.id, adesso);
    return true;
  }
  const doc = await User.findOne({
    resetTokenHash: hash,
    resetTokenExp: { $gt: new Date() },
  });
  if (!doc) return false;
  const passwordHash = await bcrypt.hash(nuova, 12);
  await User.updateOne(
    { _id: doc._id },
    {
      $set: { passwordHash, passwordCambiataAl: adesso },
      $unset: { resetTokenHash: "", resetTokenExp: "" },
    }
  );
  // Un reset avviene tipicamente perché la password è compromessa:
  // tutte le sessioni precedenti decadono.
  segnaCambioPassword(doc.id, adesso);
  return true;
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
  try {
    const doc = await User.create({ email: e, nome, passwordHash });
    return pubblico(fromDoc(doc));
  } catch (err) {
    // Due registrazioni concorrenti sulla stessa email: l'indice unique vince
    // sulla check-then-create. Si risponde 409, non 500.
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  }
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
  if (esistente) {
    // Collega il googleId all'account esistente al primo accesso Google,
    // così il vincolo è esplicito e non solo implicito via email.
    if (!esistente.googleId) {
      if (!dbAttivo()) {
        const du = demo.find((x) => x.id === esistente.id);
        if (du) du.googleId = googleId;
      } else {
        await User.findByIdAndUpdate(esistente.id, { googleId });
      }
    }
    return { utente: pubblico(esistente), nuovo: false };
  }

  const e = email.toLowerCase().trim();
  if (!dbAttivo()) {
    const u: UtenteInterno = { id: `demo-${Date.now()}`, email: e, nome, googleId };
    demo.push(u);
    return { utente: pubblico(u), nuovo: true };
  }
  const doc = await User.create({ email: e, nome, googleId });
  return { utente: pubblico(fromDoc(doc)), nuovo: true };
}
