import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ naam: "", email: "", onderwerp: "", bericht: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmed = {
        naam: form.naam.trim(),
        email: form.email.trim(),
        onderwerp: form.onderwerp.trim(),
        bericht: form.bericht.trim(),
      };
      const { error } = await supabase.from("contact_messages").insert(trimmed);
      if (error) throw error;
      // Send email notification (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: { type: "contact", data: trimmed },
      }).catch(console.error);
      toast({ title: "Bericht verzonden!", description: "Wij nemen zo snel mogelijk contact met u op." });
      setForm({ naam: "", email: "", onderwerp: "", bericht: "" });
    } catch {
      toast({ title: "Fout", description: "Er is iets misgegaan. Probeer het later opnieuw.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Contact
          </motion.h1>
          <p className="text-cream/70 mt-4">Neem contact met ons op</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <SectionHeading subtitle="Bereik ons" title="Contactgegevens" />
              <div className="flex flex-col gap-6">
                <a href="tel:+31495546218" className="flex items-start gap-4 group">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefoon</p>
                    <p className="font-semibold text-foreground">+31 495 546 218</p>
                  </div>
                </a>
                <a href="mailto:info@simweert.nl" className="flex items-start gap-4 group">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-semibold text-foreground">info@simweert.nl</p>
                  </div>
                </a>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adres</p>
                    <p className="font-semibold text-foreground">Charitastraat 4</p>
                    <p className="text-muted-foreground text-sm">6001 XT Weert</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2508.5!2d5.7084!3d51.2517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c0b9f3b4b4b4b5%3A0x0!2sCharitastraat+4%2C+6001+XT+Weert!5e0!3m2!1snl!2snl!4v1"
                  className="w-full h-48 rounded-xl border-0 cursor-pointer"
                  allowFullScreen
                  loading="lazy"
                  title="Moskee Nahda - Charitastraat 4, Weert"
                  onClick={() => window.open('https://maps.app.goo.gl/XN5nYzsP9svnRUwQ9', '_blank')}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionHeading subtitle="Stuur een bericht" title="Contactformulier" />
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Naam</label>
                    <input type="text" required maxLength={100} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="Uw naam" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
                    <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="uw@email.nl" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">Onderwerp</label>
                  <input type="text" required maxLength={200} value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="Onderwerp" />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-1">Bericht</label>
                  <textarea required maxLength={2000} rows={5} value={form.bericht} onChange={(e) => setForm({ ...form, bericht: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none" placeholder="Uw bericht..." />
                </div>
                <button type="submit" disabled={loading}
                  className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                  <Send size={16} /> {loading ? "Verzenden..." : "Verstuur bericht"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
