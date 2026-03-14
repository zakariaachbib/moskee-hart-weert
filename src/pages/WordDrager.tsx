import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Users, Mic, BookOpen, Shield, CreditCard, Loader2, CheckCircle2, CalendarCheck, Building } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import wordLidHero from "@/assets/media/word-lid-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const BEDRAG_OPTIES = [
  { value: "5", label: "€5", desc: "per maand" },
  { value: "10", label: "€10", desc: "per maand" },
  { value: "25", label: "€25", desc: "per maand" },
  { value: "50", label: "€50", desc: "per maand" },
  { value: "100", label: "€100", desc: "per maand" },
];

export default function WordDrager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bedrag, setBedrag] = useState("10");
  const [form, setForm] = useState({
    voornaam: "", achternaam: "", straat: "", postcode: "", plaats: "", email: "", telefoon: "",
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const benefits = [
    { icon: BookOpen, title: "Bekeerlingen traject", desc: "Ondersteun nieuwe moslims bij hun reis naar de Islam" },
    { icon: Users, title: "Gemeenschapsactiviteiten", desc: "Maak activiteiten mogelijk voor de hele gemeenschap" },
    { icon: Mic, title: "Sprekers uitnodigen", desc: "Help bij het uitnodigen van geleerden en sprekers" },
    { icon: Heart, title: "Dawah projecten", desc: "Draag bij aan het verspreiden van de boodschap van de Islam" },
  ];

  const infoItems = [
    { icon: CalendarCheck, label: "Maandelijkse bijdrage", value: "Vanaf €5 per maand" },
    { icon: Building, label: "Bestemming", value: "Bekeerlingen, activiteiten, dawah en sprekers" },
    { icon: CreditCard, label: "Betaalmethode", value: "SEPA-incasso via Mollie" },
    { icon: Shield, label: "Verificatie", value: "Eenmalige €0,01 iDEAL verificatie van uw bankrekening" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Toestemming vereist", description: "U moet toestemming geven voor de SEPA-incasso.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-membership-payment", {
        body: { ...form, type: "drager", bedrag: parseFloat(bedrag) },
      });
      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch (err: any) {
      console.error("Drager error:", err);
      toast({
        title: "Er ging iets mis",
        description: err?.message || "Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-brown py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={wordLidHero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brown/75" />
        </div>
        <div className="container relative text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream">
            Word drager van Nahda Moskee Weert
          </motion.h1>
        </div>
      </section>

      {/* Form Section */}
      <section id="drager-formulier" className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"><div className="absolute inset-0 islamic-pattern" /></div>
        <div className="container max-w-2xl relative">
          <SectionHeading
            subtitle="Aanmelden"
            title="Word drager"
            description="Kies uw maandelijkse bijdrage en vul het formulier in. Na het invullen wordt uw bankrekening geverifieerd via een eenmalige iDEAL betaling van €0,01."
          />

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="mt-10 bg-card rounded-2xl p-6 sm:p-8 border border-border space-y-5"
          >
            {/* Bedrag selectie */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Kies uw maandelijkse bijdrage</Label>
              <RadioGroup value={bedrag} onValueChange={setBedrag} className="grid grid-cols-5 gap-2">
                {BEDRAG_OPTIES.map((optie) => (
                  <label
                    key={optie.value}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      bedrag === optie.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30 bg-background"
                    }`}
                  >
                    <RadioGroupItem value={optie.value} className="sr-only" />
                    <span className={`text-lg sm:text-xl font-bold ${bedrag === optie.value ? "text-primary" : "text-foreground"}`}>
                      {optie.label}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{optie.desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Name fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="voornaam">Voornaam *</Label>
                <Input id="voornaam" name="voornaam" value={form.voornaam} onChange={handleChange} required placeholder="Uw voornaam" maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="achternaam">Achternaam *</Label>
                <Input id="achternaam" name="achternaam" value={form.achternaam} onChange={handleChange} required placeholder="Uw achternaam" maxLength={100} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="straat">Straat en huisnummer *</Label>
              <Input id="straat" name="straat" value={form.straat} onChange={handleChange} required placeholder="Bijv. Kerkstraat 12" maxLength={200} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input id="postcode" name="postcode" value={form.postcode} onChange={handleChange} required placeholder="1234 AB" maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plaats">Plaats *</Label>
                <Input id="plaats" name="plaats" value={form.plaats} onChange={handleChange} required placeholder="Uw woonplaats" maxLength={100} />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mailadres *</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="uw@email.nl" maxLength={255} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefoon">Telefoonnummer <span className="text-muted-foreground font-normal">(optioneel)</span></Label>
              <Input id="telefoon" name="telefoon" type="tel" value={form.telefoon} onChange={handleChange} placeholder="06-12345678" maxLength={20} />
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                Ik geef Nahda Moskee Weert toestemming om maandelijks €{parseFloat(bedrag).toFixed(2).replace(".", ",")} via SEPA-incasso van mijn rekening af te schrijven.
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !consent}
              className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-base h-12"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> Bezig met verwerken...</>
              ) : (
                <><Shield size={18} /> Verifieer bankrekening (€0,01)</>
              )}
            </Button>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield size={12} /> Beveiligde betaling</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> iDEAL verificatie</span>
              <span className="flex items-center gap-1"><CreditCard size={12} /> Via Mollie</span>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Info Block */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-6">
            {infoItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 items-start p-5 rounded-xl bg-background border border-border"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{item.label}</p>
                  <p className="text-foreground font-medium text-sm">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quranic Quote */}
      <section className="py-12 bg-brown relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0 islamic-pattern" /></div>
        <div className="container max-w-2xl relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <p className="font-rabat2 text-2xl md:text-3xl text-cream leading-relaxed mb-4" dir="rtl">وَمَن يُوقَ شُحَّ نَفْسِهِ فَأُولَـٰئِكَ هُمُ الْمُفْلِحُونَ</p>
            <p className="text-cream/80 text-base italic mb-2">{t.membership.quoteTranslation}</p>
            <p className="text-gold/60 text-xs">— Surah Al-Hashr 59:9</p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4"><b.icon className="text-primary" size={26} /></div>
                <h3 className="font-heading text-lg text-foreground mb-1">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
