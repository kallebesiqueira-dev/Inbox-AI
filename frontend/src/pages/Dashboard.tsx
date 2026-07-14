import { useState } from "react";
import {
  Clock,
  Mail,
  FileText,
  TrendingUp,
  Banknote,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard, type DashboardData } from "@/hooks/useDashboard";
import { GraficoAndamento } from "@/components/dashboard/GraficoAndamento";
import { GraficoDonut } from "@/components/dashboard/GraficoDonut";
import { BarrePercentuali } from "@/components/dashboard/BarrePercentuali";
import { GraficoCascata } from "@/components/dashboard/GraficoCascata";
import {
  COLORE_PRIMARIO,
  COLORE_SECONDARIO,
  COLORE_ACCENTO,
  euroCompatto,
} from "@/components/dashboard/formato";

const META = [
  { chiave: "emailElaborate", label: "Email elaborate", icon: Mail },
  { chiave: "offerteGenerate", label: "Offerte generate", icon: FileText },
  { chiave: "opportunitaAperte", label: "Opportunità aperte", icon: TrendingUp },
  { chiave: "valorePipeline", label: "Valore pipeline", icon: Banknote },
  { chiave: "oreRisparmiate", label: "Tempo risparmiato", icon: Clock },
] as const;

function formato(chiave: string, valore: number) {
  if (chiave === "oreRisparmiate") return `${valore.toLocaleString("it-IT")} h`;
  if (chiave === "valorePipeline") return euroCompatto(valore);
  return valore.toLocaleString("it-IT");
}

export function Dashboard() {
  const [anno, setAnno] = useState<number | undefined>(undefined);
  const { data, isLoading, isError } = useDashboard(anno);

  const valida =
    !!data?.metriche?.valorePipeline &&
    !!data?.andamento &&
    !!data?.pipeline &&
    !!data?.offertePerStato &&
    !!data?.valoriMensili &&
    !!data?.attivita;

  return (
    <div>
      {/* Intestazione in stile report: barra colorata + titolo, anni a destra. */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-1.5 shrink-0 rounded-full"
            style={{ background: COLORE_SECONDARIO }}
          />
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Dashboard{data?.anno ? ` — Anno: ${data.anno}` : ""}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Panoramica operativa
            </p>
          </div>
        </div>
        {data?.anni && data.anni.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Seleziona anno">
            {data.anni.map((a) => {
              const attivo = a === data.anno;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAnno(a)}
                  aria-pressed={attivo}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                    attivo
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {a}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError || !valida ? (
        // Difensivo: se la risposta non ha la forma attesa (es. backend non
        // ancora aggiornato) si mostra l'errore invece di far crashare l'app.
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm">Impossibile caricare i dati della dashboard.</p>
        </div>
      ) : (
        <Contenuto data={data as DashboardData} />
      )}
    </div>
  );
}

function Contenuto({ data }: { data: DashboardData }) {
  return (
    <>
      {/* Riga KPI: icona · divisore colorato · valore/etichetta. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {META.map(({ chiave, label, icon: Icon }) => {
          const m = data.metriche[chiave];
          return (
            <Card key={chiave}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-3.5 sm:p-5">
                <Icon
                  className="size-6 shrink-0 sm:size-7"
                  strokeWidth={1.6}
                  style={{ color: COLORE_PRIMARIO }}
                />
                <span
                  className="h-11 w-0.5 shrink-0 rounded-full"
                  style={{ background: COLORE_ACCENTO }}
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold tracking-tight sm:text-xl">
                    {formato(chiave, m.valore)}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "truncate text-[11px] font-medium tabular-nums sm:text-xs",
                      m.delta >= 0 ? "text-secondary" : "text-destructive"
                    )}
                  >
                    {m.delta.toLocaleString("it-IT", { signDisplay: "always" })}%
                    <span className="text-muted-foreground"> sul mese</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Riga grafici: andamento mensile, donut pipeline, quote per stato. */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              Andamento mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoAndamento dati={data.andamento} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              Pipeline per fase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoDonut dati={data.pipeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              Offerte per stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarrePercentuali dati={data.offertePerStato} />
          </CardContent>
        </Card>
      </div>

      {/* Cascata mensile a tutta larghezza, come nei report direzionali. */}
      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-semibold">
            Risultato commerciale
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORE_SECONDARIO }}
              />
              Incremento
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORE_PRIMARIO }}
              />
              Totale
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <GraficoCascata
            dati={data.valoriMensili.map((v) => ({
              etichetta: v.mese,
              valore: v.valore,
            }))}
          />
        </CardContent>
      </Card>

      {/* Attività recenti in coda, compatte. */}
      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-semibold">
            Attività recenti
          </CardTitle>
          <Link
            to="/app/inbox"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Vedi tutte <ArrowUpRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.attivita.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm leading-snug" title={a.testo}>
                    {a.testo}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.tempo}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
