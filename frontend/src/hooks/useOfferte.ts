import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export const STATI_OFFERTA = [
  "Bozza",
  "In revisione",
  "Approvata",
  "Inviata",
] as const;

export type StatoOfferta = (typeof STATI_OFFERTA)[number];

export interface VoceOfferta {
  descrizione: string;
  importo: number;
}

export interface Offerta {
  id: string;
  numero: string;
  cliente: string;
  importo: number;
  stato: StatoOfferta;
  data: string;
  corpo: string;
  voci: VoceOfferta[];
}

export interface NuovaOfferta {
  cliente: string;
  importo: number;
  stato?: StatoOfferta;
  corpo?: string;
  voci?: VoceOfferta[];
}

const KEY = ["offerte"];

export function useOfferte() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Offerta[]>("/offerte"),
  });
}

export function useCreaOfferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuovaOfferta) =>
      apiFetch<Offerta>("/offerte", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAggiornaOfferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NuovaOfferta> }) =>
      apiFetch<Offerta>(`/offerte/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminaOfferta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/offerte/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
