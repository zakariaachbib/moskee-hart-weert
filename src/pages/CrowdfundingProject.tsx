import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Trophy, Clock, Users, Share2, Check, Droplets,
  HandHeart, Sparkles, CreditCard, ChevronDown, ChevronUp,
  AlertCircle, Shield, ShowerHead, Building2, HeartHandshake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Translations } from "@/i18n/types";

import wasruimteExterieur from "@/assets/media/wasruimte-exterieur.jpg";
import wasruimteWudu from "@/assets/media/wasruimte-wudu.jpg";
import wasruimteGhusl from "@/assets/media/wasruimte-ghusl.jpg";
import wasruimteOverzicht1 from "@/assets/media/wasruimte-overzicht-1.jpg";
import wasruimteOverzicht2 from "@/assets/media/wasruimte-overzicht-2.jpg";
import wasruimteDodenwastafel from "@/assets/media/wasruimte-dodenwastafel.jpg";

const donationAmounts = [5, 10, 25, 50, 100];

interface Project {
  id: string;
  titel: string;
  beschrijving: string | null;
  doelbedrag: number;
  opgehaald_bedrag: number;
  afbeelding_url: string | null;
  slug: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  bedrag: number;
  naam: string | null;
  anoniem: boolean;
  created_at: string;
}

// ─── Sub-components ─────────────────────────────────────────

function HeroImage({ project }: { project: Project }) {
  if (!project.afbeelding_url) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden rounded-2xl lg:rounded-3xl"
    >
      <img
        src={project.afbeelding_url}
        alt={project.titel}
        className="w-full h-52 sm:h-64 lg:h-80 object-cover"
      />
    </motion.div>
  );
}

function ProgressStats({
  project,
  percentage,
  donorCount,
  t,
}: {
  project: Project;
  percentage: number;
  donorCount: number;
  t: Translations;
}) {
  return (
    <div className="space-y-3 text-center">
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">
          €{project.opgehaald_bedrag.toLocaleString("nl-NL")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.crowdfunding.raisedOf} €{project.doelbedrag.toLocaleString("nl-NL")}
        </p>
      </div>

      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full mx-auto">
        {percentage}%
      </span>

      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-gold"
        />
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-primary" /> {donorCount} {t.crowdfunding.donations}
        </span>
      </div>
    </div>
  );
}

function TrustBadge({ t }: { t: Translations }) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield size={14} className="text-primary" />
        <span>{t.crowdfunding.trustDirect}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <CreditCard size={14} />
        <span>{t.crowdfunding.trustPayments}</span>
      </div>
    </div>
  );
}

