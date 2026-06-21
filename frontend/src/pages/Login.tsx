import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/GoogleButton";
import { useLogin, useRegister } from "@/hooks/useAuth";

type Modalita = "login" | "registrazione";

export function Login() {
  const navigate = useNavigate();
  const [modalita, setModalita] = useState<Modalita>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();
  const registra = useRegister();
  const attiva = modalita === "login" ? login : registra;
  const errore = attiva.error instanceof Error ? attiva.error.message : null;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    const onSuccess = () => navigate("/");
    if (modalita === "login") {
      login.mutate({ email, password }, { onSuccess });
    } else {
      registra.mutate({ nome, email, password }, { onSuccess });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src="/icon.jpeg"
              alt="Inbox AI"
              className="h-40 w-auto rounded-2xl shadow-soft"
            />
          </div>

          <form className="space-y-4" onSubmit={invia}>
            {modalita === "registrazione" && (
              <div className="grid gap-2">
                <label htmlFor="nome" className="text-sm font-medium">
                  Nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Il tuo nome"
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nome@azienda.it"
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={modalita === "registrazione" ? 8 : undefined}
                autoComplete={
                  modalita === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {errore && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {errore}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={attiva.isPending}>
              {attiva.isPending && <Loader2 className="size-4 animate-spin" />}
              {modalita === "login" ? "Accedi" : "Registrati"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            oppure
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {modalita === "login" ? (
              <>
                Non hai un account?{" "}
                <button
                  type="button"
                  onClick={() => setModalita("registrazione")}
                  className="font-medium text-primary hover:underline"
                >
                  Registrati
                </button>
              </>
            ) : (
              <>
                Hai già un account?{" "}
                <button
                  type="button"
                  onClick={() => setModalita("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Accedi
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Autorizza Inbox AI ad analizzare le tue email per automatizzare
            offerte, richieste e attività operative.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
