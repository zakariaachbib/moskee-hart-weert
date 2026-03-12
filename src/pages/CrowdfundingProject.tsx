import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trophy, Clock, Users, Share2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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

export default function CrowdfundingProject() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
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

  useEffect(() => {
    fetchProject();
  }, [slug]);

  useEffect(() => {
    if (donated) {
      toast({ title: "Bedankt voor uw donatie! 🤲", description: "Uw bijdrage maakt het verschil." });
    }
  }, [donated]);

  const fetchProject = async () => {
    setLoading(true);
    // Try slug first, then id
    let query = supabase
      .from("crowdfunding_projects")
      .select("*")
      .eq("actief", true);

    const { data, error } = await query.or(`slug.eq.${slug},id.eq.${slug}`).limit(1).single();

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
      toast({ title: "Minimaal donatiebedrag is €5", variant: "destructive" });
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
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch {
      toast({
        title: "Er is een fout opgetreden",
        description: "Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const percentage = project ? Math.min(100, Math.round((project.opgehaald_bedrag / project.doelbedrag) * 100)) : 0;
  const donorCount = donations.length;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Zojuist";
    if (hours < 24) return `${hours} uur geleden`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 dag geleden";
    return `${days} dagen geleden`;
  };

  const handleShare = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      await navigator.share({ title: project?.titel, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link gekopieerd!" });
    }
  };

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
          <h1 className="font-heading text-2xl text-foreground mb-2">Project niet gevonden</h1>
          <p className="text-muted-foreground">Dit crowdfunding project bestaat niet of is niet meer actief.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="relative bg-brown overflow-hidden">
        {project.afbeelding_url && (
          <div className="absolute inset-0">
            <img src={project.afbeelding_url} alt={project.titel} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brown via-brown/60 to-transparent" />
          </div>
        )}
        <div className="container relative py-16 md:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl md:text-5xl text-cream max-w-3xl"
          >
            {project.titel}
          </motion.h1>
        </div>
      </section>

      {/* Main content */}
      <section className="py-8 md:py-12">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            {/* Left - Story */}
            <div>
              {/* Progress card (mobile only - shown above story) */}
              <div className="lg:hidden mb-8">
                <ProgressCard
                  project={project}
                  percentage={percentage}
                  donorCount={donorCount}
                  onDonate={() => setShowDonateForm(true)}
                  onShare={handleShare}
                />
              </div>

              {/* Story */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl text-foreground mb-4">Over dit project</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {project.beschrijving || "Geen beschrijving beschikbaar."}
                </div>
              </div>

              {/* Donations feed */}
              <div className="mt-8 bg-card rounded-2xl border border-border p-6 md:p-8">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setTab("recent")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tab === "recent"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Clock size={16} /> Recente donaties
                  </button>
                  <button
                    onClick={() => setTab("top")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tab === "top"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Trophy size={16} /> Top donaties
                  </button>
                </div>

                <div className="space-y-3">
                  {(tab === "recent" ? donations : topDonations).length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      Nog geen donaties. Wees de eerste!
                    </p>
                  ) : (
                    (tab === "recent" ? donations : topDonations).map((d, i) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {d.anoniem ? (
                            <Heart size={18} className="text-primary" />
                          ) : (
                            <span className="text-primary font-bold text-sm">
                              {(d.naam || "A")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {d.anoniem ? "Anoniem" : d.naam || "Anoniem"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tab === "recent" ? formatTimeAgo(d.created_at) : `€${d.bedrag.toLocaleString("nl-NL")}`}
                          </p>
                        </div>
                        <span className="font-bold text-primary text-sm">
                          €{d.bedrag.toLocaleString("nl-NL")}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar - desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <ProgressCard
                  project={project}
                  percentage={percentage}
                  donorCount={donorCount}
                  onDonate={() => setShowDonateForm(true)}
                  onShare={handleShare}
                />

                {/* Quick recent donations */}
                {donations.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Heart size={14} className="text-primary" />
                      Recente donaties
                    </p>
                    <div className="space-y-2">
                      {donations.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate">
                            {d.anoniem ? "Anoniem" : d.naam || "Anoniem"}
                          </span>
                          <span className="font-semibold text-foreground">€{d.bedrag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donate modal */}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-xl text-foreground">Doneer aan dit project</h3>
                <button onClick={() => setShowDonateForm(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>

              <form onSubmit={handleDonate}>
                {/* Amount buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {donationAmounts.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => { setSelectedAmount(d); setCustomAmount(""); }}
                      className={`rounded-xl py-3 text-center border-2 transition-colors font-bold ${
                        selectedAmount === d
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/50 text-foreground"
                      }`}
                    >
                      €{d}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="mb-6">
                  <input
                    type="number"
                    min="5"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground"
                    placeholder="Ander bedrag (min. €5)"
                  />
                </div>

                {/* Name & email */}
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    maxLength={100}
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground"
                    placeholder="Uw naam (optioneel)"
                    disabled={anoniem}
                  />
                  <input
                    type="email"
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground"
                    placeholder="Uw email (optioneel)"
                  />
                </div>

                {/* Anonymous toggle */}
                <label className="flex items-center gap-3 mb-6 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      anoniem ? "bg-primary border-primary" : "border-border"
                    }`}
                    onClick={() => setAnoniem(!anoniem)}
                  >
                    {anoniem && <Check size={14} className="text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground">Doneer anoniem</span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !amount || amount < 5}
                  className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
                >
                  {submitting ? "Bezig..." : `Doneer €${amount || 0}`}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressCard({
  project,
  percentage,
  donorCount,
  onDonate,
  onShare,
}: {
  project: Project;
  percentage: number;
  donorCount: number;
  onDonate: () => void;
  onShare: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      {/* Progress ring / stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
            {percentage}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            €{project.opgehaald_bedrag.toLocaleString("nl-NL")}
          </p>
          <p className="text-sm text-muted-foreground">
            van €{project.doelbedrag.toLocaleString("nl-NL")} doel
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={percentage} className="h-2.5 mb-4" />

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users size={14} /> {donorCount} donaties
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onDonate}
        className="w-full bg-gradient-gold text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-lg mb-3"
      >
        Doneer nu
      </button>
      <button
        onClick={onShare}
        className="w-full flex items-center justify-center gap-2 border-2 border-border text-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors"
      >
        <Share2 size={16} /> Delen
      </button>
    </div>
  );
}
