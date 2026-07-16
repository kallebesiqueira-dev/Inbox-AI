import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Check,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const moduli = [
  { icon: Sparkles, titolo: "Assistente AI", testo: "Chat conversazionale in tempo reale per gestire il lavoro quotidiano." },
  { icon: Inbox, titolo: "Inbox intelligente", testo: "Email analizzate e classificate per categoria e priorità." },
  { icon: FileText, titolo: "Offerte", testo: "Generazione e versioning dei documenti commerciali." },
  { icon: Users, titolo: "CRM", testo: "Pipeline delle opportunità, dal primo contatto alla chiusura." },
  { icon: CheckSquare, titolo: "Approvazioni", testo: "Workflow con supervisione umana su ogni azione." },
  { icon: LayoutDashboard, titolo: "Dashboard", testo: "KPI operativi e attività recenti in un colpo d'occhio." },
];

const piani = [
  {
    id: "base" as const,
    nome: "Base",
    prezzo: "29",
    periodo: "/mese",
    descrizione: "Per professionisti e piccoli team che iniziano ad automatizzare.",
    voci: [
      "1 casella Gmail collegata",
      "Analisi AI delle email",
      "50 offerte generate al mese",
      "CRM e approvazioni",
      "Dashboard direzionale",
    ],
    evidenza: false,
  },
  {
    id: "pro" as const,
    nome: "Professionale",
    prezzo: "79",
    periodo: "/mese",
    descrizione: "Per aziende che vogliono l'automazione su tutto il flusso commerciale.",
    voci: [
      "Caselle email illimitate",
      "Offerte e risposte AI illimitate",
      "Assistente AI in streaming",
      "Invio email dal CRM",
      "Supporto prioritario",
    ],
    evidenza: true,
  },
  {
    id: "enterprise" as const,
    nome: "Enterprise",
    prezzo: "Su misura",
    periodo: "",
    descrizione: "Per organizzazioni con esigenze di integrazione e volumi elevati.",
    voci: [
      "Onboarding dedicato",
      "Integrazioni personalizzate",
      "SLA e ambienti dedicati",
      "Controlli di sicurezza avanzati",
      "Fatturazione centralizzata",
    ],
    evidenza: false,
  },
];

const vantaggi = [
  { icon: Zap, titolo: "Automazione concreta", testo: "Riduci il lavoro manuale ripetitivo su email, offerte e attività." },
  { icon: ShieldCheck, titolo: "Sicuro per impostazione", testo: "Sessioni protette, CSRF e provider AI sempre lato server." },
  { icon: Clock, titolo: "Tempo risparmiato", testo: "Processi più rapidi mantenendo il controllo sulle decisioni." },
];

export function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [caricamento, setCaricamento] = useState<string | null>(null);

  // Scroll morbido alle ancore (es. /#prezzi dal menu).
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  // Avvia il checkout: con Stripe configurato reindirizza alla pagina di
  // pagamento; in modalità demo porta alla registrazione.
  const attivaPiano = async (piano: "base" | "pro") => {
    setCaricamento(piano);
    try {
      const esito = await apiFetch<{ url?: string; demo?: boolean }>(
        "/billing/checkout",
        { method: "POST", body: JSON.stringify({ piano }) }
      );
      if (esito.url) {
        window.location.href = esito.url;
        return;
      }
      toast(
        "Versione dimostrativa: i pagamenti non sono ancora attivi. Registrati e prova la piattaforma.",
        "info"
      );
      navigate("/login");
    } catch {
      toast("Impossibile avviare il pagamento. Riprova più tardi.", "errore");
    } finally {
      setCaricamento(null);
    }
  };

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

      {/* Prezzi */}
      <section id="prezzi" className="border-y border-border bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Piani semplici, senza sorprese
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Scegli il piano adatto al tuo team: puoi cambiare o disdire in
              qualsiasi momento.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {piani.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-6",
                  p.evidenza
                    ? "border-primary shadow-card md:-my-2 md:py-8"
                    : "border-border"
                )}
              >
                {p.evidenza && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Consigliato
                  </span>
                )}
                <h3 className="font-semibold">{p.nome}</h3>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                  {p.descrizione}
                </p>
                <p className="mt-4">
                  {p.periodo ? (
                    <>
                      <span className="text-4xl font-semibold tracking-tight">
                        €{p.prezzo}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {p.periodo}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold tracking-tight">
                      {p.prezzo}
                    </span>
                  )}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.voci.map((v) => (
                    <li key={v} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-secondary" />
                      {v}
                    </li>
                  ))}
                </ul>
                {p.id === "enterprise" ? (
                  <Link
                    to="/login"
                    className="mt-6 inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
                  >
                    Richiedi una demo
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => attivaPiano(p.id)}
                    disabled={caricamento !== null}
                    className={cn(
                      "mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
                      p.evidenza
                        ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                        : "border border-border bg-card hover:bg-surface"
                    )}
                  >
                    {caricamento === p.id && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Attiva il piano
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Prezzi IVA esclusa. Il pagamento è gestito in modo sicuro da Stripe.
          </p>
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
