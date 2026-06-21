import type { Request, Response } from "express";
import { z } from "zod";
import { ai } from "../services/ai/index.js";

// Limiti di lunghezza espliciti: contengono costo e abuso e trattano il testo
// dell'email come dato non fidato (mitigazione prompt-injection col provider reale).
const analizzaSchema = z.object({
  mittente: z.string().trim().min(1, "Mittente obbligatorio.").max(320),
  oggetto: z.string().trim().min(1, "Oggetto obbligatorio.").max(300),
  corpo: z.string().max(10_000).optional().default(""),
});

const offertaSchema = z.object({
  cliente: z.string().trim().min(1, "Cliente obbligatorio.").max(200),
  richiesta: z.string().trim().min(1, "Richiesta obbligatoria.").max(10_000),
});

export async function analizzaEmail(req: Request, res: Response) {
  const parsed = analizzaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      messaggio: "Dati non validi.",
      errori: parsed.error.flatten().fieldErrors,
    });
  }

  const risultato = await ai.analizzaEmail(parsed.data);
  res.json(risultato);
}

export async function generaOfferta(req: Request, res: Response) {
  const parsed = offertaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      messaggio: "Dati non validi.",
      errori: parsed.error.flatten().fieldErrors,
    });
  }

  const offerta = await ai.generaOfferta(parsed.data);
  res.json(offerta);
}
