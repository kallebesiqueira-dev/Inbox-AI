import { useState } from "react";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailDetail } from "@/components/inbox/EmailDetail";
import { ConnettiGmail } from "@/components/gmail/ConnettiGmail";
import { useInbox, type CategoriaEmail, type EmailInbox } from "@/hooks/useInbox";
import { useStatoGmail } from "@/hooks/useGmail";

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
  const { data: gmail } = useStatoGmail();
  const [selezionata, setSelezionata] = useState<EmailInbox | null>(null);

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={
          gmail?.connesso
            ? `Email reali da ${gmail.email}. Apri un'email per analizzarla con l'AI.`
            : "Apri un'email per analizzarla con l'AI, generare un'offerta o creare un'opportunità"
        }
        action={<ConnettiGmail compatto />}
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
      ) : email.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <Sparkles className="size-7 text-secondary" />
          <p className="max-w-sm text-sm">
            {gmail?.connesso
              ? "Nessuna email recente nella tua casella."
              : "Collega Gmail per vedere e analizzare le tue email reali con l'AI."}
          </p>
          {!gmail?.connesso && <ConnettiGmail />}
        </div>
      ) : (
        <div className="space-y-2">
          {email.map((e) => (
            <Card
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelezionata(e)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  setSelezionata(e);
                }
              }}
              className="group cursor-pointer transition-shadow hover:shadow-card"
            >
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
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3 opacity-0 transition-opacity group-hover:opacity-70" />
                    {e.tempo} fa
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selezionata && (
        <EmailDetail email={selezionata} onClose={() => setSelezionata(null)} />
      )}
    </div>
  );
}
