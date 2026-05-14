import { motion } from "framer-motion";
import { VolunteerForm } from "@/pages/Activiteiten";

export default function Vrijwilliger() {
  return (
    <>
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="container relative text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream"
          >
            Vrijwilliger worden
          </motion.h1>
        </div>
      </section>

      {/* Hadith motivatie */}
      <section className="py-8 md:py-10 islamic-pattern">
        <div className="container max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-rabat8 text-2xl md:text-3xl text-brown leading-loose mb-2"
            dir="rtl"
          >
            خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ
          </motion.p>
          <p className="text-foreground text-sm md:text-base italic">
            "De beste mensen zijn degenen die het meest van nut zijn voor de mensen." <span className="text-gold-dark not-italic font-semibold">— Sahih</span>
          </p>
        </div>
      </section>

      <section className="pb-12 md:pb-20 islamic-pattern">
        <div className="container max-w-5xl">
          <VolunteerForm />
        </div>
      </section>
    </>
  );
}
