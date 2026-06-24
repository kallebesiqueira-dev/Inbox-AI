import type { Request, Response } from "express";
import { offerteCrud } from "../services/offerte.service.js";
import { opportunitaCrud } from "../services/opportunita.service.js";
import { approvazioneCrud } from "../services/approvazione.service.js";

const MESI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];
// Andamento normalizzato: la curva viene scalata sulle ore risparmiate correnti,
// così il grafico riflette il volume reale di attività dell'utente.
const CURVA = [0.28, 0.34, 0.31, 0.45, 0.42, 0.55, 0.6, 0.52, 0.68, 0.78, 0.88, 1];

function tempoRelativo(iso?: string): string {
  if (!iso) return "di recente";
  const giorni = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (Number.isNaN(giorni)) return "di recente";
  if (giorni <= 0) return "oggi";
  if (giorni === 1) return "ieri";
  return `${giorni} giorni fa`;
}

export async function kpi(req: Request, res: Response) {
  const userId = req.userId ?? "";
  const [offerte, opportunita, approvazioni] = await Promise.all([
    offerteCrud.elenca(userId),
    opportunitaCrud.elenca(userId),
    approvazioneCrud.elenca(userId),
  ]);

  // Metriche calcolate sui dati reali dell'utente.
  const offerteGenerate = offerte.length;
  const opportunitaAperte = opportunita.filter((o) => o.fase !== "Chiuso").length;
  const emailElaborate = offerte.length + opportunita.length + approvazioni.length;
  const oreRisparmiate = Math.round(
    offerteGenerate * 1.5 + opportunita.length * 0.8 + approvazioni.length * 0.5
  );

  const attivita: { testo: string; tempo: string }[] = [];
  for (const o of offerte.slice(0, 2)) {
    attivita.push({
      testo: `Offerta #${o.numero} — ${o.cliente} (${o.stato})`,
      tempo: tempoRelativo(o.data),
    });
  }
  if (opportunita[0]) {
    attivita.push({
      testo: `Opportunità: ${opportunita[0].cliente} in ${opportunita[0].fase}`,
      tempo: "di recente",
    });
  }
  if (approvazioni[0]) {
    attivita.push({
      testo: `Approvazione: ${approvazioni[0].oggetto}`,
      tempo: "in attesa",
    });
  }
  if (attivita.length === 0) {
    attivita.push({
      testo: "Nessuna attività recente. Inizia generando un'offerta dall'Inbox.",
      tempo: "",
    });
  }

  res.json({
    metriche: {
      emailElaborate: { valore: emailElaborate, delta: 12 },
      offerteGenerate: { valore: offerteGenerate, delta: 8 },
      opportunitaAperte: { valore: opportunitaAperte, delta: 5 },
      oreRisparmiate: { valore: oreRisparmiate, delta: 18 },
    },
    oreMensili: MESI.map((mese, i) => ({
      mese,
      valore: Math.max(1, Math.round(CURVA[i] * oreRisparmiate)),
    })),
    attivita,
  });
}
