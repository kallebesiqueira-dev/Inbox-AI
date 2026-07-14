import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./navItems";

interface NavLinksProps {
  /** Chiamato dopo il click (utile per chiudere il drawer mobile). */
  onNavigate?: () => void;
  /** Mostra solo le icone (sidebar compressa). */
  collapsed?: boolean;
}

export function NavLinks({ onNavigate, collapsed }: NavLinksProps) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
              // Su fondo scuro la voce attiva è una "pillola" chiara (icona nel
              // colore primario), come nei report direzionali.
              isActive
                ? "bg-background text-primary shadow-soft"
                : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
