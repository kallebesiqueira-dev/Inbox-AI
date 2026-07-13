import {
  Clock,
  Mail,
  FileText,
  TrendingUp,
  Banknote,
  ArrowUpRight,
  CalendarDays,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  {
    chiave: "emailElaborate",
    label: "Email elaborate",
    icon: Mail,
    colore: COLORE_PRIMARIO,
  },
  {
    chiave: "offerteGenerate",
    label: "Offerte generate",
    icon: FileText,
    colore: COLORE_SECONDARIO,
  },
  {
    chiave: "opportunitaAperte",
    label: "Opportunità aperte",
    icon: TrendingUp,
    colore: "hsl(187 32% 48%)",
  },
  {
    chiave: "valorePipeline",
    label: "Valore pipeline",
    icon: Banknote,
    colore: COLORE_ACCENTO,
  },
  {
    chiave: "oreRisparmiate",
    label: "Tempo risparmiato",
    icon: Clock,
    colore: COLORE_PRIMARIO,
  },
] as const;

function formato(chiave: string, valore: number) {
  if (chiave === "oreRisparmiate") return `${valore.toLocaleString("it-IT")} h`;
  if (chiave === "valorePipeline") return euroCompatto(valore);
  return valore.toLocaleString("it-IT");
}

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica operativa in tempo reale"
        action={
          data?.anno ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-soft">
              <CalendarDays className="size-4 text-primary" />
              Anno {data.anno}
            </span>
          ) : undefined
        }
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError ||
        !data?.metriche?.valorePipeline ||
        !data?.andamento ||
        !data?.pipeline ||
        !data?.offertePerStato ||
        !data?.attivita ? (
        // Difensivo: se la risposta non ha la forma attesa (es. backend non
        // ancora aggiornato) si mostra l'errore invece di far crashare l'app.
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm">Impossibile caricare i dati della dashboard.</p>
        </div>
      ) : (
        <Contenuto data={data} />
      )}
    </div>
  );
}

function Contenuto({ data }: { data: DashboardData }) {
  return (
    <>
      {/* Riga KPI: barra colorata + icona + valore, come nei report direzionali. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {META.map(({ chiave, label, icon: Icon, colore }) => {
          const m = data.metriche[chiave];
          return (
            <Card key={chiave}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ background: colore }}
                    />
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: `color-mix(in srgb, ${colore} 12%, transparent)`,
                        color: colore,
                      }}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                  </div>
                  <Badge variant={m.delta >= 0 ? "success" : "warning"}>
                    {m.delta.toLocaleString("it-IT", { signDisplay: "always" })}%
                  </Badge>
                </div>
                <p className="mt-3 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {formato(chiave, m.valore)}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                  {label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Riga grafici: andamento mensile, donut pipeline, quote per stato. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
        <Card className="lg:col-span-2 xl:col-span-1">
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

      {/* Riga finale: cascata del valore pipeline + attività recenti. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              Valore pipeline per fase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoCascata dati={data.pipeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              Attività recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.attivita.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="text-sm leading-snug">{a.testo}</p>
                  <p className="text-xs text-muted-foreground">{a.tempo}</p>
                </div>
              </div>
            ))}
            <Link
              to="/app/inbox"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Vedi tutte <ArrowUpRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
