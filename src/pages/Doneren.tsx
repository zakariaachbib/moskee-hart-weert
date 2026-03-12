import { useState } from "react";
import { motion } from "framer-motion";
import { Building, Send } from "lucide-react";
import donerenHero from "@/assets/media/doneren-hero.jpg";
import idealLogo from "@/assets/media/ideal-logo.png";
import tikkieQr from "@/assets/media/tikkie-qr-new.jpeg";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

const donationAmounts = [5, 10, 25, 50];

export default function Doneren() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [notitie, setNotitie] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 5) { toast({ title: "Minimaal donatiebedrag is €5", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-mollie-payment", {
        body: { amount, naam: naam.trim() || null, email: email.trim() || null, notitie: notitie.trim() || null },
      });
      if (error) throw error;
      if (data?.checkoutUrl) { window.location.href = data.checkoutUrl; } else { throw new Error("Geen checkout URL ontvangen"); }
    } catch {
      toast({ title: "Er is een fout opgetreden", description: "Probeer het opnieuw of gebruik een alternatieve betaalmethode.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0"><img src={donerenHero} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-brown/70" /></div>
        <div className="container relative text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">{t.donate.title}</motion.h1>
          <p className="text-cream/70 mt-4">{t.donate.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-4xl">
          <SectionHeading subtitle={t.donate.sadaqahZakaat} title={t.donate.differenceTitle} description={t.donate.differenceDesc} />

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {donationAmounts.map((d) => (
                <motion.button type="button" key={d} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onClick={() => { setSelectedAmount(d); setCustomAmount(""); }} className={`rounded-2xl p-6 text-center border-2 transition-colors ${selectedAmount === d ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
                  <span className="block text-3xl font-bold text-primary">€{d}</span>
                </motion.button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-1">{t.donate.orEnterAmount}</label>
              <input type="number" min="5" step="0.01" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="w-full max-w-xs px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.donate.amountPlaceholder} />
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border mb-8">
              <h3 className="font-heading text-xl text-foreground mb-4">{t.donate.yourDetails}</h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t.donate.name}</label>
                  <input type="text" maxLength={100} value={naam} onChange={(e) => setNaam(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.donate.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t.donate.email}</label>
                  <input type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.donate.email} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.donate.note}</label>
                <input type="text" maxLength={500} value={notitie} onChange={(e) => setNotitie(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.donate.notePlaceholder} />
              </div>
            </div>

            <button type="submit" disabled={loading || !amount} className="bg-gradient-gold text-primary-foreground px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-3 text-lg mb-12">
              <img src={idealLogo} alt="iDEAL" className="h-7" />
              {loading ? t.donate.processing : `${t.donate.pay}${amount ? ` — €${amount}` : ""}`}
            </button>
          </form>


        </div>
      </section>
    </>
  );
}
