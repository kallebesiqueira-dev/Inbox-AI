import type { Request, Response } from "express";
import { z } from "zod";
import * as gmail from "../services/gmail.service.js";

const connettiSchema = z.object({ code: z.string().min(1) });

export async function connetti(req: Request, res: Response) {
  if (!gmail.configurato()) {
    return res.status(501).json({ messaggio: "Gmail non configurato sul server." });
  }
  const parsed = connettiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ messaggio: "Codice di autorizzazione mancante." });
  }
  try {
    const r = req.userId
      ? await gmail.connetti(req.userId, parsed.data.code)
      : null;
    if (!r) return res.status(400).json({ messaggio: "Impossibile collegare Gmail." });
    res.json({ connesso: true, email: r.email });
  } catch (err) {
    console.error("[Gmail] connetti fallita:", err);
    res.status(502).json({ messaggio: "Errore durante il collegamento a Gmail." });
  }
}

export async function stato(req: Request, res: Response) {
  const s = req.userId ? await gmail.stato(req.userId) : { connesso: false };
  res.json({ ...s, configurato: gmail.configurato() });
}

export async function disconnetti(req: Request, res: Response) {
  if (req.userId) await gmail.disconnetti(req.userId);
  res.status(204).end();
}

const inviaSchema = z.object({
  to: z.string().email("Destinatario non valido."),
  oggetto: z.string().trim().min(1).max(300),
  corpo: z.string().trim().min(1).max(20_000),
  threadId: z.string().optional(),
});

export async function invia(req: Request, res: Response) {
  const parsed = inviaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: parsed.error.flatten().fieldErrors });
  }
  try {
    const ok = req.userId
      ? await gmail.inviaEmail(req.userId, parsed.data)
      : false;
    if (!ok) {
      return res.status(400).json({
        messaggio: "Invio non riuscito. Verifica di aver collegato Gmail con il permesso di invio.",
      });
    }
    res.json({ inviata: true });
  } catch (err) {
    console.error("[Gmail] invio fallito:", err);
    res.status(502).json({ messaggio: "Errore durante l'invio dell'email." });
  }
}
