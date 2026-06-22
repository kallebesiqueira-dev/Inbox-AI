import { Link } from "react-router-dom";
import {
  Sparkles,
  Inbox,
  FileText,
  Users,
  CheckSquare,
  LayoutDashboard,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Funzione {
  icon: LucideIcon;
  titolo: string;
  testo: string;
  punti: string[];
}

const funzioni: Funzione[] = [
  {
    icon: Sparkles,
    titolo: "Assistente AI",
    testo:
      "Una chat conversazionale in streaming che ti affianca nelle attività quotidiane: riassunti, bozze, suggerimenti operativi.",
    punti: ["Risposte in tempo reale", "Suggerimenti contestuali", "Provider AI astratto e sicuro"],
  },
  {
    icon: Inbox,
    titolo: "Inbox intelligente",
    testo:
      "Le email vengono analizzate e classificate automaticamente per categoria e priorità, per sapere subito dove intervenire.",
    punti: ["Categorie automatiche", "Priorità calcolata", "Azioni suggerite"],
  },
  {
    icon: FileText,
    titolo: "Offerte",
    testo:
      "Genera offerte a partire da una richiesta, modificale e gestiscine le versioni lungo tutto il ciclo di vita.",
    punti: ["Generazione assistita", "Bozza → In revisione → Approvata → Inviata", "Voci e importi strutturati"],
  },
  {
    icon: Users,
    titolo: "CRM",
    testo:
      "Una pipeline chiara per seguire ogni opportunità dal primo contatto alla chiusura.",
    punti: ["Pipeline a colonne", "Stato sempre aggiornato", "Focus sulle priorità"],
  },
  {
    icon: CheckSquare,
    titolo: "Approvazioni",
    testo:
      "Mantieni il controllo umano: ogni azione automatizzata passa da un flusso di approvazione esplicito.",
    punti: ["Supervisione umana", "Bozza → Revisione → Approvazione → Esecuzione", "Tracciabilità"],
  },
  {
    icon: LayoutDashboard,
    titolo: "Dashboard",
    testo:
      "KPI operativi e attività recenti raccolti in un'unica panoramica in tempo reale.",
    punti: ["Email elaborate", "Offerte generate", "Tempo risparmiato"],
  },
];

export function Funzionalita() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Funzionalità</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tutto ciò che serve per automatizzare le attività operative, commerciali
          e amministrative — in un'unica piattaforma coerente.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {funzioni.map(({ icon: Icon, titolo, testo, punti }) => (
          <div key={titolo} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{titolo}</h2>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{testo}</p>
            <ul className="mt-4 space-y-2">
              {punti.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Inizia ora <ArrowRight className="size-4" />
        </Link>
        <Link
          to="/documentazione"
          className="inline-flex items-center rounded-md border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-surface"
        >
          Leggi la documentazione
        </Link>
      </div>
    </div>
  );
}
