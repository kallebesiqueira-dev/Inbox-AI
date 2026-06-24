import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface StatoGmail {
  connesso: boolean;
  email?: string;
  configurato: boolean;
}

export function useStatoGmail() {
  return useQuery({
    queryKey: ["gmail", "stato"],
    queryFn: () => apiFetch<StatoGmail>("/gmail/stato"),
  });
}

export function useConnettiGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ connesso: boolean; email: string }>("/gmail/connetti", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gmail"] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

export function useDisconnettiGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/gmail/disconnetti", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gmail"] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}
