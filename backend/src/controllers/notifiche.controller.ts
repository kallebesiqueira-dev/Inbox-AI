import type { Request, Response } from "express";
import { offerteCrud } from "../services/offerte.service.js";
import { opportunitaCrud } from "../services/opportunita.service.js";
import { approvazioneCrud } from "../services/approvazione.service.js";

export interface Notifica {
  id: string;
  titolo: string;
  descrizione: string;
}

/** Notifiche derivate dall'attività reale dell'utente (no dati demo). */
export async function elenca(req: Request, res: Response) {
  const userId = req.userId ?? "";
  const [offerte, opportunita, approvazioni] = await Promise.all([
    offerteCrud.elenca(userId),
    opportunitaCrud.elenca(userId),
    approvazioneCrud.elenca(userId),
  ]);

  const notifiche: Notifica[] = [];

  for (const a of approvazioni
    .filter((x) => x.fase !== "Esecuzione")
    .slice(0, 3)) {
    notifiche.push({
      id: `appr-${a.id}`,
      titolo: "Approvazione in attesa",
      descrizione: `${a.oggetto} · ${a.fase}`,
    });
  }
  for (const o of offerte.slice(0, 2)) {
    notifiche.push({
      id: `off-${o.id}`,
      titolo: "Offerta",
      descrizione: `#${o.numero} — ${o.cliente} (${o.stato})`,
    });
  }
  for (const o of opportunita
    .filter((x) => x.fase === "Negoziazione")
    .slice(0, 2)) {
    notifiche.push({
      id: `opp-${o.id}`,
      titolo: "Opportunità in negoziazione",
      descrizione: o.cliente,
    });
  }

  res.json(notifiche.slice(0, 8));
}
