import type { Request, Response } from "express";
import { offerteCrud, type OffertaDTO } from "../services/offerte.service.js";
import {
  opportunitaCrud,
  type OpportunitaDTO,
} from "../services/opportunita.service.js";
import {
  approvazioneCrud,
  type ApprovazioneDTO,
} from "../services/approvazione.service.js";
import { FASI_CRM } from "../models/Opportunita.js";
import { STATI_OFFERTA } from "../models/Offerta.js";

const MESI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

// Stima ore risparmiate per elemento gestito dall'AI (offerta, opp., approv.).
const ORE_OFFERTA = 1.5;
const ORE_OPPORTUNITA = 0.8;
const ORE_APPROVAZIONE = 0.5;

// Limite prudenziale: la dashboard aggrega i documenti dell'utente in memoria
// (proiettati sui soli campi utili), non intere collezioni illimitate.
const LIMITE = 1000;

function tempoRelativo(iso?: string): string {
  if (!iso) return "di recente";
  const giorni = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (Number.isNaN(giorni)) return "di recente";
  if (giorni <= 0) return "oggi";
  if (giorni === 1) return "ieri";
  return `${giorni} giorni fa`;
}

/** Indice del mese (0-11) se la data ISO cade nell'anno corrente, altrimenti -1. */
function meseCorrente(iso: string, anno: number): number {
  const d = new Date(iso);
  return d.getFullYear() === anno ? d.getMonth() : -1;
}

/** Variazione % mese corrente vs mese precedente, sui valori reali. */
function deltaMensile(serie: number[], mese: number): number {
  const corrente = serie[mese] ?? 0;
  const precedente = mese > 0 ? serie[mese - 1] : 0;
  if (precedente === 0) return corrente > 0 ? 100 : 0;
  return Math.round(((corrente - precedente) / precedente) * 100);
}

export async function kpi(req: Request, res: Response) {
  const userId = req.userId ?? "";
  // Proiezioni: niente avatar (data URL fino a 500KB) né corpo/voci in memoria.
  const [offerte, opportunita, approvazioni] = await Promise.all([
    offerteCrud.elenca(userId, {
      limite: LIMITE,
      campi: ["numero", "cliente", "importo", "stato", "data", "createdAt"],
    }),
    opportunitaCrud.elenca(userId, {
      limite: LIMITE,
      campi: ["cliente", "valore", "fase", "createdAt"],
    }),
    approvazioneCrud.elenca(userId, {
      limite: LIMITE,
      campi: ["tipo", "oggetto", "fase", "createdAt"],
    }),
  ]);

  const anno = new Date().getFullYear();
  const meseOggi = new Date().getMonth();

  // Serie mensili reali (anno corrente) dalle date di creazione.
  const offerteMese = Array.from({ length: 12 }, () => 0);
  const opportunitaMese = Array.from({ length: 12 }, () => 0);
  const elementiMese = Array.from({ length: 12 }, () => 0);
  const oreMese = Array.from({ length: 12 }, () => 0);
  const pipelineMese = Array.from({ length: 12 }, () => 0);

  for (const o of offerte) {
    const m = meseCorrente(o.data, anno);
    if (m < 0) continue;
    offerteMese[m] += 1;
    elementiMese[m] += 1;
    oreMese[m] += ORE_OFFERTA;
  }
  for (const o of opportunita) {
    const m = meseCorrente(o.data, anno);
    if (m < 0) continue;
    opportunitaMese[m] += 1;
    elementiMese[m] += 1;
    oreMese[m] += ORE_OPPORTUNITA;
    pipelineMese[m] += o.valore;
  }
  for (const a of approvazioni) {
    const m = meseCorrente(a.data, anno);
    if (m < 0) continue;
    elementiMese[m] += 1;
    oreMese[m] += ORE_APPROVAZIONE;
  }

  // Distribuzioni reali per il donut / barre / cascata.
  const pipeline = FASI_CRM.map((fase) => {
    const inFase = opportunita.filter((o: OpportunitaDTO) => o.fase === fase);
    return {
      fase,
      quantita: inFase.length,
      valore: inFase.reduce((somma, o) => somma + o.valore, 0),
    };
  });
  const offertePerStato = STATI_OFFERTA.map((stato) => {
    const inStato = offerte.filter((o: OffertaDTO) => o.stato === stato);
    return {
      stato,
      quantita: inStato.length,
      importo: inStato.reduce((somma, o) => somma + o.importo, 0),
    };
  });

  const opportunitaAperte = opportunita.filter((o) => o.fase !== "Chiuso");
  const valorePipeline = opportunitaAperte.reduce(
    (somma, o) => somma + o.valore,
    0
  );
  const emailElaborate =
    offerte.length + opportunita.length + approvazioni.length;
  const oreRisparmiate = Math.round(
    offerte.length * ORE_OFFERTA +
      opportunita.length * ORE_OPPORTUNITA +
      approvazioni.length * ORE_APPROVAZIONE
  );

  const attivita: { testo: string; tempo: string }[] = [];
  for (const o of offerte.slice(0, 2)) {
    attivita.push({
      testo: `Offerta #${o.numero} — ${o.cliente} (${o.stato})`,
      tempo: tempoRelativo(o.data),
    });
  }
  const opp = opportunita[0] as OpportunitaDTO | undefined;
  if (opp) {
    attivita.push({
      testo: `Opportunità: ${opp.cliente} in ${opp.fase}`,
      tempo: tempoRelativo(opp.data),
    });
  }
  const appr = approvazioni[0] as ApprovazioneDTO | undefined;
  if (appr) {
    attivita.push({
      testo: `Approvazione: ${appr.oggetto}`,
      tempo: "in attesa",
    });
  }
  if (attivita.length === 0) {
    attivita.push({
      testo: "Nessuna attività recente. Inizia generando un'offerta dall'Inbox.",
      tempo: "",
    });
  }

  const andamento = MESI.map((mese, i) => ({
    mese,
    offerte: offerteMese[i],
    elementi: elementiMese[i],
    ore: Math.round(oreMese[i] * 10) / 10,
  }));

  res.json({
    anno,
    metriche: {
      emailElaborate: {
        valore: emailElaborate,
        delta: deltaMensile(elementiMese, meseOggi),
      },
      offerteGenerate: {
        valore: offerte.length,
        delta: deltaMensile(offerteMese, meseOggi),
      },
      opportunitaAperte: {
        valore: opportunitaAperte.length,
        delta: deltaMensile(opportunitaMese, meseOggi),
      },
      valorePipeline: {
        valore: valorePipeline,
        delta: deltaMensile(pipelineMese, meseOggi),
      },
      oreRisparmiate: {
        valore: oreRisparmiate,
        delta: deltaMensile(oreMese, meseOggi),
      },
    },
    andamento,
    pipeline,
    offertePerStato,
    // Campo legacy: mantiene compatibile il frontend già deployato mentre
    // backend e frontend si aggiornano in momenti diversi (Vercel vs Render).
    oreMensili: andamento.map(({ mese, ore }) => ({ mese, valore: ore })),
    attivita,
  });
}
