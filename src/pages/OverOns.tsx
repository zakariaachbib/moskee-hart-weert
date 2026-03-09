import { motion } from "framer-motion";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import interieurSneeuw from "@/assets/media/interieur-sneeuw.jpeg";
import imamKhutba from "@/assets/media/imam-khutba.jpg";
import imamKhutba2 from "@/assets/media/imam-khutba-2.jpg";
import imamMicrofoon from "@/assets/media/imam-microfoon.jpg";
import muazzinAdhan from "@/assets/media/muazzin-adhan.jpg";
import muazzinMicrofoon from "@/assets/media/muazzin-microfoon.jpg";

const teamSections = [
  {
    title: "Imam Dr. Ayoub ben Aicha",
    description: "Onze imam tijdens het gebed en de khutbac: imamKhutba, alt: "Imam tijdens khutba" },
      { src: imamKhutba2, alt: "Imam op de minbar tijdens khutba" },
      { src: imamMicrofoon, alt: "Imam achter de microfoon" },
    ],
  },
  {
    title: "Muazzin Said Hannou",
    description: "Onze gebedsoproeper Said Hannou tijdens de adhanos: [
      { src: muazzinAdhan, alt: "Muazzin Said Hannou tijdens de adhan" },
      { src: muazzinMicrofoon, alt: "Muazzin Said Hannou achter de microfoon" },
    ],
  },
];

export default function OverOns() {
  const [lightbox, setLightbox] = useState<{ sectionIdx: number; photoIdx: number } | null>(null);
  const allPhotos = teamSections.flatMap((s, si) => s.photos.map((p, pi) => ({ ...p, sectionIdx: si, photoIdx: pi })));
  const currentFlat = lightbox ? allPhotos.findIndex(p => p.sectionIdx === lightbox.sectionIdx && p.photoIdx === lightbox.photoIdx) : -1;
  const navigate = (dir: number) => {
    if (currentFlat < 0) return;
    const next = (currentFlat + dir + allPhotos.length) % allPhotos.length;
    const item = allPhotos[next];
    setLightbox({ sectionIdx: item.sectionIdx, photoIdx: item.photoIdx });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Over Ons
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-2xl mx-auto">Leer meer over Stichting Islamitische Moskee Weert</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-left mb-8">
                <span className="text-gold font-heading text-lg italic">Onze Missie</span>
                <h2 className="font-heading text-3xl md:text-4xl mt-2 text-foreground">
                  Een sterke gemeenschap opbouwen
                </h2>
                <div className="h-1 w-20 bg-gold mt-4 rounded-full"></div>
              </div>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  Stichting Islamitische Moskee Weert (مسجد النهضة) is een bruisend centrum voor de islamitische gemeenschap in Weert en omgeving. 
                  Wij zijn toegewijd aan het opbouwen van een sterke, verbonden gemeenschap die gebaseerd is op de waarden van de Islam.
                </p>
                <p>
                  Onze moskee biedt een breed scala aan diensten, waaronder dagelijkse gebeden, vrijdaggebed (Jumu'ah), 
                  islamitisch en arabisch onderwijs voor kinderen en volwassenen, en diverse gemeenschapsactiviteiten.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl"
            >
              <img 
                src={interieurSneeuw} 
                alt="Interieur van de moskee met zicht op de sneeuw" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container">
          <SectionHeading subtitle="Onze Visie" title="Samen groeien, bouwen en inspireren" />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Gemeenschap", desc: "Een veilige en gastvrije plek voor iedereen, ongeacht achtergrond." },
              { title: "Onderwijs", desc: "Kwalitatief islamitisch onderwijs voor alle leeftijden." },
              { title: "Integratie", desc: "Bruggen bouwen tussen culturen en bijdragen aan de samenleving." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-background rounded-2xl p-8 border border-border"
              >
                <h3 className="font-heading text-2xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Imam & Muazzin */}
      <section className="py-20 islamic-pattern">
        <div className="container max-w-6xl space-y-16">
          <SectionHeading subtitle="Ons Team" title="Ontmoet onze imam en muazzin" />
          {teamSections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-6">
                <h3 className="font-heading text-2xl text-foreground">{section.title}</h3>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.photos.map((photo, pi) => (
                  <motion.button
                    key={pi}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLightbox({ sectionIdx: si, photoIdx: pi })}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-border"
                  >
                    <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 overflow-hidden">
        <div className="container max-w-4xl mb-8">
          <SectionHeading subtitle="Faciliteiten" title="Wat bieden wij?" />
        </div>
        <div className="relative w-full">
          <div className="flex animate-marquee gap-4 w-max">
            {[
              "Gebedsruimte voor mannen",
              "Gebedsruimte voor vrouwen",
              "Wasruimte (wudu)",
              "Kinderlessen",
              "Toegankelijk voor mindervaliden",
              "Janaza gebed",
              "Eid gebed",
              "Ramadan iftar",
              "Parkeerplaats",
              "Verhuur zalen",
              "Verhuur keuken",
              "Gebedsruimte voor mannen",
              "Gebedsruimte voor vrouwen",
              "Wasruimte (wudu)",
              "Kinderlessen",
              "Toegankelijk voor mindervaliden",
              "Janaza gebed",
              "Eid gebed",
              "Ramadan iftar",
              "Parkeerplaats",
              "Verhuur zalen",
              "Verhuur keuken",
            ].map((f, i) => (
              <div key={`${f}-${i}`} className="bg-card rounded-xl px-6 py-4 text-center border border-border shrink-0">
                <span className="text-sm text-foreground whitespace-nowrap">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
            <X className="h-8 w-8" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-4 text-white/70 hover:text-white z-10">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-4 text-white/70 hover:text-white z-10">
            <ChevronRight className="h-10 w-10" />
          </button>
          <img
            src={teamSections[lightbox.sectionIdx].photos[lightbox.photoIdx].src}
            alt={teamSections[lightbox.sectionIdx].photos[lightbox.photoIdx].alt}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </>
  );
}
