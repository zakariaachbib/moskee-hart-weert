import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const activities = [
  { title: "Vrijdaggebed", desc: "Wekelijks vrijdaggebed met khutbah", day: "Elke vrijdag", time: "12:30 - 13:30", location: "Gebedshal" },
  { title: "Arabische Les - Kinderen", desc: "Arabische taal en Quran lessen voor kinderen", day: "Za & Zo", time: "10:00 - 13:00", location: "Klaslokalen" },
  { title: "Islamitische Les - Volwassenen", desc: "Wekelijkse les over islamitische onderwerpen", day: "Elke zaterdag", time: "20:00 - 21:30", location: "Gebedshal" },
  { title: "Quran Recitatie", desc: "Leer de juiste uitspraak en recitatie van de Quran", day: "Elke zondag", time: "14:00 - 16:00", location: "Klaslokaal 1" },
  { title: "Iftar (Ramadan)", desc: "Gezamenlijke iftar tijdens de maand Ramadan", day: "Tijdens Ramadan", time: "Bij zonsondergang", location: "Eetzaal" },
  { title: "Eid Gebed", desc: "Feestgebed ter ere van Eid al-Fitr en Eid al-Adha", day: "Op Eid dagen", time: "08:00", location: "Gebedshal" },
];

export default function Activiteiten() {
  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Activiteiten
          </motion.h1>
          <p className="text-cream/70 mt-4">Ontdek onze evenementen en activiteiten</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading subtitle="Agenda" title="Komende activiteiten" />
          <div className="grid md:grid-cols-2 gap-6">
            {activities.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
              >
                <h3 className="font-heading text-xl text-foreground mb-2">{a.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{a.desc}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={14} className="text-primary" /> {a.day}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-primary" /> {a.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-primary" /> {a.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
