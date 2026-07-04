import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TipoToast = "successo" | "errore" | "info";

interface Toast {
  id: number;
  messaggio: string;
  tipo: TipoToast;
}

// Store minimale con pub/sub: niente dipendenze, niente context.
let contatore = 0;
let elenco: Toast[] = [];
const ascoltatori = new Set<(t: Toast[]) => void>();

function emetti() {
  for (const l of ascoltatori) l(elenco);
}

export function toast(messaggio: string, tipo: TipoToast = "successo") {
  const t: Toast = { id: ++contatore, messaggio, tipo };
  elenco = [...elenco, t];
  emetti();
  setTimeout(() => {
    elenco = elenco.filter((x) => x.id !== t.id);
    emetti();
  }, 4000);
}

const stile: Record<TipoToast, { icon: typeof Info; colore: string }> = {
  successo: { icon: CheckCircle2, colore: "text-secondary" },
  errore: { icon: AlertCircle, colore: "text-destructive" },
  info: { icon: Info, colore: "text-primary" },
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>(elenco);

  useEffect(() => {
    ascoltatori.add(setItems);
    return () => {
      ascoltatori.delete(setItems);
    };
  }, []);

  function chiudi(id: number) {
    elenco = elenco.filter((x) => x.id !== id);
    emetti();
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => {
        const { icon: Icon, colore } = stile[t.tipo];
        return (
          <div
            key={t.id}
            role={t.tipo === "errore" ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", colore)} />
            <p className="flex-1 text-sm text-foreground">{t.messaggio}</p>
            <button
              onClick={() => chiudi(t.id)}
              aria-label="Chiudi"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
