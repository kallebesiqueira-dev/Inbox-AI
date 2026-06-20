import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Categoria = "Commerciale" | "Offerta" | "Supporto" | "Amministrazione" | "Altro";

const categorie: Record<Categoria, "default" | "secondary" | "accent" | "warning" | "outline"> = {
  Commerciale: "default",
  Offerta: "accent",
  Supporto: "secondary",
  Amministrazione: "warning",
  Altro: "outline",
};

const email: {
  mittente: string;
  oggetto: string;
  categoria: Categoria;
  priorita: "Alta" | "Media" | "Bassa";
  tempo: string;
}[] = [
  { mittente: "Rossi S.p.A.", oggetto: "Richiesta preventivo fornitura", categoria: "Commerciale", priorita: "Alta", tempo: "5 min" },
  { mittente: "Bianchi SRL", oggetto: "Conferma ordine #4821", categoria: "Amministrazione", priorita: "Media", tempo: "32 min" },
  { mittente: "Verdi & Co", oggetto: "Problema accesso piattaforma", categoria: "Supporto", priorita: "Alta", tempo: "1 ora" },
  { mittente: "Studio Ferrari", oggetto: "Revisione offerta commerciale", categoria: "Offerta", priorita: "Media", tempo: "2 ore" },
  { mittente: "Newsletter", oggetto: "Aggiornamenti di settore", categoria: "Altro", priorita: "Bassa", tempo: "4 ore" },
];

export function InboxPage() {
  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Email ricevute, analizzate e classificate automaticamente"
      />

      <div className="space-y-2">
        {email.map((e, i) => (
          <Card key={i} className="transition-shadow hover:shadow-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary">
                {e.mittente.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{e.mittente}</p>
                  <Badge variant={categorie[e.categoria]}>{e.categoria}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {e.oggetto}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={
                    e.priorita === "Alta"
                      ? "text-xs font-medium text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  Priorità {e.priorita}
                </span>
                <span className="text-xs text-muted-foreground">{e.tempo} fa</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
