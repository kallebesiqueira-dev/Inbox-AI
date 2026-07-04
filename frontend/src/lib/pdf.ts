import type { Offerta } from "@/hooks/useOfferte";

const euro = (n: number) =>
  `${n.toLocaleString("it-IT", { minimumFractionDigits: 2 })} EUR`;

/** Genera e scarica un PDF dell'offerta. */
export async function generaPdfOfferta(o: Offerta) {
  // Import dinamico: jsPDF (~150KB gzip) si scarica solo al primo PDF,
  // non pesa sul caricamento della pagina Offerte.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const left = 20;
  let y = 24;

  doc.setFontSize(20);
  doc.text("Inbox AI", left, y);
  doc.setFontSize(13);
  doc.setTextColor(110);
  doc.text(`Offerta commerciale #${o.numero}`, left, (y += 9));
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.text(`Cliente: ${o.cliente}`, left, (y += 12));
  doc.text(`Stato: ${o.stato}`, left, (y += 7));
  doc.text(`Data: ${new Date(o.data).toLocaleDateString("it-IT")}`, left, (y += 7));

  if (o.corpo) {
    y += 10;
    const righe = doc.splitTextToSize(o.corpo, 170) as string[];
    doc.text(righe, left, y);
    y += righe.length * 6;
  }

  if (o.voci?.length) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Descrizione", left, y);
    doc.text("Importo", 150, y);
    doc.setFont("helvetica", "normal");
    y += 3;
    doc.line(left, y, 190, y);
    y += 7;
    for (const v of o.voci) {
      doc.text(v.descrizione, left, y);
      doc.text(euro(v.importo), 150, y);
      y += 7;
    }
    doc.line(left, y - 3, 190, y - 3);
    doc.setFont("helvetica", "bold");
    doc.text("Totale", left, y + 2);
    doc.text(euro(o.importo), 150, y + 2);
  } else {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Totale: ${euro(o.importo)}`, left, y);
  }

  doc.save(`offerta-${o.numero}.pdf`);
}
