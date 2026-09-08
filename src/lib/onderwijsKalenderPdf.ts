import jsPDF from "jspdf";
import { monthsData, holidays, getTypeLabel } from "@/components/JaarAgenda";

const GOLD: [number, number, number] = [212, 175, 55];
const BROWN: [number, number, number] = [61, 42, 28];
const DARK: [number, number, number] = [40, 40, 40];
const GREY: [number, number, number] = [120, 120, 120];

export function downloadOnderwijsKalenderPdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, pageW, 74, "F");
  doc.setTextColor(255, 248, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Jaaragenda Onderwijs 2026-2027", margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("Nahda Moskee Weert  |  Lestijden: zondag 09:00 - 13:40", margin, 54);

  let y = 100;

  const columnW = (pageW - margin * 2 - 20) / 2;
  let column = 0;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed <= pageH - 60) return;
    if (column === 0) {
      column = 1;
      y = 100;
    } else {
      doc.addPage();
      column = 0;
      y = 60;
    }
  };

  const x = () => margin + column * (columnW + 20);

  monthsData.forEach((month) => {
    newPageIfNeeded(40 + month.dates.length * 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BROWN);
    doc.text(month.name, x(), y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.line(x(), y + 4, x() + columnW, y + 4);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    if (month.dates.length === 0) {
      doc.setTextColor(...GREY);
      doc.text("Geen lesdagen", x(), y);
      y += 16;
    } else {
      month.dates.forEach((d) => {
        newPageIfNeeded(16);
        const dayName = d.dayType === "za" ? "Za" : "Zo";
        const label = getTypeLabel(d.type);
        doc.setTextColor(...DARK);
        doc.text(`${dayName} ${d.day} ${month.name}`, x(), y);
        doc.setTextColor(...(d.type === "normal" ? GREY : BROWN));
        doc.text(label, x() + columnW, y, { align: "right" });
        y += 13;
      });
      y += 8;
    }
  });

  // Vakanties & feestdagen
  newPageIfNeeded(40 + holidays.length * 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BROWN);
  doc.text("Vakanties & feestdagen", x(), y);
  doc.setDrawColor(...GOLD);
  doc.line(x(), y + 4, x() + columnW, y + 4);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  holidays.forEach((h) => {
    newPageIfNeeded(16);
    doc.setTextColor(...DARK);
    doc.text(h.nameAr, x(), y);
    doc.setTextColor(...GREY);
    doc.text(h.dates, x() + columnW, y, { align: "right" });
    y += 13;
  });

  // Footer op elke pagina
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("Nahda Moskee Weert - Charitastraat 4, 6001 XT Weert", margin, pageH - 28);
    doc.text(`Pagina ${i} van ${pages}`, pageW - margin, pageH - 28, { align: "right" });
  }

  doc.save("Onderwijskalender-2026-2027.pdf");
}
