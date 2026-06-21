import { z } from "zod";
import {
  TIPI_APPROVAZIONE,
  FASI_APPROVAZIONE,
} from "../models/Approvazione.js";
import { approvazioneCrud } from "../services/approvazione.service.js";
import { controllerCrud } from "../controllers/crud.controller.js";
import { rotteCrud } from "./crud.routes.js";

const schema = z.object({
  tipo: z.enum(TIPI_APPROVAZIONE),
  oggetto: z.string().min(1, "L'oggetto è obbligatorio.").max(300),
  fase: z.enum(FASI_APPROVAZIONE).optional(),
  richiedente: z.string().max(120).optional(),
});

export default rotteCrud(controllerCrud(approvazioneCrud, schema));
