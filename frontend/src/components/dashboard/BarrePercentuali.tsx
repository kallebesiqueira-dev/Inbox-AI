import type { StatoOfferte } from "@/hooks/useDashboard";
import { COLORE_ACCENTO, COLORE_SECONDARIO, euroIntero } from "./formato";

/**
 * Percentuale di offerte per stato: etichetta, barra e quota sulla stessa
 * riga, nello stile del pannello "% per categoria" dei report finanziari.
 * La quota maggiore è evidenziata nel colore primario del tema.
 */
export function BarrePercentuali({ dati }: { dati: StatoOfferte[] }) {
  const totale = dati.reduce((somma, s) => somma + s.quantita, 0);
  const massimo = Math.max(...dati.map((s) => s.quantita), 0);

  return (
    <ul className="space-y-3.5">
      {dati.map((s) => {
        const quota = totale > 0 ? Math.round((s.quantita / totale) * 100) : 0;
        return (
          <li
            key={s.stato}
            className="flex items-center gap-3"
            title={`${s.quantita.toLocaleString("it-IT")} ${
              s.quantita === 1 ? "offerta" : "offerte"
            } — ${euroIntero(s.importo)}`}
          >
            <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
              {s.stato}
            </span>
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${quota}%`,
                  background:
                    massimo > 0 && s.quantita === massimo
                      ? COLORE_SECONDARIO
                      : COLORE_ACCENTO,
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
              {quota}%
            </span>
          </li>
        );
      })}
      <li className="pt-1 text-xs text-muted-foreground">
        {totale.toLocaleString("it-IT")} {totale === 1 ? "offerta" : "offerte"}{" "}
        totali ·{" "}
        {euroIntero(dati.reduce((somma, s) => somma + s.importo, 0))}
      </li>
    </ul>
  );
}
