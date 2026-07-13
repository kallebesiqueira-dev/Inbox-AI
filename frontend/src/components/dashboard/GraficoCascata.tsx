import type { FasePipeline } from "@/hooks/useDashboard";
import {
  COLORE_PRIMARIO,
  coloreFase,
  euroCompatto,
  euroIntero,
} from "./formato";

const LARGHEZZA = 640;
const ALTEZZA = 230;
const PAD = { sopra: 26, destra: 8, sotto: 30, sinistra: 8 };

// Etichette compatte per l'asse X.
const ABBREVIAZIONI: Record<string, string> = {
  "Offerta Inviata": "Off. Inviata",
};

/**
 * Valore della pipeline per fase, a cascata: ogni fase parte dove finisce la
 * precedente e l'ultima barra è il totale complessivo — sui valori reali.
 */
export function GraficoCascata({ dati }: { dati: FasePipeline[] }) {
  const totale = dati.reduce((somma, f) => somma + f.valore, 0);
  const colonne = [...dati.map((f) => ({ ...f, totale: false })), {
    fase: "Totale",
    quantita: 0,
    valore: totale,
    totale: true,
  }];

  const utileY = ALTEZZA - PAD.sopra - PAD.sotto;
  const slot = (LARGHEZZA - PAD.sinistra - PAD.destra) / colonne.length;
  const larghezzaBarra = Math.min(64, slot * 0.62);
  const base = ALTEZZA - PAD.sotto;
  const scala = totale > 0 ? utileY / totale : 0;

  let cumulato = 0;
  const barre = colonne.map((c, i) => {
    const inizio = c.totale ? 0 : cumulato;
    if (!c.totale) cumulato += c.valore;
    const altezza = Math.max(c.valore * scala, c.valore > 0 ? 3 : 0);
    const y = base - inizio * scala - altezza;
    return {
      ...c,
      x: PAD.sinistra + i * slot + (slot - larghezzaBarra) / 2,
      y,
      altezza,
      centro: PAD.sinistra + i * slot + slot / 2,
      connettoreY: base - cumulato * scala,
    };
  });

  return (
    <div>
      {totale === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Nessun valore in pipeline: aggiungi opportunità dal CRM.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
          className="h-auto w-full"
          role="img"
          aria-label="Valore della pipeline per fase, cumulato fino al totale"
        >
          <line
            x1={PAD.sinistra}
            x2={LARGHEZZA - PAD.destra}
            y1={base}
            y2={base}
            stroke="hsl(156 12% 85%)"
            strokeWidth="1"
          />
          {barre.map((b, i) => (
            <g key={b.fase}>
              {/* Connettore tratteggiato verso la barra successiva. */}
              {!b.totale && i < barre.length - 1 && b.valore > 0 && (
                <line
                  x1={b.x + larghezzaBarra}
                  x2={barre[i + 1].x}
                  y1={b.y}
                  y2={b.y}
                  stroke="hsl(194 18% 60%)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
              <rect
                x={b.x}
                y={b.y}
                width={larghezzaBarra}
                height={b.altezza}
                rx="3"
                fill={b.totale ? COLORE_PRIMARIO : coloreFase(b.fase)}
                opacity={b.totale ? 1 : 0.92}
              >
                <title>{`${b.fase}: ${euroIntero(b.valore)}`}</title>
              </rect>
              {b.valore > 0 && (
                <text
                  x={b.centro}
                  y={b.y - 7}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="hsl(194 52% 13%)"
                >
                  {euroCompatto(b.valore)}
                </text>
              )}
              <text
                x={b.centro}
                y={ALTEZZA - 10}
                textAnchor="middle"
                fontSize="10"
                fill="hsl(194 18% 45%)"
              >
                {ABBREVIAZIONI[b.fase] ?? b.fase}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
