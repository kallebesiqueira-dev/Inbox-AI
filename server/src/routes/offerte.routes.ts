import { z } from "zod";
import { STATI_OFFERTA } from "../models/Offerta.js";
import { offerteCrud } from "../services/offerte.service.js";
import { controllerCrud } from "../controllers/crud.controller.js";
import { rotteCrud } from "./crud.routes.js";

const schema = z.object({
  cliente: z.string().min(1, "Il cliente è obbligatorio.").max(200),
  importo: z.number().nonnegative("L'importo non può essere negativo."),
  stato: z.enum(STATI_OFFERTA).optional(),
  numero: z.string().max(50).optional(),
});

export default rotteCrud(controllerCrud(offerteCrud, schema));
