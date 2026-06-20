import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Impostazioni() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Impostazioni"
        description="Gestione dell'organizzazione e delle automazioni"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizzazione</CardTitle>
            <CardDescription>
              Dati aziendali utilizzati nei documenti generati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome azienda</label>
              <input
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="La tua azienda"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email aziendale</label>
              <input
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="info@azienda.it"
              />
            </div>
            <Button>Salva modifiche</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automazione email</CardTitle>
            <CardDescription>
              Autorizza Inbox AI ad analizzare le tue email per automatizzare
              offerte, richieste e attività operative.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Lettura email",
              "Analisi email",
              "Classificazione email",
              "Elaborazione automatica dei messaggi",
            ].map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"
              >
                <input type="checkbox" defaultChecked className="size-4 accent-[#0F4C5C]" />
                {perm}
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
