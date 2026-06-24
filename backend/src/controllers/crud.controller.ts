import type { Request, Response } from "express";
import type { AnyZodObject } from "zod";
import type { Crud } from "../services/crud.js";

/** Controller CRUD generico per-utente con validazione zod (create + update parziale). */
export function controllerCrud<
  TDTO extends { id: string },
  TInput extends Record<string, unknown>,
>(crud: Crud<TDTO, TInput>, schema: AnyZodObject) {
  const aggiornaSchema = schema.partial();
  const uid = (req: Request) => req.userId ?? "";

  return {
    async elenca(req: Request, res: Response) {
      res.json(await crud.elenca(uid(req)));
    },
    async cestino(req: Request, res: Response) {
      res.json(await crud.elencaCestino(uid(req)));
    },
    async crea(req: Request, res: Response) {
      const p = schema.safeParse(req.body);
      if (!p.success) {
        return res
          .status(400)
          .json({ messaggio: "Dati non validi.", errori: p.error.flatten().fieldErrors });
      }
      res.status(201).json(await crud.crea(uid(req), p.data as TInput));
    },
    async aggiorna(req: Request, res: Response) {
      const p = aggiornaSchema.safeParse(req.body);
      if (!p.success) {
        return res
          .status(400)
          .json({ messaggio: "Dati non validi.", errori: p.error.flatten().fieldErrors });
      }
      const upd = await crud.aggiorna(uid(req), req.params.id, p.data as Partial<TInput>);
      if (!upd) return res.status(404).json({ messaggio: "Risorsa non trovata." });
      res.json(upd);
    },
    async elimina(req: Request, res: Response) {
      const ok = await crud.elimina(uid(req), req.params.id);
      if (!ok) return res.status(404).json({ messaggio: "Risorsa non trovata." });
      res.status(204).end();
    },
    async ripristina(req: Request, res: Response) {
      const ripristinato = await crud.ripristina(uid(req), req.params.id);
      if (!ripristinato)
        return res.status(404).json({ messaggio: "Risorsa non trovata." });
      res.json(ripristinato);
    },
    async eliminaDefinitivo(req: Request, res: Response) {
      const ok = await crud.eliminaDefinitivo(uid(req), req.params.id);
      if (!ok) return res.status(404).json({ messaggio: "Risorsa non trovata." });
      res.status(204).end();
    },
  };
}

export type ControllerCrud = ReturnType<typeof controllerCrud>;
