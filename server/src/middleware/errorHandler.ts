import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ messaggio: "Risorsa non trovata." });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[Errore]", err);
  res.status(500).json({ messaggio: "Si è verificato un errore interno." });
}
