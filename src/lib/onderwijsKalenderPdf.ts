import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { weekData, holidays, monthNames, monthNamesAr } from "@/components/JaarAgenda";

const TYPE_COLORS: Record<string, string> = {
  start: "#92D050",
  vrij: "#FFA500",
  toets: "#2E89D6",
  ouder: "#FFFF00",
  laatste: "#FF0000",
  quiz: "#F4B183",
};

const LEGEND: { nl: string; ar: string; type: string }[] = [
  { nl: "Start lesperiode", ar: "بداية الموسم الدراسي", type: "start" },
  { nl: "Vrij", ar: "عطلة", type: "vrij" },
  { nl: "Toetsperiode", ar: "فترة الامتحان", type: "toets" },
  { nl: "Oudergesprekken", ar: "مناقشة النتائج مع أولياء الأمور", type: "ouder" },
  { nl: "Laatste schooldag", ar: "نهاية الموسم الدراسي والحفل الختامي", type: "laatste" },
  { nl: "Quiz", ar: "مسابقة صفية", type: "quiz" },
];

const BORDER = "1px solid #9aa0a6";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(): string {
  const cols = monthNames.length;

  // Header row met NL + Arabische maandnamen
  const monthHead = monthNames
    .map(
      (m, i) =>
        `<th style="border:${BORDER};padding:3px 2px;background:#f2efe9;font-size:11px;">${esc(m)}<div style="font-size:10px;font-weight:600;direction:rtl;">${esc(monthNamesAr[i])}</div></th>`,
    )
    .join("");

  // Rijen: per week een za- en zo-rij; rechterkolom met vakanties
  const holidayRows = holidays.map(
    (h) =>
      `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span style="font-size:10px;color:#222;line-height:1.4;">${esc(h.nameAr)}</span><span style="font-size:10.5px;direction:rtl;font-weight:600;line-height:1.4;">${esc(h.name)}</span></div><div style="font-size:9.5px;color:#555;line-height:1.4;">${esc(h.dates)}</div>`,
  );
  let hIdx = 0;

  let body = "";
  weekData.forEach((week) => {
    (["za", "zo"] as const).forEach((dayKey) => {
      const label = dayKey === "za" ? "السبت" : "الأحد";
      let row = `<tr>
        <td style="border:${BORDER};padding:5px 4px;font-size:10px;text-align:center;direction:rtl;background:#fafafa;">${label}</td>
        <td style="border:${BORDER};padding:5px 4px;font-size:10px;text-align:center;background:#fafafa;">${dayKey}</td>`;
      week.forEach((pair) => {
        const cell = pair[dayKey];
        const bg = cell && TYPE_COLORS[cell.type] ? TYPE_COLORS[cell.type] : "#ffffff";
        const color = cell && cell.type === "laatste" ? "#ffffff" : "#1a1a1a";
        const weight = cell && TYPE_COLORS[cell.type] ? 700 : 500;
        row += `<td style="border:${BORDER};padding:6px 2px;text-align:center;font-size:12px;background:${bg};color:${color};font-weight:${weight};">${cell ? cell.day : ""}</td>`;
      });
      const hCell = hIdx < holidayRows.length ? holidayRows[hIdx++] : "";
      row += `<td style="border:${BORDER};padding:5px 8px;background:#ffffff;min-width:210px;">${hCell}</td></tr>`;
      body += row;
    });
  });

  const legendRows = LEGEND.map(
    (l) =>
      `<tr>
        <td style="border:${BORDER};background:${TYPE_COLORS[l.type]};width:58px;min-width:58px;"></td>
        <td style="border:${BORDER};padding:6px 12px;font-size:12px;font-weight:700;white-space:nowrap;">${esc(l.nl)}</td>
        <td style="border:${BORDER};padding:6px 12px;font-size:12.5px;direction:rtl;text-align:right;white-space:nowrap;">${esc(l.ar)}</td>
      </tr>`,
  ).join("");

  return `
  <div id="kal-root" style="width:1400px;background:#ffffff;padding:24px 28px;font-family:'Helvetica Neue',Arial,'Segoe UI',sans-serif;color:#1a1a1a;">
    <div style="text-align:center;margin-bottom:10px;">
      <div style="font-size:20px;font-weight:800;letter-spacing:0.4px;">JAARAGENDA TA3LEEM 2026-2027</div>
      <div style="font-size:18px;font-weight:700;direction:rtl;margin-top:2px;">برنامج التعليم لموسم 2026-2027</div>
    </div>
    <table style="border-collapse:collapse;width:100%;table-layout:auto;">
      <thead>
        <tr>
          <th style="border:${BORDER};background:#f2efe9;width:44px;"></th>
          <th style="border:${BORDER};background:#f2efe9;width:32px;"></th>
          ${monthHead}
          <th style="border:${BORDER};background:#f2efe9;padding:3px 6px;font-size:10.5px;direction:rtl;">هنا فقط كملاحظات وليست عطلة</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>

    <table style="border-collapse:collapse;margin-top:16px;">
      ${legendRows}
    </table>

    <div style="margin-top:14px;font-size:10.5px;line-height:1.7;">
      <div><b>Tijdens de wintertijdperiode (01 oktober t/m 31 maart)</b> zijn de lessen elke zondag van 09:00 tot 13:40.</div>
      <div><b>Tijdens de zomertijdperiode (01 april t/m 30 september)</b> zijn de lessen elke zondag van 09:00 tot 13:40.</div>
      <div style="direction:rtl;font-size:11.5px;">أثناء التوقيت الشتوي (من 01 أكتوبر إلى 31 مارس) تستأنف الدروس كل يوم أحد ما بين الساعة 09:00 والساعة 13:40</div>
      <div style="direction:rtl;font-size:11.5px;">أثناء التوقيت الصيفي (من 01 أبريل إلى 30 شتنبر) تستأنف الدروس كل يوم أحد ما بين الساعة 09:00 والساعة 13:40</div>
    </div>

    <div style="margin-top:12px;padding-top:8px;border-top:1px solid #d9d2c5;font-size:10px;color:#6b6b6b;">
      Nahda Moskee Weert — Charitastraat 4, 6001 XT Weert
    </div>
  </div>`;
}

export async function downloadOnderwijsKalenderPdf() {
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1;";
  holder.innerHTML = buildHtml();
  document.body.appendChild(holder);

  try {
    const node = holder.querySelector("#kal-root") as HTMLElement;
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;

    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      (pageW - w) / 2,
      margin,
      w,
      h,
    );
    doc.save("Onderwijskalender-2026-2027.pdf");
  } finally {
    holder.remove();
  }
}
