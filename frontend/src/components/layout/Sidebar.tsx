import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinks } from "./NavLinks";

/** Sidebar (md+) richiudibile con pulsante: espansa mostra logo + voci,
 *  compressa mostra solo le icone. Lo stato persiste in localStorage.
 *  Tema scuro "Deep Petroleum" in stile report direzionale. */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("ia_sidebar") === "1"
  );

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem("ia_sidebar", c ? "0" : "1");
      return !c;
    });

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-primary text-primary-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <span className="rounded-md bg-white p-1">
            <img src="/logo.jpeg" alt="Inbox AI" className="h-8 w-auto rounded-sm" />
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Espandi menu" : "Comprimi menu"}
          className="flex size-9 items-center justify-center rounded-md text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      </div>

      <NavLinks collapsed={collapsed} />

      {!collapsed && (
        <div className="border-t border-white/10 p-4 text-xs text-primary-foreground/60">
          Automazione operativa e commerciale
        </div>
      )}
    </aside>
  );
}
