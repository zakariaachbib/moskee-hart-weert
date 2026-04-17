import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
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

function TimeDisplay({ time, className = "" }: { time: string; className?: string }) {
  const parts = time.split(':');
  if (parts.length !== 2) return <span className={className}>{time}</span>;
  return (
    <span className={`inline-flex items-baseline justify-center ${className}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
      <span className="font-bold tracking-wide" style={{ textShadow: '0 1px 8px rgba(212, 175, 55, 0.15)' }}>{parts[0]}</span>
      <span className="opacity-40 font-medium mx-[1px] text-[0.65em] relative -top-[0.05em]">:</span>
      <span className="font-bold tracking-wide" style={{ textShadow: '0 1px 8px rgba(212, 175, 55, 0.15)' }}>{parts[1]}</span>
    </span>
  );
}

function getNextPrayerIndex(prayers: PrayerTime[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < prayers.length; i++) {
    const parts = prayers[i].time.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const prayerMinutes = parts[0] * 60 + parts[1];
      if (prayerMinutes > currentMinutes) return i;
    }
  }
  return 0; // wrap to Fajr
}

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [jumuah, setJumuah] = useState<string | null>(null);
  const [iqamaTimes, setIqamaTimes] = useState<Record<string, string> | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  const nextPrayerIdx = useMemo(() => {
    if (prayers.length === 0) return -1;
    return getNextPrayerIndex(prayers);
  }, [prayers]);

  function calcIqama(adhan: string, offset: string): string {
    const match = offset.match(/[+-]?\d+/);
    if (!match) return offset;
    const mins = parseInt(match[0]);
    const [h, m] = adhan.split(':').map(Number);
    const total = h * 60 + m + mins;
    const iqH = Math.floor(total / 60) % 24;
    const iqM = total % 60;
    return `${String(iqH).padStart(2, '0')}:${String(iqM).padStart(2, '0')}`;
  }

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('mawaqit-prayer-times');
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
        const today = new Date();
        setDate(today.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }));
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

  // Build display list including Sunrise (Zonsopgang) between Fajr and Dhuhr — Pelt-style
  const displayItems: { name: string; nameAr: string; time: string; key: string; isSunrise?: boolean }[] = [];
  prayers.forEach((p, i) => {
    if (i === 1 && sunrise) {
      displayItems.push({ name: "Zonsopgang", nameAr: "الشروق", time: sunrise, key: "sunrise", isSunrise: true });
    }
    displayItems.push({ name: p.name, nameAr: p.nameAr, time: p.time, key: p.name });
  });

  // Format date in Dutch like "Vrijdag 17 April 2026"
  const today = new Date();
  const dutchDate = today.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).replace(/\b\w/g, c => c.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="text-center mb-6">
        <h3 className="font-heading text-sm tracking-[0.35em] text-gold uppercase">{t.prayerTimes.title}</h3>
        <p className="text-foreground/70 text-sm mt-2">{loading ? t.prayerTimes.loading : dutchDate}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {displayItems.map((item, i) => {
          // nextPrayerIdx is index in `prayers`. Sunrise is never "next".
          const prayerIndex = item.isSunrise ? -1 : prayers.findIndex(p => p.name === item.name);
          const isNext = !item.isSunrise && prayerIndex === nextPrayerIdx;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`relative text-center rounded-2xl px-3 py-5 md:py-6 transition-all duration-300 ${
                isNext
                  ? 'bg-cream border-2 border-gold shadow-[0_4px_20px_-4px_hsl(var(--gold)/0.3)]'
                  : 'bg-cream/60 border border-gold/15 hover:border-gold/30 hover:bg-cream/80'
              }`}
            >
              {isNext && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-cream text-[9px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full shadow-md">
                  Volgend
                </span>
              )}
              <span className="block text-gold text-xl md:text-2xl leading-none" style={{ fontFamily: 'Rabat3' }}>{item.nameAr}</span>
              <span className="block text-foreground/80 text-xs md:text-sm font-medium mt-2">{item.name}</span>
              <TimeDisplay
                time={item.time}
                className={`block text-2xl md:text-3xl mt-3 tracking-[0.02em] ${isNext ? 'text-gold' : 'text-foreground'}`}
              />
              {!item.isSunrise && iqamaTimes?.[item.name] && (
                <span
                  className="block text-foreground/55 text-[11px] mt-2 font-medium tracking-wide"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}
                >
                  Iqama {iqamaTimes[item.name]}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {jumuah && (
        <div className="mt-5 mx-auto max-w-md bg-cream/60 border border-gold/15 rounded-2xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gold text-xl" style={{ fontFamily: 'Rabat3' }}>الجمعة</span>
            <span className="text-foreground font-medium">Jumu'ah</span>
          </div>
          <TimeDisplay time={jumuah} className="text-foreground text-xl tracking-[0.02em]" />
        </div>
      )}

      <p className="text-center text-foreground/50 text-xs mt-5">{t.prayerTimes.source}</p>
    </motion.div>
  );
}