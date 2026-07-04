import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useMe } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

export function RequireAuth() {
  const { data: utente, isLoading, isError, error, refetch } = useMe();
  const [lento, setLento] = useState(false);

  // Su hosting con cold start la prima richiesta può richiedere ~30s:
  // dopo qualche secondo mostriamo un messaggio per non sembrare bloccati.
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setLento(true), 4000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        {lento && (
          <p className="max-w-xs text-center text-sm">
            Avvio del servizio in corso… può richiedere qualche secondo al primo
            accesso.
          </p>
        )}
      </div>
    );
  }

  // Errore di rete o del servizio (non un 401): la sessione potrebbe essere
  // ancora valida, quindi niente redirect al login — si offre un nuovo tentativo.
  const nonAutenticato = error instanceof ApiError && error.status === 401;
  if (isError && !nonAutenticato) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <AlertCircle className="size-6 text-destructive" />
        <p className="max-w-xs text-center text-sm">
          Impossibile contattare il servizio.
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!utente) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
