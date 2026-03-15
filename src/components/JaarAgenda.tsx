import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type CellType = "normal" | "start" | "vrij" | "toets" | "ouder" | "laatste" | "quiz";

interface DateEntry {
  day: number;
  dayType: "za" | "zo";
  type: CellType;
}

interface MonthData {
  name: string;
  nameAr: string;
  dates: DateEntry[];
}

interface HolidayEntry {
  name: string;
  nameAr: string;
  dates: string;
}

const monthNames = ["sep", "okt", "nov", "dec", "jan", "feb", "mrt", "apr", "mei", "jun", "jul"];
const monthNamesAr = ["سبتمبر", "اكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "ابريل", "ماي", "يونيو", "يوليوز"];
const monthNamesFull = ["September", "Oktober", "November", "December", "Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli"];

// Build structured month data
function buildMonthData(): MonthData[] {
  const raw: { day: number; dayType: "za" | "zo"; type: CellType }[][] = Array.from({ length: 11 }, () => []);

  // Week 1 zo
  [7, 5, 2, 7, 4, 1, 1, 5, 3, 7, 5].forEach((d, i) => {
    let t: CellType = "normal";
    if (i === 0) t = "start";
    if (i === 10) t = "laatste";
    raw[i].push({ day: d, dayType: "zo", type: t });
  });
  // Week 2 zo
  [14, 12, 9, 14, 11, 8, 8, 12, 10, 14, 0].forEach((d, i) => {
    if (!d) return;
    let t: CellType = "normal";
    if (i === 0) t = "start";
    if (i === 5) t = "toets";
    raw[i].push({ day: d, dayType: "zo", type: t });
  });
  // Week 3 zo
  [21, 19, 16, 21, 18, 15, 15, 19, 17, 21, 0].forEach((d, i) => {
    if (!d) return;
    let t: CellType = "normal";
    if (i === 9) t = "vrij";
    raw[i].push({ day: d, dayType: "zo", type: t });
  });
  // Week 4 za
  [0, 0, 0, 0, 0, 21, 0, 0, 0, 27, 0].forEach((d, i) => {
    if (!d) return;
    let t: CellType = "normal";
    if (i === 9) t = "vrij";
    raw[i].push({ day: d, dayType: "za", type: t });
  });
  // Week 4 zo
  [28, 26, 23, 28, 25, 22, 22, 26, 24, 28, 0].forEach((d, i) => {
    if (!d) return;
    let t: CellType = "normal";
    if (i === 5) t = "ouder";
    if (i === 6) t = "ouder";
    if (i === 9) t = "vrij";
    raw[i].push({ day: d, dayType: "zo", type: t });
  });
  // Week 5 zo
  [0, 0, 30, 0, 0, 0, 29, 0, 31, 0, 0].forEach((d, i) => {
    if (!d) return;
    raw[i].push({ day: d, dayType: "zo", type: "normal" });
  });

  return raw.map((dates, i) => ({
    name: monthNamesFull[i],
    nameAr: monthNamesAr[i],
    dates: dates.sort((a, b) => a.day - b.day),
  }));
}

const monthsData = buildMonthData();

const holidays: HolidayEntry[] = [
  { name: "عيد الفطر", nameAr: "Eid al-Fitr", dates: "20/03 - 22/03/2026" },
  { name: "عيد الأضحى", nameAr: "Eid al-Adha", dates: "25/05 - 28/05/2026" },
  { name: "عطلة اكتوبر", nameAr: "Herfstvakantie", dates: "11/10 - 19/10/2025" },
  { name: "عطلة الربيع", nameAr: "Voorjaarsvakantie", dates: "14/02 - 22/02/2026" },
  { name: "عطلة ماي", nameAr: "Meivakantie", dates: "25/04 - 03/05/2026" },
  { name: "عطلة الصيف", nameAr: "Zomervakantie", dates: "11/07 - 23/08/2026" },
];

const legend = [
  { label: "Start lesperiode", color: "bg-emerald-500" },
  { label: "Vrij", color: "bg-yellow-400" },
  { label: "Toetsperiode", color: "bg-blue-500" },
  { label: "Oudergesprekken", color: "bg-orange-400" },
  { label: "Laatste schooldag", color: "bg-red-500" },
];

function getTypeLabel(type: CellType): string {
  switch (type) {
    case "start": return "Start lesperiode";
    case "vrij": return "Vrij / Vakantie";
    case "toets": return "Toetsperiode";
    case "ouder": return "Oudergesprekken";
    case "laatste": return "Laatste schooldag";
    case "quiz": return "Quiz";
    default: return "Lesdag";
  }
}

function getCellBg(type: CellType): string {
  switch (type) {
    case "start": return "bg-emerald-500/15 border-emerald-500/30 text-emerald-700";
    case "vrij": return "bg-yellow-400/15 border-yellow-400/30 text-yellow-700";
    case "toets": return "bg-blue-500/15 border-blue-500/30 text-blue-700";
    case "ouder": return "bg-orange-400/15 border-orange-400/30 text-orange-700";
    case "laatste": return "bg-red-500/15 border-red-500/30 text-red-700";
    default: return "bg-muted/50 border-border text-foreground";
  }
}

function getCellDot(type: CellType): string | null {
  switch (type) {
    case "start": return "bg-emerald-500";
    case "vrij": return "bg-yellow-400";
    case "toets": return "bg-blue-500";
    case "ouder": return "bg-orange-400";
    case "laatste": return "bg-red-500";
    default: return null;
  }
}

function getDesktopCellClasses(type: CellType): string {
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

// Desktop table data (same structure as before)
const weekData = [
  monthNames.map((_, i) => {
    const d = [7, 5, 2, 7, 4, 1, 1, 5, 3, 7, 5][i];
    let t: CellType = "normal";
    if (i === 0) t = "start";
    if (i === 10) t = "laatste";
    return { za: null as { day: number; type: CellType } | null, zo: { day: d, type: t } };
  }),
  monthNames.map((_, i) => {
    const d = [14, 12, 9, 14, 11, 8, 8, 12, 10, 14, 0][i];
    if (!d) return { za: null, zo: null };
    let t: CellType = "normal";
    if (i === 0) t = "start";
    if (i === 5) t = "toets";
    return { za: null, zo: { day: d, type: t } };
  }),
  monthNames.map((_, i) => {
    const d = [21, 19, 16, 21, 18, 15, 15, 19, 17, 21, 0][i];
    if (!d) return { za: null, zo: null };
    let t: CellType = "normal";
    if (i === 9) t = "vrij";
    return { za: null, zo: { day: d, type: t } };
  }),
  monthNames.map((_, i) => {
    const zaD = [0, 0, 0, 0, 0, 21, 0, 0, 0, 27, 0][i];
    const zoD = [28, 26, 23, 28, 25, 22, 22, 26, 24, 28, 0][i];
    let zaT: CellType = "normal";
    let zoT: CellType = "normal";
    if (i === 5) zoT = "ouder";
    if (i === 6) zoT = "ouder";
    if (i === 9) { zaT = "vrij"; zoT = "vrij"; }
    return {
      za: zaD ? { day: zaD, type: zaT } : null,
      zo: zoD ? { day: zoD, type: zoT } : null,
    };
  }),
  monthNames.map((_, i) => {
    const d = [0, 0, 30, 0, 0, 0, 29, 0, 31, 0, 0][i];
    if (!d) return { za: null, zo: null };
    return { za: null, zo: { day: d, type: "normal" as CellType } };
  }),
];

// ── Mobile Month Card ──
function MobileMonthView({ monthIndex, onDateTap }: { monthIndex: number; onDateTap: (date: DateEntry, month: string) => void }) {
  const month = monthsData[monthIndex];

  return (
    <div className="px-1">
      <div className="space-y-2">
        {month.dates.map((d) => {
          const dot = getCellDot(d.type);
          return (
            <button
              key={`${d.dayType}-${d.day}`}
              onClick={() => onDateTap(d, month.name)}
              className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3 min-h-[52px] transition-all active:scale-[0.98] ${getCellBg(d.type)}`}
            >
              <div className="w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold">{d.day}</span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium capitalize">
                  {d.dayType === "za" ? "Zaterdag" : "Zondag"} {d.day} {month.name}
                </span>
                {d.type !== "normal" && (
                  <span className="block text-xs opacity-80 mt-0.5">{getTypeLabel(d.type)}</span>
                )}
              </div>
              {dot && <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />}
            </button>
          );
        })}
        {month.dates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Geen lesdagen deze maand</p>
        )}
      </div>
    </div>
  );
}

// ── Detail Bottom Sheet ──
function DateDetailSheet({ date, month, onClose }: { date: DateEntry; month: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-2xl border-t border-border p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-heading text-2xl text-foreground">
              {date.dayType === "za" ? "Zaterdag" : "Zondag"} {date.day} {month}
            </h4>
            {date.type !== "normal" && (
              <span className={`inline-block mt-2 text-sm font-medium px-3 py-1 rounded-full ${getCellBg(date.type)}`}>
                {getTypeLabel(date.type)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          {date.type === "normal" && <p>Reguliere lesdag.</p>}
          {date.type === "start" && <p>De lessen beginnen weer! Zorg dat je op tijd aanwezig bent.</p>}
          {date.type === "vrij" && <p>Geen lessen vandaag — vakantieperiode.</p>}
          {date.type === "toets" && <p>Toetsperiode — bereid je goed voor op de toetsen.</p>}
          {date.type === "ouder" && <p>Oudergesprekken — bespreking van resultaten met ouders.</p>}
          {date.type === "laatste" && <p>Laatste schooldag van het jaar inclusief het afsluitingsfeest!</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──
export default function JaarAgenda() {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState<{ date: DateEntry; month: string } | null>(null);
  const [swipeDir, setSwipeDir] = useState(0);

  const goToMonth = useCallback((dir: number) => {
    setSwipeDir(dir);
    setCurrentMonth((prev) => {
      const next = prev + dir;
      if (next < 0) return 0;
      if (next >= monthsData.length) return monthsData.length - 1;
      return next;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="bg-brown px-4 sm:px-6 py-5 text-center">
        <h3 className="font-heading text-xl sm:text-2xl md:text-3xl text-cream">
          Jaaragenda Ta3leem 2025–2026
        </h3>
        <p className="font-heading text-cream/70 text-base sm:text-lg mt-1" dir="rtl">
          برنامج التعليم لموسم 2025-2026
        </p>
      </div>

      {/* ── MOBILE: swipeable month cards ── */}
      {isMobile ? (
        <div className="p-4">
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => goToMonth(-1)}
              disabled={currentMonth === 0}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center">
              <span className="text-lg font-semibold text-foreground">{monthsData[currentMonth].name}</span>
              <span className="block text-xs text-muted-foreground font-heading" dir="rtl">
                {monthsData[currentMonth].nameAr}
              </span>
            </div>
            <button
              onClick={() => goToMonth(1)}
              disabled={currentMonth === monthsData.length - 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Month dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {monthsData.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSwipeDir(i > currentMonth ? 1 : -1); setCurrentMonth(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === currentMonth ? "bg-primary w-4" : "bg-border"}`}
              />
            ))}
          </div>

          {/* Animated month content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonth}
              initial={{ opacity: 0, x: swipeDir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDir * -60 }}
              transition={{ duration: 0.2 }}
            >
              <MobileMonthView
                monthIndex={currentMonth}
                onDateTap={(date, month) => setSelectedDate({ date, month })}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* ── DESKTOP: original table ── */
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs w-12"></th>
                {monthNames.map((m, i) => (
                  <th key={m} className="px-1.5 py-2.5 text-center">
                    <span className="block text-foreground font-semibold text-xs uppercase tracking-wide">{m}</span>
                    <span className="block text-muted-foreground text-[10px] font-heading" dir="rtl">{monthNamesAr[i]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekData.map((week, wi) => (
                <>
                  {week.some(w => w.za) && (
                    <tr key={`za-${wi}`} className="border-b border-border/50">
                      <td className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium text-center">za</td>
                      {week.map((w, mi) => (
                        <td key={`za-${wi}-${mi}`} className="px-1 py-1.5 text-center">
                          {w.za && (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs ${getDesktopCellClasses(w.za.type)}`}>
                              {w.za.day}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr key={`zo-${wi}`} className={`border-b border-border ${wi < weekData.length - 1 ? "border-b-2" : ""}`}>
                    <td className="px-2 py-1.5 text-[10px] text-muted-foreground font-medium text-center">zo</td>
                    {week.map((w, mi) => (
                      <td key={`zo-${wi}-${mi}`} className="px-1 py-1.5 text-center">
                        {w.zo && (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs ${getDesktopCellClasses(w.zo.type)}`}>
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
      )}

      {/* Holidays */}
      <div className="px-4 sm:px-6 py-5 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {holidays.map((h) => (
            <div key={h.dates} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
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
      <div className="px-4 sm:px-6 pb-5">
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
      <div className="px-4 sm:px-6 pb-6 space-y-1">
        <p className="text-xs text-muted-foreground">
          <strong>Wintertijd</strong> (1 okt t/m 31 maart): lessen elke zondag van 09:00 tot 13:30
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Zomertijd</strong> (1 april t/m 30 september): lessen elke zondag van 10:00 tot 14:30
        </p>
      </div>

      {/* Bottom sheet detail */}
      <AnimatePresence>
        {selectedDate && (
          <DateDetailSheet
            date={selectedDate.date}
            month={selectedDate.month}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
