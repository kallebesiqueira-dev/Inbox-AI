import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { STATI_OFFERTA } from "../models/Offerta.js";
import { offerteCrud } from "../services/offerte.service.js";
import { approvazioneCrud } from "../services/approvazione.service.js";
import { controllerCrud } from "../controllers/crud.controller.js";

const schema = z.object({
  cliente: z.string().min(1, "Il cliente è obbligatorio.").max(200),
  importo: z.number().nonnegative("L'importo non può essere negativo."),
  stato: z.enum(STATI_OFFERTA).optional(),
  numero: z.string().max(50).optional(),
});

const ctrl = controllerCrud(offerteCrud, schema);

// Creazione personalizzata: oltre all'offerta crea anche un'approvazione di invio
// (le approvazioni nascono da azioni reali, non da dati demo).
async function crea(req: Request, res: Response) {
  const p = schema.safeParse(req.body);
  if (!p.success) {
    return res
      .status(400)
      .json({ messaggio: "Dati non validi.", errori: p.error.flatten().fieldErrors });
  }
  const userId = req.userId ?? "";
  const offerta = await offerteCrud.crea(userId, p.data);
  await approvazioneCrud.crea(userId, {
    tipo: "Invio offerta",
    oggetto: `Offerta #${offerta.numero} — ${offerta.cliente}`,
    fase: "Revisione",
  });
  res.status(201).json(offerta);
}

const router = Router();
router.get("/", ctrl.elenca);
router.get("/cestino", ctrl.cestino);
router.post("/", crea);
router.patch("/:id", ctrl.aggiorna);
router.delete("/:id", ctrl.elimina);
router.post("/:id/ripristina", ctrl.ripristina);
router.delete("/:id/definitivo", ctrl.eliminaDefinitivo);

export default router;
