import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

const SUGGERIMENTI = [
  "Analizza la pipeline",
  "Crea proposta",
  "Genera report",
  "Riassumi i clienti",
  "Scrivi email",
];

export function ChatWidget() {
  const [aperto, setAperto] = useState(false);
  const { messaggi, inCorso, errore, invia, reset } = useChat();
  const [testo, setTesto] = useState("");
  const fineRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (aperto) fineRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi, aperto]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {/* Pannello */}
      {aperto && (
        <div className="mb-3 flex h-[32rem] max-h-[calc(100vh-6rem)] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:w-96">
          {/* Intestazione */}
          <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-br from-primary to-secondary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/15">
                <Sparkles className="size-4" />
              </span>
              <span className="font-semibold">Assistente</span>
            </div>
            <div className="flex items-center gap-1">
              {!vuota && (
                <button
                  onClick={reset}
                  disabled={inCorso}
                  aria-label="Nuova conversazione"
                  className="rounded-md p-1 transition-colors hover:bg-white/15"
                >
                  <SquarePen className="size-4" />
                </button>
              )}
              <button
                onClick={() => setAperto(false)}
                aria-label="Chiudi"
                className="rounded-md p-1 transition-colors hover:bg-white/15"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Corpo */}
          <div className="flex-1 overflow-y-auto p-4">
            {vuota ? (
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Come posso aiutarti oggi?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chiedi all'assistente di riassumere un cliente, scrivere un'email
                  di follow-up o suggerire il prossimo passo.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGERIMENTI.map((s) => (
                    <button
                      key={s}
                      onClick={() => invia(s)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messaggi.map((m, i) =>
                  m.ruolo === "utente" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                        {m.contenuto}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                        <Sparkles className="size-3" />
                      </span>
                      <div className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {m.contenuto}
                        {inCorso && i === messaggi.length - 1 && (
                          <span className="ml-0.5 inline-block h-3.5 w-1 translate-y-0.5 animate-pulse rounded-sm bg-secondary align-middle" />
                        )}
                      </div>
                    </div>
                  )
                )}
                <div ref={fineRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3">
            {errore && (
              <p className="pb-2 text-center text-xs text-destructive">{errore}</p>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring">
              <textarea
                aria-label="Scrivi un messaggio all'assistente"
                ref={areaRef}
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Scrivi un messaggio…"
                className="max-h-[120px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={inviaMessaggio}
                disabled={!testo.trim() || inCorso}
                aria-label="Invia"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="pt-2 text-center text-[10px] text-muted-foreground">
              L'IA può commettere errori — verifica le informazioni importanti.
            </p>
          </div>
        </div>
      )}

      {/* Bottone flottante */}
      <button
        onClick={() => setAperto((a) => !a)}
        aria-label={aperto ? "Chiudi assistente" : "Apri assistente"}
        className={cn(
          "ml-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-card transition-transform hover:scale-105",
          aperto && "scale-95"
        )}
      >
        {aperto ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>
    </div>
  );
}
