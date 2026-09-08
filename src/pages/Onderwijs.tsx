import { motion } from "framer-motion";
import { BookOpen, Users, GraduationCap, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/SectionHeading";
import JaarAgenda from "@/components/JaarAgenda";
import { useLanguage } from "@/i18n/LanguageContext";
import onderwijs2 from "@/assets/media/onderwijs-2.jpg";

export default function Onderwijs() {
  const { t } = useLanguage();

  const subjects = [
    { icon: BookOpen, title: t.education.arabicLang, desc: t.education.arabicLangDesc },
    { icon: GraduationCap, title: t.education.quranStudies, desc: t.education.quranStudiesDesc },
    { icon: Users, title: t.education.islamicStudies, desc: t.education.islamicStudiesDesc },
  ];

  return (
    <>
      <section className="relative isolate min-h-[360px] overflow-hidden bg-brown flex items-center">
        <img
          src={onderwijs2}
          alt="Klaslokaal van Nahda Moskee Weert"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-brown/75" />
        <div className="container py-20 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.education.title}
          </motion.h1>
          <p className="text-cream/90 mt-4">{t.education.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading
            subtitle={t.education.programSubtitle}
            title={t.education.programTitle}
            description={t.education.programDesc}
          />

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {subjects.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border flex items-start gap-4"
              >
                <item.icon className="text-primary shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-heading text-lg text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Inschrijving CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <Link
              to="/onderwijs/inschrijving"
              className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <PenLine size={18} />
              Schrijf uw kind in
            </Link>
          </motion.div>

          {/* Jaaragenda */}
          <div className="mb-8">
            <SectionHeading subtitle="Schooljaar 2026–2027" title="Jaaragenda" />
            <JaarAgenda />
          </div>
        </div>
      </section>
    </>
  );
}
