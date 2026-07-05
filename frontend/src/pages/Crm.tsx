import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { EditableText } from "@/components/EditableText";
import { toast } from "@/components/ui/toast";
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
        // Kanban: sotto xl le colonne scorrono in orizzontale (snap), da xl in
        // su griglia a 5 colonne. Ogni colonna è un contenitore con sfondo,
        // contatore e totale nel piede: le colonne vuote restano intenzionali.
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:gap-4 xl:overflow-visible xl:px-0">
          {FASI_CRM.map((fase) => {
            const colonna = (data ?? []).filter((o) => o.fase === fase);
            const totale = colonna.reduce((s, o) => s + o.valore, 0);
            return (
              <div
                key={fase}
                className="flex w-[17rem] shrink-0 snap-start flex-col rounded-xl bg-surface/60 p-2 xl:w-auto"
              >
                <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                  <h2 className="text-sm font-semibold">{fase}</h2>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-soft">
                    {colonna.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {colonna.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      Nessuna opportunità
                    </div>
                  ) : (
                    colonna.map((o) => (
                      <Card key={o.id} className="transition-shadow hover:shadow-card">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={o.avatar}
                              nome={o.cliente}
                              className="size-8 text-xs"
                              onUpload={(dataUrl) =>
                                aggiorna.mutate({ id: o.id, avatar: dataUrl })
                              }
                            />
                            <EditableText
                              valore={o.cliente}
                              troncato
                              ariaLabel="Modifica cliente"
                              className="min-w-0 flex-1 text-sm font-medium"
                              onSalva={(v) => aggiorna.mutate({ id: o.id, cliente: v })}
                            />
                            <button
                              onClick={() =>
                                elimina.mutate(o.id, {
                                  onSuccess: () => toast("Spostato nel cestino."),
                                })
                              }
                              aria-label={`Elimina ${o.cliente}`}
                              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <EditableText
                            valore={o.valore}
                            display={formatEuro(o.valore)}
                            tipo="number"
                            ariaLabel="Modifica valore"
                            className="mt-2.5 text-sm font-semibold text-primary"
                            onSalva={(v) =>
                              aggiorna.mutate({ id: o.id, valore: Number(v) || 0 })
                            }
                          />
                          <select
                            value={o.fase}
                            onChange={(e) =>
                              aggiorna.mutate({ id: o.id, fase: e.target.value as FaseCrm })
                            }
                            aria-label={`Fase di ${o.cliente}`}
                            className="mt-2.5 h-8 w-full cursor-pointer rounded-md border border-input bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {FASI_CRM.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/70 px-1.5 pt-2 text-xs">
                  <span className="text-muted-foreground">Totale</span>
                  <span className="font-semibold text-foreground">
                    {formatEuro(totale)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
