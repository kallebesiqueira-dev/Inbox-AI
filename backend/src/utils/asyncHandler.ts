import type { NextFunction, Request, Response, RequestHandler } from "express";

type HandlerAsync = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

/**
 * Inoltra i reject delle promise all'errorHandler. Express 4 non lo fa da solo:
 * un errore async non gestito diventerebbe una unhandledRejection e, con Node
 * moderno, abbatterebbe l'intero processo invece di rispondere 500.
 */
export function ah(fn: HandlerAsync): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
