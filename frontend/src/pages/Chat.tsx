import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, SquarePen, FileText, Inbox, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

const SUGGERIMENTI = [
  { icon: Inbox, testo: "Riassumi le email commerciali ricevute oggi" },
  { icon: FileText, testo: "Scrivi una bozza di offerta per un nuovo cliente" },
  { icon: Users, testo: "Quali opportunità del CRM sono prioritarie?" },
  { icon: Sparkles, testo: "Suggerisci come ridurre i tempi di approvazione" },
];

export function Chat() {
  const { messaggi, inCorso, errore, invia, reset } = useChat();
  const [testo, setTesto] = useState("");
  const fineRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Scorre in fondo a ogni aggiornamento dei messaggi.
  useEffect(() => {
    fineRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi]);

  // Altezza dinamica della textarea (fino a un massimo).
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [testo]);

  function inviaMessaggio() {
    if (!testo.trim() || inCorso) return;
    invia(testo);
    setTesto("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      inviaMessaggio();
    }
  }

  const vuota = messaggi.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* Intestazione */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight">Assistente</h1>
        </div>
        {!vuota && (
          <Button variant="ghost" size="sm" onClick={reset} disabled={inCorso}>
            <SquarePen className="size-4" />
            Nuova conversazione
          </Button>
        )}
      </div>

      {/* Conversazione */}
      <div className="flex-1 overflow-y-auto">
        {vuota ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-soft">
              <Sparkles className="size-8" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">
              Come posso aiutarti oggi?
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Chiedi all'assistente di gestire email, offerte, opportunità CRM e
              approvazioni. Inizia da un suggerimento o scrivi la tua richiesta.
            </p>
            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
              {SUGGERIMENTI.map(({ icon: Icon, testo: s }) => (
                <button
                  key={s}
                  onClick={() => invia(s)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left text-sm transition-colors hover:bg-surface"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-secondary" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-2">
            {messaggi.map((m, i) =>
              m.ruolo === "utente" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.contenuto}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 whitespace-pre-wrap pt-1 text-sm leading-relaxed text-foreground">
                    {m.contenuto}
                    {inCorso && i === messaggi.length - 1 && (
                      <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-secondary align-middle" />
                    )}
                  </div>
                </div>
              )
            )}
            <div ref={fineRef} />
          </div>
        )}
      </div>

      {/* Errore */}
      {errore && (
        <p className="pt-2 text-center text-xs text-destructive">{errore}</p>
      )}

      {/* Composer */}
      <div className="pt-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={areaRef}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Scrivi un messaggio…"
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={inviaMessaggio}
            disabled={!testo.trim() || inCorso}
            aria-label="Invia"
            className={cn("shrink-0 rounded-xl")}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          L'assistente può commettere errori. Verifica le informazioni importanti.
        </p>
      </div>
    </div>
  );
}
