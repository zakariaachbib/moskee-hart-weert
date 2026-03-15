import { useEffect, useState } from "react";
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
      <span className="text-cream font-bold tracking-wide" style={{ textShadow: '0 1px 8px rgba(212, 175, 55, 0.15)' }}>{parts[0]}</span>
      <span className="text-cream/40 font-medium mx-[2px] text-[0.65em] relative -top-[0.05em]">:</span>
      <span className="text-cream font-bold tracking-wide" style={{ textShadow: '0 1px 8px rgba(212, 175, 55, 0.15)' }}>{parts[1]}</span>
    </span>
  );
}

function TimeDisplayGold({ time, className = "" }: { time: string; className?: string }) {
  const parts = time.split(':');
  if (parts.length !== 2) return <span className={className}>{time}</span>;
  return (
    <span className={`inline-flex items-baseline justify-center ${className}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
      <span className="text-cream font-bold tracking-wide">{parts[0]}</span>
      <span className="text-cream/40 font-medium mx-[2px] text-[0.65em] relative -top-[0.05em]">:</span>
      <span className="text-cream font-bold tracking-wide">{parts[1]}</span>
    </span>
  );
}

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [jumuah, setJumuah] = useState<string | null>(null);
  const [iqamaTimes, setIqamaTimes] = useState<Record<string, string> | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden bg-brown rounded-2xl p-6 md:p-10 shadow-2xl"
    >
      {/* Subtle decorative glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center mb-8">
        <h3 className="font-heading text-3xl text-cream tracking-wide">{t.prayerTimes.title}</h3>
        <p className="text-cream/50 text-sm mt-1">{loading ? t.prayerTimes.loading : date}</p>
        <p className="text-gold/60 text-xs mt-1">{t.prayerTimes.source}</p>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {prayers.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="text-center bg-cream/[0.07] backdrop-blur-sm rounded-xl p-4 md:p-5 border border-cream/[0.08] hover:bg-cream/[0.12] transition-colors duration-300"
          >
            <span className="block text-gold text-xl" style={{ fontFamily: 'Rabat3' }}>{p.nameAr}</span>
            <span className="block text-cream/50 text-[11px] uppercase tracking-widest mt-1">{p.name}</span>
            <TimeDisplay time={p.time} className="block mt-3 text-[34px] md:text-[44px] leading-none tracking-[0.02em]" />
            {iqamaTimes?.[p.name] && (
              <span
                className="block text-cream/35 text-[11px] mt-2.5 font-medium tracking-wide"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}
              >
                Iqama {iqamaTimes[p.name]}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {(sunrise || jumuah) && (
        <div className="relative flex flex-wrap justify-center gap-6 md:gap-10 mt-6 pt-6 border-t border-cream/[0.08]">
          {sunrise && (
            <div className="text-center">
              <span className="block text-gold/80 text-base" style={{ fontFamily: 'Rabat3' }}>الشروق</span>
              <span className="block text-cream/40 text-[11px] uppercase tracking-widest mt-0.5">{t.prayerTimes.sunrise}</span>
              <TimeDisplayGold time={sunrise} className="block mt-1 text-xl font-bold tracking-[0.02em]" />
            </div>
          )}
          {jumuah && (
            <div className="text-center">
              <span className="block text-gold/80 text-base" style={{ fontFamily: 'Rabat3' }}>الجمعة</span>
              <span className="block text-cream/40 text-[11px] uppercase tracking-widest mt-0.5">{t.prayerTimes.jumuah}</span>
              <TimeDisplayGold time={jumuah} className="block mt-1 text-xl font-bold tracking-[0.02em]" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}