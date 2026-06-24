import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResetPassword } from "@/hooks/useAuth";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [fatto, setFatto] = useState(false);
  const errore = reset.error instanceof Error ? reset.error.message : null;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    reset.mutate({ token, password }, { onSuccess: () => setFatto(true) });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpeg" alt="Inbox AI" className="h-20 w-auto rounded" />
          </div>

          {!token ? (
            <p className="text-center text-sm text-destructive">
              Link non valido. Richiedi un nuovo reset dalla pagina di accesso.
            </p>
          ) : fatto ? (
            <div className="space-y-4 text-center">
              <p className="rounded-md bg-secondary/10 px-3 py-3 text-sm">
                Password aggiornata. Ora puoi accedere.
              </p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Vai all'accesso
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={invia}>
              <h1 className="text-center text-lg font-semibold">Nuova password</h1>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nuova password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errore && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {errore}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={reset.isPending}>
                {reset.isPending && <Loader2 className="size-4 animate-spin" />}
                Reimposta password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
