import { motion } from "framer-motion";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import gebedstijdenHero from "@/assets/media/gebedstijden-hero.jpg";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Gebedstijden() {
  const { t } = useLanguage();

  return (
    <>
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={gebedstijdenHero} alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-brown/70" />
        </div>
        <div className="container relative text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.prayerTimes.title}
          </motion.h1>
          <p className="text-cream/70 mt-4">{t.prayerTimes.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-4xl">
          <PrayerTimesWidget />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 bg-card rounded-2xl p-8 border border-border"
          >
            <h3 className="font-heading text-2xl text-foreground mb-4">{t.prayerTimes.fridayTitle}</h3>
            <p className="text-muted-foreground">{t.prayerTimes.fridayDesc}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 bg-card rounded-2xl p-8 border border-border"
          >
            <h3 className="font-heading text-2xl text-foreground mb-4">{t.prayerTimes.sourceTitle}</h3>
            <p className="text-muted-foreground">{t.prayerTimes.sourceDesc}</p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
