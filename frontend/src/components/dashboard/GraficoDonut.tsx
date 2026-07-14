import type { FasePipeline } from "@/hooks/useDashboard";
import { coloreFase, euroIntero } from "./formato";

const RAGGIO = 52;
const SPESSORE = 18;
const CIRCONFERENZA = 2 * Math.PI * RAGGIO;

/**
 * Distribuzione delle opportunità per fase della pipeline (donut), con il
 * totale al centro e la legenda con conteggio e valore reale per fase.
 */
export function GraficoDonut({ dati }: { dati: FasePipeline[] }) {
  const totale = dati.reduce((somma, f) => somma + f.quantita, 0);

  // Segmenti in sequenza: ognuno parte dove finisce il precedente.
  let progresso = 0;
  const segmenti = dati
    .filter((f) => f.quantita > 0)
    .map((f) => {
      const frazione = f.quantita / totale;
      const seg = {
        ...f,
        lunghezza: frazione * CIRCONFERENZA,
        scostamento: -progresso * CIRCONFERENZA,
      };
      progresso += frazione;
      return seg;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-auto w-full max-w-[13rem]">
        <svg
          viewBox="0 0 144 144"
          className="h-auto w-full -rotate-90"
          role="img"
          aria-label={`Pipeline: ${totale} opportunità per fase`}
        >
          <circle
            cx="72"
            cy="72"
            r={RAGGIO}
            fill="none"
            stroke="hsl(156 13% 91%)"
            strokeWidth={SPESSORE}
          />
          {segmenti.map((s) => (
            <circle
              key={s.fase}
              cx="72"
              cy="72"
              r={RAGGIO}
              fill="none"
              stroke={coloreFase(s.fase)}
              strokeWidth={SPESSORE}
              strokeDasharray={`${s.lunghezza} ${CIRCONFERENZA - s.lunghezza}`}
              strokeDashoffset={s.scostamento}
            >
              <title>{`${s.fase}: ${s.quantita} (${euroIntero(s.valore)})`}</title>
            </circle>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight">
            {totale}
          </span>
          <span className="text-xs text-muted-foreground">opportunità</span>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {dati.map((f) => (
          <li key={f.fase} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: coloreFase(f.fase) }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {f.fase}
            </span>
            <span className="font-medium tabular-nums">{f.quantita}</span>
            <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
              {totale > 0 ? `${Math.round((f.quantita / totale) * 100)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
