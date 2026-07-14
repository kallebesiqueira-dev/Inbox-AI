import {
  COLORE_PRIMARIO,
  COLORE_SECONDARIO,
  euroCompatto,
  euroIntero,
} from "./formato";

// Rosso tenue per le diminuzioni (stile report finanziario).
const COLORE_NEGATIVO = "hsl(8 55% 72%)";

const LARGHEZZA = 960;
const ALTEZZA = 250;
const PAD = { sopra: 28, destra: 8, sotto: 30, sinistra: 8 };

export interface VoceCascata {
  etichetta: string;
  valore: number;
}

/**
 * Cascata cumulata (waterfall): ogni voce parte dove finisce la precedente,
 * l'ultima barra è il totale. Supporta valori negativi (barre in diminuzione).
 */
export function GraficoCascata({
  dati,
  etichettaTotale = "Totale",
}: {
  dati: VoceCascata[];
  etichettaTotale?: string;
}) {
  const totale = dati.reduce((somma, v) => somma + v.valore, 0);
  const colonne = [
    ...dati.map((v) => ({ ...v, totale: false })),
    { etichetta: etichettaTotale, valore: totale, totale: true },
  ];

  // Picco cumulato per la scala verticale (gestisce anche le diminuzioni).
  let cum = 0;
  let picco = 0;
  for (const v of dati) {
    cum += v.valore;
    picco = Math.max(picco, cum);
  }
  picco = Math.max(picco, totale, 1);

  const utileY = ALTEZZA - PAD.sopra - PAD.sotto;
  const slot = (LARGHEZZA - PAD.sinistra - PAD.destra) / colonne.length;
  const larghezzaBarra = Math.min(58, slot * 0.6);
  const base = ALTEZZA - PAD.sotto;
  const scala = utileY / picco;

  let inizio = 0;
  const barre = colonne.map((c, i) => {
    const da = c.totale ? 0 : inizio;
    const a = c.totale ? totale : inizio + c.valore;
    if (!c.totale) inizio = a;
    const altezza = Math.max(Math.abs(a - da) * scala, c.valore !== 0 ? 3 : 0);
    return {
      ...c,
      x: PAD.sinistra + i * slot + (slot - larghezzaBarra) / 2,
      y: base - Math.max(da, a) * scala,
      altezza,
      centro: PAD.sinistra + i * slot + slot / 2,
      fine: base - a * scala,
    };
  });

  const nulla = dati.every((v) => v.valore === 0);

  return nulla ? (
    <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
      Nessun valore nel periodo: aggiungi opportunità dal CRM.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
        className="h-auto w-full min-w-[640px]"
        role="img"
        aria-label="Valore generato per mese, cumulato fino al totale"
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
          <g key={b.etichetta}>
            {/* Connettore tratteggiato al livello cumulato raggiunto. */}
            {!b.totale && i < barre.length - 1 && b.valore !== 0 && (
              <line
                x1={b.x + larghezzaBarra}
                x2={barre[i + 1].x}
                y1={b.fine}
                y2={b.fine}
                stroke="hsl(194 18% 62%)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            <rect
              x={b.x}
              y={b.y}
              width={larghezzaBarra}
              height={b.altezza}
              rx="2.5"
              fill={
                b.totale
                  ? COLORE_PRIMARIO
                  : b.valore < 0
                    ? COLORE_NEGATIVO
                    : COLORE_SECONDARIO
              }
              opacity={b.totale ? 1 : 0.9}
            >
              <title>{`${b.etichetta}: ${euroIntero(b.valore)}`}</title>
            </rect>
            {b.valore !== 0 && (
              <text
                x={b.centro}
                y={b.y - 6}
                textAnchor="middle"
                fontSize="10"
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
              {b.etichetta}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
