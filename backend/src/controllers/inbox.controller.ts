import type { Request, Response } from "express";
import * as gmail from "../services/gmail.service.js";

// Email di esempio: usate come fallback quando Gmail non è collegato.
const EMAIL = [
  { id: "1", mittente: "Rossi S.p.A.", mittenteEmail: "acquisti@rossi.it", oggetto: "Richiesta preventivo fornitura", categoria: "Commerciale", priorita: "Alta", tempo: "5 min", corpo: "Buongiorno, siamo interessati a una fornitura di 200 unità del vostro prodotto di punta. Avremmo bisogno di un preventivo dettagliato con tempi di consegna entro fine mese. Restiamo in attesa di un vostro riscontro." },
  { id: "2", mittente: "Bianchi SRL", mittenteEmail: "ordini@bianchi.it", oggetto: "Conferma ordine #4821", categoria: "Amministrazione", priorita: "Media", tempo: "32 min", corpo: "Vi confermiamo l'ordine #4821. Vi preghiamo di inviare la fattura all'indirizzo amministrativo e di procedere con la spedizione standard." },
  { id: "3", mittente: "Verdi & Co", mittenteEmail: "supporto@verdi.it", oggetto: "Problema accesso piattaforma", categoria: "Supporto", priorita: "Alta", tempo: "1 ora", corpo: "Non riusciamo ad accedere alla piattaforma dal nostro account principale: riceviamo un errore di autenticazione. È urgente, abbiamo una scadenza oggi pomeriggio." },
  { id: "4", mittente: "Studio Ferrari", mittenteEmail: "info@studioferrari.it", oggetto: "Revisione offerta commerciale", categoria: "Offerta", priorita: "Media", tempo: "2 ore", corpo: "Abbiamo ricevuto la vostra offerta e vorremmo rivedere alcune voci, in particolare i costi di personalizzazione. Possiamo fissare una call questa settimana?" },
  { id: "5", mittente: "Gallo Logistica", mittenteEmail: "commerciale@gallologistica.it", oggetto: "Disponibilità nuova fornitura", categoria: "Commerciale", priorita: "Media", tempo: "3 ore", corpo: "Salve, vorremmo sapere se avete disponibilità per una nuova fornitura ricorrente mensile. Indicateci condizioni e prezzi per volumi elevati." },
  { id: "6", mittente: "Newsletter", mittenteEmail: "news@settore.it", oggetto: "Aggiornamenti di settore", categoria: "Altro", priorita: "Bassa", tempo: "4 ore", corpo: "Le ultime novità del settore e gli aggiornamenti normativi del mese. Clicca per leggere l'articolo completo." },
];

export async function elenca(req: Request, res: Response) {
  // Se l'utente ha collegato Gmail, mostra le email reali; altrimenti i dati demo.
  if (req.userId) {
    try {
      const reali = await gmail.leggiEmail(req.userId);
      if (reali) return res.json(reali);
    } catch (err) {
      console.error("[Inbox] lettura Gmail fallita, uso i dati demo:", err);
    }
  }
  res.json(EMAIL);
}
