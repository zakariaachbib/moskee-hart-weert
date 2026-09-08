import jsPDF from "jspdf";
import { weekData, holidays, monthNames } from "@/components/JaarAgenda";

type RGB = [number, number, number];

const BROWN: RGB = [61, 42, 28];
const GOLD: RGB = [212, 175, 55];
const DARK: RGB = [30, 30, 30];
const GREY: RGB = [130, 130, 130];
const LINE: RGB = [180, 180, 180];

const TYPE_COLORS: Record<string, RGB> = {
  start: [146, 208, 80],
  vrij: [255, 165, 0],
  toets: [46, 137, 214],
  ouder: [255, 255, 0],
  laatste: [255, 0, 0],
  quiz: [244, 177, 131],
};

const LEGEND: { label: string; type: string }[] = [
  { label: "Start lesperiode", type: "start" },
  { label: "Vrij / vakantie", type: "vrij" },
  { label: "Toetsperiode", type: "toets" },
  { label: "Oudergesprekken", type: "ouder" },
  { label: "Laatste schooldag", type: "laatste" },
  { label: "Quiz", type: "quiz" },
];

export function downloadOnderwijsKalenderPdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  // Header
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, pageW, 62, "F");
  doc.setTextColor(255, 248, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("JAARAGENDA TA3LEEM 2026-2027", margin, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text("Nahda Moskee Weert  |  lessen elke zondag van 09:00 tot 13:40", margin, 46);

  // Grid geometry
  const labelW = 34;
  const holidayW = 150;
  const gridX = margin;
  const gridTop = 84;
  const monthW = (pageW - margin * 2 - labelW - holidayW) / monthNames.length;
  const rowH = 18;

  // Month header row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.5);

  doc.setFillColor(245, 241, 233);
  doc.rect(gridX, gridTop, labelW + monthW * monthNames.length + holidayW, rowH, "F");
  doc.setTextColor(...BROWN);
  monthNames.forEach((m, i) => {
    const x = gridX + labelW + i * monthW;
    doc.rect(x, gridTop, monthW, rowH);
    doc.text(m, x + monthW / 2, gridTop + 12.5, { align: "center" });
  });
  doc.rect(gridX, gridTop, labelW, rowH);
  doc.rect(gridX + labelW + monthW * monthNames.length, gridTop, holidayW, rowH);
  doc.text("Vakanties", gridX + labelW + monthW * monthNames.length + holidayW / 2, gridTop + 12.5, {
    align: "center",
  });

  // Body rows: per week a "za" and "zo" row
  let y = gridTop + rowH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const holidayRows = holidays.map((h) => `${h.nameAr}  ${h.dates}`);
  let holidayIdx = 0;

  weekData.forEach((week) => {
    (["za", "zo"] as const).forEach((dayKey) => {
      // label
      doc.setFillColor(250, 250, 250);
      doc.rect(gridX, y, labelW, rowH, "FD");
      doc.setTextColor(...GREY);
      doc.text(dayKey, gridX + labelW / 2, y + 12, { align: "center" });

      week.forEach((cellPair, i) => {
        const cell = cellPair[dayKey];
        const x = gridX + labelW + i * monthW;
        if (cell) {
          const color = TYPE_COLORS[cell.type];
          if (color) {
            doc.setFillColor(...color);
            doc.rect(x, y, monthW, rowH, "FD");
          } else {
            doc.rect(x, y, monthW, rowH);
          }
          doc.setTextColor(...(cell.type === "laatste" ? ([255, 255, 255] as RGB) : DARK));
          doc.setFont("helvetica", color ? "bold" : "normal");
          doc.text(String(cell.day), x + monthW / 2, y + 12, { align: "center" });
          doc.setFont("helvetica", "normal");
        } else {
          doc.rect(x, y, monthW, rowH);
        }
      });

      // holiday column
      const hx = gridX + labelW + monthW * monthNames.length;
      doc.rect(hx, y, holidayW, rowH);
      if (holidayIdx < holidayRows.length) {
        const h = holidays[holidayIdx];
        doc.setTextColor(...DARK);
        doc.setFontSize(7.5);
        doc.text(h.nameAr, hx + 5, y + 12);
        doc.setTextColor(...GREY);
        doc.text(h.dates, hx + holidayW - 5, y + 12, { align: "right" });
        doc.setFontSize(8.5);
        holidayIdx++;
      }

      y += rowH;
    });
  });

  // Legend
  let ly = y + 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BROWN);
  doc.text("Legenda", gridX, ly);
  ly += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  LEGEND.forEach((item, i) => {
    const x = gridX + (i % 3) * 190;
    const yy = ly + Math.floor(i / 3) * 16;
    doc.setFillColor(...TYPE_COLORS[item.type]);
    doc.setDrawColor(...LINE);
    doc.rect(x, yy - 7, 12, 10, "FD");
    doc.setTextColor(...DARK);
    doc.text(item.label, x + 18, yy);
  });

  // Notes
  const ny = ly + 2 * 16 + 14;
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    "Wintertijd (01 oktober t/m 31 maart) en zomertijd (01 april t/m 30 september): de lessen zijn elke zondag van 09:00 tot 13:40.",
    gridX,
    ny,
  );
  doc.text("Nahda Moskee Weert - Charitastraat 4, 6001 XT Weert", gridX, pageH - 20);

  doc.save("Onderwijskalender-2026-2027.pdf");
}
