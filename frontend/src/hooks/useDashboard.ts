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
  attivita: { testo: string; tempo: string }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: () => apiFetch<DashboardData>("/dashboard/kpi"),
    // Evita di rifare la richiesta a ogni ritorno sulla dashboard.
    staleTime: 60_000,
  });
}
