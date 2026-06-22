import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, BookOpen, Globe, LogOut } from "lucide-react";
import { navItems } from "@/components/layout/navItems";
import { useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CtxValue {
  apri: () => void;
}
const Ctx = createContext<CtxValue | null>(null);

export function useCommandPalette(): CtxValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCommandPalette fuori dal provider");
  return c;
}

interface Comando {
  id: string;
  label: string;
  gruppo: string;
  icon: React.ComponentType<{ className?: string }>;
  parole?: string;
  esegui: () => void;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [aperto, setAperto] = useState(false);
  const apri = useCallback(() => setAperto(true), []);

  // Scorciatoia globale Ctrl/⌘ + K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAperto((a) => !a);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{ apri }}>
      {children}
      {aperto && <Palette onClose={() => setAperto(false)} />}
    </Ctx.Provider>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const [query, setQuery] = useState("");
  const [attivo, setAttivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const comandi = useMemo<Comando[]>(() => {
    const vai = (to: string) => () => {
      navigate(to);
      onClose();
    };
    return [
      ...navItems.map((n) => ({
        id: n.to,
        label: n.label,
        gruppo: "Vai a",
        icon: n.icon,
        esegui: vai(n.to),
      })),
      {
        id: "doc",
        label: "Documentazione",
        gruppo: "Risorse",
        icon: BookOpen,
        parole: "guida tutorial aiuto",
        esegui: vai("/documentazione"),
      },
      {
        id: "sito",
        label: "Sito pubblico",
        gruppo: "Risorse",
        icon: Globe,
        parole: "home landing",
        esegui: vai("/"),
      },
      {
        id: "logout",
        label: "Esci",
        gruppo: "Account",
        icon: LogOut,
        parole: "logout disconnetti",
        esegui: () => {
          logout.mutate(undefined, { onSuccess: () => navigate("/") });
          onClose();
        },
      },
    ];
  }, [navigate, logout, onClose]);

  const filtrati = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return comandi;
    return comandi.filter((c) =>
      `${c.label} ${c.gruppo} ${c.parole ?? ""}`.toLowerCase().includes(q)
    );
  }, [comandi, query]);

  useEffect(() => setAttivo(0), [query]);
  useEffect(() => inputRef.current?.focus(), []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAttivo((i) => Math.min(i + 1, filtrati.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAttivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtrati[attivo]?.esegui();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca pagine e azioni…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtrati.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nessun risultato per «{query}».
            </p>
          ) : (
            filtrati.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setAttivo(i)}
                onClick={c.esegui}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  i === attivo ? "bg-primary text-primary-foreground" : "hover:bg-surface"
                )}
              >
                <c.icon className="size-4 shrink-0" />
                <span className="flex-1">{c.label}</span>
                <span
                  className={cn(
                    "text-[11px]",
                    i === attivo ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {c.gruppo}
                </span>
                {i === attivo && <CornerDownLeft className="size-3.5" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
