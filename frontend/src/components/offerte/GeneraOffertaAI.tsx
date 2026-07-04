import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatEuro } from "@/lib/utils";
import { useGeneraOfferta, type OffertaGenerata } from "@/hooks/useAI";
import { useCreaOfferta } from "@/hooks/useOfferte";
import { useModale } from "@/hooks/useModale";

export function GeneraOffertaAI({ onClose }: { onClose: () => void }) {
  useModale(onClose);
  const genera = useGeneraOfferta();
  const creaOfferta = useCreaOfferta();
  const [cliente, setCliente] = useState("");
  const [richiesta, setRichiesta] = useState("");
  const [offerta, setOfferta] = useState<OffertaGenerata | null>(null);

  const totale = offerta?.voci.reduce((s, v) => s + v.importo, 0) ?? 0;

  function onGenera() {
    if (!cliente.trim() || !richiesta.trim() || genera.isPending) return;
    genera.mutate(
      { cliente: cliente.trim(), richiesta: richiesta.trim() },
      { onSuccess: (o) => setOfferta(o) }
    );
  }

  function onCrea() {
    creaOfferta.mutate(
      {
        cliente: cliente.trim(),
        importo: totale,
        corpo: offerta?.corpo,
        voci: offerta?.voci,
      },
      {
        onSuccess: () => {
          toast(`Offerta creata per ${cliente.trim()}.`);
          onClose();
        },
      }
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Genera offerta con AI"
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-br from-primary to-secondary px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <span className="font-semibold">Genera offerta con AI</span>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="rounded-md p-1 hover:bg-white/15">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-2">
            <label htmlFor="offerta-ai-cliente" className="text-sm font-medium">
              Cliente
            </label>
            <input
              id="offerta-ai-cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nome del cliente"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="offerta-ai-richiesta" className="text-sm font-medium">
              Richiesta
            </label>
            <textarea
              id="offerta-ai-richiesta"
              value={richiesta}
              onChange={(e) => setRichiesta(e.target.value)}
              rows={3}
              placeholder="Descrivi cosa serve al cliente (es. fornitura di 200 unità con consegna entro 30 giorni)"
              className="resize-none rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onGenera}
            disabled={!cliente.trim() || !richiesta.trim() || genera.isPending}
          >
            {genera.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Genera
          </Button>

          {offerta && (
            <div className="rounded-xl border border-border p-4">
              <p className="font-semibold">{offerta.titolo}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {offerta.corpo}
              </p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {offerta.voci.map((v, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5">{v.descrizione}</td>
                      <td className="py-1.5 text-right">{formatEuro(v.importo)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-1.5">Totale</td>
                    <td className="py-1.5 text-right text-primary">{formatEuro(totale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {offerta && (
          <div className="border-t border-border p-4">
            <Button className="w-full" onClick={onCrea} disabled={creaOfferta.isPending}>
              {creaOfferta.isPending && <Loader2 className="size-4 animate-spin" />}
              Crea offerta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
