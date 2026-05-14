import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Event types ──
type EventType = "normal" | "eid";

interface CalEvent {
  monthIdx: number; // 0=jan
  day: number;
  type: EventType;
  title: string;
  titleAr: string;
  time?: string;
  location?: string;
  description?: string;
}

const monthNames = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const monthNamesAr = ["يناير", "فبراير", "مارس", "ابريل", "ماي", "يونيو", "يوليوز", "غشت", "سبتمبر", "اكتوبر", "نوفمبر", "ديسمبر"];
const monthNamesFull = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

// Only Eid al-Adha 2026
const events: CalEvent[] = [
  {
    monthIdx: 4, // mei
    day: 27,
    type: "eid",
    title: "Eid al-Adha",
    titleAr: "عيد الأضحى",
    time: "Tijdstip nader te beslissen",
    location: "Gebedshal — Charitastraat 4, Weert",
    description:
      "Feestgebed (Salat al-Eid) ter ere van het Offerfeest. Het exacte tijdstip wordt later bekendgemaakt. Houd de aankondigingen in de gaten.",
  },
];

const legend = [{ label: "Eid", color: "bg-emerald-500" }];

function getCellBg(type: EventType) {
  return type === "eid"
    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700"
    : "bg-muted/50 border-border text-foreground";
}
function getDesktopCellClasses(type: EventType) {
  return type === "eid"
    ? "bg-emerald-500/20 text-emerald-700 font-semibold"
    : "text-foreground";
}

// First-day-of-month for 2026 (0=Sun..6=Sat)
const firstDayOfMonth2026 = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];
const daysInMonth2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getEvent(monthIdx: number, day: number) {
  return events.find((e) => e.monthIdx === monthIdx && e.day === day);
}

// ── Mobile Month Card ──
function MobileMonthView({ monthIdx, onTap }: { monthIdx: number; onTap: (e: CalEvent) => void }) {
  const monthEvents = events.filter((e) => e.monthIdx === monthIdx);
  const first = firstDayOfMonth2026[monthIdx];
  const days = daysInMonth2026[monthIdx];

  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div className="px-1 space-y-4">
      {/* Mini grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Z", "M", "D", "W", "D", "V", "Z"].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ev = getEvent(monthIdx, d);
          return (
            <button
              key={i}
              onClick={() => ev && onTap(ev)}
              disabled={!ev}
              className={`aspect-square flex items-center justify-center text-xs rounded-md ${
                ev ? `${getCellBg(ev.type)} font-bold border` : "text-foreground"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Event list */}
      {monthEvents.length > 0 ? (
        <div className="space-y-2">
          {monthEvents.map((e, i) => (
            <button
              key={i}
              onClick={() => onTap(e)}
              className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3 min-h-[52px] transition-all active:scale-[0.98] ${getCellBg(e.type)}`}
            >
              <div className="w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold">{e.day}</span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold">{e.title}</span>
                <span className="block text-xs opacity-80 mt-0.5">{e.time} · {e.location?.split("—")[0].trim()}</span>
              </div>
              <Sparkles className="w-4 h-4 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">Geen activiteiten deze maand</p>
      )}
    </div>
  );
}

// ── Detail Sheet ──
function EventDetailSheet({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-2xl border-t border-border p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-heading text-2xl text-foreground">{event.title}</h4>
            <span className="block text-sm text-muted-foreground font-heading mt-1" dir="rtl">{event.titleAr}</span>
            <span className={`inline-block mt-2 text-sm font-medium px-3 py-1 rounded-full ${getCellBg(event.type)}`}>
              {event.day} {monthNamesFull[event.monthIdx]} 2026
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {event.time && <p><strong className="text-foreground">Tijd:</strong> {event.time}</p>}
          {event.location && <p><strong className="text-foreground">Locatie:</strong> {event.location}</p>}
          {event.description && <p className="pt-2 leading-relaxed">{event.description}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──
export default function ActiviteitenAgenda() {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() === 2026 ? now.getMonth() : 0;
  });
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [swipeDir, setSwipeDir] = useState(0);

  const goToMonth = useCallback((dir: number) => {
    setSwipeDir(dir);
    setCurrentMonth((prev) => Math.max(0, Math.min(11, prev + dir)));
  }, []);

  // Desktop: render all 12 months as week rows
  const maxWeeks = 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="bg-brown px-4 sm:px-6 py-5 text-center">
        <h3 className="font-heading text-xl sm:text-2xl md:text-3xl text-cream">
          Activiteitenagenda 2026
        </h3>
        <p className="font-heading text-cream/70 text-base sm:text-lg mt-1" dir="rtl">
          برنامج الأنشطة 2026
        </p>
      </div>

      {isMobile ? (
        <div className="p-4">
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => goToMonth(-1)} disabled={currentMonth === 0}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center">
              <span className="text-lg font-semibold text-foreground">{monthNamesFull[currentMonth]}</span>
              <span className="block text-xs text-muted-foreground font-heading" dir="rtl">{monthNamesAr[currentMonth]}</span>
            </div>
            <button onClick={() => goToMonth(1)} disabled={currentMonth === 11}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
            {monthNames.map((_, i) => (
              <button key={i} onClick={() => { setSwipeDir(i > currentMonth ? 1 : -1); setCurrentMonth(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === currentMonth ? "bg-primary w-4" : "bg-border"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentMonth}
              initial={{ opacity: 0, x: swipeDir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: swipeDir * -60 }}
              transition={{ duration: 0.2 }}>
              <MobileMonthView monthIdx={currentMonth} onTap={setSelected} />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        // Desktop: 12-month grid
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {monthNames.map((m, mi) => {
              const first = firstDayOfMonth2026[mi];
              const days = daysInMonth2026[mi];
              const cells: (number | null)[] = [];
              for (let i = 0; i < first; i++) cells.push(null);
              for (let d = 1; d <= days; d++) cells.push(d);
              while (cells.length < maxWeeks * 7) cells.push(null);

              return (
                <div key={mi} className="border border-border rounded-xl p-3 bg-background/50">
                  <div className="text-center mb-2">
                    <span className="block text-foreground font-semibold text-sm uppercase">{m}</span>
                    <span className="block text-muted-foreground text-[10px] font-heading" dir="rtl">{monthNamesAr[mi]}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {["Z", "M", "D", "W", "D", "V", "Z"].map((d, i) => (
                      <div key={i} className="text-[9px] font-semibold text-muted-foreground py-0.5">{d}</div>
                    ))}
                    {cells.map((d, i) => {
                      if (d === null) return <div key={i} />;
                      const ev = getEvent(mi, d);
                      return (
                        <button
                          key={i}
                          onClick={() => ev && setSelected(ev)}
                          disabled={!ev}
                          className={`aspect-square flex items-center justify-center text-[11px] rounded ${
                            ev ? `${getDesktopCellClasses(ev.type)} cursor-pointer hover:scale-110 transition-transform` : "text-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events summary */}
      <div className="px-4 sm:px-6 py-5 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {events.map((e, i) => (
            <button
              key={i}
              onClick={() => setSelected(e)}
              className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-lg px-3 py-2.5 text-left transition-colors"
            >
              <div className="text-xs text-emerald-700 font-mono shrink-0">
                {String(e.day).padStart(2, "0")}/{String(e.monthIdx + 1).padStart(2, "0")}/2026
              </div>
              <div className="flex-1 text-xs">
                <span className="text-foreground font-medium">{e.title}</span>
                <span className="text-muted-foreground ml-2 font-heading" dir="rtl">{e.titleAr}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="flex flex-wrap gap-3 justify-center">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && <EventDetailSheet event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
