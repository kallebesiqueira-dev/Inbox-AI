import { Check, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  useApprovazioni,
  useAggiornaApprovazione,
  useEliminaApprovazione,
  FASI_APPROVAZIONE,
  type FaseApprovazione,
} from "@/hooks/useApprovazioni";

function faseSuccessiva(fase: FaseApprovazione): FaseApprovazione | null {
  const i = FASI_APPROVAZIONE.indexOf(fase);
  return i >= 0 && i < FASI_APPROVAZIONE.length - 1
    ? FASI_APPROVAZIONE[i + 1]
    : null;
}

export function Approvazioni() {
  const { data, isLoading, isError, error } = useApprovazioni();
  const aggiorna = useAggiornaApprovazione();
  const elimina = useEliminaApprovazione();

  return (
    <div>
      <PageHeader
        title="Approvazioni"
        description="Workflow approvativi con supervisione umana"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {FASI_APPROVAZIONE.map((f, i) => (
          <div key={f} className="flex items-center gap-2">
            <span className="rounded-full bg-surface px-3 py-1 font-medium text-foreground">
              {f}
            </span>
            {i < FASI_APPROVAZIONE.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Caricamento approvazioni...
        </div>
      ) : isError ? (
        <div className="p-10 text-center text-destructive">
          {error instanceof Error ? error.message : "Errore di caricamento."}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">
          Nessuna approvazione in sospeso.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const prossima = faseSuccessiva(r.fase);
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">{r.tipo}</Badge>
                      <Badge variant="warning">{r.fase}</Badge>
                    </div>
                    <p className="mt-2 font-medium">{r.oggetto}</p>
                    <p className="text-xs text-muted-foreground">
                      Richiesto da: {r.richiedente}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={elimina.isPending}
                      onClick={() =>
                        elimina.mutate(r.id, {
                          onSuccess: () => toast("Spostato nel cestino."),
                        })
                      }
                    >
                      <X className="size-4" /> Rifiuta
                    </Button>
                    <Button
                      size="sm"
                      disabled={!prossima || aggiorna.isPending}
                      onClick={() =>
                        prossima && aggiorna.mutate({ id: r.id, fase: prossima })
                      }
                    >
                      <Check className="size-4" />
                      {prossima ? "Approva" : "Completata"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
