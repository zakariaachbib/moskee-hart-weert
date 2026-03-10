import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, CreditCard, Building, Send, CheckCircle } from "lucide-react";
import donerenHero from "@/assets/media/doneren-hero.jpg";
import tikkieQr from "@/assets/media/tikkie-qr.jpg";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const donationAmounts = [10, 25, 50, 100];

export default function Doneren() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [notitie, setNotitie] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const amount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);

  useEffect(() => {
    if (searchParams.get("status") === "success") setPaymentSuccess(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) { toast({ title: t.donate.pay, variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-mollie-payment", {
        body: { amount, naam: naam.trim() || null, email: email.trim() || null, notitie: notitie.trim() || null },
      });
      if (error) throw error;
      if (data?.checkoutUrl) { window.location.href = data.checkoutUrl; } else { throw new Error("Geen checkout URL ontvangen"); }
    } catch {
      toast({ title: t.donate.thankYou, description: t.donate.donationReceivedDesc, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <>
        <section className="relative bg-brown py-20 overflow-hidden">
          <div className="absolute inset-0"><img src={donerenHero} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-brown/70" /></div>
          <div className="container relative text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">{t.donate.thankYou}</motion.h1>
          </div>
        </section>
        <section className="py-20 islamic-pattern">
          <div className="container max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-12 border border-border">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="font-heading text-2xl text-foreground mb-4">{t.donate.donationReceived}</h2>
              <p className="text-muted-foreground mb-6">{t.donate.donationReceivedDesc}</p>
              <a href="/doneren" className="bg-gradient-gold text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity inline-block">{t.donate.anotherDonation}</a>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

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
        <div className="container max-w-4xl mb-8">
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-6 py-4 text-center">
            <p className="text-primary font-semibold text-sm">⚠️ Testmodus — Online doneren en Tikkie gaan binnenkort live. U kunt wel alvast overmaken via bankoverschrijving.</p>
          </div>
        </div>
        <div className="container max-w-4xl">
          <SectionHeading subtitle={t.donate.sadaqahZakaat} title={t.donate.differenceTitle} description={t.donate.differenceDesc} />

          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {donationAmounts.map((d) => (
                <motion.button type="button" key={d} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onClick={() => { setSelectedAmount(d); setCustomAmount(""); }} className={`rounded-2xl p-6 text-center border-2 transition-colors ${selectedAmount === d ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
                  <span className="block text-3xl font-bold text-primary">€{d}</span>
                </motion.button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-1">{t.donate.orEnterAmount}</label>
              <input type="number" min="1" step="0.01" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="w-full max-w-xs px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.donate.amountPlaceholder} />
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

            <button type="submit" disabled={loading || !amount} className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mb-12">
              <CreditCard size={16} /> {loading ? t.donate.processing : `${t.donate.pay}${amount ? ` — €${amount}` : ""}`}
            </button>
          </form>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border">
            <h3 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-2"><Building className="text-primary" /> {t.donate.bankTransfer}</h3>
            <p className="text-muted-foreground mb-4">{t.donate.bankTransferDesc}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.accountHolder}</p><p className="font-semibold text-foreground">Stichting Islamitische Moskee</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.iban}</p><p className="font-semibold text-foreground font-mono">NL65 ABNA 0576 0888 89</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.bic}</p><p className="font-semibold text-foreground font-mono">ABNANL2A</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.description}</p><p className="font-semibold text-foreground">{t.donate.bankDescriptionValue}</p></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border mt-6 text-center">
            <h3 className="font-heading text-2xl text-foreground mb-4 flex items-center justify-center gap-2"><Send className="text-primary" /> Doneer via Tikkie</h3>
            <p className="text-muted-foreground mb-6">Scan de QR-code met uw telefoon om snel en eenvoudig te doneren via Tikkie.</p>
            <div className="mx-auto max-w-[250px] w-full overflow-hidden rounded-2xl">
              <img src={tikkieQr} alt="Tikkie QR-code voor donaties" className="w-full scale-[1.35]" />
            </div>
          </motion.div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: t.donate.sadaqah, desc: t.donate.sadaqahDesc },
              { icon: CreditCard, title: t.donate.zakaat, desc: t.donate.zakaatDesc },
              { icon: Building, title: t.donate.maintenance, desc: t.donate.maintenanceDesc },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <item.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <h4 className="font-heading text-lg text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
