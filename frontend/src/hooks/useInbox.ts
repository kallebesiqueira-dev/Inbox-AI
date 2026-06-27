import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type CategoriaEmail =
  | "Commerciale"
  | "Offerta"
  | "Supporto"
  | "Amministrazione"
  | "Altro";

export interface EmailInbox {
  id: string;
  mittente: string;
  mittenteEmail?: string;
  oggetto: string;
  categoria: CategoriaEmail;
  priorita: "Alta" | "Media" | "Bassa";
  tempo: string;
  corpo: string;
}

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: () => apiFetch<EmailInbox[]>("/inbox"),
    // L'analisi AI delle email è costosa: niente refetch a ogni navigazione.
    staleTime: 120_000,
  });
}
