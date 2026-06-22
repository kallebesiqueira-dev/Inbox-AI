import type { Request, Response } from "express";

// Email di esempio servite dal backend (in un'integrazione reale arriverebbero
// dalla casella collegata, già analizzate e classificate dal provider AI).
const EMAIL = [
  { id: "1", mittente: "Rossi S.p.A.", oggetto: "Richiesta preventivo fornitura", categoria: "Commerciale", priorita: "Alta", tempo: "5 min" },
  { id: "2", mittente: "Bianchi SRL", oggetto: "Conferma ordine #4821", categoria: "Amministrazione", priorita: "Media", tempo: "32 min" },
  { id: "3", mittente: "Verdi & Co", oggetto: "Problema accesso piattaforma", categoria: "Supporto", priorita: "Alta", tempo: "1 ora" },
  { id: "4", mittente: "Studio Ferrari", oggetto: "Revisione offerta commerciale", categoria: "Offerta", priorita: "Media", tempo: "2 ore" },
  { id: "5", mittente: "Gallo Logistica", oggetto: "Disponibilità nuova fornitura", categoria: "Commerciale", priorita: "Media", tempo: "3 ore" },
  { id: "6", mittente: "Newsletter", oggetto: "Aggiornamenti di settore", categoria: "Altro", priorita: "Bassa", tempo: "4 ore" },
];

export function elenca(_req: Request, res: Response) {
  res.json(EMAIL);
}
