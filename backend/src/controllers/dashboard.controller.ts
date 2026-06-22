import type { Request, Response } from "express";

// Metriche operative della dashboard. Valori rappresentativi serviti dal backend
// come unica fonte di verità: il frontend non contiene più dati cablati e potrà
// in futuro essere alimentato da aggregazioni reali senza modifiche alla UI.
const MESI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];
const ORE_MENSILI = [40, 55, 48, 70, 65, 82, 90, 78, 95, 110, 120, 142];

export function kpi(_req: Request, res: Response) {
  res.json({
    metriche: {
      emailElaborate: { valore: 1284, delta: 12 },
      offerteGenerate: { valore: 86, delta: 8 },
      opportunitaAperte: { valore: 37, delta: 5 },
      oreRisparmiate: { valore: 142, delta: 18 },
    },
    oreMensili: MESI.map((mese, i) => ({ mese, valore: ORE_MENSILI[i] })),
    attivita: [
      { testo: "Nuova email classificata come Commerciale", tempo: "2 min fa" },
      { testo: "Offerta #2025-086 generata automaticamente", tempo: "18 min fa" },
      { testo: "Opportunità spostata in Negoziazione", tempo: "1 ora fa" },
      { testo: "Approvazione richiesta per invio offerta", tempo: "3 ore fa" },
    ],
  });
}
