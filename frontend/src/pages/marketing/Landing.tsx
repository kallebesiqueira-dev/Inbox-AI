import { Link } from "react-router-dom";
import {
  Sparkles,
  Inbox,
  FileText,
  Users,
  CheckSquare,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";

const moduli = [
  { icon: Sparkles, titolo: "Assistente AI", testo: "Chat conversazionale in tempo reale per gestire il lavoro quotidiano." },
  { icon: Inbox, titolo: "Inbox intelligente", testo: "Email analizzate e classificate per categoria e priorità." },
  { icon: FileText, titolo: "Offerte", testo: "Generazione e versioning dei documenti commerciali." },
  { icon: Users, titolo: "CRM", testo: "Pipeline delle opportunità, dal primo contatto alla chiusura." },
  { icon: CheckSquare, titolo: "Approvazioni", testo: "Workflow con supervisione umana su ogni azione." },
  { icon: LayoutDashboard, titolo: "Dashboard", testo: "KPI operativi e attività recenti in un colpo d'occhio." },
];

const vantaggi = [
  { icon: Zap, titolo: "Automazione concreta", testo: "Riduci il lavoro manuale ripetitivo su email, offerte e attività." },
  { icon: ShieldCheck, titolo: "Sicuro per impostazione", testo: "Sessioni protette, CSRF e provider AI sempre lato server." },
  { icon: Clock, titolo: "Tempo risparmiato", testo: "Processi più rapidi mantenendo il controllo sulle decisioni." },
];

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-secondary">
          <Sparkles className="size-3.5" />
          Automazione operativa con intelligenza artificiale
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Il lavoro operativo della tua azienda, automatizzato.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Inbox AI analizza le email, genera offerte, gestisce il CRM e i workflow
          di approvazione — così il tuo team si concentra su ciò che conta davvero.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Inizia ora <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/documentazione"
            className="inline-flex items-center rounded-md border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Documentazione
          </Link>
        </div>
      </section>

      {/* Vantaggi */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
          {vantaggi.map(({ icon: Icon, titolo, testo }) => (
            <div key={titolo} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold">{titolo}</h3>
              <p className="text-sm text-muted-foreground">{testo}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Moduli */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Una piattaforma, tutti i tuoi processi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Moduli integrati che lavorano insieme, con l'intelligenza artificiale
            astratta dietro un'unica esperienza coerente.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {moduli.map(({ icon: Icon, titolo, testo }) => (
            <div
              key={titolo}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{titolo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{testo}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA finale */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold tracking-tight">
            Pronto a ridurre il lavoro manuale?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Accedi e prova l'Assistente AI in pochi secondi.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Inizia ora <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
