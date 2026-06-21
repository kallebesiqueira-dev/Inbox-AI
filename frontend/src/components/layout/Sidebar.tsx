import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinks } from "./NavLinks";

/** Sidebar (md+) richiudibile con pulsante: espansa mostra logo + voci,
 *  compressa mostra solo le icone. Lo stato persiste in localStorage. */
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
        "hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <img src="/logo.jpeg" alt="Inbox AI" className="h-10 w-auto rounded" />
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Espandi menu" : "Comprimi menu"}
          className="flex size-9 items-center justify-center rounded-md text-foreground/60 hover:bg-background hover:text-foreground"
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
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          Automazione operativa e commerciale
        </div>
      )}
    </aside>
  );
}
