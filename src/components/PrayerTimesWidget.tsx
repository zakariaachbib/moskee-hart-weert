import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
}

export default function PrayerTimesWidget({ compact = false }: { compact?: boolean }) {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [date, setDate] = useState("");
  const [hijri, setHijri] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=Weert&country=Netherlands&method=3`
        );
        const data = await res.json();
        const t = data.data.timings;
        const h = data.data.date.hijri;

        setPrayers([
          { name: "Fajr", nameAr: "الفجر", time: t.Fajr },
          { name: "Dhuhr", nameAr: "الظهر", time: t.Dhuhr },
          { name: "Asr", nameAr: "العصر", time: t.Asr },
          { name: "Maghrib", nameAr: "المغرب", time: t.Maghrib },
          { name: "Isha", nameAr: "العشاء", time: t.Isha },
        ]);
        setDate(data.data.date.readable);
        setHijri(`${h.day} ${h.month.en} ${h.year}`);
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
        <p className="text-gold text-xs mt-1">Weert, Nederland</p>
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
            <span className="block text-gold font-heading text-lg">{p.nameAr}</span>
            <span className="block text-cream/70 text-xs mt-1">{p.name}</span>
            <span className="block text-cream text-xl font-semibold mt-2">{p.time}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
