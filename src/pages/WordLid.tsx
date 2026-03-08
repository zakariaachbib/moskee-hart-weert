import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Send } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";

export default function WordLid() {
  const { toast } = useToast();
  const [form, setForm] = useState({ naam: "", email: "", telefoon: "", adres: "", geboortedatum: "", opmerking: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Aanmelding ontvangen!", description: "Wij nemen zo snel mogelijk contact met u op." });
      setForm({ naam: "", email: "", telefoon: "", adres: "", geboortedatum: "", opmerking: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Word Lid
          </motion.h1>
          <p className="text-cream/70 mt-4">Sluit je aan bij onze gemeenschap</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-3xl">
          <SectionHeading
            subtitle="Lidmaatschap"
            title="Meld je aan als lid"
            description="Word lid van Stichting Islamitische Moskee Weert en draag bij aan onze gemeenschap."
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="text-primary" size={24} />
              <h3 className="font-heading text-xl text-foreground">Aanmeldingsformulier</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Volledige naam *</label>
                  <input type="text" required maxLength={100} value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="Uw volledige naam" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">E-mail *</label>
                  <input type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="uw@email.nl" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefoonnummer</label>
                  <input type="tel" maxLength={20} value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="+31 6 12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Geboortedatum</label>
                  <input type="date" value={form.geboortedatum} onChange={(e) => setForm({ ...form, geboortedatum: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Adres</label>
                <input type="text" maxLength={200} value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="Straat, Postcode, Plaats" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Opmerking</label>
                <textarea maxLength={1000} rows={3} value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none" placeholder="Optionele opmerking..." />
              </div>
              <button type="submit" disabled={loading}
                className="bg-gradient-gold text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                <Send size={16} /> {loading ? "Verzenden..." : "Aanmelden"}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
