/**
 * Layer di astrazione del provider AI.
 *
 * Il frontend non deve MAI conoscere il provider, il modello o il brand
 * tecnologico utilizzato. Tutte le funzionalità AI passano da qui.
 */

export type CategoriaEmail =
  | "Commerciale"
  | "Offerta"
  | "Supporto"
  | "Amministrazione"
  | "Altro";

export interface EmailDaAnalizzare {
  mittente: string;
  oggetto: string;
  corpo: string;
}

export interface RisultatoAnalisi {
  categoria: CategoriaEmail;
  priorita: "Alta" | "Media" | "Bassa";
  riassunto: string;
  azioniSuggerite: string[];
}

export interface DatiOfferta {
  cliente: string;
  richiesta: string;
}

export interface MessaggioChat {
  ruolo: "utente" | "assistente";
  contenuto: string;
}

export interface OffertaGenerata {
  titolo: string;
  corpo: string;
  voci: { descrizione: string; importo: number }[];
}

/** Contratto comune a tutti i provider AI. */
export interface AIProvider {
  readonly nome: string;
  analizzaEmail(email: EmailDaAnalizzare): Promise<RisultatoAnalisi>;
  generaOfferta(dati: DatiOfferta): Promise<OffertaGenerata>;
  /** Conversazione con l'assistente: produce la risposta in streaming (chunk di testo). */
  chat(messaggi: MessaggioChat[]): AsyncIterable<string>;
}
