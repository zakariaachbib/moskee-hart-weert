import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
}

interface MawaqitData {
  prayers: Record<string, string>;
  iqamaTimes: Record<string, string> | null;
  jumuah: string | null;
  sunrise: string | null;
  hijriDate: string | null;
}

// Pelt design palette
const COLORS = {
  bg: "#F5F3EE",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.06)",
  gold: "#B8860B",
  textPrimary: "#2C2C2A",
  textSecondary: "#888780",
};

const FONT_SANS = "'Inter', 'Segoe UI', system-ui, sans-serif";
const FONT_AR = "'Amiri', 'Traditional Arabic', serif";

function TimeDisplay({ time, color = COLORS.textPrimary }: { time: string; color?: string }) {
  const parts = time.split(":");
  if (parts.length !== 2) {
    return <span style={{ color, fontFamily: FONT_SANS }}>{time}</span>;
  }
  return (
    <span
      style={{
        fontFamily: FONT_SANS,
        fontVariantNumeric: "tabular-nums",
        fontSize: "30px",
        fontWeight: 500,
        letterSpacing: "-0.5px",
        color,
        lineHeight: 1,
      }}
    >
      {parts[0]}
      <span style={{ color: COLORS.gold, margin: "0 1px" }}>:</span>
      {parts[1]}
    </span>
  );
}

