import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
}

interface MawaqitData {
  prayers: Record<string, string>;
  jumuah: string | null;
  sunrise: string | null;
  hijriDate: string | null;
  gregorianDate: string | null;
}

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [jumuah, setJumuah] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [hijri, setHijri] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('mawaqit-prayer-times');

        if (error) throw error;

        const mawaqit = data as MawaqitData;
        const t = mawaqit.prayers;

        setPrayers([
          { name: "Fajr", nameAr: "الفجر", time: t.Fajr || "--:--" },
          { name: "Dhuhr", nameAr: "الظهر", time: t.Dhuhr || "--:--" },
          { name: "Asr", nameAr: "العصر", time: t.Asr || "--:--" },
          { name: "Maghrib", nameAr: "المغرب", time: t.Maghrib || "--:--" },
          { name: "Isha", nameAr: "العشاء", time: t.Isha || "--:--" },
        ]);
        setSunrise(mawaqit.sunrise);
        setJumuah(mawaqit.jumuah);
        setDate(mawaqit.gregorianDate || "");
        setHijri(mawaqit.hijriDate || "");
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
      className="bg-brown rounded-2xl p-8 shadow-xl"
    >
      <div className="text-center mb-6">
        <h3 className="font-heading text-2xl text-cream mb-1">Gebedstijden</h3>
        <p className="text-cream/60 text-sm">{loading ? "Laden..." : `${date} — ${hijri}`}</p>
        <p className="text-gold text-xs mt-1">Bron: Mawaqit — Stichting Islamitische Moskee Weert</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {prayers.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center bg-cream/5 rounded-xl p-4"
          >
            <span className="block text-gold text-lg" style={{ fontFamily: 'Rabat3' }}>{p.nameAr}</span>
            <span className="block text-cream/70 text-xs mt-1">{p.name}</span>
            <span className="block text-cream text-xl font-semibold mt-2">{p.time}</span>
          </motion.div>
        ))}
      </div>

      {/* Extra prayer info: Sunrise & Jumu'ah */}
      {(sunrise || jumuah) && (
        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-cream/10">
          {sunrise && (
            <div className="text-center">
              <span className="block text-gold text-sm" style={{ fontFamily: 'Rabat3' }}>الشروق</span>
              <span className="block text-cream/70 text-xs">Zonsopgang</span>
              <span className="block text-cream text-lg font-semibold">{sunrise}</span>
            </div>
          )}
          {jumuah && (
            <div className="text-center">
              <span className="block text-gold text-sm" style={{ fontFamily: 'Rabat3' }}>الجمعة</span>
              <span className="block text-cream/70 text-xs">Jumu'ah</span>
              <span className="block text-cream text-lg font-semibold">{jumuah}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
