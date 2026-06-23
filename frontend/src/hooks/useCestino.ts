import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type Risorsa = "offerte" | "crm" | "approvazioni";

export interface VoceCestino {
  risorsa: Risorsa;
  tipo: string;
  id: string;
  etichetta: string;
}

interface OffertaRaw { id: string; numero: string; cliente: string }
interface CrmRaw { id: string; cliente: string }
interface ApprovazioneRaw { id: string; oggetto: string; tipo: string }

const CESTINO_KEY = ["cestino"];

export function useCestino() {
  const offerte = useQuery({
    queryKey: [...CESTINO_KEY, "offerte"],
    queryFn: () => apiFetch<OffertaRaw[]>("/offerte/cestino"),
  });
  const crm = useQuery({
    queryKey: [...CESTINO_KEY, "crm"],
    queryFn: () => apiFetch<CrmRaw[]>("/crm/cestino"),
  });
  const approvazioni = useQuery({
    queryKey: [...CESTINO_KEY, "approvazioni"],
    queryFn: () => apiFetch<ApprovazioneRaw[]>("/approvazioni/cestino"),
  });

  const voci: VoceCestino[] = [
    ...(offerte.data ?? []).map((o) => ({
      risorsa: "offerte" as const,
      tipo: "Offerta",
      id: o.id,
      etichetta: `#${o.numero} · ${o.cliente}`,
    })),
    ...(crm.data ?? []).map((o) => ({
      risorsa: "crm" as const,
      tipo: "Opportunità CRM",
      id: o.id,
      etichetta: o.cliente,
    })),
    ...(approvazioni.data ?? []).map((a) => ({
      risorsa: "approvazioni" as const,
      tipo: `Approvazione · ${a.tipo}`,
      id: a.id,
      etichetta: a.oggetto,
    })),
  ];

  return {
    voci,
    isLoading: offerte.isLoading || crm.isLoading || approvazioni.isLoading,
    isError: offerte.isError || crm.isError || approvazioni.isError,
  };
}

export function useRipristina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ risorsa, id }: { risorsa: Risorsa; id: string }) =>
      apiFetch(`/${risorsa}/${id}/ripristina`, { method: "POST" }),
    onSuccess: (_d, { risorsa }) => {
      qc.invalidateQueries({ queryKey: CESTINO_KEY });
      qc.invalidateQueries({ queryKey: [risorsa] });
    },
  });
}

export function useEliminaDefinitivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ risorsa, id }: { risorsa: Risorsa; id: string }) =>
      apiFetch<void>(`/${risorsa}/${id}/definitivo`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CESTINO_KEY }),
  });
}
