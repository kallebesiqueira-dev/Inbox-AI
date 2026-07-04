import type { Request, Response } from "express";
import * as gmail from "../services/gmail.service.js";

/**
 * Inbox reale: se l'utente ha collegato Gmail restituisce le sue email vere,
 * altrimenti una lista vuota (nessun dato demo). Il frontend invita a collegare
 * Gmail quando la casella non è connessa.
 */
export async function elenca(req: Request, res: Response) {
  if (!req.userId) return res.json([]);
  try {
    const reali = await gmail.leggiEmail(req.userId);
    return res.json(reali ?? []);
  } catch (err) {
    // Errore reale (es. refresh token revocato da Google): va segnalato,
    // non mascherato da casella vuota.
    console.error("[Inbox] lettura Gmail fallita:", err);
    return res.status(502).json({
      messaggio: "Impossibile leggere la casella Gmail. Prova a ricollegare l'account.",
    });
  }
}
