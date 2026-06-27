import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMe } from "@/hooks/useAuth";

export function RequireAuth() {
  const { data: utente, isLoading } = useMe();
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

  if (!utente) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
