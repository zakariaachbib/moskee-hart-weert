import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Heart, Users, Calendar, ArrowRight, Instagram } from "lucide-react";
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
            <Link to="/over-ons" className="border-2 border-cream/40 text-cream px-8 py-3 rounded-full font-semibold hover:bg-cream/10 transition-colors">
              Over Ons
            </Link>
            <Link to="/doneren" className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:brightness-110 transition-all shadow-[0_2px_12px_rgba(200,148,63,0.3)] hover:shadow-[0_4px_20px_rgba(200,148,63,0.45)] pulse">
              Doneren
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Socials & Navigate bar */}
      <div className="bg-gradient-gold">
        <div className="flex items-center justify-center divide-x divide-primary-foreground/20">
          <div className="flex items-center gap-3 px-6 py-3">
            <div className="flex items-center gap-3">
              <a href="https://wa.me/" target="_blank" rel="noopener" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://www.instagram.com/nahdamoskeeweert?igsh=MXN3d3hobTBkZmtsZA%3D%3D&utm_source=qr" target="_blank" rel="noopener" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://tiktok.com/" target="_blank" rel="noopener" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
              </a>
            </div>
          </div>
          <a
            href="https://maps.google.com/?q=Nahda+Moskee+Weert"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-6 py-3 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Navigeer
          </a>
        </div>
      </div>

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
