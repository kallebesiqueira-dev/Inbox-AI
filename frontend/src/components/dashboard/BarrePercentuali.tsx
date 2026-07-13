import type { StatoOfferte } from "@/hooks/useDashboard";
import { COLORE_ACCENTO, euroIntero } from "./formato";

/**
 * Percentuale di offerte per stato: barre orizzontali con quota reale,
 * nello stile del pannello "% per categoria" dei report finanziari.
 */
export function BarrePercentuali({ dati }: { dati: StatoOfferte[] }) {
  const totale = dati.reduce((somma, s) => somma + s.quantita, 0);

  return (
    <ul className="space-y-4">
      {dati.map((s) => {
        const quota = totale > 0 ? Math.round((s.quantita / totale) * 100) : 0;
        return (
          <li key={s.stato} title={`${s.quantita} offerte — ${euroIntero(s.importo)}`}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {s.stato}
              </span>
              <span className="font-medium tabular-nums">{quota}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${quota}%`, background: COLORE_ACCENTO }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.quantita.toLocaleString("it-IT")}{" "}
              {s.quantita === 1 ? "offerta" : "offerte"} ·{" "}
              {euroIntero(s.importo)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
