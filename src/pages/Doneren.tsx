import { motion } from "framer-motion";
import { Heart, CreditCard, Building } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const donationOptions = [
  { amount: "€10", desc: "Dagelijkse bijdrage", period: "eenmalig" },
  { amount: "€25", desc: "Wekelijkse bijdrage", period: "eenmalig" },
  { amount: "€50", desc: "Maandelijkse bijdrage", period: "per maand" },
  { amount: "€100", desc: "Grote bijdrage", period: "eenmalig" },
];

export default function Doneren() {
  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Doneren
          </motion.h1>
          <p className="text-cream/70 mt-4">Steun onze moskee en gemeenschap</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-4xl">
          <SectionHeading
            subtitle="Sadaqah & Zakaat"
            title="Uw bijdrage maakt het verschil"
            description="Uw donatie helpt ons bij het onderhouden van de moskee, het organiseren van activiteiten en het bieden van onderwijs aan onze gemeenschap."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {donationOptions.map((d, i) => (
              <motion.div
                key={d.amount}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center border-2 border-border hover:border-primary transition-colors cursor-pointer"
              >
                <span className="block text-3xl font-bold text-primary">{d.amount}</span>
                <span className="block text-sm text-muted-foreground mt-1">{d.desc}</span>
                <span className="block text-xs text-muted-foreground/60 mt-1">{d.period}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <h3 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-2">
              <Building className="text-primary" /> Bankoverschrijving
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rekeninghouder</p>
                <p className="font-semibold text-foreground">Stichting Islamitische Moskee</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">IBAN</p>
                <p className="font-semibold text-foreground font-mono">NL00 BANK 0000 0000 00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">BIC</p>
                <p className="font-semibold text-foreground font-mono">BANKBIC</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Omschrijving</p>
                <p className="font-semibold text-foreground">Donatie SIM Weert</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Sadaqah", desc: "Vrijwillige liefdadigheid ter verbetering van de gemeenschap." },
              { icon: CreditCard, title: "Zakaat", desc: "Verplichte aalmoes, een van de vijf zuilen van de Islam." },
              { icon: Building, title: "Moskee Onderhoud", desc: "Bijdrage aan het onderhoud en verbetering van onze moskee." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
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
