import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinks } from "./NavLinks";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/** Drawer di navigazione per telefono (visibile solo sotto md). */
export function MobileNav({ open, onClose }: MobileNavProps) {
  // Blocca lo scroll del body quando il drawer è aperto e chiude con Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div className={cn("md:hidden", open ? "" : "pointer-events-none")}>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!open}
      />

      {/* Pannello */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu di navigazione"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-surface shadow-card transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Inbox AI" className="h-8 w-auto rounded" />
            <span className="text-lg font-semibold text-primary">Inbox AI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi menu"
            className="flex size-9 items-center justify-center rounded-md text-foreground/70 hover:bg-background"
          >
            <X className="size-5" />
          </button>
        </div>

        <NavLinks onNavigate={onClose} />

        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          Automazione operativa e commerciale
        </div>
      </div>
    </div>
  );
}
