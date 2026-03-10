import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface Activity {
  id: string;
  titel: string;
  omschrijving: string | null;
  dag: string | null;
  tijd: string | null;
  locatie: string | null;
}

const fallbackActivities: Activity[] = [
  { id: "1", titel: "Vrijdaggebed", omschrijving: "Wekelijks vrijdaggebed met khutbah", dag: "Elke vrijdag", tijd: "12:30 - 13:30", locatie: "Gebedshal" },
  { id: "2", titel: "Arabische Les - Kinderen", omschrijving: "Arabische taal en Quran lessen voor kinderen", dag: "Za & Zo", tijd: "10:00 - 13:00", locatie: "Klaslokalen" },
  { id: "3", titel: "Islamitische Les - Volwassenen", omschrijving: "Wekelijkse les over islamitische onderwerpen", dag: "Elke zaterdag", tijd: "20:00 - 21:30", locatie: "Gebedshal" },
  { id: "4", titel: "Quran Recitatie", omschrijving: "Leer de juiste uitspraak en recitatie van de Quran", dag: "Elke zondag", tijd: "14:00 - 16:00", locatie: "Klaslokaal 1" },
  { id: "5", titel: "Iftar (Ramadan)", omschrijving: "Gezamenlijke iftar tijdens de maand Ramadan", dag: "Tijdens Ramadan", tijd: "Bij zonsondergang", locatie: "Eetzaal" },
  { id: "6", titel: "Eid Gebed", omschrijving: "Feestgebed ter ere van Eid al-Fitr en Eid al-Adha", dag: "Op Eid dagen", tijd: "08:00", locatie: "Gebedshal" },
];

export default function Activiteiten() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>(fallbackActivities);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("id, titel, omschrijving, dag, tijd, locatie")
        .eq("actief", true)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) setActivities(data);
    };
    fetchActivities();
  }, []);

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.activities.title}
          </motion.h1>
          <p className="text-cream/70 mt-4">{t.activities.subtitle}</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading subtitle={t.activities.agendaSubtitle} title={t.activities.agendaTitle} />
          <div className="grid md:grid-cols-2 gap-6">
            {activities.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
              >
                <h3 className="font-heading text-xl text-foreground mb-2">{a.titel}</h3>
                {a.omschrijving && <p className="text-muted-foreground text-sm mb-4">{a.omschrijving}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {a.dag && <span className="flex items-center gap-1"><Calendar size={14} className="text-primary" /> {a.dag}</span>}
                  {a.tijd && <span className="flex items-center gap-1"><Clock size={14} className="text-primary" /> {a.tijd}</span>}
                  {a.locatie && <span className="flex items-center gap-1"><MapPin size={14} className="text-primary" /> {a.locatie}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
