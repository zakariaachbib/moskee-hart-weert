import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";

export default function OverOns() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Over Ons
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-2xl mx-auto">Leer meer over Stichting Islamitische Moskee Weert</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-4xl">
          <SectionHeading subtitle="Onze Missie" title="Een sterke gemeenschap opbouwen" />
          <div className="space-y-4 mx-auto text-muted-foreground text-base leading-relaxed">
            <p>
              Stichting Islamitische Moskee Weert (مسجد النهضة) is een bruisend centrum voor de islamitische gemeenschap in Weert en omgeving. 
              Wij zijn toegewijd aan het opbouwen van een sterke, verbonden gemeenschap die gebaseerd is op de waarden van de Islam.
            </p>
            <p>
              Onze moskee biedt een breed scala aan diensten, waaronder dagelijkse gebeden, vrijdaggebed (Jumu'ah), 
              islamitisch en arabisch onderwijs voor kinderen en volwassenen, en diverse gemeenschapsactiviteiten.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container">
          <SectionHeading subtitle="Onze Visie" title="Samen groeien, bouwen en inspireren" />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Gemeenschap", desc: "Een veilige en gastvrije plek voor iedereen, ongeacht achtergrond." },
              { title: "Onderwijs", desc: "Kwalitatief islamitisch onderwijs voor alle leeftijden." },
              { title: "Integratie", desc: "Bruggen bouwen tussen culturen en bijdragen aan de samenleving." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-background rounded-2xl p-8 border border-border"
              >
                <h3 className="font-heading text-2xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 overflow-hidden">
        <div className="container max-w-4xl mb-8">
          <SectionHeading subtitle="Faciliteiten" title="Wat bieden wij?" />
        </div>
        <div className="relative w-full">
          <div className="flex animate-marquee gap-4 w-max">
            {[
              "Gebedsruimte voor mannen",
              "Gebedsruimte voor vrouwen",
              "Wasruimte (wudu)",
              "Kinderlessen",
              "Toegankelijk voor mindervaliden",
              "Janaza gebed",
              "Eid gebed",
              "Ramadan iftar",
              "Parkeerplaats",
              "Verhuur zalen",
              "Verhuur keuken",
              "Gebedsruimte voor mannen",
              "Gebedsruimte voor vrouwen",
              "Wasruimte (wudu)",
              "Kinderlessen",
              "Toegankelijk voor mindervaliden",
              "Janaza gebed",
              "Eid gebed",
              "Ramadan iftar",
              "Parkeerplaats",
              "Verhuur zalen",
              "Verhuur keuken",
            ].map((f, i) => (
              <div key={`${f}-${i}`} className="bg-card rounded-xl px-6 py-4 text-center border border-border shrink-0">
                <span className="text-sm text-foreground whitespace-nowrap">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
