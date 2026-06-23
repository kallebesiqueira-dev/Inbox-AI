import type { Request, Response } from "express";

// Email di esempio servite dal backend (in un'integrazione reale arriverebbero
// dalla casella collegata, già analizzate e classificate dal provider AI).
const EMAIL = [
  { id: "1", mittente: "Rossi S.p.A.", oggetto: "Richiesta preventivo fornitura", categoria: "Commerciale", priorita: "Alta", tempo: "5 min", corpo: "Buongiorno, siamo interessati a una fornitura di 200 unità del vostro prodotto di punta. Avremmo bisogno di un preventivo dettagliato con tempi di consegna entro fine mese. Restiamo in attesa di un vostro riscontro." },
  { id: "2", mittente: "Bianchi SRL", oggetto: "Conferma ordine #4821", categoria: "Amministrazione", priorita: "Media", tempo: "32 min", corpo: "Vi confermiamo l'ordine #4821. Vi preghiamo di inviare la fattura all'indirizzo amministrativo e di procedere con la spedizione standard." },
  { id: "3", mittente: "Verdi & Co", oggetto: "Problema accesso piattaforma", categoria: "Supporto", priorita: "Alta", tempo: "1 ora", corpo: "Non riusciamo ad accedere alla piattaforma dal nostro account principale: riceviamo un errore di autenticazione. È urgente, abbiamo una scadenza oggi pomeriggio." },
  { id: "4", mittente: "Studio Ferrari", oggetto: "Revisione offerta commerciale", categoria: "Offerta", priorita: "Media", tempo: "2 ore", corpo: "Abbiamo ricevuto la vostra offerta e vorremmo rivedere alcune voci, in particolare i costi di personalizzazione. Possiamo fissare una call questa settimana?" },
  { id: "5", mittente: "Gallo Logistica", oggetto: "Disponibilità nuova fornitura", categoria: "Commerciale", priorita: "Media", tempo: "3 ore", corpo: "Salve, vorremmo sapere se avete disponibilità per una nuova fornitura ricorrente mensile. Indicateci condizioni e prezzi per volumi elevati." },
  { id: "6", mittente: "Newsletter", oggetto: "Aggiornamenti di settore", categoria: "Altro", priorita: "Bassa", tempo: "4 ore", corpo: "Le ultime novità del settore e gli aggiornamenti normativi del mese. Clicca per leggere l'articolo completo." },
];

export function elenca(_req: Request, res: Response) {
  res.json(EMAIL);
}
