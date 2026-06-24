import { useState } from "react";
import {
  X,
  Sparkles,
  FileText,
  Users,
  Loader2,
  CheckCircle2,
  Reply,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatEuro } from "@/lib/utils";
import {
  useAnalizzaEmail,
  useGeneraOfferta,
  useGeneraRisposta,
  type OffertaGenerata,
} from "@/hooks/useAI";
import { useInviaEmail } from "@/hooks/useGmail";
import { useCreaOfferta } from "@/hooks/useOfferte";
import { useCreaOpportunita } from "@/hooks/useOpportunita";
import type { EmailInbox } from "@/hooks/useInbox";

const prioritaColore: Record<string, string> = {
  Alta: "text-destructive",
  Media: "text-accent",
  Bassa: "text-muted-foreground",
};

export function EmailDetail({
  email,
  onClose,
}: {
  email: EmailInbox;
  onClose: () => void;
}) {
  const analizza = useAnalizzaEmail();
  const genera = useGeneraOfferta();
  const generaRisposta = useGeneraRisposta();
  const inviaEmail = useInviaEmail();
  const creaOfferta = useCreaOfferta();
  const creaOpportunita = useCreaOpportunita();
  const [offerta, setOfferta] = useState<OffertaGenerata | null>(null);
  const [oppCreata, setOppCreata] = useState(false);
  const [rispondi, setRispondi] = useState(false);
  const [bozza, setBozza] = useState("");

  const analisi = analizza.data;
  const totale = offerta?.voci.reduce((s, v) => s + v.importo, 0) ?? 0;

  function onAnalizza() {
    analizza.mutate({
      mittente: email.mittente,
      oggetto: email.oggetto,
      corpo: email.corpo,
    });
  }

  function onGenera() {
    genera.mutate(
      { cliente: email.mittente, richiesta: `${email.oggetto}. ${email.corpo}` },
      { onSuccess: (o) => setOfferta(o) }
    );
  }

  function onSalvaOfferta() {
    if (!offerta) return;
    creaOfferta.mutate(
      { cliente: email.mittente, importo: totale },
      {
        onSuccess: () => {
          toast(`Offerta creata per ${email.mittente}.`);
          onClose();
        },
      }
    );
  }

  function onCreaOpportunita() {
    creaOpportunita.mutate(
      { cliente: email.mittente, valore: totale },
      {
        onSuccess: () => {
          toast(`Opportunità creata nel CRM per ${email.mittente}.`);
          setOppCreata(true);
        },
      }
    );
  }

  function onGeneraRisposta() {
    generaRisposta.mutate(
      { mittente: email.mittente, oggetto: email.oggetto, corpo: email.corpo },
      { onSuccess: (r) => setBozza(r.bozza) }
    );
  }

  function onInvia() {
    if (!email.mittenteEmail || !bozza.trim()) return;
    inviaEmail.mutate(
      { to: email.mittenteEmail, oggetto: `Re: ${email.oggetto}`, corpo: bozza.trim() },
      {
        onSuccess: () => {
          toast("Risposta inviata.");
          onClose();
        },
        onError: (e) =>
          toast(e instanceof Error ? e.message : "Invio non riuscito.", "errore"),
      }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary">
              {email.mittente.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{email.mittente}</p>
              <p className="truncate text-sm text-muted-foreground">{email.oggetto}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Corpo email */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline">{email.categoria}</Badge>
              <span className={`text-xs font-medium ${prioritaColore[email.priorita]}`}>
                Priorità {email.priorita}
              </span>
              <span className="text-xs text-muted-foreground">· {email.tempo} fa</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {email.corpo}
            </p>
          </div>

          {/* Analisi AI */}
          {!analisi ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={onAnalizza}
              disabled={analizza.isPending}
            >
              {analizza.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Analizza con AI
            </Button>
          ) : (
            <div className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-secondary" />
                <span className="text-sm font-semibold">Analisi AI</span>
                <Badge variant="default">{analisi.categoria}</Badge>
              </div>
              <p className="mt-2 text-sm">{analisi.riassunto}</p>
              {analisi.azioniSuggerite.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {analisi.azioniSuggerite.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Offerta generata */}
          {offerta && (
            <div className="rounded-xl border border-border p-4">
              <p className="font-semibold">{offerta.titolo}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {offerta.corpo}
              </p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {offerta.voci.map((v, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5">{v.descrizione}</td>
                      <td className="py-1.5 text-right">{formatEuro(v.importo)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-1.5">Totale</td>
                    <td className="py-1.5 text-right text-primary">{formatEuro(totale)}</td>
                  </tr>
                </tbody>
              </table>
              <Button
                className="mt-3 w-full"
                onClick={onSalvaOfferta}
                disabled={creaOfferta.isPending}
              >
                {creaOfferta.isPending && <Loader2 className="size-4 animate-spin" />}
                Crea offerta
              </Button>
            </div>
          )}

          {/* Risposta */}
          {rispondi && (
            <div className="rounded-xl border border-border p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                A: {email.mittenteEmail || "indirizzo non disponibile"}
              </p>
              <textarea
                value={bozza}
                onChange={(e) => setBozza(e.target.value)}
                rows={6}
                placeholder="Scrivi la tua risposta o generala con l'AI…"
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onGeneraRisposta}
                  disabled={generaRisposta.isPending}
                >
                  {generaRisposta.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Genera bozza con AI
                </Button>
                <Button
                  size="sm"
                  onClick={onInvia}
                  disabled={
                    !bozza.trim() || !email.mittenteEmail || inviaEmail.isPending
                  }
                >
                  {inviaEmail.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Invia
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setRispondi((v) => !v)}
          >
            <Reply className="size-4" />
            {rispondi ? "Annulla" : "Rispondi"}
          </Button>
          {!offerta && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onGenera}
              disabled={genera.isPending}
            >
              {genera.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              Genera offerta con AI
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCreaOpportunita}
            disabled={creaOpportunita.isPending || oppCreata}
          >
            {oppCreata ? (
              <CheckCircle2 className="size-4 text-secondary" />
            ) : creaOpportunita.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Users className="size-4" />
            )}
            {oppCreata ? "Opportunità creata" : "Crea opportunità CRM"}
          </Button>
        </div>
      </div>
    </div>
  );
}
