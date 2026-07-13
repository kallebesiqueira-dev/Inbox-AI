import type { PuntoAndamento } from "@/hooks/useDashboard";
import { COLORE_PRIMARIO, COLORE_ACCENTO } from "./formato";

const LARGHEZZA = 640;
const ALTEZZA = 240;
const PAD = { sopra: 16, destra: 12, sotto: 28, sinistra: 34 };

interface Punto {
  x: number;
  y: number;
}

/**
 * Curva morbida (Catmull-Rom → Bézier) passante per tutti i punti. Le maniglie
 * sono vincolate all'area del grafico, così i picchi non "sfondano" lo zero.
 */
function curva(punti: Punto[], minY: number, maxY: number): string {
  if (punti.length < 2) return "";
  const vincola = (y: number) => Math.min(maxY, Math.max(minY, y));
  let d = `M ${punti[0].x} ${punti[0].y}`;
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[Math.max(0, i - 1)];
    const p1 = punti[i];
    const p2 = punti[i + 1];
    const p3 = punti[Math.min(punti.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = vincola(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = vincola(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Andamento mensile: area+linea delle ore risparmiate e linea delle offerte
 * generate, sui dati reali dell'anno corrente.
 */
export function GraficoAndamento({ dati }: { dati: PuntoAndamento[] }) {
  const massimo = Math.max(...dati.map((p) => Math.max(p.ore, p.offerte)), 4);
  const utileX = LARGHEZZA - PAD.sinistra - PAD.destra;
  const utileY = ALTEZZA - PAD.sopra - PAD.sotto;
  const passo = utileX / (dati.length - 1 || 1);
  const base = ALTEZZA - PAD.sotto;

  const posiziona = (valore: number, i: number): Punto => ({
    x: Math.round((PAD.sinistra + i * passo) * 10) / 10,
    y: Math.round((base - (valore / massimo) * utileY) * 10) / 10,
  });

  const puntiOre = dati.map((p, i) => posiziona(p.ore, i));
  const puntiOfferte = dati.map((p, i) => posiziona(p.offerte, i));
  const lineaOre = curva(puntiOre, PAD.sopra, base);
  const areaOre = `${lineaOre} L ${puntiOre[puntiOre.length - 1].x} ${base} L ${puntiOre[0].x} ${base} Z`;

  // 4 linee di griglia orizzontali con etichetta del valore.
  const griglia = [0, 1, 2, 3].map((i) => {
    const valore = Math.round((massimo / 3) * i);
    return { valore, y: base - (valore / massimo) * utileY };
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${LARGHEZZA} ${ALTEZZA}`}
        className="h-auto w-full"
        role="img"
        aria-label="Andamento mensile di ore risparmiate e offerte generate"
      >
        <defs>
          <linearGradient id="riempimento-ore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORE_PRIMARIO} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COLORE_PRIMARIO} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {griglia.map(({ valore, y }) => (
          <g key={valore}>
            <line
              x1={PAD.sinistra}
              x2={LARGHEZZA - PAD.destra}
              y1={y}
              y2={y}
              stroke="hsl(156 12% 88%)"
              strokeWidth="1"
            />
            <text
              x={PAD.sinistra - 8}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="hsl(194 18% 45%)"
            >
              {valore}
            </text>
          </g>
        ))}

        <path d={areaOre} fill="url(#riempimento-ore)" />
        <path
          d={lineaOre}
          fill="none"
          stroke={COLORE_PRIMARIO}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={curva(puntiOfferte, PAD.sopra, base)}
          fill="none"
          stroke={COLORE_ACCENTO}
          strokeWidth="2"
          strokeDasharray="1 0"
          strokeLinecap="round"
        />

        {dati.map((p, i) => (
          <g key={p.mese}>
            <circle
              cx={puntiOre[i].x}
              cy={puntiOre[i].y}
              r="3"
              fill="#fff"
              stroke={COLORE_PRIMARIO}
              strokeWidth="2"
            >
              <title>{`${p.mese}: ${p.ore} h risparmiate`}</title>
            </circle>
            <circle
              cx={puntiOfferte[i].x}
              cy={puntiOfferte[i].y}
              r="2.5"
              fill={COLORE_ACCENTO}
            >
              <title>{`${p.mese}: ${p.offerte} offerte`}</title>
            </circle>
            <text
              x={puntiOre[i].x}
              y={ALTEZZA - 8}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(194 18% 45%)"
            >
              {p.mese}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: COLORE_PRIMARIO }}
          />
          Ore risparmiate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: COLORE_ACCENTO }}
          />
          Offerte generate
        </span>
      </div>
    </div>
  );
}
