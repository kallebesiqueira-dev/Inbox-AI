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
}

const seed: ApprovazioneDTO[] = [
  { id: "demo-1", tipo: "Invio offerta", oggetto: "Offerta #2025-086 — Rossi S.p.A.", fase: "Approvazione", richiedente: "Sistema AI" },
  { id: "demo-2", tipo: "Invio documento", oggetto: "Contratto fornitura — Bianchi SRL", fase: "Revisione", richiedente: "Sistema AI" },
  { id: "demo-3", tipo: "Operazione finanziaria", oggetto: "Nota di credito — Verdi & Co", fase: "Approvazione", richiedente: "Sistema AI" },
];

export const approvazioneCrud = creaCrud<ApprovazioneInput, ApprovazioneDTO>({
  model: Approvazione as unknown as Model<ApprovazioneInput>,
  toDTO: (d) => ({
    id: d.id,
    tipo: d.tipo as TipoApprovazione,
    oggetto: d.oggetto,
    fase: d.fase as FaseApprovazione,
    richiedente: d.richiedente ?? "Sistema AI",
  }),
  seed,
  demo: (input, id) => ({
    id,
    tipo: input.tipo,
    oggetto: input.oggetto,
    fase: input.fase ?? "Revisione",
    richiedente: input.richiedente ?? "Sistema AI",
  }),
});
