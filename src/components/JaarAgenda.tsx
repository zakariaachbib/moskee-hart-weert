import { motion } from "framer-motion";

type CellType = "normal" | "start" | "vrij" | "toets" | "ouder" | "laatste" | "quiz";

interface CalendarCell {
  day?: number;
  type?: CellType;
}

interface WeekRow {
  za?: CalendarCell;
  zo?: CalendarCell;
}

interface HolidayEntry {
  name: string;
  nameAr: string;
  dates: string;
}

const months = ["sep", "okt", "nov", "dec", "jan", "feb", "mrt", "apr", "mei", "jun", "jul"];
const monthsAr = ["سبتمبر", "اكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "ابريل", "ماي", "يونيو", "يوليوز"];

// Data from the calendar image - each week has za (saturday) and zo (sunday) per month
const weekData: WeekRow[][] = [
  // Week 1
  months.map((_, i) => {
    const zoDays = [7, 5, 2, 7, 4, 1, 1, 5, 3, 7, 5];
    const cell: WeekRow = { zo: { day: zoDays[i], type: "normal" } };
    if (i === 0) cell.zo!.type = "start"; // sep 7 = start
    if (i === 10) cell.zo!.type = "laatste"; // jul 5 = laatste schooldag
    return cell;
  }),
  // Week 2
  months.map((_, i) => {
    const zoDays = [14, 12, 9, 14, 11, 8, 8, 12, 10, 14, 0];
    const cell: WeekRow = {};
    if (zoDays[i]) cell.zo = { day: zoDays[i], type: "normal" };
    if (i === 0) cell.zo!.type = "start"; // sep 14
    if (i === 5) cell.zo!.type = "toets"; // feb 8
    return cell;
  }),
  // Week 3
  months.map((_, i) => {
    const zoDays = [21, 19, 16, 21, 18, 15, 15, 19, 17, 21, 0];
    const cell: WeekRow = {};
    if (zoDays[i]) cell.zo = { day: zoDays[i], type: "normal" };
    if (i === 9) cell.zo!.type = "vrij"; // jun 21 = vrij
    return cell;
  }),
  // Week 4
  months.map((_, i) => {
    const zaDays = [0, 0, 0, 0, 0, 21, 0, 0, 0, 27, 0];
    const zoDays = [28, 26, 23, 28, 25, 22, 22, 26, 24, 28, 0];
    const cell: WeekRow = {};
    if (zaDays[i]) cell.za = { day: zaDays[i], type: "normal" };
    if (zoDays[i]) cell.zo = { day: zoDays[i], type: "normal" };
    if (i === 5 && cell.zo) cell.zo.type = "ouder"; // feb 22
    if (i === 6 && cell.zo) cell.zo.type = "ouder"; // mrt 22
    if (i === 9 && cell.za) cell.za.type = "vrij"; // jun 27
    if (i === 9 && cell.zo) cell.zo.type = "vrij"; // jun 28
    return cell;
  }),
  // Week 5
  months.map((_, i) => {
    const zoDays = [0, 0, 30, 0, 0, 0, 29, 0, 31, 0, 0];
    const cell: WeekRow = {};
    if (zoDays[i]) cell.zo = { day: zoDays[i], type: "normal" };
    return cell;
  }),
];

const holidays: HolidayEntry[] = [
  { name: "عيد الفطر", nameAr: "Eid al-Fitr", dates: "20/03/2026 - 22/03/2026" },
  { name: "عيد الأضحى", nameAr: "Eid al-Adha", dates: "25/05/2026 - 28/05/2026" },
  { name: "عطلة اكتوبر", nameAr: "Herfstvakantie", dates: "11/10/2025 - 19/10/2025" },
  { name: "عطلة الربيع", nameAr: "Voorjaarsvakantie", dates: "14/02/2026 - 22/02/2026" },
  { name: "عطلة ماي", nameAr: "Meivakantie", dates: "25/04/2026 - 03/05/2026" },
  { name: "عطلة الصيف", nameAr: "Zomervakantie", dates: "11/07/2026 - 23/08/2026" },
];

const legend = [
  { label: "Start lesperiode", labelAr: "بداية الموسم الدراسي", color: "bg-emerald-500" },
  { label: "Vrij", labelAr: "عطلة", color: "bg-yellow-400" },
  { label: "Toetsperiode", labelAr: "فترة الامتحان", color: "bg-blue-500" },
  { label: "Oudergesprekken", labelAr: "مناقشة النتائج مع اولياء الامور", color: "bg-orange-400" },
  { label: "Laatste schooldag", labelAr: "نهاية الموسم الدراسي", color: "bg-red-500" },
  { label: "Quiz", labelAr: "مسابقة صفية", color: "bg-muted border border-border" },
];

function getCellClasses(type?: CellType): string {
  switch (type) {
    case "start": return "bg-emerald-500/20 text-emerald-700 font-semibold";
    case "vrij": return "bg-yellow-400/20 text-yellow-700 font-semibold";
    case "toets": return "bg-blue-500/20 text-blue-700 font-semibold";
    case "ouder": return "bg-orange-400/20 text-orange-700 font-semibold";
    case "laatste": return "bg-red-500/20 text-red-700 font-semibold";
    case "quiz": return "bg-muted text-foreground";
    default: return "text-foreground";
  }
}

export default function JaarAgenda() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="bg-brown px-6 py-5 text-center">
        <h3 className="font-heading text-2xl md:text-3xl text-cream">
          Jaaragenda Ta3leem 2025–2026
        </h3>
        <p className="font-heading text-cream/70 text-lg mt-1" dir="rtl">
          برنامج التعليم لموسم 2025-2026
        </p>
      </div>

      {/* Calendar table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs w-12"></th>
              {months.map((m, i) => (
                <th key={m} className="px-1.5 py-2.5 text-center">
                  <span className="block text-foreground font-semibold text-xs uppercase tracking-wide">{m}</span>
                  <span className="block text-muted-foreground text-[10px] font-heading" dir="rtl">{monthsAr[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.map((week, wi) => (
              <>
                {/* Za row - only show if any za data exists */}
                {week.some(w => w.za) && (
                  <tr key={`za-${wi}`} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium text-center">za</td>
                    {week.map((w, mi) => (
                      <td key={`za-${wi}-${mi}`} className="px-1 py-1.5 text-center">
                        {w.za?.day && (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs ${getCellClasses(w.za.type)}`}>
                            {w.za.day}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                {/* Zo row */}
                <tr key={`zo-${wi}`} className={`border-b border-border ${wi < weekData.length - 1 ? "border-b-2" : ""}`}>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium text-center">zo</td>
                  {week.map((w, mi) => (
                    <td key={`zo-${wi}-${mi}`} className="px-1 py-1.5 text-center">
                      {w.zo?.day && (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs ${getCellClasses(w.zo.type)}`}>
                          {w.zo.day}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Holidays */}
      <div className="px-6 py-5 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {holidays.map((h) => (
            <div key={h.dates} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground font-mono shrink-0">{h.dates}</div>
              <div className="flex-1 text-xs">
                <span className="text-foreground font-medium">{h.nameAr}</span>
                <span className="text-muted-foreground ml-2 font-heading" dir="rtl">{h.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-5">
        <div className="flex flex-wrap gap-3">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule info */}
      <div className="px-6 pb-6 space-y-1">
        <p className="text-xs text-muted-foreground">
          <strong>Wintertijd</strong> (1 okt t/m 31 maart): lessen elke zondag van 09:00 tot 13:30
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Zomertijd</strong> (1 april t/m 30 september): lessen elke zondag van 10:00 tot 14:30
        </p>
      </div>
    </motion.div>
  );
}
