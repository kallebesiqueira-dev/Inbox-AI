import type { Model } from "mongoose";
import { Offerta, STATI_OFFERTA } from "../models/Offerta.js";
import { creaCrud } from "./crud.js";

export type Stato = (typeof STATI_OFFERTA)[number];

export interface OffertaInput extends Record<string, unknown> {
  cliente: string;
  importo: number;
  stato?: Stato;
  numero?: string;
  data?: Date; // gestita dal modello, non dall'utente
}

export interface OffertaDTO {
  id: string;
  numero: string;
  cliente: string;
  importo: number;
  stato: Stato;
  data: string;
}

function generaNumero(): string {
  return `${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
}

const seed: OffertaDTO[] = [
  { id: "demo-1", numero: "2025-086", cliente: "Rossi S.p.A.", importo: 12400, stato: "Bozza", data: "2026-06-18T00:00:00.000Z" },
  { id: "demo-2", numero: "2025-085", cliente: "Bianchi SRL", importo: 8750, stato: "In revisione", data: "2026-06-15T00:00:00.000Z" },
  { id: "demo-3", numero: "2025-084", cliente: "Verdi & Co", importo: 21300, stato: "Approvata", data: "2026-06-12T00:00:00.000Z" },
  { id: "demo-4", numero: "2025-083", cliente: "Studio Ferrari", importo: 5600, stato: "Inviata", data: "2026-06-10T00:00:00.000Z" },
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
  }),
  seed,
  demo: (input, id) => ({
    id,
    numero: input.numero ?? generaNumero(),
    cliente: input.cliente,
    importo: input.importo,
    stato: input.stato ?? "Bozza",
    data: new Date().toISOString(),
  }),
});
