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
                    <a href="https://wa.me/31616958298?text=Assalamu%20alaikum%2C%20ik%20wil%20graag%20een%20rondleiding%20aanvragen." target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                    <p className="text-xs text-muted-foreground mt-3">Voor vragen over rondleidingen kunt u contact opnemen met de coördinator.</p>
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
