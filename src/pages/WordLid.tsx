import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Send, Users, Heart } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

export default function WordLid() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", adres: "", geboortedatum: "", opmerking: "" });
  const [loading, setLoading] = useState(false);

  const benefits = [
    { icon: Users, title: t.membership.communityTitle, desc: t.membership.communityDesc },
    { icon: Heart, title: t.membership.supportTitle, desc: t.membership.supportDesc },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmed = {
        naam: form.naam.trim(), email: form.email.trim(),
        telefoon: form.telefoon.trim() || null, adres: form.adres.trim() || null,
        geboortedatum: form.geboortedatum || null, opmerking: form.opmerking.trim() || null,
      };
      const { error } = await supabase.from("membership_requests").insert(trimmed);
      if (error) throw error;
      supabase.functions.invoke("send-email", { body: { type: "membership", data: trimmed } }).catch(console.error);
      toast({ title: t.membership.submitted, description: t.membership.submittedDesc });
      setForm({ naam: "", email: "", telefoon: "", adres: "", geboortedatum: "", opmerking: "" });
    } catch {
      toast({ title: t.membership.error, description: t.membership.errorDesc, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative bg-brown py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 islamic-pattern" /></div>
        <div className="container relative text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 mb-6">
            <UserPlus className="text-gold" size={36} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="font-heading text-4xl md:text-5xl lg:text-6xl text-cream">{t.membership.title}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-cream/70 mt-4 text-lg max-w-xl mx-auto">{t.membership.subtitle}</motion.p>
        </div>
      </section>

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

      <section className="py-12 bg-brown relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0 islamic-pattern" /></div>
        <div className="container max-w-2xl relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <p className="font-rabat2 text-2xl md:text-3xl text-cream leading-relaxed mb-4" dir="rtl">وَمَن يُوقَ شُحَّ نَفْسِهِ فَأُولَـٰئِكَ هُمُ الْمُفْلِحُونَ</p>
            <p className="text-cream/80 text-base italic mb-2">"En wie behoed wordt voor de gierigheid van zijn eigen ziel, zij zijn degenen die succesvol zijn."</p>
            <p className="text-gold/60 text-xs">— Surah Al-Hashr 59:9</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-3xl">
          <SectionHeading subtitle={t.membership.formSubtitle} title={t.membership.formTitle} description={t.membership.formDesc} />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 md:p-10 border border-border shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.fullName} *</label>
                  <input type="text" required maxLength={100} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" placeholder={t.membership.fullName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.email} *</label>
                  <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" placeholder={t.membership.email} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.phone}</label>
                  <input type="tel" maxLength={20} value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" placeholder="+31 6 12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.dob}</label>
                  <input type="date" value={form.geboortedatum} onChange={(e) => setForm({ ...form, geboortedatum: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.addressLabel}</label>
                <input type="text" maxLength={200} value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground" placeholder={t.membership.addressPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.membership.remark}</label>
                <textarea maxLength={1000} rows={3} value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground resize-none" placeholder={t.membership.remark} />
              </div>
              <button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-gold text-primary-foreground px-10 py-3.5 rounded-full font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(200,148,63,0.3)] hover:shadow-[0_6px_28px_rgba(200,148,63,0.45)] hover:scale-[1.02]">
                <Send size={18} /> {loading ? t.membership.submitting : t.membership.submit}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
