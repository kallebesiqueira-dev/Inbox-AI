import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import {
  useMe,
  useAggiornaAvatar,
  useAggiornaImpostazioni,
  type Impostazioni as ImpType,
} from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

const AUTOMAZIONI: { chiave: keyof ImpType["automazioni"]; label: string }[] = [
  { chiave: "lettura", label: "Lettura email" },
  { chiave: "analisi", label: "Analisi email" },
  { chiave: "classificazione", label: "Classificazione email" },
  { chiave: "elaborazione", label: "Elaborazione automatica dei messaggi" },
];

export function Impostazioni() {
  const { data: utente } = useMe();
  const aggiornaAvatar = useAggiornaAvatar();
  const aggiornaImp = useAggiornaImpostazioni();
  const [imp, setImp] = useState<ImpType | null>(null);

  // Inizializza il form quando l'utente è disponibile.
  useEffect(() => {
    if (utente?.impostazioni && !imp) setImp(utente.impostazioni);
  }, [utente, imp]);

  function cambiaFoto(dataUrl: string) {
    aggiornaAvatar.mutate(dataUrl, {
      onSuccess: () => toast("Foto profilo aggiornata."),
      onError: () => toast("Impossibile aggiornare la foto.", "errore"),
    });
  }

  function salva() {
    if (!imp) return;
    aggiornaImp.mutate(imp, {
      onSuccess: () => toast("Impostazioni salvate."),
      onError: () => toast("Errore nel salvataggio.", "errore"),
    });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Impostazioni"
        description="Gestione del profilo, dell'organizzazione e delle automazioni"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profilo</CardTitle>
            <CardDescription>
              La tua foto è visibile nell'area di lavoro
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar
              src={utente?.avatar}
              nome={utente?.nome}
              className="size-20"
              onUpload={cambiaFoto}
              caricamento={aggiornaAvatar.isPending}
            />
            <div className="min-w-0">
              <p className="font-medium">{utente?.nome}</p>
              <p className="truncate text-sm text-muted-foreground">
                {utente?.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Clicca sulla foto per cambiarla (JPG o PNG).
              </p>
            </div>
          </CardContent>
        </Card>

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
                value={imp?.nomeAzienda ?? ""}
                onChange={(e) =>
                  setImp((p) => (p ? { ...p, nomeAzienda: e.target.value } : p))
                }
                disabled={!imp}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="La tua azienda"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email aziendale</label>
              <input
                value={imp?.emailAzienda ?? ""}
                onChange={(e) =>
                  setImp((p) => (p ? { ...p, emailAzienda: e.target.value } : p))
                }
                disabled={!imp}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="info@azienda.it"
              />
            </div>
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
            {AUTOMAZIONI.map(({ chiave, label }) => (
              <label
                key={chiave}
                className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={imp?.automazioni[chiave] ?? false}
                  onChange={(e) =>
                    setImp((p) =>
                      p
                        ? {
                            ...p,
                            automazioni: {
                              ...p.automazioni,
                              [chiave]: e.target.checked,
                            },
                          }
                        : p
                    )
                  }
                  disabled={!imp}
                  className="size-4 accent-[#0F4C5C]"
                />
                {label}
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={salva} disabled={!imp || aggiornaImp.isPending}>
            {aggiornaImp.isPending && <Loader2 className="size-4 animate-spin" />}
            Salva modifiche
          </Button>
        </div>
      </div>
    </div>
  );
}
