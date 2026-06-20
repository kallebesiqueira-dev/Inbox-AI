import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMe, useLogout } from "@/hooks/useAuth";

interface TopbarProps {
  onOpenMenu: () => void;
}

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

  function esci() {
    logout.mutate(undefined, { onSuccess: () => navigate("/login") });
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

        <div className="hidden flex-1 items-center gap-2 rounded-md bg-surface px-3 py-2 text-sm text-muted-foreground sm:flex sm:max-w-xs lg:max-w-md">
          <Search className="size-4 shrink-0" />
          <input
            type="text"
            placeholder="Cerca email, clienti, offerte..."
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Cerca">
          <Search className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifiche">
          <Bell className="size-4" />
        </Button>

        <div className="flex items-center gap-3 border-l border-border pl-2 sm:pl-3">
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Esci"
            onClick={esci}
            disabled={logout.isPending}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
