import { Router } from "express";
import type { ControllerCrud } from "../controllers/crud.controller.js";

/** Costruisce un router REST standard per un controller CRUD generico. */
export function rotteCrud(c: ControllerCrud): Router {
  const router = Router();
  router.get("/", c.elenca);
  router.post("/", c.crea);
  router.patch("/:id", c.aggiorna);
  router.delete("/:id", c.elimina);
  return router;
}
