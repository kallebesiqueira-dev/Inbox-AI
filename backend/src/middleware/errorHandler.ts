import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ messaggio: "Risorsa non trovata." });
}

export function errorHandler(
  err: Error & { type?: string; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Errori del client (body JSON malformato, payload oltre il limite): 4xx,
  // non un finto errore interno.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ messaggio: "Corpo della richiesta non valido." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ messaggio: "Corpo della richiesta troppo grande." });
  }
  console.error("[Errore]", err);
  res.status(500).json({ messaggio: "Si è verificato un errore interno." });
}
