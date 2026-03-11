import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, CreditCard, Building, Send } from "lucide-react";
import donerenHero from "@/assets/media/doneren-hero.jpg";
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
    if (!amount || amount <= 0) { toast({ title: t.donate.pay, variant: "destructive" }); return; }
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
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.accountHolder}</p><p className="font-semibold text-foreground">ST ISLAMITISCHE MOSKEE</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.iban}</p><p className="font-semibold text-foreground">NL32 ABNA 0434 7160 57</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.bic}</p><p className="font-semibold text-foreground">ABNANL2A</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">{t.donate.description}</p><p className="font-semibold text-foreground">{t.donate.bankDescriptionValue}</p></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border mt-6 text-center">
            <h3 className="font-heading text-2xl text-foreground mb-4 flex items-center justify-center gap-2"><Send className="text-primary" /> Doneer via Tikkie</h3>
            <p className="text-muted-foreground mb-6">Scan de QR-code met uw telefoon om snel en eenvoudig te doneren via Tikkie.</p>
            <div className="mx-auto max-w-[280px] w-full rounded-2xl overflow-hidden bg-white">
              <img src={tikkieQr} alt="Tikkie QR-code voor donaties" className="w-full scale-[1.45] origin-center" />
            </div>
            <a href="https://tikkie.me/pay/StIslamMos1/cE9Ve5TSJrVcqtZeQRrrae" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-primary hover:underline text-sm font-medium">
              Of klik hier om via Tikkie te doneren →
            </a>
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
