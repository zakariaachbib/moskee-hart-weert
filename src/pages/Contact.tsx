import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
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
      supabase.functions.invoke("send-email", { body: { type: "contact", data: trimmed } }).catch(console.error);
      toast({ title: t.contact.sent, description: t.contact.sentDesc });
      setForm({ naam: "", email: "", onderwerp: "", bericht: "" });
    } catch {
      toast({ title: t.contact.error, description: t.contact.errorDesc, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.contact.title}
          </motion.h1>
          <p className="text-cream/70 mt-4">{t.contact.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <SectionHeading subtitle={t.contact.reachUs} title={t.contact.contactDetails} />
              <div className="flex flex-col gap-6">
                <a href="tel:+31495546218" className="flex items-start gap-4 group">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors"><Phone className="text-primary" size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.contact.phone}</p>
                    <p className="font-semibold text-foreground">+31 495 546 218</p>
                  </div>
                </a>
                <a href="mailto:info@simweert.nl" className="flex items-start gap-4 group">
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors"><Mail className="text-primary" size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.contact.emailLabel}</p>
                    <p className="font-semibold text-foreground">info@simweert.nl</p>
                  </div>
                </a>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl"><MapPin className="text-primary" size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.contact.address}</p>
                    <p className="font-semibold text-foreground">Charitastraat 4</p>
                    <p className="text-muted-foreground text-sm">6001 XT Weert</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <iframe src="https://maps.google.com/maps?q=Charitastraat+4,+6001+XT+Weert,+Netherlands&t=&z=16&ie=UTF8&iwloc=&output=embed" className="w-full h-48 rounded-xl border-0" allowFullScreen loading="lazy" title="Moskee Nahda - Charitastraat 4, Weert" />
                <a href="https://maps.app.goo.gl/XN5nYzsP9svnRUwQ9" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                  <MapPin size={14} /> {t.contact.viewOnMaps}
                </a>
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionHeading subtitle={t.contact.sendMessage} title={t.contact.contactForm} />
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t.contact.name}</label>
                    <input type="text" required maxLength={100} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.contact.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t.contact.email}</label>
                    <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.contact.email} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">{t.contact.subject}</label>
                  <input type="text" required maxLength={200} value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.contact.subject} />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-1">{t.contact.message}</label>
                  <textarea required maxLength={2000} rows={5} value={form.bericht} onChange={(e) => setForm({ ...form, bericht: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none" placeholder={t.contact.message} />
                </div>
                <button type="submit" disabled={loading} className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                  <Send size={16} /> {loading ? t.contact.sending : t.contact.send}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
