import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export const FASI_CRM = [
  "Nuovo",
  "In Analisi",
  "Offerta Inviata",
  "Negoziazione",
  "Chiuso",
] as const;

export type FaseCrm = (typeof FASI_CRM)[number];

export interface Opportunita {
  id: string;
  cliente: string;
  valore: number;
  fase: FaseCrm;
}

export interface NuovaOpportunita {
  cliente: string;
  valore: number;
  fase?: FaseCrm;
}

const KEY = ["crm"];

export function useOpportunita() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Opportunita[]>("/crm"),
  });
}

export function useCreaOpportunita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuovaOpportunita) =>
      apiFetch<Opportunita>("/crm", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAggiornaOpportunita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fase }: { id: string; fase: FaseCrm }) =>
      apiFetch<Opportunita>(`/crm/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ fase }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminaOpportunita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/crm/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
