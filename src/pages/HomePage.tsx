import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Heart, Users, Calendar, ArrowRight } from "lucide-react";
import heroImg from "@/assets/mosque-interior.jpg";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import SectionHeading from "@/components/SectionHeading";
import AndalusianArch from "@/components/AndalusianArch";
import OrnamentalDivider from "@/components/OrnamentalDivider";

const pillars = [
  { name: "Getuigenis", nameAr: "الشهادة", desc: "De geloofsbelijdenis is de eerste en belangrijkste zuil." },
  { name: "Het Gebed", nameAr: "الصلاة", desc: "Vijf dagelijkse gebeden vormen de verbinding met Allah." },
  { name: "Vasten", nameAr: "الصوم", desc: "Tijdens de Ramadan vasten moslims van zonsopgang tot zonsondergang." },
  { name: "Aalmoes", nameAr: "الزكاة", desc: "Het geven van een deel van je bezit aan de armen." },
  { name: "Bedevaart", nameAr: "الحج", desc: "De pelgrimstocht naar Mekka, minstens eenmaal in het leven." },
];

const features = [
  { icon: BookOpen, title: "Onderwijs", desc: "7 klassen voor Arabische en Islamitische lessen", link: "/onderwijs" },
  { icon: Heart, title: "Doneren", desc: "Steun onze moskee en gemeenschap", link: "/doneren" },
  { icon: Users, title: "Word Lid", desc: "Sluit je aan bij onze gemeenschap", link: "/word-lid" },
  { icon: Calendar, title: "Activiteiten", desc: "Bekijk onze komende evenementen", link: "/activiteiten" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Moskee interieur" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brown/70" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gold text-3xl md:text-4xl mb-4" style={{ fontFamily: "'Rabat', serif" }}
          >
            مسجد النهضة
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl text-cream leading-tight"
          >
            Nahda Moskee
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-4 justify-center"
          >
            <Link to="/over-ons" className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
              Over Ons
            </Link>
            <Link to="/doneren" className="border-2 border-cream/40 text-cream px-8 py-3 rounded-full font-semibold hover:bg-cream/10 transition-colors">
              Doneren
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Navigate to mosque bar */}
      <a
        href="https://maps.app.goo.gl/oEPsAsYqXg5kZgKW6"
        target="_blank"
        rel="noopener"
        className="block bg-gradient-gold text-center py-3 text-primary-foreground font-semibold hover:brightness-110 transition-all shadow-[0_2px_12px_rgba(200,148,63,0.3)] hover:shadow-[0_4px_20px_rgba(200,148,63,0.45)] pulse"
      >
        📍 Navigeer naar de moskee
      </a>

      {/* Prayer times */}
      <section className="py-16 islamic-pattern">
        <div className="container max-w-4xl">
          <PrayerTimesWidget />
        </div>
      </section>

      {/* Quick links */}
      <section className="py-20 bg-background andalusian-mosaic">
        <div className="container">
          <SectionHeading subtitle="Ontdek" title="Wat wij bieden" description="Van onderwijs tot gemeenschapsactiviteiten, ontdek alles wat onze moskee te bieden heeft." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={f.link}
                  className="group block bg-card rounded-2xl p-6 hover:shadow-lg transition-all border border-border hover:border-primary/30"
                >
                  <f.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-heading text-xl text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{f.desc}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Meer info <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars of Islam */}
      <section className="py-20 bg-brown islamic-pattern">
        <div className="container">
          <SectionHeading subtitle="Maak Kennis Met Ons Geloof" title="De Zuilen van de Islam" light />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-cream/5 rounded-2xl p-6 text-center border border-cream/10 hover:border-gold/30 transition-colors"
              >
                <span className="block text-gold font-heading text-3xl mb-2">{p.nameAr}</span>
                <h3 className="text-cream font-semibold mb-2">{p.name}</h3>
                <p className="text-cream/60 text-sm">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Volunteer */}
      <section className="py-20 bg-gradient-gold andalusian-mosaic">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <AndalusianArch className="mb-4 [&_svg]:opacity-20" />
            <p className="text-primary-foreground/80 font-heading text-lg italic mb-2">Oproep Voor Vrijwilligers</p>
            <h2 className="font-heading text-3xl md:text-5xl text-primary-foreground mb-4">Word geïnspireerd door onze visie</h2>
            <OrnamentalDivider light />
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Sluit je aan bij onze werkgroepen en zet je talent in voor iets groters. Samen groeien, bouwen en inspireren. Doe mee!
            </p>
            <Link to="/word-lid" className="inline-block bg-foreground text-background px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
              Word Lid
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
