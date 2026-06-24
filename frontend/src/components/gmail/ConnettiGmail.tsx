import { Mail, Loader2, CheckCircle2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { caricaGsi } from "@/lib/gsi";
import {
  useStatoGmail,
  useConnettiGmail,
  useDisconnettiGmail,
} from "@/hooks/useGmail";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";

/** Pulsante per collegare/scollegare la casella Gmail dell'utente. */
export function ConnettiGmail({ compatto }: { compatto?: boolean }) {
  const { data: stato, isLoading } = useStatoGmail();
  const connetti = useConnettiGmail();
  const disconnetti = useDisconnettiGmail();

  async function avvia() {
    if (!CLIENT_ID) {
      toast("Accesso Google non configurato.", "errore");
      return;
    }
    try {
      await caricaGsi();
      const codeClient = window.google!.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        ux_mode: "popup",
        callback: (resp) => {
          if (!resp.code) return;
          connetti.mutate(resp.code, {
            onSuccess: (r) => toast(`Gmail collegato (${r.email}).`),
            onError: (e) =>
              toast(e instanceof Error ? e.message : "Errore di collegamento.", "errore"),
          });
        },
      });
      codeClient.requestCode();
    } catch {
      toast("Impossibile avviare il collegamento a Gmail.", "errore");
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size={compatto ? "sm" : "default"} disabled>
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  if (stato?.connesso) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-secondary">
          <CheckCircle2 className="size-4" />
          {compatto ? "Gmail collegato" : `Collegato come ${stato.email}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            disconnetti.mutate(undefined, {
              onSuccess: () => toast("Gmail scollegato."),
            })
          }
          disabled={disconnetti.isPending}
        >
          <Unlink className="size-4" /> Scollega
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={avvia}
      size={compatto ? "sm" : "default"}
      disabled={connetti.isPending || stato?.configurato === false}
    >
      {connetti.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Mail className="size-4" />
      )}
      Connetti Gmail
    </Button>
  );
}
