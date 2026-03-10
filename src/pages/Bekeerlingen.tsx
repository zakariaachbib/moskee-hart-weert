import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, BookOpen, Users, MessageCircle, Send, HandHeart, ArrowRight } from "lucide-react";
import bekeerlingenHero from "@/assets/media/bekeerlingen-hero.jpg";
import bekeerlingenHeroDesktop from "@/assets/media/bekeerlingen-hero-desktop.jpg";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    icon: BookOpen,
    title: "Leer over de Islam",
    desc: "Begin met het leren van de basisprincipes van de islam: het geloof in één god (Allah), de profeten, en de vijf zuilen van de islam.",
  },
  {
    icon: Heart,
    title: "De Shahada uitspreken",
    desc: "De geloofsbelijdenis (Shahada) is de eerste stap: 'Ik getuig dat er geen god is dan Allah, en dat Mohammed Zijn boodschapper is.'",
  },
  {
    icon: Users,
    title: "Word deel van de gemeenschap",
    desc: "Na het uitspreken van de Shahada ben je welkom in onze gemeenschap. Wij begeleiden je bij het gebed, de rituelen en het dagelijkse geloof.",
  },
];

const faqs = [
  {
    q: "Moet ik Arabisch spreken om moslim te worden?",
    a: "Nee, Arabisch is niet verplicht. De Shahada kan in het Arabisch worden uitgesproken met begeleiding, maar het begrip en de intentie in je eigen taal zijn het belangrijkst.",
  },
  {
    q: "Heb ik getuigen nodig?",
    a: "Het is aanbevolen maar niet verplicht. In onze moskee kun je de Shahada uitspreken in aanwezigheid van de imam en gemeenschapsleden.",
  },
  {
    q: "Moet ik mijn naam veranderen?",
    a: "Nee, een naamsverandering is niet verplicht in de Islam. Sommige bekeerlingen kiezen ervoor, maar dit is een persoonlijke keuze.",
  },
  {
    q: "Wat als ik nog twijfels heb?",
    a: "Dat is volkomen normaal. Je bent welkom om eerst rustig te leren en vragen te stellen. Onze imam en gemeenschap staan klaar om je te begeleiden, zonder druk.",
  },
];

