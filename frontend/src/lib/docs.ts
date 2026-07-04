export interface DocSezione {
  titolo?: string;
  paragrafi?: string[];
  passi?: string[];
}

export interface DocArticolo {
  slug: string;
  titolo: string;
  categoria: string;
  descrizione: string;
  sezioni: DocSezione[];
}

/**
 * Contenuti della documentazione. Strutturati come dati per restare
 * facilmente estendibili e renderizzabili senza dipendenze esterne.
 */
export const documentazione: DocArticolo[] = [
  {
    slug: "introduzione",
    titolo: "Introduzione",
    categoria: "Per iniziare",
    descrizione: "Cos'è Inbox AI e quali problemi risolve.",
    sezioni: [
      {
        paragrafi: [
          "Inbox AI è una piattaforma B2B che automatizza le attività operative, commerciali e amministrative tramite intelligenza artificiale: analisi e classificazione delle email, generazione di offerte, gestione del CRM, workflow di approvazione e una dashboard di KPI.",
          "L'obiettivo è ridurre il lavoro manuale ripetitivo e accelerare i processi, mantenendo sempre il controllo umano sulle decisioni importanti.",
        ],
      },
      {
        titolo: "A chi è rivolto",
        paragrafi: [
          "Team commerciali, uffici acquisti e amministrazione che gestiscono grandi volumi di email e documenti e vogliono standardizzare i processi.",
        ],
      },
    ],
  },
  {
    slug: "primi-passi",
    titolo: "Primi passi",
    categoria: "Per iniziare",
    descrizione: "Tutorial: dall'accesso alla prima attività automatizzata.",
    sezioni: [
      {
        titolo: "Tutorial in 4 passi",
        passi: [
          "Accedi con email e password oppure con il tuo account Google.",
          "Apri la Dashboard per avere una panoramica dei KPI operativi.",
          "Apri l'Assistente dal pulsante in basso a destra e chiedi, ad esempio, di redigere una bozza di offerta.",
          "Controlla il risultato in Offerte e fallo avanzare nel workflow di approvazione.",
        ],
      },
      {
        titolo: "Suggerimento",
        paragrafi: [
          "Premi Ctrl+K (o ⌘K su Mac) in qualsiasi momento per aprire la ricerca rapida e saltare a qualunque sezione o azione.",
        ],
      },
    ],
  },
  {
    slug: "assistente",
    titolo: "Assistente AI",
    categoria: "Funzionalità",
    descrizione: "La chat conversazionale per gestire il lavoro quotidiano.",
    sezioni: [
      {
        paragrafi: [
          "L'Assistente è un widget di chat flottante (in basso a destra), disponibile su ogni pagina, che risponde in streaming. Puoi chiedergli di riassumere email, redigere offerte, individuare opportunità prioritarie nel CRM o suggerire come velocizzare le approvazioni.",
        ],
      },
      {
        titolo: "Come usarlo",
        passi: [
          "Apri il widget dal pulsante in basso a destra.",
          "Scrivi la tua richiesta o scegli un suggerimento.",
          "Premi Invio per inviare (Shift+Invio per andare a capo).",
          "Usa «Nuova conversazione» per ripartire da zero.",
        ],
      },
    ],
  },
  {
    slug: "inbox",
    titolo: "Inbox",
    categoria: "Funzionalità",
    descrizione: "Email analizzate e classificate automaticamente.",
    sezioni: [
      {
        paragrafi: [
          "L'Inbox raccoglie le email in arrivo e le classifica per categoria (Commerciale, Offerta, Supporto, Amministrazione, Altro) e priorità, così da sapere subito su cosa concentrarti.",
        ],
      },
    ],
  },
  {
    slug: "offerte",
    titolo: "Offerte",
    categoria: "Funzionalità",
    descrizione: "Generazione, modifica e versioning dei documenti commerciali.",
    sezioni: [
      {
        paragrafi: [
          "Le offerte seguono un ciclo di vita chiaro: Bozza → In revisione → Approvata → Inviata. Puoi generarle automaticamente a partire da una richiesta e poi modificarle prima dell'invio.",
        ],
      },
    ],
  },
  {
    slug: "crm",
    titolo: "CRM",
    categoria: "Funzionalità",
    descrizione: "Pipeline commerciale e gestione delle opportunità.",
    sezioni: [
      {
        paragrafi: [
          "Il CRM organizza le opportunità in una pipeline a colonne: Nuovo → In Analisi → Offerta Inviata → Negoziazione → Chiuso. Sposta le opportunità tra le fasi per riflettere lo stato della trattativa.",
        ],
      },
    ],
  },
  {
    slug: "approvazioni",
    titolo: "Approvazioni",
    categoria: "Funzionalità",
    descrizione: "Workflow con supervisione umana.",
    sezioni: [
      {
        paragrafi: [
          "Le approvazioni garantiscono il controllo umano sulle azioni automatizzate, seguendo il flusso Bozza → Revisione → Approvazione → Esecuzione. Nulla viene eseguito senza un via libera esplicito.",
        ],
      },
    ],
  },
  {
    slug: "scorciatoie",
    titolo: "Scorciatoie e ricerca",
    categoria: "Avanzato",
    descrizione: "Naviga più velocemente con la tastiera.",
    sezioni: [
      {
        titolo: "Ricerca rapida",
        paragrafi: [
          "Premi Ctrl+K (⌘K su Mac) per aprire la palette dei comandi: cerca pagine e azioni, spostati con le frecce e conferma con Invio. Premi Esc per chiudere.",
        ],
      },
    ],
  },
  {
    slug: "sicurezza",
    titolo: "Sicurezza e privacy",
    categoria: "Avanzato",
    descrizione: "Come proteggiamo i tuoi dati.",
    sezioni: [
      {
        paragrafi: [
          "Le sessioni usano cookie httpOnly firmati, protezione CSRF e revoca lato server al logout. Le chiavi e il provider di intelligenza artificiale restano sempre sul backend e non sono mai esposti al browser.",
        ],
      },
    ],
  },
];

export const categorieDoc = [...new Set(documentazione.map((d) => d.categoria))];

/** Senza slug ritorna il primo articolo; con slug inesistente ritorna undefined (404). */
export function trovaArticolo(slug?: string): DocArticolo | undefined {
  if (!slug) return documentazione[0];
  return documentazione.find((d) => d.slug === slug);
}
