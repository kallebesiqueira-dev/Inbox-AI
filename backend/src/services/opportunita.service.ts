import type { Model } from "mongoose";
import { Opportunita, FASI_CRM } from "../models/Opportunita.js";
import { creaCrud } from "./crud.js";

export type FaseCrm = (typeof FASI_CRM)[number];

export interface OpportunitaInput extends Record<string, unknown> {
  cliente: string;
  valore: number;
  fase?: FaseCrm;
  avatar?: string;
}

export interface OpportunitaDTO {
  id: string;
  cliente: string;
  valore: number;
  fase: FaseCrm;
  avatar?: string;
}

const semi: OpportunitaInput[] = [
  { cliente: "Gialli SRL", valore: 9000, fase: "Nuovo" },
  { cliente: "Marini SpA", valore: 15000, fase: "Nuovo" },
  { cliente: "Rossi S.p.A.", valore: 12400, fase: "In Analisi" },
  { cliente: "Studio Ferrari", valore: 5600, fase: "Offerta Inviata" },
  { cliente: "Conti & Figli", valore: 18200, fase: "Offerta Inviata" },
  { cliente: "Verdi & Co", valore: 21300, fase: "Negoziazione" },
  { cliente: "Bianchi SRL", valore: 8750, fase: "Chiuso" },
];

export const opportunitaCrud = creaCrud<OpportunitaInput, OpportunitaDTO>({
  model: Opportunita as unknown as Model<OpportunitaInput>,
  toDTO: (d) => ({
    id: d.id,
    cliente: d.cliente,
    valore: d.valore,
    fase: d.fase as FaseCrm,
    avatar: (d.avatar as string | undefined) ?? undefined,
  }),
  semi,
  demo: (input, id) => ({
    id,
    cliente: input.cliente,
    valore: input.valore,
    fase: input.fase ?? "Nuovo",
    avatar: input.avatar,
  }),
});
