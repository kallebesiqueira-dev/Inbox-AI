import { Trash2, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  useCestino,
  useRipristina,
  useEliminaDefinitivo,
  type Risorsa,
} from "@/hooks/useCestino";

export function Cestino() {
  const { voci, isLoading, isError } = useCestino();
  const ripristina = useRipristina();
  const eliminaDef = useEliminaDefinitivo();

  function onRipristina(risorsa: Risorsa, id: string) {
    ripristina.mutate(
      { risorsa, id },
      {
        onSuccess: () => toast("Elemento ripristinato."),
        onError: () => toast("Impossibile ripristinare.", "errore"),
      }
    );
  }

  function onElimina(risorsa: Risorsa, id: string) {
    eliminaDef.mutate(
      { risorsa, id },
      {
        onSuccess: () => toast("Eliminato definitivamente."),
        onError: () => toast("Impossibile eliminare.", "errore"),
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="Cestino"
        description="Elementi eliminati. Ripristinali o eliminali definitivamente."
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Caricamento...
        </div>
      ) : isError ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="size-6 text-destructive" />
          <p className="text-sm">Impossibile caricare il cestino.</p>
        </div>
      ) : voci.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Trash2 className="size-8" />
          <p className="text-sm">Il cestino è vuoto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {voci.map((v) => (
            <Card key={`${v.risorsa}-${v.id}`}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.etichetta}</p>
                  <p className="text-xs text-muted-foreground">{v.tipo}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ripristina.isPending}
                    onClick={() => onRipristina(v.risorsa, v.id)}
                  >
                    <RotateCcw className="size-4" /> Ripristina
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Elimina definitivamente"
                    disabled={eliminaDef.isPending}
                    onClick={() => onElimina(v.risorsa, v.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