function getNextPrayerIndex(prayers: PrayerTime[]): number {
  // Use Europe/Amsterdam timezone
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hStr, mStr] = fmt.format(now).split(":");
  const currentMinutes = parseInt(hStr) * 60 + parseInt(mStr);
  for (let i = 0; i < prayers.length; i++) {
    const parts = prayers[i].time.split(":").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const prayerMinutes = parts[0] * 60 + parts[1];
      if (prayerMinutes > currentMinutes) return i;
    }
  }
  return 0; // wrap to Fajr next day
}

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [jumuah, setJumuah] = useState<string | null>(null);
  const [iqamaTimes, setIqamaTimes] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const nextPrayerIdx = useMemo(() => {
    if (prayers.length === 0) return -1;
    return getNextPrayerIndex(prayers);
  }, [prayers]);

  function calcIqama(adhan: string, offset: string): string {
    const match = offset.match(/[+-]?\d+/);
    if (!match) return offset;
    const mins = parseInt(match[0]);
    const [h, m] = adhan.split(":").map(Number);
    const total = h * 60 + m + mins;
    const iqH = Math.floor(total / 60) % 24;
    const iqM = total % 60;
    return `${String(iqH).padStart(2, "0")}:${String(iqM).padStart(2, "0")}`;
  }

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("mawaqit-prayer-times");
        if (error) throw error;
        const mawaqit = data as MawaqitData;
        const p = mawaqit.prayers;
        setPrayers([
          { name: "Fajr", nameAr: "الفجر", time: p.Fajr || "--:--" },
          { name: "Dhuhr", nameAr: "الظهر", time: p.Dhuhr || "--:--" },
          { name: "Asr", nameAr: "العصر", time: p.Asr || "--:--" },
          { name: "Maghrib", nameAr: "المغرب", time: p.Maghrib || "--:--" },
          { name: "Isha", nameAr: "العشاء", time: p.Isha || "--:--" },
        ]);
        setSunrise(mawaqit.sunrise);
        setJumuah(mawaqit.jumuah);
        if (mawaqit.iqamaTimes && p) {
          const computed: Record<string, string> = {};
          for (const [name, offset] of Object.entries(mawaqit.iqamaTimes)) {
            if (p[name]) {
              computed[name] = calcIqama(p[name], offset);
            }
          }
          setIqamaTimes(computed);
        }
      } catch {
        setPrayers([
          { name: "Fajr", nameAr: "الفجر", time: "--:--" },
          { name: "Dhuhr", nameAr: "الظهر", time: "--:--" },
          { name: "Asr", nameAr: "العصر", time: "--:--" },
          { name: "Maghrib", nameAr: "المغرب", time: "--:--" },
          { name: "Isha", nameAr: "العشاء", time: "--:--" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, []);

  if (compact) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {prayers.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gold">{p.name}</span>
            <span className="text-cream/80">{p.time}</span>
          </div>
        ))}
      </div>
    );
  }

  // Build display list with Sunrise inline between Fajr and Dhuhr
  const displayItems: { name: string; nameAr: string; time: string; key: string; isSunrise?: boolean }[] = [];
  prayers.forEach((p, i) => {
    if (i === 1 && sunrise) {
      displayItems.push({ name: "Zonsopgang", nameAr: "الشروق", time: sunrise, key: "sunrise", isSunrise: true });
    }
    displayItems.push({ name: p.name, nameAr: p.nameAr, time: p.time, key: p.name });
  });

  // Dutch date: "Vrijdag 17 april 2026"
  const today = new Date();
  const dutchDate = today.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).replace(/^./, (c) => c.toUpperCase());

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        padding: "2.5rem 1rem",
        borderRadius: "16px",
        maxWidth: "850px",
        margin: "0 auto",
        fontFamily: FONT_SANS,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: COLORS.gold,
            fontWeight: 600,
            fontFamily: FONT_SANS,
          }}
        >
          {t.prayerTimes.title}
        </div>
        <div
          style={{
            fontSize: "15px",
            color: COLORS.textSecondary,
            marginTop: "8px",
            fontFamily: FONT_SANS,
          }}
        >
          {loading ? t.prayerTimes.loading : dutchDate}
        </div>
      </div>

      {/* Prayer cards grid */}
      <div className="prayer-grid-pelt">
        {displayItems.map((item) => {
          const prayerIndex = item.isSunrise ? -1 : prayers.findIndex((p) => p.name === item.name);
          const isNext = !item.isSunrise && prayerIndex === nextPrayerIdx;
          return (
            <div
              key={item.key}
              style={{
                position: "relative",
                backgroundColor: COLORS.card,
                border: isNext ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                padding: "1rem 0.5rem 1.1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "150px",
              }}
            >
              {isNext && (
                <span
                  style={{
                    position: "absolute",
                    top: "-11px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: COLORS.gold,
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontFamily: FONT_SANS,
                    whiteSpace: "nowrap",
                  }}
                >
                  Volgend
                </span>
              )}

              {/* Arabic name */}
              <div
                style={{
                  fontFamily: FONT_AR,
                  fontSize: "18px",
                  color: COLORS.gold,
                  lineHeight: 1.2,
                  marginTop: "4px",
                }}
              >
                {item.nameAr}
              </div>

              {/* Dutch / prayer name */}
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: COLORS.textPrimary,
                  marginTop: "4px",
                }}
              >
                {item.name}
              </div>

              {/* Time */}
              <div style={{ marginTop: "10px" }}>
                <TimeDisplay time={item.time} />
              </div>

              {/* Iqama (not for sunrise) */}
              {!item.isSunrise && iqamaTimes?.[item.name] ? (
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "12px",
                    color: COLORS.textSecondary,
                    marginTop: "8px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Iqama {iqamaTimes[item.name]}
                </div>
              ) : (
                <div style={{ marginTop: "8px", height: "16px" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Jumu'ah bar */}
      {jumuah && (
        <div
          style={{
            marginTop: "1.25rem",
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            padding: "0.9rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: FONT_AR, fontSize: "22px", color: COLORS.gold }}>الجمعة</span>
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", fontWeight: 500, color: COLORS.textPrimary }}>
              Jumu'ah
            </span>
          </div>
          <TimeDisplay time={jumuah} />
        </div>
      )}

      {/* Source */}
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: COLORS.textSecondary,
          marginTop: "1.25rem",
          fontFamily: FONT_SANS,
        }}
      >
        {t.prayerTimes.source}
      </p>

      {/* Responsive grid via styled CSS */}
      <style>{`
        .prayer-grid-pelt {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .prayer-grid-pelt { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 520px) {
          .prayer-grid-pelt { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
