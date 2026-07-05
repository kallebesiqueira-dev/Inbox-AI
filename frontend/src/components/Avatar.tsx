import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ridimensionaImmagine } from "@/lib/image";

function iniziali(nome?: string) {
  if (!nome) return "?";
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  src?: string;
  nome?: string;
  /** Classi di dimensione (es. "size-9"). */
  className?: string;
  /** Se presente, l'avatar diventa cliccabile per caricare una nuova immagine. */
  onUpload?: (dataUrl: string) => void | Promise<void>;
  /** Mostra lo stato di caricamento (es. mutation in corso). */
  caricamento?: boolean;
}

export function Avatar({
  src,
  nome,
  className,
  onUpload,
  caricamento,
}: AvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errore, setErrore] = useState(false);

  const contenuto =
    src && !errore ? (
      <img
        src={src}
        alt={nome ?? "Avatar"}
        onError={() => setErrore(true)}
        className="size-full rounded-full object-cover"
      />
    ) : (
      <span className="font-semibold">{iniziali(nome)}</span>
    );

  // text-sm di default; sovrascrivibile dal chiamante (es. "text-xs" per avatar piccoli).
  const base = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm text-primary-foreground",
    className
  );

  if (!onUpload) {
    return <div className={base}>{contenuto}</div>;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // consente di ricaricare lo stesso file
    if (!file) return;
    try {
      const dataUrl = await ridimensionaImmagine(file);
      await onUpload?.(dataUrl);
    } catch {
      /* immagine non valida: ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(base, "group cursor-pointer")}
      aria-label="Cambia foto"
      disabled={caricamento}
    >
      {contenuto}
      <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
        {caricamento ? (
          <Loader2 className="size-4 animate-spin text-white" />
        ) : (
          <Camera className="size-4 text-white" />
        )}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
    </button>
  );
}
