import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export const FASI_APPROVAZIONE = [
  "Bozza",
  "Revisione",
  "Approvazione",
  "Esecuzione",
] as const;

export type FaseApprovazione = (typeof FASI_APPROVAZIONE)[number];

export interface Approvazione {
  id: string;
  tipo: string;
  oggetto: string;
  fase: FaseApprovazione;
  richiedente: string;
}

const KEY = ["approvazioni"];

export function useApprovazioni() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Approvazione[]>("/approvazioni"),
  });
}

export function useAggiornaApprovazione() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fase }: { id: string; fase: FaseApprovazione }) =>
      apiFetch<Approvazione>(`/approvazioni/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ fase }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminaApprovazione() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/approvazioni/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
