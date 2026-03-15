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
  // Auto-sync to current month in the academic year (sep=0, okt=1, ..., jul=10)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const m = now.getMonth(); // 0=jan
    // Map: sep(8)=0, okt(9)=1, nov(10)=2, dec(11)=3, jan(0)=4, feb(1)=5, mrt(2)=6, apr(3)=7, mei(4)=8, jun(5)=9, jul(6)=10
    const map: Record<number, number> = { 8:0, 9:1, 10:2, 11:3, 0:4, 1:5, 2:6, 3:7, 4:8, 5:9, 6:10 };
    return map[m] ?? 0;
  });
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
          Jaaragenda Onderwijs 2025–2026
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
      <div className="px-4 sm:px-6 pb-5 space-y-1">
        <p className="text-xs text-muted-foreground">
          <strong>Wintertijd</strong> (1 okt t/m 31 maart): lessen elke zondag van 09:00 tot 13:30
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Zomertijd</strong> (1 april t/m 30 september): lessen elke zondag van 10:00 tot 14:30
        </p>
      </div>

      {/* Contact */}
      <div className="px-4 sm:px-6 pb-6 border-t border-border pt-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Contactpersoon Onderwijs</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/31643138435"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Aziz Hanzaz — +31 6 43138435
          </a>
          <a
            href="mailto:alnahdaweert@gmail.com"
            className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            alnahdaweert@gmail.com
          </a>
        </div>
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
