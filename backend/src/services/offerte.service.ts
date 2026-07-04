import mongoose, { type Model } from "mongoose";
import { Offerta, STATI_OFFERTA } from "../models/Offerta.js";
import { Contatore } from "../models/Contatore.js";
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

const contatoriDemo = new Map<string, number>();

/**
 * Numero progressivo per utente/anno (es. "2026-007"): incremento atomico su
 * Mongo, così due creazioni concorrenti non possono produrre lo stesso numero.
 */
export async function prossimoNumeroOfferta(userId: string): Promise<string> {
  const anno = new Date().getFullYear();
  const chiave = `offerta:${userId}:${anno}`;
  let progressivo: number;
  if (mongoose.connection.readyState !== 1) {
    progressivo = (contatoriDemo.get(chiave) ?? 0) + 1;
    contatoriDemo.set(chiave, progressivo);
  } else {
    const doc = await Contatore.findOneAndUpdate(
      { chiave },
      { $inc: { valore: 1 } },
      { new: true, upsert: true }
    );
    progressivo = doc.valore;
  }
  return `${anno}-${String(progressivo).padStart(3, "0")}`;
}

export const offerteCrud = creaCrud<OffertaInput, OffertaDTO>({
  model: Offerta as unknown as Model<OffertaInput>,
  toDTO: (d) => ({
    id: d.id,
    numero: d.numero ?? "—",
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
  demo: (input, id) => ({
    id,
    numero: input.numero ?? "—",
    cliente: input.cliente,
    importo: input.importo,
    stato: input.stato ?? "Bozza",
    data: new Date().toISOString(),
    corpo: input.corpo ?? "",
    voci: input.voci ?? [],
  }),
});
