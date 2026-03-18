import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Users, ArrowRight, Instagram, UtensilsCrossed, MapPin, Sparkles, GraduationCap } from "lucide-react";
import heroImg from "@/assets/mosque-interior.jpg";
import moskeeWordLid from "@/assets/media/koepel-plafond.jpg";
import logoImg from "@/assets/logo.png";
import cfHeroImg from "@/assets/media/wasruimte-overzicht-1.jpg";
import logoHero from "@/assets/logo-hero.png";
import logoLarge from "@/assets/logo-hero.png";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";
import SectionHeading from "@/components/SectionHeading";
import AndalusianArch from "@/components/AndalusianArch";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import EidPopup from "@/components/EidPopup";

export default function HomePage() {
  const { t } = useLanguage();

  // Fetch active crowdfunding project
  const [cfProject, setCfProject] = useState<{ titel: string; doelbedrag: number; opgehaald_bedrag: number; slug: string | null; id: string } | null>(null);
  const [cfDonorCount, setCfDonorCount] = useState(0);

  useEffect(() => {
    supabase
      .from("crowdfunding_projects")
      .select("id, titel, doelbedrag, opgehaald_bedrag, slug")
      .eq("actief", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setCfProject(data as any);
          supabase
            .from("crowdfunding_donations")
            .select("id", { count: "exact", head: true })
            .eq("project_id", data.id)
            .eq("status", "paid")
            .then(({ count }) => setCfDonorCount(count || 0));
        }
      });
  }, []);

  const pillars = [
    { name: t.home.pillarTestimony, nameAr: "الشهادة", desc: t.home.pillarTestimonyDesc },
    { name: t.home.pillarPrayer, nameAr: "الصلاة", desc: t.home.pillarPrayerDesc },
    { name: t.home.pillarFasting, nameAr: "الصوم", desc: t.home.pillarFastingDesc },
    { name: t.home.pillarCharity, nameAr: "الزكاة", desc: t.home.pillarCharityDesc },
    { name: t.home.pillarPilgrimage, nameAr: "الحج", desc: t.home.pillarPilgrimageDesc },
  ];

  const features = [
    { icon: Users, title: "Word Lid", desc: "Word lid van onze moskee en steun het onderhoud met een vaste maandelijkse bijdrage.", link: "/word-lid" },
    { icon: Heart, title: "Word Drager", desc: "Steun onze moskee structureel met een flexibel maandelijks bedrag.", link: "/word-drager" },
    { icon: UtensilsCrossed, title: "Zaal & Keuken", desc: "Reserveer onze zaal of keuken voor uw evenement of bijeenkomst.", link: "/reservering" },
    { icon: MapPin, title: "Rondleidingen", desc: "Ontdek onze moskee met een persoonlijke rondleiding.", link: "/contact" },
    { icon: Sparkles, title: "Bekeerlingen Traject", desc: "Begeleiding en ondersteuning voor nieuwe moslims.", link: "/bekeerlingen" },
    { icon: GraduationCap, title: "Cursussen", desc: "Volg online cursussen en verdiep uw kennis.", link: "/cursussen" },
  ];

  return (
    <>
      {/* <EidPopup /> — geparkeerd, activeren wanneer Eid nadert */}
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[650px] flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Moskee interieur" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-brown/80 via-brown/60 to-brown/80" />
        <div className="relative z-10 text-center px-4 max-w-4xl flex flex-col items-center">
          <motion.img
            src={logoHero}
            alt="Nahda Moskee Logo"
            className="h-52 md:h-72 mx-auto mb-2 drop-shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{ filter: "brightness(1.1)" }}
          />
          <motion.h1
            className="font-heading text-5xl md:text-7xl lg:text-8xl text-cream leading-none tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {t.home.mosque}
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl text-gold mt-3"
            style={{ fontFamily: 'Rabat4' }}
            dir="rtl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            مسجد النهضة
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Link to="/over-ons" className="border-2 border-cream/30 text-cream px-8 py-3 rounded-full font-semibold hover:bg-cream/10 hover:border-cream/50 transition-all backdrop-blur-sm">
              {t.home.aboutUs}
            </Link>
            <Link to="/doneren" className="bg-gold-dark text-cream px-8 py-3 rounded-full font-semibold hover:bg-gold transition-all shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              {t.home.donate}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Socials & Navigate bar */}
      <div className="bg-brown-light border-t border-cream/10">
        <div className="flex items-center justify-center divide-x divide-cream/10">
          <div className="flex items-center gap-4 px-6 py-3">
            <a href="https://chat.whatsapp.com/DwcENVtty2fE9pMzYBeVG7" target="_blank" rel="noopener" className="text-cream/50 hover:text-gold transition-colors" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="https://www.instagram.com/nahdamoskeeweert?igsh=MXN3d3hobTBkZmtsZA%3D%3D&utm_source=qr" target="_blank" rel="noopener" className="text-cream/50 hover:text-gold transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://www.tiktok.com/@nahdamoskeeweert?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener" className="text-cream/50 hover:text-gold transition-colors" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
              </a>
          </div>
          <a href="https://maps.app.goo.gl/MrFHWeRKss4kN3rH8" target="_blank" rel="noopener" className="flex items-center gap-2 px-6 py-3 text-cream/50 hover:text-gold text-sm font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
            {t.nav.navigate}
          </a>
        </div>
      </div>

      {/* Prayer times */}
      <section className="py-16 islamic-pattern">
        <div className="container max-w-4xl">
          <PrayerTimesWidget />
        </div>
      </section>

      {/* Crowdfunding widget */}
      {cfProject && (() => {
        const pct = Math.min(100, Math.round((cfProject.opgehaald_bedrag / cfProject.doelbedrag) * 100));
        return (
          <section className="py-12 islamic-pattern">
            <div className="container max-w-md sm:max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
              >
                <img src={cfHeroImg} alt="Wudu-ruimte project" className="w-full h-44 sm:h-52 object-cover" />
                <div className="p-5 sm:p-8">
                <div className="text-center mb-5">
                  <span className="text-primary text-[11px] font-semibold uppercase tracking-widest">{t.crowdfunding.title}</span>
                  <h3 className="font-heading text-xl sm:text-2xl text-foreground mt-1 leading-tight">{cfProject.titel}</h3>
                </div>

                {/* Progress bar */}
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-gold"
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground text-base">€{cfProject.opgehaald_bedrag.toLocaleString("nl-NL")}</span>
                    {" "}{t.crowdfunding.raisedOf} €{cfProject.doelbedrag.toLocaleString("nl-NL")}
                  </p>
                  <span className="text-primary font-bold text-base">{pct}%</span>
                </div>

                <Link
                  to={`/crowdfunding/${cfProject.slug || cfProject.id}`}
                  className="block w-full bg-gradient-gold text-primary-foreground text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {t.crowdfunding.donateNow}
                </Link>
                </div>
              </motion.div>
            </div>
          </section>
        );
      })()}

      {/* Quick links + Faciliteiten */}
      <section className="py-20 islamic-pattern overflow-hidden">
        <div className="container">
          <SectionHeading subtitle={t.home.discover} title={t.home.whatWeOffer} description={t.home.whatWeOfferDesc} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={f.link} className="group block bg-card rounded-2xl p-6 hover:shadow-lg transition-all border border-border hover:border-primary/30">
                  <f.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-heading text-xl text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{f.desc}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t.home.moreInfo} <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Faciliteiten - continuous marquee */}
        <div className="mt-16">
          <div className="container max-w-4xl mb-6">
            <SectionHeading subtitle="" title={t.about.facilitiesSubtitle} />
          </div>
          <div className="overflow-hidden w-full">
            <div className="flex animate-marquee gap-3" style={{ width: 'max-content' }}>
              {[...t.about.facilitiesList, ...t.about.facilitiesList].map((f, i) => (
                <div key={`${f}-${i}`} className="bg-card rounded-xl px-6 py-4 text-center border border-border flex items-center justify-center whitespace-nowrap">
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
