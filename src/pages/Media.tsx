import { motion } from "framer-motion";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import moskeeVoorZijkant from "@/assets/media/moskee-voor-zijkant.png";
import moskeeVoor from "@/assets/media/moskee-voor.png";
import moskeeZijkant from "@/assets/media/moskee-zijkant.png";
import moskeeAchterGroen from "@/assets/media/moskee-achter-groen.png";
import moskeeAchterParkeerplaats from "@/assets/media/moskee-achter-parkeerplaats.png";
import bouw1 from "@/assets/media/bouw-1.jpg";
import bouw2 from "@/assets/media/bouw-2.jpg";
import bouw3 from "@/assets/media/bouw-3.jpg";
import bouw4 from "@/assets/media/bouw-4.jpg";
import wederopbouw1 from "@/assets/media/wederopbouw-1.jpg";
import wederopbouw2 from "@/assets/media/wederopbouw-2.jpg";
import wederopbouw3 from "@/assets/media/wederopbouw-3.jpg";
import wederopbouw4 from "@/assets/media/wederopbouw-4.jpg";
import wederopbouw5 from "@/assets/media/wederopbouw-5.jpg";
import wederopbouw6 from "@/assets/media/wederopbouw-6.jpg";
import wederopbouw7 from "@/assets/media/wederopbouw-7.jpg";
import ontwerp1 from "@/assets/media/ontwerp-1.png";
import ontwerp2 from "@/assets/media/ontwerp-2.png";
import ontwerp3 from "@/assets/media/ontwerp-3.png";
import resultaat1 from "@/assets/media/resultaat-1.jpg";
import resultaat2 from "@/assets/media/resultaat-2.png";
import resultaat3 from "@/assets/media/resultaat-3.jpg";
import resultaat4 from "@/assets/media/resultaat-4.jpg";
import interieurRaam from "@/assets/media/interieur-raam.jpg";
import interieurMihrab from "@/assets/media/interieur-mihrab.jpg";
import interieurDeur from "@/assets/media/interieur-deur.jpg";
import interieurKalligrafie from "@/assets/media/interieur-kalligrafie.jpg";
import interieurKoranBoek from "@/assets/media/interieur-koran-boek.jpg";
import interieurKoepel from "@/assets/media/interieur-koepel.jpg";
import interieurMinbarDetail from "@/assets/media/interieur-minbar-detail.jpg";
import interieurGebedsruimte from "@/assets/media/interieur-gebedsruimte.jpg";
import interieurKorans from "@/assets/media/interieur-korans.jpg";

export default function Media() {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<{ sectionIdx: number; photoIdx: number } | null>(null);

  const sections = [
    {
      title: t.media.oldBuilding, description: t.media.oldBuildingDesc,
      photos: [
        { src: moskeeVoor, alt: "Moskee voorkant" },
        { src: moskeeZijkant, alt: "Moskee zijkant" },
        { src: moskeeVoorZijkant, alt: "Moskee voorzijde" },
        { src: moskeeAchterParkeerplaats, alt: "Moskee achterkant parkeerplaats" },
        { src: moskeeAchterGroen, alt: "Moskee achterkant met groen" },
      ],
    },
    {
      title: t.media.demolition, description: t.media.demolitionDesc,
      photos: [
        { src: bouw1, alt: "Sloopwerkzaamheden 1" },
        { src: bouw2, alt: "Sloopwerkzaamheden met graafmachine" },
        { src: bouw3, alt: "Sloopwerkzaamheden 3" },
        { src: bouw4, alt: "Sloopwerkzaamheden 4" },
      ],
    },
    {
      title: t.media.newDesign, description: t.media.newDesignDesc,
      photos: [
        { src: ontwerp1, alt: "3D ontwerp voorzijde" },
        { src: ontwerp2, alt: "3D ontwerp bovenaanzicht" },
        { src: ontwerp3, alt: "3D ontwerp zijkant" },
      ],
    },
    {
      title: t.media.reconstruction, description: t.media.reconstructionDesc,
      photos: [
        { src: wederopbouw1, alt: "Fundering met wapening" },
        { src: wederopbouw2, alt: "Fundering leggen" },
        { src: wederopbouw3, alt: "Staalconstructie" },
        { src: wederopbouw4, alt: "Metselwerk begint" },
        { src: wederopbouw5, alt: "Bogen en isolatie" },
        { src: wederopbouw6, alt: "Bouwplaats overzicht" },
        { src: wederopbouw7, alt: "Moskee neemt vorm aan" },
      ],
    },
    {
      title: t.media.result, description: t.media.resultDesc,
      photos: [
        { src: resultaat4, alt: "Moskee buitenkant zonnig" },
        { src: resultaat1, alt: "Moskee buitenkant dramatische lucht" },
        { src: resultaat3, alt: "Gebedsruimte interieur" },
        { src: resultaat2, alt: "Gebedsruimte bovenaanzicht" },
      ],
    },
    {
      title: t.media.interior, description: t.media.interiorDesc,
      photos: [
        { src: interieurMihrab, alt: "De mihrab" },
        { src: interieurGebedsruimte, alt: "Gebedsruimte met balkon" },
        { src: interieurKoepel, alt: "Koepel van binnenuit" },
        { src: interieurRaam, alt: "Boogvormig raam met sneeuw" },
        { src: interieurKalligrafie, alt: "Arabische kalligrafie" },
        { src: interieurMinbarDetail, alt: "Detail van de minbar" },
        { src: interieurDeur, alt: "Interieur deur" },
        { src: interieurKorans, alt: "Korans op het gebedskleed" },
        { src: interieurKoranBoek, alt: "De Koran — speciale editie" },
      ],
    },
  ];

  const allPhotos = sections.flatMap((s, si) => s.photos.map((p, pi) => ({ ...p, sectionIdx: si, photoIdx: pi })));
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
            {t.media.title}
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-xl mx-auto">{t.media.subtitle}</p>
        </div>
      </section>

      <section className="py-16 islamic-pattern">
        <div className="container max-w-6xl space-y-20">
          {sections.map((section, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: si * 0.1 }}>
              <div className="flex items-center gap-4 mb-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading text-lg">{si + 1}</span>
                <div>
                  <h2 className="font-heading text-2xl text-foreground">{section.title}</h2>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
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

          <div className="bg-brown rounded-2xl p-10 text-center">
            <h3 className="font-heading text-2xl text-cream mb-2">{t.media.morePhotos}</h3>
            <p className="text-cream/70 max-w-lg mx-auto text-sm">{t.media.morePhotosDesc}</p>
          </div>
        </div>
      </section>

      {lightbox && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X className="h-8 w-8" /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-4 text-white/70 hover:text-white z-10"><ChevronLeft className="h-10 w-10" /></button>
          <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-4 text-white/70 hover:text-white z-10"><ChevronRight className="h-10 w-10" /></button>
          <img src={sections[lightbox.sectionIdx].photos[lightbox.photoIdx].src} alt={sections[lightbox.sectionIdx].photos[lightbox.photoIdx].alt} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </motion.div>
      )}
    </>
  );
}
