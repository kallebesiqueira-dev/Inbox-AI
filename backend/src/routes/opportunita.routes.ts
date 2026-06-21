import { z } from "zod";
import { FASI_CRM } from "../models/Opportunita.js";
import { opportunitaCrud } from "../services/opportunita.service.js";
import { controllerCrud } from "../controllers/crud.controller.js";
import { rotteCrud } from "./crud.routes.js";

const schema = z.object({
  cliente: z.string().min(1, "Il cliente è obbligatorio.").max(200),
  valore: z.number().nonnegative("Il valore non può essere negativo."),
  fase: z.enum(FASI_CRM).optional(),
});

export default rotteCrud(controllerCrud(opportunitaCrud, schema));
