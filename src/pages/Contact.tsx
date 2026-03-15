import { useState, useMemo } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Clock, Users, Coffee, Landmark, MessageCircle, CalendarDays, CheckCircle2 } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const timelineSteps = [
  { icon: Users, minutes: 5, key: "welcome" as const },
  { icon: Landmark, minutes: 15, key: "presentation" as const },
  { icon: MapPin, minutes: 20, key: "tour" as const },
  { icon: Coffee, minutes: 10, key: "snacks" as const },
  { icon: MessageCircle, minutes: 10, key: "closing" as const },
];

const TOUR_TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ naam: "", email: "", onderwerp: "Rondleiding aanvraag", bericht: "" });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    setSelectedTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateStr = selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: nl }) : "";
      const timeInfo = dateStr ? `\n\nGewenste datum: ${dateStr}${selectedTime ? `\nVoorkeurstijd: ${selectedTime}` : ""}` : "";
      
      const trimmed = {
        naam: form.naam.trim(),
        email: form.email.trim(),
        onderwerp: form.onderwerp.trim(),
        bericht: form.bericht.trim() + timeInfo,
      };
      const { error } = await supabase.from("contact_messages").insert(trimmed);
      if (error) throw error;
      supabase.functions.invoke("send-email", { body: { type: "contact", data: trimmed } }).catch(console.error);
      toast({ title: t.contact.sent, description: t.contact.sentDesc });
      setForm({ naam: "", email: "", onderwerp: "Rondleiding aanvraag", bericht: "" });
      setSelectedDate(undefined);
      setSelectedTime("");
      setSubmitted(true);
    } catch {
      toast({ title: t.contact.error, description: t.contact.errorDesc, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.contact.title}
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-2xl mx-auto">{t.contact.subtitle}</p>
        </div>
      </section>

      {/* Tour Info */}
      <section className="py-16 islamic-pattern">
        <div className="container max-w-5xl">
          {/* Intro */}
          <div className="text-center mb-12">
            <SectionHeading subtitle={t.contact.reachUs} title={t.contact.contactDetails} />
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t.contact.tourIntro}
            </p>
          </div>

          {/* Highlights */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t.contact.duration}</h3>
              <p className="text-sm text-muted-foreground">{t.contact.durationDesc}</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t.contact.hostTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.contact.hostDesc}</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t.contact.snacksTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.contact.snacksDesc}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <SectionHeading subtitle={t.contact.programSubtitle} title={t.contact.programTitle} />
            <div className="max-w-2xl mx-auto">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                const label = t.contact.timeline[step.key];
                const desc = t.contact.timelineDesc[step.key];
                return (
                  <div key={step.key} className="flex gap-4 mb-0">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="text-primary" size={20} />
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className="w-0.5 bg-border flex-1 my-1" />
                      )}
                    </div>
                    <div className="pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {step.minutes} min
                        </span>
                        <h4 className="font-semibold text-foreground">{label}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>{t.contact.totalDuration}</span>
            </div>
          </div>

          {/* Prayer times note */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-16 text-center">
            <p className="text-foreground font-medium">{t.contact.prayerTimesNote}</p>
          </div>

          {/* Calendar + Form + Contact */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-8 border border-border text-center max-w-lg mx-auto"
            >
              <CheckCircle2 className="text-primary mx-auto mb-4" size={48} />
              <h3 className="font-heading text-xl mb-2">{t.contact.sent}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t.contact.sentDesc}</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-primary hover:underline font-medium"
              >
                Nieuwe aanvraag indienen
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Calendar + Time */}
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="text-primary" size={18} />
                      <h3 className="font-semibold text-foreground">Kies een gewenste datum</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Selecteer een datum voor uw rondleiding. Wij bevestigen de beschikbaarheid.</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      locale={nl}
                      disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                      className="p-3 pointer-events-auto w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_cell]:flex-1 [&_.rdp-cell]:flex-1 [&_.rdp-row]:flex [&_.rdp-head_row]:flex [&_.rdp-day]:h-12 [&_.rdp-day]:w-full"
                    />
                    {selectedDate && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-center">
                        <span className="font-medium text-foreground">
                          {format(selectedDate, "EEEE d MMMM yyyy", { locale: nl })}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Preferred time */}
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="text-primary" size={18} />
                        <h3 className="font-semibold text-foreground">Kies een voorkeurstijd</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">De rondleiding duurt 60 minuten. Wij stemmen het exacte tijdstip af op de gebedstijden.</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {TOUR_TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={cn(
                              "py-2.5 px-2 rounded-lg text-sm font-medium border transition-all",
                              selectedTime === slot
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:border-primary hover:text-primary"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {selectedTime && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-muted-foreground text-center">
                          Voorkeur: <strong className="text-foreground">{selectedTime} – {
                            (() => {
                              const [h, m] = selectedTime.split(":").map(Number);
                              return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                            })()
                          }</strong> (60 min)
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Right: Form + Coordinator */}
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="text-primary" size={18} />
                      <h3 className="font-semibold text-foreground">Uw gegevens</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t.contact.name} *</label>
                        <input type="text" required maxLength={100} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.contact.name} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t.contact.email} *</label>
                        <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder={t.contact.email} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-1">{t.contact.message}</label>
                      <textarea maxLength={2000} rows={4} value={form.bericht} onChange={(e) => setForm({ ...form, bericht: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none" placeholder={t.contact.messagePlaceholder} />
                    </div>
                    <button type="submit" disabled={loading || !form.naam.trim() || !form.email.includes("@")} className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                      <Send size={16} /> {loading ? t.contact.sending : t.contact.send}
                    </button>
                  </div>

                  {/* Coordinator */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Rondleidingscoördinator</p>
                    <p className="font-semibold text-foreground">Tarik Ghanmi</p>
                    <a href="tel:+31616958298" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                      <Phone size={13} /> +31 6 16958298
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">Voor vragen over rondleidingen kunt u contact opnemen met de coördinator.</p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
