import { useEffect } from "react";

/**
 * Comportamento standard dei dialoghi modali: chiusura con Escape e blocco
 * dello scroll della pagina sottostante finché il modale è aperto.
 */
export function useModale(onClose: () => void) {
  useEffect(() => {
    const originale = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originale;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
}
