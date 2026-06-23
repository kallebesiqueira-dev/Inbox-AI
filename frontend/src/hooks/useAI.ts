import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface AnalisiEmail {
  categoria: "Commerciale" | "Offerta" | "Supporto" | "Amministrazione" | "Altro";
  priorita: "Alta" | "Media" | "Bassa";
  riassunto: string;
  azioniSuggerite: string[];
}

export interface OffertaGenerata {
  titolo: string;
  corpo: string;
  voci: { descrizione: string; importo: number }[];
}

/** Analizza un'email tramite il provider AI. */
export function useAnalizzaEmail() {
  return useMutation({
    mutationFn: (input: { mittente: string; oggetto: string; corpo: string }) =>
      apiFetch<AnalisiEmail>("/ai/analizza-email", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

/** Genera una bozza di offerta tramite il provider AI. */
export function useGeneraOfferta() {
  return useMutation({
    mutationFn: (input: { cliente: string; richiesta: string }) =>
      apiFetch<OffertaGenerata>("/ai/genera-offerta", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
