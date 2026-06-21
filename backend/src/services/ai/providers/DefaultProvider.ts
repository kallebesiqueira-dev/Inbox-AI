import type {
  AIProvider,
  EmailDaAnalizzare,
  RisultatoAnalisi,
  DatiOfferta,
  OffertaGenerata,
  CategoriaEmail,
} from "./AIProvider.js";

/**
 * Implementazione di riferimento (regole euristiche).
 * Sostituibile in futuro con un provider reale senza modificare il resto
 * dell'applicazione né il frontend.
 */
export class DefaultProvider implements AIProvider {
  readonly nome = "default";

  async analizzaEmail(email: EmailDaAnalizzare): Promise<RisultatoAnalisi> {
    const testo = `${email.oggetto} ${email.corpo}`.toLowerCase();

    let categoria: CategoriaEmail = "Altro";
    if (/(preventivo|fornitura|acquist|prezzo)/.test(testo)) categoria = "Commerciale";
    else if (/(offerta|proposta|quotazione)/.test(testo)) categoria = "Offerta";
    else if (/(problema|errore|assistenza|supporto)/.test(testo)) categoria = "Supporto";
    else if (/(fattura|ordine|pagamento|contratto)/.test(testo)) categoria = "Amministrazione";

    const priorita = /(urgente|subito|importante)/.test(testo)
      ? "Alta"
      : categoria === "Supporto"
        ? "Alta"
        : "Media";

    return {
      categoria,
      priorita,
      riassunto: `Email da ${email.mittente} classificata come ${categoria}.`,
      azioniSuggerite:
        categoria === "Commerciale"
          ? ["Generare offerta", "Creare opportunità nel CRM"]
          : ["Inoltrare al responsabile"],
    };
  }

  async generaOfferta(dati: DatiOfferta): Promise<OffertaGenerata> {
    return {
      titolo: `Offerta commerciale — ${dati.cliente}`,
      corpo: `Gentile ${dati.cliente},\n\nin riferimento alla vostra richiesta "${dati.richiesta}", siamo lieti di sottoporvi la seguente proposta.`,
      voci: [
        { descrizione: "Servizio base", importo: 1000 },
        { descrizione: "Personalizzazione", importo: 500 },
      ],
    };
  }
}
