import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/GoogleButton";
import { useLogin, useRegister, usePasswordDimenticata, useMe } from "@/hooks/useAuth";

type Modalita = "login" | "registrazione" | "recupero";

export function Login() {
  const navigate = useNavigate();
  const { data: utente } = useMe();
  const [modalita, setModalita] = useState<Modalita>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviato, setInviato] = useState(false);

  const login = useLogin();
  const registra = useRegister();
  const recupero = usePasswordDimenticata();
  const attiva =
    modalita === "login" ? login : modalita === "registrazione" ? registra : recupero;
  const errore = attiva.error instanceof Error ? attiva.error.message : null;

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (modalita === "login") {
      login.mutate({ email, password }, { onSuccess: () => navigate("/app") });
    } else if (modalita === "registrazione") {
      registra.mutate({ nome, email, password }, { onSuccess: () => navigate("/app") });
    } else {
      recupero.mutate(email, { onSuccess: () => setInviato(true) });
    }
  }

  const titoloPulsante =
    modalita === "login"
      ? "Accedi"
      : modalita === "registrazione"
        ? "Registrati"
        : "Invia link di reset";

  // Sessione già attiva: inutile mostrare il login.
  if (utente) return <Navigate to="/app" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpeg" alt="Inbox AI" className="h-20 w-auto rounded" />
          </div>

          {modalita === "recupero" && inviato ? (
            <div className="space-y-4 text-center">
              <p className="rounded-md bg-secondary/10 px-3 py-3 text-sm text-foreground">
                Se l'email esiste, riceverai un link per reimpostare la password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setModalita("login");
                  setInviato(false);
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Torna all'accesso
              </button>
            </div>
          ) : (
            <>
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

                {modalita !== "recupero" && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
                      </label>
                      {modalita === "login" && (
                        <button
                          type="button"
                          onClick={() => setModalita("recupero")}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Password dimenticata?
                        </button>
                      )}
                    </div>
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
                )}

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
                  {titoloPulsante}
                </Button>
              </form>

              {modalita !== "recupero" && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    oppure
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <GoogleButton />
                </>
              )}

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
