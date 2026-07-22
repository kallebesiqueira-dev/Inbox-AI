import type { Offerta } from "@/hooks/useOfferte";
import type { jsPDF } from "jspdf";

/*
 * Generazione del PDF dell'offerta commerciale.
 *
 * Layout A4 con impaginazione automatica: il corpo (potenzialmente lungo,
 * essendo generato dall'AI) e la tabella delle voci vengono spezzati su più
 * pagine quando necessario. Palette coerente con il prodotto (Deep Petroleum).
 */

const PETROLIO: [number, number, number] = [15, 76, 92]; // #0F4C5C
const SUPERFICIE: [number, number, number] = [230, 236, 234]; // #E6ECEA
const INCHIOSTRO = 40;
const GRIGIO = 115;

const PAGINA = { larghezza: 210, altezza: 297 };
const MARGINE = { sx: 20, dx: 20, alto: 20, basso: 24 };
const LARGHEZZA_UTILE = PAGINA.larghezza - MARGINE.sx - MARGINE.dx;
const COLONNA_IMPORTO = 38; // larghezza riservata agli importi in tabella
const INTERLINEA = 5.4;

const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

/** Genera e scarica un PDF dell'offerta. */
export async function generaPdfOfferta(o: Offerta) {
  // Import dinamico: jsPDF (~130KB gzip) si scarica solo al primo PDF,
  // non pesa sul caricamento della pagina Offerte.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  /** Va a pagina nuova se lo spazio residuo non basta per `altezza` mm. */
  function assicuraSpazio(altezza: number) {
    if (y + altezza > PAGINA.altezza - MARGINE.basso) {
      doc.addPage();
      y = MARGINE.alto;
    }
  }

  // ---- Intestazione (fascia colorata) ----
  doc.setFillColor(...PETROLIO);
  doc.rect(0, 0, PAGINA.larghezza, 34, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("Inbox AI", MARGINE.sx, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(214, 226, 223);
  doc.text("Automazione operativa e commerciale", MARGINE.sx, 23.5);
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text("OFFERTA COMMERCIALE", PAGINA.larghezza - MARGINE.dx, 16, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(214, 226, 223);
  doc.text(`N. ${o.numero}`, PAGINA.larghezza - MARGINE.dx, 23.5, { align: "right" });

  // ---- Riquadro dati offerta ----
  y = 42;
  doc.setFillColor(...SUPERFICIE);
  doc.roundedRect(MARGINE.sx, y, LARGHEZZA_UTILE, 20, 2, 2, "F");
  const colonne: Array<[string, string]> = [
    ["CLIENTE", o.cliente],
    ["DATA", new Date(o.data).toLocaleDateString("it-IT")],
    ["STATO", o.stato],
  ];
  colonne.forEach(([etichetta, valore], i) => {
    const x = MARGINE.sx + 6 + (i * (LARGHEZZA_UTILE - 12)) / 3;
    doc.setFontSize(7.5);
    doc.setTextColor(GRIGIO);
    doc.text(etichetta, x, y + 7.5);
    doc.setFontSize(10.5);
    doc.setTextColor(INCHIOSTRO);
    doc.setFont("helvetica", "bold");
    // Tronca i valori troppo lunghi per la colonna (es. ragioni sociali estese)
    const maxLarghezza = (LARGHEZZA_UTILE - 12) / 3 - 6;
    let testo = String(valore);
    while (doc.getTextWidth(testo) > maxLarghezza && testo.length > 1) {
      testo = testo.slice(0, -2) + "…";
    }
    doc.text(testo, x, y + 14.5);
    doc.setFont("helvetica", "normal");
  });
  y += 30;

  // ---- Corpo dell'offerta (impaginato riga per riga) ----
  if (o.corpo) {
    doc.setFontSize(10.5);
    doc.setTextColor(INCHIOSTRO);
    const righe = doc.splitTextToSize(o.corpo, LARGHEZZA_UTILE) as string[];
    for (const riga of righe) {
      assicuraSpazio(INTERLINEA);
      doc.text(riga, MARGINE.sx, y);
      y += INTERLINEA;
    }
    y += 6;
  }

  // ---- Tabella voci ----
  const xImporto = PAGINA.larghezza - MARGINE.dx;
  const larghezzaDescrizione = LARGHEZZA_UTILE - COLONNA_IMPORTO;

  function testataTabella() {
    doc.setFillColor(...PETROLIO);
    doc.rect(MARGINE.sx, y, LARGHEZZA_UTILE, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255);
    doc.text("Descrizione", MARGINE.sx + 4, y + 6);
    doc.text("Importo", xImporto - 4, y + 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 9;
  }

  if (o.voci?.length) {
    assicuraSpazio(9 + 10); // testata + almeno una riga
    testataTabella();
    doc.setFontSize(10);
    o.voci.forEach((v, i) => {
      const righe = doc.splitTextToSize(String(v.descrizione), larghezzaDescrizione - 8) as string[];
      const altezzaRiga = Math.max(righe.length * 4.8 + 4.5, 9);
      if (y + altezzaRiga > PAGINA.altezza - MARGINE.basso) {
        doc.addPage();
        y = MARGINE.alto;
        testataTabella();
        doc.setFontSize(10);
      }
      if (i % 2 === 1) {
        doc.setFillColor(...SUPERFICIE);
        doc.rect(MARGINE.sx, y, LARGHEZZA_UTILE, altezzaRiga, "F");
      }
      doc.setTextColor(INCHIOSTRO);
      doc.text(righe, MARGINE.sx + 4, y + 6);
      doc.text(euro(v.importo), xImporto - 4, y + 6, { align: "right" });
      y += altezzaRiga;
    });

    // Riga totale
    assicuraSpazio(11);
    doc.setDrawColor(...PETROLIO);
    doc.setLineWidth(0.5);
    doc.line(MARGINE.sx, y, PAGINA.larghezza - MARGINE.dx, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PETROLIO);
    doc.text("Totale", MARGINE.sx + 4, y + 7.5);
    doc.text(euro(o.importo), xImporto - 4, y + 7.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 12;
  } else {
    assicuraSpazio(14);
    doc.setFillColor(...SUPERFICIE);
    doc.roundedRect(MARGINE.sx, y, LARGHEZZA_UTILE, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PETROLIO);
    doc.text("Totale", MARGINE.sx + 4, y + 7.8);
    doc.text(euro(o.importo), xImporto - 4, y + 7.8, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 16;
  }

  aggiungiPiePagina(doc, o.numero);
  doc.save(`offerta-${o.numero}.pdf`);
}

/** Piè di pagina su ogni pagina: brand a sinistra, "Pagina X di Y" a destra. */
function aggiungiPiePagina(doc: jsPDF, numero: string) {
  const totale = doc.getNumberOfPages();
  for (let i = 1; i <= totale; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 208, 206);
    doc.setLineWidth(0.2);
    doc.line(
      MARGINE.sx,
      PAGINA.altezza - 16,
      PAGINA.larghezza - MARGINE.dx,
      PAGINA.altezza - 16
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(GRIGIO);
    doc.text(`Inbox AI — Offerta ${numero}`, MARGINE.sx, PAGINA.altezza - 11);
    doc.text(`Pagina ${i} di ${totale}`, PAGINA.larghezza - MARGINE.dx, PAGINA.altezza - 11, {
      align: "right",
    });
  }
}
