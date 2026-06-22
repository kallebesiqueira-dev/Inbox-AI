import mongoose from "mongoose";
import { RevokedToken } from "../models/RevokedToken.js";

const dbAttivo = () => mongoose.connection.readyState === 1;

// jti -> istante di scadenza (ms epoch). Cache in memoria consultata ad ogni
// richiesta autenticata: il controllo di revoca è O(1) e non tocca il DB nel
// percorso caldo. La fonte di verità persistente è la collezione RevokedToken.
const revocati = new Map<string, number>();

function purga(now = Date.now()): void {
  for (const [jti, scadenza] of revocati) {
    if (scadenza <= now) revocati.delete(jti);
  }
}

/** Vero se il token (per jti) è stato revocato e non è ancora scaduto. */
export function eRevocato(jti: string): boolean {
  const scadenza = revocati.get(jti);
  if (scadenza === undefined) return false;
  if (scadenza <= Date.now()) {
    revocati.delete(jti);
    return false;
  }
  return true;
}

/**
 * Revoca un token fino alla sua scadenza naturale (exp in secondi epoch).
 * Aggiorna la cache in memoria e, se il DB è attivo, persiste la revoca.
 */
export async function revoca(jti: string, expSecondi: number): Promise<void> {
  const scadenza = new Date(expSecondi * 1000);
  // Token già scaduto: nulla da revocare.
  if (scadenza.getTime() <= Date.now()) return;

  revocati.set(jti, scadenza.getTime());
  if (dbAttivo()) {
    try {
      await RevokedToken.updateOne(
        { jti },
        { $set: { jti, expiresAt: scadenza } },
        { upsert: true }
      );
    } catch (err) {
      // La revoca resta valida in memoria anche se la persistenza fallisce.
      console.error("[Revoca] Persistenza fallita:", err);
    }
  }
}

/** All'avvio ripopola la cache dai token revocati ancora non scaduti. */
export async function caricaRevocati(): Promise<void> {
  if (!dbAttivo()) return;
  try {
    const docs = await RevokedToken.find({ expiresAt: { $gt: new Date() } });
    for (const d of docs) revocati.set(d.jti, d.expiresAt.getTime());
    if (docs.length) {
      console.log(`[Revoca] ${docs.length} token revocati ricaricati in cache.`);
    }
  } catch (err) {
    console.error("[Revoca] Ricarica iniziale fallita:", err);
  }
}

// Spazzata periodica della cache per evitare crescita illimitata; non deve
// tenere vivo il processo (unref) né bloccare un arresto controllato.
const sweeper = setInterval(() => purga(), 60 * 60 * 1000);
sweeper.unref();
