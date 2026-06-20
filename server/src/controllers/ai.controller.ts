import type { Request, Response } from "express";
import { ai } from "../services/ai/index.js";

export async function analizzaEmail(req: Request, res: Response) {
  const { mittente, oggetto, corpo } = req.body ?? {};

  if (!mittente || !oggetto) {
    return res
      .status(400)
      .json({ messaggio: "Campi obbligatori mancanti: mittente, oggetto." });
  }

  const risultato = await ai.analizzaEmail({
    mittente,
    oggetto,
    corpo: corpo ?? "",
  });
  res.json(risultato);
}

export async function generaOfferta(req: Request, res: Response) {
  const { cliente, richiesta } = req.body ?? {};

  if (!cliente || !richiesta) {
    return res
      .status(400)
      .json({ messaggio: "Campi obbligatori mancanti: cliente, richiesta." });
  }

  const offerta = await ai.generaOfferta({ cliente, richiesta });
  res.json(offerta);
}
