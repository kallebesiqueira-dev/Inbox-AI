import {
  Clock,
  Mail,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard, type DashboardData } from "@/hooks/useDashboard";

const META = [
  { chiave: "emailElaborate", label: "Email elaborate", icon: Mail },
  { chiave: "offerteGenerate", label: "Offerte generate", icon: FileText },
  { chiave: "opportunitaAperte", label: "Opportunità aperte", icon: TrendingUp },
  { chiave: "oreRisparmiate", label: "Tempo risparmiato", icon: Clock },
] as const;

function formato(chiave: string, valore: number) {
  if (chiave === "oreRisparmiate") return `${valore} h`;
  return valore.toLocaleString("it-IT");
}

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica operativa in tempo reale"
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError || !data?.metriche || !data?.oreMensili ? (
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
  const maxOre = Math.max(...data.oreMensili.map((o) => o.valore), 1);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {META.map(({ chiave, label, icon: Icon }) => {
          const m = data.metriche[chiave];
          return (
            <Card key={chiave}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:size-10">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="success">+{m.delta}%</Badge>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-3xl">
                  {formato(chiave, m.valore)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ore risparmiate al mese</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barre in una riga ad altezza fissa: la percentuale di altezza si
                risolve correttamente contro h-56. Le etichette sono in una riga
                separata, allineate per colonna con lo stesso flex-1/gap. */}
            <div className="flex h-56 items-end gap-3">
              {data.oreMensili.map(({ mese, valore }) => (
                <div
                  key={mese}
                  className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${(valore / maxOre) * 100}%` }}
                  title={`${mese}: ${valore} h`}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-3">
              {data.oreMensili.map(({ mese }) => (
                <span
                  key={mese}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {mese.charAt(0)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attività recenti</CardTitle>
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
