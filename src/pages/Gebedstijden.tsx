import { motion } from "framer-motion";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";

export default function Gebedstijden() {
  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Gebedstijden
          </motion.h1>
          <p className="text-cream/70 mt-4">Live gebedstijden voor Weert, Nederland</p>
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
            <h3 className="font-heading text-2xl text-foreground mb-4">Vrijdaggebed (Jumu'ah)</h3>
            <p className="text-muted-foreground">
              Het vrijdaggebed vindt wekelijks plaats. De khutbah (preek) begint kort voor het Dhuhr-gebed. 
              Alle moslims zijn welkom om deel te nemen aan dit belangrijke wekelijkse gebed.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 bg-card rounded-2xl p-8 border border-border"
          >
            <h3 className="font-heading text-2xl text-foreground mb-4">Gebedstijden bron</h3>
            <p className="text-muted-foreground">
              De gebedstijden worden dagelijks opgehaald via Mawaqit, de officiële bron van Stichting Islamitische Moskee Weert. 
              De tijden worden automatisch bijgewerkt en houden rekening met zomer- en wintertijd.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
