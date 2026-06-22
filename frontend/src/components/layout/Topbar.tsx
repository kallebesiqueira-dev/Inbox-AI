import { useEffect, useRef, useState } from "react";
import { Search, Menu, LogOut, Settings, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMe, useLogout } from "@/hooks/useAuth";
import { useCommandPalette } from "@/components/command/CommandPalette";
import { NotificationsBell } from "@/components/notifications/Notifications";
import { toast } from "@/components/ui/toast";

interface TopbarProps {
  onOpenMenu: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

function iniziali(nome?: string) {
  if (!nome) return "IA";
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { data: utente } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const { apri } = useCommandPalette();
  const [menuAperto, setMenuAperto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAperto) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuAperto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuAperto]);

  function esci() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast("Sessione terminata. A presto!", "info");
        navigate("/");
      },
    });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMenu}
          aria-label="Apri menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Ricerca → apre la command palette */}
        <button
          onClick={apri}
          className="hidden flex-1 items-center gap-2 rounded-md bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface/70 sm:flex sm:max-w-xs lg:max-w-md"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Cerca pagine e azioni…</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Cerca"
          onClick={apri}
        >
          <Search className="size-4" />
        </Button>

        <NotificationsBell />

        {/* Menu utente */}
        <div className="relative border-l border-border pl-2 sm:pl-3" ref={menuRef}>
          <button
            onClick={() => setMenuAperto((a) => !a)}
            className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-surface"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">
                {utente?.nome ?? "Account"}
              </p>
              <p className="max-w-[14rem] truncate text-xs text-muted-foreground">
                {utente?.email ?? "Organizzazione"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {iniziali(utente?.nome)}
            </div>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>

          {menuAperto && (
            <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="border-b border-border px-4 py-3 sm:hidden">
                <p className="text-sm font-medium">{utente?.nome ?? "Account"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {utente?.email}
                </p>
              </div>
              <Link
                to="/app/impostazioni"
                onClick={() => setMenuAperto(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface"
              >
                <Settings className="size-4" />
                Impostazioni
              </Link>
              <button
                onClick={esci}
                disabled={logout.isPending}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-surface"
              >
                <LogOut className="size-4" />
                Esci
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
