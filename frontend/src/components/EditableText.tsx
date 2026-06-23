import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  /** Valore grezzo, usato in fase di modifica. */
  valore: string | number;
  /** Come mostrare il valore quando non si modifica (default: il valore stesso). */
  display?: React.ReactNode;
  tipo?: "text" | "number";
  onSalva: (nuovo: string) => void;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

/** Testo modificabile in linea: clic → input → Invio/blur salva, Esc annulla. */
export function EditableText({
  valore,
  display,
  tipo = "text",
  onSalva,
  ariaLabel,
  className,
  inputClassName,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(valore));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setVal(String(valore));
  }, [valore, editing]);

  function salva() {
    setEditing(false);
    const nuovo = val.trim();
    if (nuovo !== "" && nuovo !== String(valore)) onSalva(nuovo);
    else setVal(String(valore));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      salva();
    } else if (e.key === "Escape") {
      setVal(String(valore));
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type={tipo}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={salva}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full rounded-md border border-input bg-card px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={ariaLabel ?? "Modifica"}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded text-left hover:text-primary",
        className
      )}
    >
      <span>{display ?? valore}</span>
      <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
    </button>
  );
}
