import { motion } from "framer-motion";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/i18n/LanguageContext";
import onderwijsKlas from "@/assets/media/onderwijs-klas.jpeg";
import koranBoeken from "@/assets/media/koran-boeken.jpg";
import koranLezenHand from "@/assets/media/koran-lezen-hand.jpg";


export default function Onderwijs() {
  const { t } = useLanguage();

  const subjects = [
    { icon: BookOpen, title: t.education.arabicLang, desc: t.education.arabicLangDesc },
    { icon: GraduationCap, title: t.education.quranStudies, desc: t.education.quranStudiesDesc },
    { icon: Users, title: t.education.islamicStudies, desc: t.education.islamicStudiesDesc },
  ];

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.education.title}
          </motion.h1>
          <p className="text-cream/70 mt-4">{t.education.subtitle}</p>
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

          <SectionHeading subtitle={t.education.classOverviewSubtitle} title={t.education.classOverviewTitle} />
          <div className="space-y-4">
            {t.education.classes.map((k, i) => (
              <motion.div
                key={k.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="bg-gradient-gold text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                  <span className="font-heading text-lg">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg text-foreground">{k.name}</h3>
                  <p className="text-muted-foreground text-sm">{k.desc}</p>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium shrink-0">
                  {k.age}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
