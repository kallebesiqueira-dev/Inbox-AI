import { NavLinks } from "./NavLinks";

/** Sidebar fissa visibile da tablet in su (md+). */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <img src="/logo.jpeg" alt="Inbox AI" className="h-8 w-auto rounded" />
        <span className="text-lg font-semibold text-primary">Inbox AI</span>
      </div>

      <NavLinks />

      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Automazione operativa e commerciale
      </div>
    </aside>
  );
}
