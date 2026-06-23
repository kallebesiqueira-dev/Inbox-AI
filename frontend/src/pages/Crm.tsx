import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { formatEuro } from "@/lib/utils";
import {
  useOpportunita,
  useCreaOpportunita,
  useAggiornaOpportunita,
  useEliminaOpportunita,
  FASI_CRM,
  type FaseCrm,
} from "@/hooks/useOpportunita";

export function Crm() {
  const { data, isLoading, isError, error } = useOpportunita();
  const crea = useCreaOpportunita();
  const aggiorna = useAggiornaOpportunita();
  const elimina = useEliminaOpportunita();

  const [form, setForm] = useState(false);
  const [cliente, setCliente] = useState("");
  const [valore, setValore] = useState("");

  function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim()) return;
    crea.mutate(
      { cliente: cliente.trim(), valore: Number(valore) || 0 },
      {
        onSuccess: () => {
          setCliente("");
          setValore("");
          setForm(false);
        },
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="CRM"
        description="Pipeline commerciale e gestione delle opportunità"
        action={
          <Button onClick={() => setForm((v) => !v)}>
            <Plus className="size-4" /> Nuova opportunità
          </Button>
        }
      />

      {form && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={invia} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="cliente" className="mb-1 block text-sm font-medium">
                  Cliente
                </label>
                <input
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome del cliente"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="sm:w-40">
                <label htmlFor="valore" className="mb-1 block text-sm font-medium">
                  Valore (€)
                </label>
                <input
                  id="valore"
                  type="number"
                  min="0"
                  value={valore}
                  onChange={(e) => setValore(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" disabled={crea.isPending}>
                {crea.isPending && <Loader2 className="size-4 animate-spin" />}
                Salva
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Caricamento pipeline...
        </div>
      ) : isError ? (
        <div className="p-10 text-center text-destructive">
          {error instanceof Error ? error.message : "Errore di caricamento."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {FASI_CRM.map((fase) => {
            const colonna = (data ?? []).filter((o) => o.fase === fase);
            const totale = colonna.reduce((s, o) => s + o.valore, 0);
            return (
              <div key={fase} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{fase}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                    {colonna.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {colonna.map((o) => (
                    <Card key={o.id} className="transition-shadow hover:shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              src={o.avatar}
                              nome={o.cliente}
                              className="size-9"
                              onUpload={(dataUrl) =>
                                aggiorna.mutate({ id: o.id, avatar: dataUrl })
                              }
                            />
                            <p className="min-w-0 truncate font-medium">{o.cliente}</p>
                          </div>
                          <button
                            onClick={() => elimina.mutate(o.id)}
                            aria-label={`Elimina ${o.cliente}`}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-primary">{formatEuro(o.valore)}</p>
                        <select
                          value={o.fase}
                          onChange={(e) =>
                            aggiorna.mutate({ id: o.id, fase: e.target.value as FaseCrm })
                          }
                          aria-label={`Fase di ${o.cliente}`}
                          className="mt-2 w-full cursor-pointer rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {FASI_CRM.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  Totale: {formatEuro(totale)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
