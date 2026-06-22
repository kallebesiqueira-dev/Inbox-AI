import {
  Clock,
  Mail,
  FileText,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const kpi = [
  { label: "Email elaborate", value: "1.284", delta: "+12%", icon: Mail },
  { label: "Offerte generate", value: "86", delta: "+8%", icon: FileText },
  { label: "Opportunità aperte", value: "37", delta: "+5%", icon: TrendingUp },
  { label: "Tempo risparmiato", value: "142 h", delta: "+18%", icon: Clock },
];

const attivita = [
  { testo: "Nuova email classificata come Commerciale", tempo: "2 min fa" },
  { testo: "Offerta #2025-086 generata automaticamente", tempo: "18 min fa" },
  { testo: "Opportunità spostata in Negoziazione", tempo: "1 ora fa" },
  { testo: "Approvazione richiesta per invio offerta", tempo: "3 ore fa" },
];

export function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Panoramica operativa in tempo reale"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map(({ label, value, delta, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <Badge variant="success">{delta}</Badge>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ore risparmiate al mese</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3">
              {[40, 55, 48, 70, 65, 82, 90, 78, 95, 110, 120, 142].map(
                (h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${(h / 142) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {
                        ["G","F","M","A","M","G","L","A","S","O","N","D"][i]
                      }
                    </span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attività recenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attivita.map((a, i) => (
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
    </div>
  );
}
