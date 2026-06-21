import { NavLinks } from "./NavLinks";

/**
 * Sidebar a scomparsa (solo md+): rail con sole icone che si espande
 * automaticamente al passaggio del mouse. Il pannello espanso si sovrappone
 * al contenuto (nessun reflow), grazie al contenitore di larghezza fissa.
 */
export function Sidebar() {
  return (
    <div className="group/sidebar relative hidden w-16 shrink-0 md:block">
      <aside className="absolute inset-y-0 left-0 z-30 flex w-16 flex-col overflow-hidden border-r border-border bg-surface shadow-soft transition-[width] duration-200 ease-out group-hover/sidebar:w-64 group-hover/sidebar:shadow-card">
        <div className="flex h-16 items-center border-b border-border px-3">
          <img
            src="/icon.jpeg"
            alt="Inbox AI"
            className="size-10 shrink-0 rounded-lg object-cover"
          />
        </div>

        <NavLinks />

        <div className="overflow-hidden whitespace-nowrap border-t border-border p-4 text-xs text-muted-foreground">
          Automazione operativa e commerciale
        </div>
      </aside>
    </div>
  );
}
