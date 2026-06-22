import { Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInbox, type CategoriaEmail } from "@/hooks/useInbox";

const categorie: Record<
  CategoriaEmail,
  "default" | "secondary" | "accent" | "warning" | "outline"
> = {
  Commerciale: "default",
  Offerta: "accent",
  Supporto: "secondary",
  Amministrazione: "warning",
  Altro: "outline",
};

export function InboxPage() {
  const { data: email, isLoading, isError } = useInbox();

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Email ricevute, analizzate e classificate automaticamente"
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError || !Array.isArray(email) ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm">Impossibile caricare le email.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {email.map((e) => (
            <Card key={e.id} className="transition-shadow hover:shadow-card">
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
                  <span className="text-xs text-muted-foreground">
                    {e.tempo} fa
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
