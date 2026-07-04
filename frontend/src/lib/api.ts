const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Risveglia il backend appena il sito viene aperto (utile su hosting con
 * "cold start", es. Render free): così, quando l'utente accede, il servizio è
 * già attivo. Fire-and-forget, non blocca né influenza la UI.
 */
export function warmup() {
  fetch(`${API_URL}/api/health`, { credentials: "omit", cache: "no-store" }).catch(
    () => {}
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Token CSRF tenuto in memoria: il cookie CSRF è sul dominio dell'API (diverso dal
// frontend) e non è leggibile via document.cookie. Lo riceviamo dal corpo delle
// risposte di autenticazione (vedi useAuth) e lo reinviamo nell'header.
let csrfToken: string | null = null;
export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

/** Wrapper attorno a fetch verso l'API backend, con cookie, CSRF e gestione errori. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const metodo = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Protezione CSRF double-submit per le richieste che modificano lo stato.
  if (metodo !== "GET" && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!res.ok) {
    let messaggio = `Errore richiesta (${res.status})`;
    try {
      const body = await res.json();
      if (body?.messaggio) messaggio = body.messaggio;
    } catch {
      /* risposta senza corpo JSON */
    }
    throw new ApiError(res.status, messaggio);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Variante per le risposte in streaming (es. chat AI): invia un POST con cookie
 * e CSRF e restituisce la Response, lasciando al chiamante la lettura dello stream.
 */
export async function apiStream(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const res = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let messaggio = `Errore richiesta (${res.status})`;
    try {
      const b = await res.json();
      if (b?.messaggio) messaggio = b.messaggio;
    } catch {
      /* risposta senza corpo JSON */
    }
    throw new ApiError(res.status, messaggio);
  }
  return res;
}
