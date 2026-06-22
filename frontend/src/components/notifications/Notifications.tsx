import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Notifica {
  id: number;
  titolo: string;
  descrizione: string;
  tempo: string;
  letta: boolean;
}

interface CtxValue {
  notifiche: Notifica[];
  nonLette: number;
  segnaTutteLette: () => void;
  segnaLetta: (id: number) => void;
}

const Ctx = createContext<CtxValue | null>(null);

export function useNotifiche(): CtxValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNotifiche fuori dal provider");
  return c;
}

// Notifiche di esempio: in un'integrazione reale arriverebbero dal backend.
const INIZIALI: Notifica[] = [
  {
    id: 1,
    titolo: "Nuova email commerciale",
    descrizione: "Rossi S.p.A. ha inviato una richiesta di preventivo.",
    tempo: "5 min fa",
    letta: false,
  },
  {
    id: 2,
    titolo: "Offerta generata",
    descrizione: "L'offerta #2025-086 è pronta per la revisione.",
    tempo: "18 min fa",
    letta: false,
  },
  {
    id: 3,
    titolo: "Approvazione richiesta",
    descrizione: "Un'offerta è in attesa del tuo via libera.",
    tempo: "1 ora fa",
    letta: true,
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifiche, setNotifiche] = useState<Notifica[]>(INIZIALI);
  const nonLette = notifiche.filter((n) => !n.letta).length;

  const segnaTutteLette = () =>
    setNotifiche((prev) => prev.map((n) => ({ ...n, letta: true })));
  const segnaLetta = (id: number) =>
    setNotifiche((prev) =>
      prev.map((n) => (n.id === id ? { ...n, letta: true } : n))
    );

  return (
    <Ctx.Provider value={{ notifiche, nonLette, segnaTutteLette, segnaLetta }}>
      {children}
    </Ctx.Provider>
  );
}

/** Campanella con badge e pannello a tendina. */
export function NotificationsBell() {
  const { notifiche, nonLette, segnaTutteLette, segnaLetta } = useNotifiche();
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Chiude al click esterno o con Esc.
  useEffect(() => {
    if (!aperto) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAperto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAperto(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [aperto]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifiche"
        onClick={() => setAperto((a) => !a)}
      >
        <Bell className="size-4" />
        {nonLette > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
            {nonLette}
          </span>
        )}
      </Button>

      {aperto && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifiche</p>
            {nonLette > 0 && (
              <button
                onClick={segnaTutteLette}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Segna tutte come lette
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifiche.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nessuna notifica.
              </p>
            ) : (
              notifiche.map((n) => (
                <button
                  key={n.id}
                  onClick={() => segnaLetta(n.id)}
                  className="flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.letta ? "bg-transparent" : "bg-accent"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.titolo}</span>
                    <span className="block text-sm text-muted-foreground">
                      {n.descrizione}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {n.tempo}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
