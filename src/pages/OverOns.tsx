import { motion } from "framer-motion";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, UtensilsCrossed, MapPin, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import SectionHeading from "@/components/SectionHeading";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useLanguage } from "@/i18n/LanguageContext";
import interieurSneeuw from "@/assets/media/interieur-sneeuw.jpeg";
import zaalVerhuur from "@/assets/media/zaal-verhuur.jpg";
import keukenVerhuur from "@/assets/media/keuken-verhuur.jpg";
import onderwijsKlas from "@/assets/media/onderwijs-klas.jpeg";
import imamKhutba from "@/assets/media/imam-khutba.jpg";
import imamKhutba2 from "@/assets/media/imam-khutba-2.jpg";
import imamGebed from "@/assets/media/imam-gebed.jpg";
import imamMicrofoon from "@/assets/media/imam-microfoon.jpg";
import muazzinAdhan from "@/assets/media/muazzin-adhan.jpg";
import muazzinMicrofoon from "@/assets/media/muazzin-microfoon.jpg";

export default function OverOns() {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<{ sectionIdx: number; photoIdx: number } | null>(null);

  const teamSections = [
    {
      title: t.about.imamTitle,
      description: t.about.imamDesc,
      photos: [
        { src: imamKhutba, alt: "Imam tijdens khutba" },
        { src: imamGebed, alt: "Imam tijdens het gebed" },
        { src: imamMicrofoon, alt: "Imam achter de microfoon" },
      ],
    },
    {
      title: t.about.muazzinTitle,
      description: t.about.muazzinDesc,
      photos: [
        { src: muazzinAdhan, alt: "Muazzin Said Hannou tijdens de adhan" },
        { src: muazzinMicrofoon, alt: "Muazzin Said Hannou achter de microfoon" },
      ],
    },
  ];

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
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.about.title}
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-2xl mx-auto">{t.about.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="text-left mb-8">
                <span className="text-gold font-heading text-lg italic">{t.about.missionTitle}</span>
                <h2 className="font-heading text-3xl md:text-4xl mt-2 text-foreground">{t.about.missionHeading}</h2>
                <div className="h-1 w-20 bg-gold mt-4 rounded-full"></div>
              </div>
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>{t.about.missionP1}</p>
                <p>{t.about.missionP2}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl">
              <img src={interieurSneeuw} alt="Interieur van de moskee" className="w-full h-full object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container">
          <SectionHeading subtitle={t.about.visionSubtitle} title={t.about.visionTitle} />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: t.about.community, desc: t.about.communityDesc },
              { title: t.about.educationTitle, desc: t.about.educationDesc },
              { title: t.about.integration, desc: t.about.integrationDesc },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-background rounded-2xl p-8 border border-border">
                <h3 className="font-heading text-2xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-3xl">
          <SectionHeading subtitle="Bestuur" title="Bestuursleden" />
          
          <div className="flex flex-col items-center gap-3">
            {/* Voorzitter */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border rounded-xl px-5 py-3 text-center shadow-sm w-48">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                <span className="text-primary font-heading text-sm">أ</span>
              </div>
              <h3 className="font-heading text-sm text-foreground">Ahmed El Edrissi Reyahi</h3>
              <span className="text-xs font-medium text-primary">Voorzitter</span>
            </motion.div>

            <div className="w-px h-4 bg-border" />

            {/* Vice-voorzitter */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl px-5 py-3 text-center shadow-sm w-48">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                <span className="text-primary font-heading text-sm">م</span>
              </div>
              <h3 className="font-heading text-sm text-foreground">Mounir Marzouk</h3>
              <span className="text-xs font-medium text-primary">Vice-Voorzitter</span>
            </motion.div>

            <div className="w-px h-4 bg-border" />

            {/* Bottom row */}
            <div className="relative w-full max-w-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-border" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
                {[
                  { name: "Fekri El Mahtouchi", role: "Secretaris", initial: "ف" },
                  { name: "Tarik Ghanmi", role: "Penningmeester", initial: "ط" },
                  { name: "Mouloud El Mouhmouh", role: "Bestuurslid", initial: "م" },
                  { name: "Younés Ezzohari", role: "Bestuurslid", initial: "ي" },
                ].map((member, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08 }} className="relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 -mt-5 bg-border" />
                    <div className="bg-card border border-border rounded-xl px-3 py-3 text-center shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                        <span className="text-primary font-heading text-xs">{member.initial}</span>
                      </div>
                      <h3 className="font-heading text-xs text-foreground leading-tight">{member.name}</h3>
                      <span className="text-[10px] font-medium text-primary">{member.role}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-6xl space-y-16">
          <SectionHeading subtitle={t.about.teamSubtitle} title={t.about.teamTitle} />
          {teamSections.map((section, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="mb-6">
                <h3 className="font-heading text-2xl text-foreground">{section.title}</h3>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.photos.map((photo, pi) => (
                  <motion.button key={pi} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setLightbox({ sectionIdx: si, photoIdx: pi })} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-border">
                    <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Wat wij bieden carousel */}
      <section className="py-20 bg-card">
        <div className="container max-w-5xl">
          <SectionHeading subtitle={t.home.discover} title={t.home.whatWeOffer} />
          <Carousel
            opts={{ loop: true, align: "start" }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {[
                { icon: UtensilsCrossed, title: "Zaal & Keuken", desc: "Reserveer onze zaal of keuken voor uw evenement of bijeenkomst.", link: "/reservering", img: zaalVerhuur },
                { icon: MapPin, title: "Rondleidingen", desc: "Ontdek onze moskee met een persoonlijke rondleiding.", link: "/contact", img: keukenVerhuur },
                { icon: GraduationCap, title: "Fundamenten van de Islam", desc: "Volg onze uitgebreide online cursus en verdiep uw kennis over de basis van de Islam.", link: "/cursussen", img: onderwijsKlas },
              ].map((item, i) => (
                <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Link to={item.link} className="group block h-full">
                    <div className="bg-background rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all h-full flex flex-col">
                      <div className="relative h-48 overflow-hidden">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <item.icon className="absolute bottom-3 left-3 h-8 w-8 text-cream drop-shadow-lg" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-heading text-lg text-foreground mb-2">{item.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4 flex-1">{item.desc}</p>
                        <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          {t.home.moreInfo} <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12" />
            <CarouselNext className="-right-4 md:-right-12" />
          </Carousel>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl">
          <SectionHeading subtitle={t.about.facilitiesSubtitle} title={t.about.facilitiesTitle} />
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {t.about.facilitiesList.map((f, i) => (
              <div key={i} className="bg-card rounded-xl px-6 py-4 text-center border border-border">
                <span className="text-sm text-foreground whitespace-nowrap">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X className="h-8 w-8" /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-4 text-white/70 hover:text-white z-10"><ChevronLeft className="h-10 w-10" /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-4 text-white/70 hover:text-white z-10"><ChevronRight className="h-10 w-10" /></button>
          <img src={teamSections[lightbox.sectionIdx].photos[lightbox.photoIdx].src} alt={teamSections[lightbox.sectionIdx].photos[lightbox.photoIdx].alt} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </motion.div>
      )}
    </>
  );
}
