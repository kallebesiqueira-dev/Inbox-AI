import { useState } from "react";
import { Plus, Trash2, Loader2, Sparkles, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditableText } from "@/components/EditableText";
import { GeneraOffertaAI } from "@/components/offerte/GeneraOffertaAI";
import { OffertaDetail } from "@/components/offerte/OffertaDetail";
import type { Offerta } from "@/hooks/useOfferte";
import { toast } from "@/components/ui/toast";
import { formatEuro, formatData } from "@/lib/utils";
import {
  useOfferte,
  useCreaOfferta,
  useAggiornaOfferta,
  useEliminaOfferta,
  STATI_OFFERTA,
  type StatoOfferta,
} from "@/hooks/useOfferte";

const statoVariant: Record<StatoOfferta, "default" | "secondary" | "success" | "warning"> = {
  Bozza: "secondary",
  "In revisione": "warning",
  Approvata: "success",
  Inviata: "default",
};

export function Offerte() {
  const { data, isLoading, isError, error } = useOfferte();
  const crea = useCreaOfferta();
  const aggiorna = useAggiornaOfferta();
  const elimina = useEliminaOfferta();

  const [form, setForm] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [dettaglio, setDettaglio] = useState<Offerta | null>(null);
  const [cliente, setCliente] = useState("");
  const [importo, setImporto] = useState("");

  function inviaForm(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim()) return;
    crea.mutate(
      { cliente: cliente.trim(), importo: Number(importo) || 0 },
      {
        onSuccess: () => {
          setCliente("");
          setImporto("");
          setForm(false);
        },
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="Offerte"
        description="Generazione automatica, modifica e versioning dei documenti"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <Sparkles className="size-4" /> Genera con AI
            </Button>
            <Button onClick={() => setForm((v) => !v)}>
              <Plus className="size-4" /> Nuova offerta
            </Button>
          </div>
        }
      />

      {aiOpen && <GeneraOffertaAI onClose={() => setAiOpen(false)} />}
      {dettaglio && (
        <OffertaDetail offerta={dettaglio} onClose={() => setDettaglio(null)} />
      )}

      {form && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form
              onSubmit={inviaForm}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
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
                <label htmlFor="importo" className="mb-1 block text-sm font-medium">
                  Importo (€)
                </label>
                <input
                  id="importo"
                  type="number"
                  min="0"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
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

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Caricamento offerte...
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-destructive">
              {error instanceof Error ? error.message : "Errore di caricamento."}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              Nessuna offerta presente. Crea la prima con “Nuova offerta”.
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Numero</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Importo</th>
                  <th className="p-4 font-medium">Stato</th>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-surface"
                  >
                    <td className="p-4 font-medium">#{o.numero}</td>
                    <td className="p-4">
                      <EditableText
                        valore={o.cliente}
                        ariaLabel={`Modifica cliente offerta ${o.numero}`}
                        onSalva={(v) =>
                          aggiorna.mutate({ id: o.id, patch: { cliente: v } })
                        }
                      />
                    </td>
                    <td className="p-4">
                      <EditableText
                        valore={o.importo}
                        display={formatEuro(o.importo)}
                        tipo="number"
                        ariaLabel={`Modifica importo offerta ${o.numero}`}
                        onSalva={(v) =>
                          aggiorna.mutate({
                            id: o.id,
                            patch: { importo: Number(v) || 0 },
                          })
                        }
                      />
                    </td>
                    <td className="p-4">
                      <select
                        value={o.stato}
                        onChange={(e) =>
                          aggiorna.mutate({
                            id: o.id,
                            patch: { stato: e.target.value as StatoOfferta },
                          })
                        }
                        className="cursor-pointer rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Stato offerta ${o.numero}`}
                      >
                        {STATI_OFFERTA.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Badge variant={statoVariant[o.stato]} className="ml-2 hidden lg:inline-flex">
                        {o.stato}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{formatData(o.data)}</td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Dettaglio offerta ${o.numero}`}
                        onClick={() => setDettaglio(o)}
                      >
                        <FileText className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Elimina offerta ${o.numero}`}
                        disabled={elimina.isPending}
                        onClick={() =>
                          elimina.mutate(o.id, {
                            onSuccess: () => toast("Spostato nel cestino."),
                          })
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
