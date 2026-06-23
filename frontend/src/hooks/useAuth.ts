import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, setCsrfToken } from "@/lib/api";

export interface Utente {
  id: string;
  email: string;
  nome: string;
  avatar?: string;
}

/** Risposta di autenticazione: utente + token CSRF da usare negli header. */
type SessioneUtente = Utente & { csrfToken?: string };

function memorizzaSessione(u: SessioneUtente) {
  setCsrfToken(u.csrfToken ?? null);
  return u;
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
        return memorizzaSessione(await apiFetch<SessioneUtente>("/auth/me"));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setCsrfToken(null);
          return null;
        }
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
      apiFetch<SessioneUtente>("/auth/login", {
        method: "POST",
        body: JSON.stringify(cred),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, memorizzaSessione(utente)),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dati: DatiRegistrazione) =>
      apiFetch<SessioneUtente>("/auth/register", {
        method: "POST",
        body: JSON.stringify(dati),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, memorizzaSessione(utente)),
  });
}

export function useGoogleLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) =>
      apiFetch<SessioneUtente>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }),
    onSuccess: (utente) => qc.setQueryData(ME_KEY, memorizzaSessione(utente)),
  });
}

export function useAggiornaAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avatar: string) =>
      apiFetch<Utente>("/auth/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatar }),
      }),
    onSuccess: (utente) =>
      qc.setQueryData(ME_KEY, (prev: SessioneUtente | null) =>
        prev ? { ...prev, ...utente } : prev
      ),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setCsrfToken(null);
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}