export default function Bekeerlingen() {
  const { toast } = useToast();
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", bericht: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmed = {
        naam: form.naam.trim(),
        email: form.email.trim(),
        onderwerp: "Bekeerling - Informatie aanvraag",
        bericht: `Telefoon: ${form.telefoon.trim() || "Niet opgegeven"}\n\n${form.bericht.trim()}`,
      };
      const { error } = await supabase.from("contact_messages").insert(trimmed);
      if (error) throw error;
      supabase.functions.invoke("send-email", {
        body: { type: "contact", data: trimmed },
      }).catch(console.error);
      toast({ title: "Bericht verzonden!", description: "Wij nemen zo snel mogelijk contact met u op." });
      setForm({ naam: "", email: "", telefoon: "", bericht: "" });
    } catch {
      toast({ title: "Fout", description: "Er is iets misgegaan. Probeer het later opnieuw.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brown py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={bekeerlingenHero} alt="" className="w-full h-full object-cover md:hidden" />
          <img src={bekeerlingenHeroDesktop} alt="" className="w-full h-full object-cover hidden md:block" />
          <div className="absolute inset-0 bg-brown/75" />
        </div>
        <div className="container relative text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream"
          >
            Nieuw in de Islam
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-cream/70 mt-4 text-base max-w-xl mx-auto"
          >
            Een warme verwelkoming en begeleiding voor iedereen die de Islam wil ontdekken
          </motion.p>
        </div>
      </section>

      {/* Begeleiding sectie */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-6">Begeleiding vanuit de moskee</h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              Wij vanuit Moskee Nahda bieden persoonlijke begeleiding aan voor iedereen die geïnteresseerd is in de islam. 
              Of je nu vragen hebt, meer informatie wilt of wilt bespreken hoe je je kunt bekeren — je bent van harte welkom.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed">
              Van een eerste kennismakingsgesprek tot het uitspreken van de shahada en het ontvangen van je officiële 
              bekeringscertificaat: wij begeleiden je stap voor stap. Je hoeft deze reis niet alleen te maken. 
              Onze imam en gemeenschap staan klaar om je te ondersteunen, op jouw tempo en zonder enige druk.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Video */}
      <section className="py-16 bg-brown">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gold/20"
          >
            <video
              className="w-full aspect-[9/16] object-cover"
              controls
              preload="metadata"
              playsInline
            >
              <source src="/media/bekeerlingen-video.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </section>

      <section className="py-16 islamic-pattern">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-muted-foreground text-base leading-relaxed">
              Of je nu al hebt besloten om moslim te worden, of nog aan het ontdekken bent —
              je bent van harte welkom. Onze moskee biedt een veilige en warme omgeving
              waar je op je eigen tempo kunt leren, vragen kunt stellen en je thuis kunt voelen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Koranvers */}
      <section className="py-12 bg-brown relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 islamic-pattern" />
        </div>
        <div className="container max-w-2xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="font-rabat2 text-2xl md:text-3xl text-cream leading-relaxed mb-4" dir="rtl">
              إِنَّ الدِّينَ عِندَ اللَّهِ الْإِسْلَامُ
            </p>
            <p className="text-cream/80 text-base italic mb-2">
              "Voorwaar, de godsdienst bij Allah is de Islam."
            </p>
            <p className="text-gold/60 text-xs">
              — Surah Aal-Imran 3:19
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stappen */}
      <section id="stappen" className="py-20 bg-background scroll-mt-20">
        <div className="container max-w-5xl">
          <SectionHeading
            subtitle="Het pad"
            title="Stappen naar de Islam"
            description="Het accepteren van de Islam is een persoonlijke reis. Hier zijn de belangrijkste stappen."
          />
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center p-8 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-5 mt-2">
                  <step.icon className="text-primary" size={30} />
                </div>
                <h3 className="font-heading text-xl text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 islamic-pattern scroll-mt-20">
        <div className="container max-w-3xl">
          <SectionHeading
            subtitle="Vragen"
            title="Veelgestelde vragen"
            description="Antwoorden op de meest voorkomende vragen over bekering tot de Islam."
          />
          <div className="space-y-4 mt-12">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <MessageCircle className="text-primary" size={16} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-foreground mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact formulier */}
      <section id="contact" className="py-20 bg-background scroll-mt-20">
        <div className="container max-w-3xl">
          <SectionHeading
            subtitle="Contact"
            title="Neem contact op"
            description="Heb je vragen of wil je een afspraak maken? Vul het formulier in en wij helpen je graag verder."
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 md:p-10 border border-border shadow-xl mt-12"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Naam *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.naam}
                    onChange={(e) => setForm({ ...form, naam: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                    placeholder="Uw naam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">E-mail *</label>
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                    placeholder="uw@email.nl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Telefoonnummer</label>
                <input
                  type="tel"
                  maxLength={20}
                  value={form.telefoon}
                  onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                  placeholder="+31 6 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Uw bericht *</label>
                <textarea
                  required
                  maxLength={2000}
                  rows={4}
                  value={form.bericht}
                  onChange={(e) => setForm({ ...form, bericht: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground resize-none"
                  placeholder="Stel uw vraag of vertel ons hoe wij u kunnen helpen..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-gold text-primary-foreground px-10 py-3.5 rounded-full font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(200,148,63,0.3)] hover:shadow-[0_6px_28px_rgba(200,148,63,0.45)] hover:scale-[1.02]"
              >
                <Send size={18} /> {loading ? "Verzenden..." : "Verstuur bericht"}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
