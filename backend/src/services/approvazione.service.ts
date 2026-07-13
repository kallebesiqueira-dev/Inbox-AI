import type { Model } from "mongoose";
import {
  Approvazione,
  TIPI_APPROVAZIONE,
  FASI_APPROVAZIONE,
} from "../models/Approvazione.js";
import { creaCrud } from "./crud.js";

export type TipoApprovazione = (typeof TIPI_APPROVAZIONE)[number];
export type FaseApprovazione = (typeof FASI_APPROVAZIONE)[number];

export interface ApprovazioneInput extends Record<string, unknown> {
  tipo: TipoApprovazione;
  oggetto: string;
  fase?: FaseApprovazione;
  richiedente?: string;
}

export interface ApprovazioneDTO {
  id: string;
  tipo: TipoApprovazione;
  oggetto: string;
  fase: FaseApprovazione;
  richiedente: string;
  /** Data di creazione (ISO) — usata dalla dashboard per le serie mensili. */
  data: string;
}

export const approvazioneCrud = creaCrud<ApprovazioneInput, ApprovazioneDTO>({
  model: Approvazione as unknown as Model<ApprovazioneInput>,
  toDTO: (d) => ({
    id: d.id,
    tipo: d.tipo as TipoApprovazione,
    oggetto: d.oggetto,
    fase: d.fase as FaseApprovazione,
    richiedente: d.richiedente ?? "Sistema AI",
    data: (
      (d as unknown as { createdAt?: Date }).createdAt ?? new Date()
    ).toISOString(),
  }),
  demo: (input, id) => ({
    id,
    tipo: input.tipo,
    oggetto: input.oggetto,
    fase: input.fase ?? "Revisione",
    richiedente: input.richiedente ?? "Sistema AI",
    data: new Date().toISOString(),
  }),
});
