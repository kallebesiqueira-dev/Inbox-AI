import { useState } from "react";
import type { FasePipeline } from "@/hooks/useDashboard";
import { coloreFase, euroIntero } from "./formato";

const RAGGIO = 52;
const SPESSORE = 18;
const CIRCONFERENZA = 2 * Math.PI * RAGGIO;

/**
 * Distribuzione delle opportunità per fase della pipeline (donut).
 * Niente legenda: passando il mouse su un segmento, il centro mostra la fase
 * (nome, conteggio e quota); a riposo mostra il totale.
 */
export function GraficoDonut({ dati }: { dati: FasePipeline[] }) {
  const [attiva, setAttiva] = useState<FasePipeline | null>(null);
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

  const quota = (f: FasePipeline) =>
    totale > 0 ? Math.round((f.quantita / totale) * 100) : 0;

  return (
    <div className="relative mx-auto w-full max-w-[15rem]">
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
            strokeWidth={attiva?.fase === s.fase ? SPESSORE + 4 : SPESSORE}
            strokeDasharray={`${s.lunghezza} ${CIRCONFERENZA - s.lunghezza}`}
            strokeDashoffset={s.scostamento}
            className="cursor-pointer transition-all duration-150"
            opacity={attiva && attiva.fase !== s.fase ? 0.45 : 1}
            onMouseEnter={() => setAttiva(s)}
            onMouseLeave={() => setAttiva(null)}
          >
            <title>{`${s.fase}: ${s.quantita} (${euroIntero(s.valore)})`}</title>
          </circle>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {attiva ? (
          <>
            <span
              className="text-2xl font-semibold tracking-tight"
              style={{ color: coloreFase(attiva.fase) }}
            >
              {attiva.quantita}
            </span>
            <span className="max-w-[7rem] truncate text-xs font-medium">
              {attiva.fase}
            </span>
            <span className="text-xs text-muted-foreground">
              {quota(attiva)}% · {euroIntero(attiva.valore)}
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-semibold tracking-tight">
              {totale}
            </span>
            <span className="text-xs text-muted-foreground">opportunità</span>
          </>
        )}
      </div>
    </div>
  );
}
