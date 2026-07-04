import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleButton() {
  const ref = useRef<HTMLDivElement>(null);
  const google = useGoogleLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;
    const clientId = CLIENT_ID;
    let annullato = false;

    function inizializza() {
      if (annullato || !ref.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) =>
          google.mutate(resp.credential, {
            onSuccess: () => navigate("/app"),
            // Senza feedback l'utente clicca e "non succede niente".
            onError: (err) =>
              toast(
                err instanceof Error && err.message
                  ? err.message
                  : "Accesso con Google non riuscito. Riprova.",
                "errore"
              ),
          }),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: "it",
        width: 320,
      });
    }

    // Riusa lo script GSI se già presente (evita doppie inizializzazioni con
    // React StrictMode in sviluppo).
    if (window.google?.accounts?.id) {
      inizializza();
      return () => {
        annullato = true;
      };
    }

    let script = document.getElementById("gsi-client") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", inizializza);
    return () => {
      annullato = true;
      script?.removeEventListener("load", inizializza);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Configura VITE_GOOGLE_CLIENT_ID per abilitare l'accesso con Google"
        className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-muted-foreground"
      >
        Continua con Google
      </button>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
