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

const chatSchema = z.object({
  messaggi: z
    .array(
      z.object({
        ruolo: z.enum(["utente", "assistente"]),
        contenuto: z.string().trim().min(1).max(4000),
      })
    )
    .min(1, "Nessun messaggio.")
    .max(40),
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

export async function chat(req: Request, res: Response) {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      messaggio: "Dati non validi.",
      errori: parsed.error.flatten().fieldErrors,
    });
  }

  // Streaming via SSE: i proxy (es. Render) non bufferizzano text/event-stream,
  // così i token arrivano al client man mano, senza attese.
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    for await (const chunk of ai.chat(parsed.data.messaggi)) {
      // Il contenuto è codificato in JSON: niente newline grezzi che rompano l'evento.
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (err) {
    // Lo stato è già inviato: si chiude lo stream senza cambiare lo status.
    console.error("[AI] Errore durante lo streaming della chat:", err);
  } finally {
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
