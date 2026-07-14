import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Metrica {
  valore: number;
  delta: number;
}

export interface PuntoAndamento {
  mese: string;
  offerte: number;
  elementi: number;
  ore: number;
}

export interface FasePipeline {
  fase: string;
  quantita: number;
  valore: number;
}

export interface StatoOfferte {
  stato: string;
  quantita: number;
  importo: number;
}

export interface DashboardData {
  anno: number;
  /** Anni con dati (max 5), per i pulsanti di periodo. */
  anni: number[];
  metriche: {
    emailElaborate: Metrica;
    offerteGenerate: Metrica;
    opportunitaAperte: Metrica;
    valorePipeline: Metrica;
    oreRisparmiate: Metrica;
  };
  andamento: PuntoAndamento[];
  pipeline: FasePipeline[];
  offertePerStato: StatoOfferte[];
  /** Valore delle opportunità create in ciascun mese (grafico a cascata). */
  valoriMensili: { mese: string; valore: number }[];
  attivita: { testo: string; tempo: string }[];
}

export function useDashboard(anno?: number) {
  return useQuery({
    queryKey: ["dashboard", "kpi", anno ?? "corrente"],
    queryFn: () =>
      apiFetch<DashboardData>(
        anno ? `/dashboard/kpi?anno=${anno}` : "/dashboard/kpi"
      ),
    // Evita di rifare la richiesta a ogni ritorno sulla dashboard.
    staleTime: 60_000,
    // Durante il cambio anno mantiene i dati precedenti (niente flash di spinner).
    placeholderData: (prev) => prev,
  });
}
