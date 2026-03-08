import { motion } from "framer-motion";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const klassen = [
  { naam: "Klas 1", leeftijd: "5-6 jaar", omschrijving: "Introductie Arabisch alfabet en basisbegrippen Islam" },
  { naam: "Klas 2", leeftijd: "7-8 jaar", omschrijving: "Arabisch lezen en korte soera's leren" },
  { naam: "Klas 3", leeftijd: "9-10 jaar", omschrijving: "Arabische grammatica basis en Quran recitatie" },
  { naam: "Klas 4", leeftijd: "10-11 jaar", omschrijving: "Verdieping Arabisch en islamitische geschiedenis" },
  { naam: "Klas 5", leeftijd: "11-12 jaar", omschrijving: "Gevorderd Arabisch en fiqh (islamitisch recht)" },
  { naam: "Klas 6", leeftijd: "12-14 jaar", omschrijving: "Tafseer (Quran uitleg) en Hadith studie" },
  { naam: "Klas 7", leeftijd: "14+ jaar", omschrijving: "Gevorderde islamitische studies en Arabische conversatie" },
];

export default function Onderwijs() {
  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Onderwijs
          </motion.h1>
          <p className="text-cream/70 mt-4">Arabische en Islamitische lessen voor alle leeftijden</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading
            subtitle="Ons Onderwijsprogramma"
            title="7 Klassen voor een sterke basis"
            description="Wij bieden gestructureerd onderwijs in Arabische taal en Islamitische studies voor kinderen en jongeren."
          />

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[
              { icon: BookOpen, title: "Arabische Taal", desc: "Van alfabet tot gevorderde grammatica en conversatie" },
              { icon: GraduationCap, title: "Quran Studies", desc: "Recitatie, tajweed en tafseer" },
              { icon: Users, title: "Islamitische Studies", desc: "Fiqh, hadith en islamitische geschiedenis" },
            ].map((item, i) => (
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

          <SectionHeading subtitle="Klasoverzicht" title="Onze 7 klassen" />
          <div className="space-y-4">
            {klassen.map((k, i) => (
              <motion.div
                key={k.naam}
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
                  <h3 className="font-heading text-lg text-foreground">{k.naam}</h3>
                  <p className="text-muted-foreground text-sm">{k.omschrijving}</p>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium shrink-0">
                  {k.leeftijd}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
