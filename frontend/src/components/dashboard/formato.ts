// Colori e formattazioni condivise dai grafici della dashboard.
// Tinte derivate dalla palette "Deep Petroleum" (vedi index.css).

export const COLORE_PRIMARIO = "hsl(193 72% 21%)";
export const COLORE_SECONDARIO = "hsl(187 42% 32%)";
export const COLORE_ACCENTO = "hsl(32 52% 64%)";

/** Un colore per ogni fase della pipeline CRM. */
export const COLORI_FASE: Record<string, string> = {
  Nuovo: COLORE_PRIMARIO,
  "In Analisi": COLORE_SECONDARIO,
  "Offerta Inviata": "hsl(187 32% 48%)",
  Negoziazione: COLORE_ACCENTO,
  Chiuso: "hsl(156 12% 70%)",
};

export function coloreFase(fase: string): string {
  return COLORI_FASE[fase] ?? COLORE_SECONDARIO;
}

/** Importo compatto per grafici e KPI: "€ 12,4k", "€ 1,2M", "€ 850". */
export function euroCompatto(valore: number): string {
  const abs = Math.abs(valore);
  if (abs >= 1_000_000) {
    return `€ ${(valore / 1_000_000).toLocaleString("it-IT", {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (abs >= 1_000) {
    return `€ ${(valore / 1_000).toLocaleString("it-IT", {
      maximumFractionDigits: 1,
    })}k`;
  }
  return `€ ${valore.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
}

/** Importo completo (tooltip e legende): "€ 12.400". */
export function euroIntero(valore: number): string {
  return valore.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}
