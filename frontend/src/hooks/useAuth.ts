import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";

export interface Utente {
  id: string;
  email: string;
  nome: string;
}

export interface CredenzialiLogin {
  email: string;
  password: string;
}

export interface DatiRegistrazione extends CredenzialiLogin {
  nome: string;
}

const ME_KEY = ["auth", "me"];

/** Sessione corrente. 401 => non autenticato (null). */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await apiFetch<Utente>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cred: CredenzialiLogin) =>
      apiFetch<Utente>("/auth/login", {
        method: "POST",
        body: JSON.stringify(cred),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, utente),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dati: DatiRegistrazione) =>
      apiFetch<Utente>("/auth/register", {
        method: "POST",
        body: JSON.stringify(dati),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, utente),
  });
}

export function useGoogleLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) =>
      apiFetch<Utente>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, utente),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}
