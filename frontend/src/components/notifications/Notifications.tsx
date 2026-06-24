import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Notifica {
  id: string;
  titolo: string;
  descrizione: string;
}

interface CtxValue {
  notifiche: Notifica[];
  nonLette: number;
  letta: (id: string) => boolean;
  segnaTutteLette: () => void;
  segnaLetta: (id: string) => void;
}

const Ctx = createContext<CtxValue | null>(null);

export function useNotifiche(): CtxValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNotifiche fuori dal provider");
  return c;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // Notifiche reali derivate dall'attività dell'utente.
  const { data } = useQuery({
    queryKey: ["notifiche"],
    queryFn: () => apiFetch<Notifica[]>("/notifiche"),
    refetchInterval: 60_000,
  });
  const notifiche = useMemo(() => data ?? [], [data]);
  // Stato "letta" gestito lato client per sessione.
  const [lette, setLette] = useState<Set<string>>(new Set());

  const value: CtxValue = {
    notifiche,
    nonLette: notifiche.filter((n) => !lette.has(n.id)).length,
    letta: (id) => lette.has(id),
    segnaTutteLette: () => setLette(new Set(notifiche.map((n) => n.id))),
    segnaLetta: (id) => setLette((prev) => new Set(prev).add(id)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Campanella con badge e pannello a tendina. */
export function NotificationsBell() {
  const { notifiche, nonLette, letta, segnaTutteLette, segnaLetta } =
    useNotifiche();
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
                      letta(n.id) ? "bg-transparent" : "bg-accent"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.titolo}</span>
                    <span className="block text-sm text-muted-foreground">
                      {n.descrizione}
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
