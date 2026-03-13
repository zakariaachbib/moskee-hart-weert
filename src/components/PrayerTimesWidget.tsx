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

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [jumuah, setJumuah] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

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
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-brown rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="font-heading text-2xl text-cream mb-1">{t.prayerTimes.title}</h3>
        <p className="text-cream/60 text-sm">{loading ? t.prayerTimes.loading : date}</p>
        <p className="text-gold text-xs mt-1">{t.prayerTimes.source}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {prayers.map((p, i) => (
          <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center bg-cream/5 rounded-xl p-4">
            <span className="block text-gold text-lg" style={{ fontFamily: 'Rabat3' }}>{p.nameAr}</span>
            <span className="block text-cream/70 text-xs mt-1">{p.name}</span>
            <span className="block text-cream text-xl font-semibold mt-2">{p.time}</span>
          </motion.div>
        ))}
      </div>
      {(sunrise || jumuah) && (
        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-cream/10">
          {sunrise && (
            <div className="text-center">
              <span className="block text-gold text-sm" style={{ fontFamily: 'Rabat3' }}>الشروق</span>
              <span className="block text-cream/70 text-xs">{t.prayerTimes.sunrise}</span>
              <span className="block text-cream text-lg font-semibold">{sunrise}</span>
            </div>
          )}
          {jumuah && (
            <div className="text-center">
              <span className="block text-gold text-sm" style={{ fontFamily: 'Rabat3' }}>الجمعة</span>
              <span className="block text-cream/70 text-xs">{t.prayerTimes.jumuah}</span>
              <span className="block text-cream text-lg font-semibold">{jumuah}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}