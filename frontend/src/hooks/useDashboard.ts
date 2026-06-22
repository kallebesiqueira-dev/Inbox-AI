import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Metrica {
  valore: number;
  delta: number;
}

export interface DashboardData {
  metriche: {
    emailElaborate: Metrica;
    offerteGenerate: Metrica;
    opportunitaAperte: Metrica;
    oreRisparmiate: Metrica;
  };
  oreMensili: { mese: string; valore: number }[];
  attivita: { testo: string; tempo: string }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: () => apiFetch<DashboardData>("/dashboard/kpi"),
  });
}
