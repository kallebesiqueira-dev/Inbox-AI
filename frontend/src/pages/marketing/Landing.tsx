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

const moduli = [
  { icon: Sparkles, titolo: "Assistente AI", testo: "Chat conversazionale in tempo reale per gestire il lavoro quotidiano." },
  { icon: Inbox, titolo: "Inbox intelligente", testo: "Email analizzate e classificate per categoria e priorità." },
  { icon: FileText, titolo: "Offerte", testo: "Generazione e versioning dei documenti commerciali." },
  { icon: Users, titolo: "CRM", testo: "Pipeline delle opportunità, dal primo contatto alla chiusura." },
  { icon: CheckSquare, titolo: "Approvazioni", testo: "Workflow con supervisione umana su ogni azione." },
  { icon: LayoutDashboard, titolo: "Dashboard", testo: "KPI operativi e attività recenti in un colpo d'occhio." },
];

// Un unico piano, tutto incluso: nessuna scelta da fare, nessuna funzione bloccata.
const incluso = [
  "Casella Gmail collegata con analisi AI delle email",
  "Offerte e risposte generate dall'AI, senza limiti",
  "Assistente AI in streaming, sempre disponibile",
  "CRM con pipeline e invio email integrato",
  "Approvazioni con supervisione umana",
  "Dashboard direzionale con KPI reali",
  "Cestino con ripristino ed esportazione PDF",
];

const vantaggi = [
  { icon: Zap, titolo: "Automazione concreta", testo: "Riduci il lavoro manuale ripetitivo su email, offerte e attività." },
  { icon: ShieldCheck, titolo: "Sicuro per impostazione", testo: "Sessioni protette, CSRF e provider AI sempre lato server." },
  { icon: Clock, titolo: "Tempo risparmiato", testo: "Processi più rapidi mantenendo il controllo sulle decisioni." },
];

export function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [caricamento, setCaricamento] = useState(false);

  // Scroll morbido alle ancore (es. /#prezzi dal menu).
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  // Avvia il checkout: con Stripe configurato reindirizza alla pagina di
  // pagamento (con 14 giorni di prova); in modalità demo porta alla registrazione.
  const attivaAbbonamento = async () => {
    setCaricamento(true);
    try {
      const esito = await apiFetch<{ url?: string; demo?: boolean }>(
        "/billing/checkout",
        { method: "POST", body: JSON.stringify({ piano: "unico" }) }
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
      setCaricamento(false);
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
              Un prezzo unico, tutto incluso
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Nessun piano da confrontare, nessuna funzione bloccata: ogni
              modulo di Inbox AI è compreso, a una frazione del costo degli
              strumenti che sostituisce.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-primary bg-card shadow-card md:grid-cols-5">
            {/* Cosa è incluso */}
            <div className="p-8 md:col-span-3">
              <h3 className="font-semibold">Tutto Inbox AI, senza limiti</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Un solo abbonamento sostituisce assistente email, generatore di
                offerte e CRM — strumenti che, separati, superano in media i
                €25 al mese.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-1">
                {incluso.map((v) => (
                  <li key={v} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-secondary" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
            {/* Prezzo e prova gratuita */}
            <div className="flex flex-col justify-center gap-4 border-t border-border bg-primary p-8 text-primary-foreground md:col-span-2 md:border-l md:border-t-0">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
                <Clock className="size-3.5" />
                14 giorni di prova gratuita
              </span>
              <p>
                <span className="text-5xl font-semibold tracking-tight">€7</span>
                <span className="text-sm text-primary-foreground/80">
                  {" "}/mese per utente
                </span>
              </p>
              <ul className="space-y-2 text-sm text-primary-foreground/90">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  Soddisfatti o rimborsati: rimborso completo, senza domande
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  Nessun vincolo: disdici in qualsiasi momento
                </li>
              </ul>
              <button
                type="button"
                onClick={attivaAbbonamento}
                disabled={caricamento}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-background px-5 py-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-surface disabled:opacity-60"
              >
                {caricamento && <Loader2 className="size-4 animate-spin" />}
                Inizia la prova gratuita
              </button>
            </div>
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
