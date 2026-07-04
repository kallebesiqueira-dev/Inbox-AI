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

export const opportunitaCrud = creaCrud<OpportunitaInput, OpportunitaDTO>({
  model: Opportunita as unknown as Model<OpportunitaInput>,
  toDTO: (d) => ({
    id: d.id,
    cliente: d.cliente,
    valore: d.valore,
    fase: d.fase as FaseCrm,
    avatar: (d.avatar as string | undefined) ?? undefined,
  }),
  demo: (input, id) => ({
    id,
    cliente: input.cliente,
    valore: input.valore,
    fase: input.fase ?? "Nuovo",
    avatar: input.avatar,
  }),
});
