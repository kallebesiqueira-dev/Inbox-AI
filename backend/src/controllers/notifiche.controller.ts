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
  // Filtri e limiti in DB: si caricano solo gli elementi che finiscono in notifica.
  const [approvazioni, offerte, opportunita] = await Promise.all([
    approvazioneCrud.elenca(userId, { limite: 3, filtro: { fase: { $ne: "Esecuzione" } } }),
    offerteCrud.elenca(userId, { limite: 2 }),
    opportunitaCrud.elenca(userId, { limite: 2, filtro: { fase: "Negoziazione" } }),
  ]);

  const notifiche: Notifica[] = [];

  for (const a of approvazioni) {
    notifiche.push({
      id: `appr-${a.id}`,
      titolo: "Approvazione in attesa",
      descrizione: `${a.oggetto} · ${a.fase}`,
    });
  }
  for (const o of offerte) {
    notifiche.push({
      id: `off-${o.id}`,
      titolo: "Offerta",
      descrizione: `#${o.numero} — ${o.cliente} (${o.stato})`,
    });
  }
  for (const o of opportunita) {
    notifiche.push({
      id: `opp-${o.id}`,
      titolo: "Opportunità in negoziazione",
      descrizione: o.cliente,
    });
  }

  res.json(notifiche.slice(0, 8));
}
