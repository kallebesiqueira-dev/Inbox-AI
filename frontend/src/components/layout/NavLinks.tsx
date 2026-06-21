import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./navItems";

interface NavLinksProps {
  /** Chiamato dopo il click (utile per chiudere il drawer mobile). */
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-foreground/70 hover:bg-background hover:text-foreground"
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          <span className="whitespace-nowrap">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
