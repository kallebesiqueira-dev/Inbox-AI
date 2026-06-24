import type { Model } from "mongoose";
import { Offerta, STATI_OFFERTA } from "../models/Offerta.js";
import { creaCrud } from "./crud.js";

export type Stato = (typeof STATI_OFFERTA)[number];

export interface VoceOfferta {
  descrizione: string;
  importo: number;
}

export interface OffertaInput extends Record<string, unknown> {
  cliente: string;
  importo: number;
  stato?: Stato;
  numero?: string;
  corpo?: string;
  voci?: VoceOfferta[];
  data?: Date; // gestita dal modello, non dall'utente
}

export interface OffertaDTO {
  id: string;
  numero: string;
  cliente: string;
  importo: number;
  stato: Stato;
  data: string;
  corpo: string;
  voci: VoceOfferta[];
}

function generaNumero(): string {
  return `${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
}

const semi: OffertaInput[] = [
  { numero: "2025-086", cliente: "Rossi S.p.A.", importo: 12400, stato: "Bozza" },
  { numero: "2025-085", cliente: "Bianchi SRL", importo: 8750, stato: "In revisione" },
  { numero: "2025-084", cliente: "Verdi & Co", importo: 21300, stato: "Approvata" },
  { numero: "2025-083", cliente: "Studio Ferrari", importo: 5600, stato: "Inviata" },
];

export const offerteCrud = creaCrud<OffertaInput, OffertaDTO>({
  model: Offerta as unknown as Model<OffertaInput>,
  toDTO: (d) => ({
    id: d.id,
    numero: d.numero ?? generaNumero(),
    cliente: d.cliente,
    importo: d.importo,
    stato: d.stato as Stato,
    data: (d.data ?? new Date()).toISOString(),
    corpo: (d.corpo as string) ?? "",
    voci: ((d.voci as VoceOfferta[]) ?? []).map((v) => ({
      descrizione: v.descrizione,
      importo: v.importo,
    })),
  }),
  semi,
  demo: (input, id) => ({
    id,
    numero: input.numero ?? generaNumero(),
    cliente: input.cliente,
    importo: input.importo,
    stato: input.stato ?? "Bozza",
    data: new Date().toISOString(),
    corpo: input.corpo ?? "",
    voci: input.voci ?? [],
  }),
});