function DonationFormContent({
  selectedAmount,
  setSelectedAmount,
  customAmount,
  setCustomAmount,
  naam,
  setNaam,
  email,
  setEmail,
  anoniem,
  setAnoniem,
  amount,
  submitting,
  onSubmit,
  t,
}: {
  selectedAmount: number | null;
  setSelectedAmount: (v: number | null) => void;
  customAmount: string;
  setCustomAmount: (v: string) => void;
  naam: string;
  setNaam: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  anoniem: boolean;
  setAnoniem: (v: boolean) => void;
  amount: number;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: Translations;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Amount grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {donationAmounts.map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => { setSelectedAmount(d); setCustomAmount(""); }}
            className={`rounded-xl py-3 text-center border-2 transition-all font-bold text-sm ${
              selectedAmount === d
                ? "border-primary bg-primary/10 text-primary scale-[1.02]"
                : "border-border bg-background hover:border-primary/50 text-foreground"
            }`}
          >
            €{d}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <input
        type="number"
        min="5"
        step="0.01"
        value={customAmount}
        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
        placeholder={t.crowdfunding.otherAmount}
      />

      {/* Name & email */}
      <div className="space-y-2.5">
        <input
          type="text"
          maxLength={100}
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
          placeholder={t.crowdfunding.yourName}
          disabled={anoniem}
        />
        <input
          type="email"
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground text-sm"
          placeholder={t.crowdfunding.yourEmail}
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            anoniem ? "bg-primary border-primary" : "border-border"
          }`}
          onClick={() => setAnoniem(!anoniem)}
        >
          {anoniem && <Check size={14} className="text-primary-foreground" />}
        </div>
        <span className="text-sm text-muted-foreground">{t.crowdfunding.donateAnonymous}</span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !amount || amount < 5}
        className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
      >
        {submitting ? t.crowdfunding.processing : `${t.crowdfunding.donate} €${amount || 0}`}
      </button>

      <TrustBadge t={t} />
    </form>
  );
}

function SocialProofSection({
  donations,
  topDonations,
  tab,
  setTab,
  formatTimeAgo,
  t,
}: {
  donations: Donation[];
  topDonations: Donation[];
  tab: "recent" | "top";
  setTab: (t: "recent" | "top") => void;
  formatTimeAgo: (d: string) => string;
  t: Translations;
}) {
  const [showAll, setShowAll] = useState(false);
  const items = tab === "recent" ? donations : topDonations;
  const visible = showAll ? items : items.slice(0, 5);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => { setTab("recent"); setShowAll(false); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
            tab === "recent"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Clock size={14} /> {t.crowdfunding.recent}
        </button>
        <button
          onClick={() => { setTab("top"); setShowAll(false); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
            tab === "top"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Trophy size={14} /> {t.crowdfunding.top}
        </button>
      </div>

      <div className="space-y-2.5">
        {visible.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">
            {t.crowdfunding.noDonations}
          </p>
        ) : (
          visible.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                tab === "top" && i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {d.anoniem ? (
                  <Heart size={16} className="text-primary" />
                ) : (
                  <span className="text-primary font-bold text-xs">
                    {(d.naam || "A")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {d.anoniem ? t.crowdfunding.anonymous : d.naam || t.crowdfunding.anonymous}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(d.created_at)}
                </p>
              </div>
              <span className="font-bold text-primary text-sm whitespace-nowrap">
                €{d.bedrag.toLocaleString("nl-NL")}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {items.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm text-primary font-medium hover:underline"
        >
          {showAll ? (
            <>{t.crowdfunding.showLess} <ChevronUp size={16} /></>
          ) : (
            <>{t.crowdfunding.viewAllDonations} <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}

function StorySection({ beschrijving, t }: { beschrijving: string | null; t: Translations }) {
  const text = beschrijving || t.crowdfunding.noDescription;
  const isLong = text.length > 300;
  const [expanded, setExpanded] = useState(false);

  // Insert Arabic hadith before "De Profeet" line
  const renderText = (content: string) => {
    const profeetIndex = content.indexOf("De Profeet");
    if (profeetIndex === -1) return content;
    
    const before = content.slice(0, profeetIndex);
    const after = content.slice(profeetIndex);
    
    return (
      <>
        {before}
        <span className="block my-3 text-center" dir="rtl" style={{ fontFamily: 'Rabat6' }}>
          <span className="block text-sm text-muted-foreground">قال رسول الله ﷺ:</span>
          <span className="block text-base sm:text-lg text-foreground leading-relaxed mt-1">
            «من بنى لله مسجدًا ولو كمفحص قطاة، بنى الله له بيتًا في الجنة»
          </span>
        </span>
        {after}
      </>
    );
  };

  const displayText = isLong && !expanded ? text.slice(0, 300) + "..." : text;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
      {/* Hadith banner */}
      <div className="mb-5 rounded-xl bg-primary/5 border border-primary/10 p-4 sm:p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">De Profeet ﷺ zei:</p>
        <p className="text-lg sm:text-xl text-foreground leading-relaxed my-2" dir="rtl" style={{ fontFamily: 'Rabat6' }}>
          مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ
        </p>
        <p className="text-sm text-muted-foreground italic">"Liefdadigheid vermindert het bezit niet."</p>
        <p className="text-xs text-muted-foreground mt-1">— Sahih Muslim</p>
      </div>

      <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-3">
        {t.crowdfunding.whyImportant}
      </h2>
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {renderText(displayText)}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          {expanded ? (
            <>{t.crowdfunding.readLess} <ChevronUp size={16} /></>
          ) : (
            <>{t.crowdfunding.readMore} <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}

function ImpactCards({ t }: { t: Translations }) {
  const cards = [
    { icon: Droplets, title: t.crowdfunding.impactTitle1, desc: t.crowdfunding.impactDesc1 },
    { icon: HandHeart, title: t.crowdfunding.impactTitle2, desc: t.crowdfunding.impactDesc2 },
    { icon: Sparkles, title: t.crowdfunding.impactTitle3, desc: t.crowdfunding.impactDesc3 },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 text-center"
        >
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <c.icon size={20} className="text-primary" />
          </div>
          <h3 className="font-heading text-base text-foreground mb-1">{c.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ProjectGallery() {
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const images = [
    { src: wasruimteExterieur, alt: "Ontwerp nieuwe aanbouw", label: "Exterieur" },
    { src: wasruimteWudu, alt: "Wudu-ruimte ontwerp", label: "Wudu-ruimte" },
    { src: wasruimteGhusl, alt: "Ghusl-kamer ontwerp", label: "Ghusl-kamer" },
    { src: wasruimteOverzicht1, alt: "Wasruimte overzicht", label: "Overzicht" },
    { src: wasruimteOverzicht2, alt: "Wasruimte details", label: "Details" },
    { src: wasruimteDodenwastafel, alt: "Dodenwastafel voor rituele wassing", label: "Dodenwastafel" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setActiveImg(img.src)}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveImg(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={activeImg}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              alt="Vergrote weergave"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function UrgencyBanner({ t }: { t: Translations }) {
  return (
    <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl p-4">
      <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-foreground leading-relaxed">
        {t.crowdfunding.urgency}
      </p>
    </div>
  );
}



function StickyMobileCTA({
  project,
  percentage,
  onDonate,
  t,
}: {
  project: Project;
  percentage: number;
  onDonate: () => void;
  t: Translations;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 safe-area-inset-bottom">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            €{project.opgehaald_bedrag.toLocaleString("nl-NL")}
            <span className="text-muted-foreground font-normal text-xs ml-1">({percentage}%)</span>
          </p>
        </div>
        <button
          onClick={onDonate}
          className="bg-gradient-gold text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {t.crowdfunding.donateNow}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function CrowdfundingProject() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const donated = searchParams.get("donated") === "true";

  const [project, setProject] = useState<Project | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [topDonations, setTopDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "top">("recent");

  // Donation form
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [anoniem, setAnoniem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDonateForm, setShowDonateForm] = useState(false);

  const amount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const percentage = project ? Math.min(100, Math.round((project.opgehaald_bedrag / project.doelbedrag) * 100)) : 0;
  const donorCount = donations.length;

  useEffect(() => { fetchProject(); }, [slug]);

  useEffect(() => {
    if (donated) {
      toast({ title: t.crowdfunding.thankYou, description: t.crowdfunding.thankYouDesc });
    }
  }, [donated]);

  const fetchProject = async () => {
    setLoading(true);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");

    let query = supabase.from("crowdfunding_projects").select("*").eq("actief", true);
    if (isUUID) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.limit(1).single();
    if (!error && data) {
      setProject(data as Project);
      fetchDonations(data.id);
    }
    setLoading(false);
  };

  const fetchDonations = async (projectId: string) => {
    const { data: recent } = await supabase
      .from("crowdfunding_donations")
      .select("id, bedrag, naam, anoniem, created_at")
      .eq("project_id", projectId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: top } = await supabase
      .from("crowdfunding_donations")
      .select("id, bedrag, naam, anoniem, created_at")
      .eq("project_id", projectId)
      .eq("status", "paid")
      .order("bedrag", { ascending: false })
      .limit(10);

    if (recent) setDonations(recent as Donation[]);
    if (top) setTopDonations(top as Donation[]);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 5) {
      toast({ title: t.crowdfunding.minAmount, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-crowdfunding-payment", {
        body: {
          amount,
          naam: anoniem ? null : naam.trim() || null,
          email: email.trim() || null,
          project_id: project!.id,
          anoniem,
        },
      });
      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL");
      }
    } catch {
      toast({
        title: t.crowdfunding.error,
        description: t.crowdfunding.errorDesc,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t.crowdfunding.justNow;
    if (hours < 24) return `${hours} ${t.crowdfunding.hoursAgo}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return t.crowdfunding.dayAgo;
    return `${days} ${t.crowdfunding.daysAgo}`;
  };

  const handleShare = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      await navigator.share({ title: project?.titel, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: t.crowdfunding.linkCopied });
    }
  };

  // ─── Loading / Not found ───────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-2xl text-foreground mb-2">{t.crowdfunding.notFound}</h1>
          <p className="text-muted-foreground">{t.crowdfunding.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  // ─── Shared form props ─────────────────

  const formProps = {
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    naam,
    setNaam,
    email,
    setEmail,
    anoniem,
    setAnoniem,
    amount,
    submitting,
    onSubmit: handleDonate,
    t,
  };

  // ─── Render ────────────────────────────

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10">
        <div className="max-w-2xl mx-auto">
          <HeroImage project={project} />
        </div>
      </section>

      {/* Main content */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="max-w-2xl mx-auto space-y-6 lg:space-y-8">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-foreground leading-tight text-center">
              {project.titel}
            </h1>
          </motion.div>

          {/* Progress */}
          <ProgressStats project={project} percentage={percentage} donorCount={donorCount} t={t} />

          {/* CTA */}
          <div>
            <button
              onClick={() => setShowDonateForm(true)}
              className="w-full bg-gradient-gold text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-lg"
            >
              {t.crowdfunding.donateNow}
            </button>
            <TrustBadge t={t} />
          </div>

          {/* Gallery */}
          <ProjectGallery />

          {/* Social proof */}
          <SocialProofSection
            donations={donations}
            topDonations={topDonations}
            tab={tab}
            setTab={setTab}
            formatTimeAgo={formatTimeAgo}
            t={t}
          />

          {/* Urgency */}
          <UrgencyBanner t={t} />

          {/* Story */}
          <StorySection beschrijving={project.beschrijving} t={t} />

          {/* Impact */}
          <ImpactCards t={t} />

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 border-2 border-border text-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors"
          >
            <Share2 size={16} /> {t.crowdfunding.share}
          </button>
        </div>
      </section>

      {/* Sticky mobile CTA bar */}
      <StickyMobileCTA project={project} percentage={percentage} onDonate={() => setShowDonateForm(true)} t={t} />

      {/* Mobile donate modal (bottom sheet) */}
      <AnimatePresence>
        {showDonateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDonateForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-border p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-xl text-foreground">{t.crowdfunding.donateToProject}</h3>
                <button onClick={() => setShowDonateForm(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
              </div>
              <DonationFormContent {...formProps} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
