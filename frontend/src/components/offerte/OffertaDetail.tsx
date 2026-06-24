import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEuro, formatData } from "@/lib/utils";
import { generaPdfOfferta } from "@/lib/pdf";
import type { Offerta } from "@/hooks/useOfferte";

export function OffertaDetail({
  offerta,
  onClose,
}: {
  offerta: Offerta;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="font-semibold">Offerta #{offerta.numero}</p>
            <p className="text-sm text-muted-foreground">
              {offerta.cliente} · {formatData(offerta.data)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{offerta.stato}</Badge>
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {offerta.corpo ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {offerta.corpo}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Offerta senza contenuto generato. Importo: {formatEuro(offerta.importo)}.
            </p>
          )}

          {offerta.voci?.length > 0 && (
            <table className="w-full text-sm">
              <tbody>
                {offerta.voci.map((v, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-1.5">{v.descrizione}</td>
                    <td className="py-1.5 text-right">{formatEuro(v.importo)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5">Totale</td>
                  <td className="py-1.5 text-right text-primary">
                    {formatEuro(offerta.importo)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => generaPdfOfferta(offerta)}>
            <Download className="size-4" /> Scarica PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
