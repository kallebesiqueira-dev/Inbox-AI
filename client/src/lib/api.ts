const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function leggiCookie(nome: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${nome}=`))
    ?.split("=")[1];
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
  if (metodo !== "GET") {
    const csrf = leggiCookie("ia_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
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
