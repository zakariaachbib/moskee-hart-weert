import { motion } from "framer-motion";
import { Image, Video, Archive } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

export default function Media() {
  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Media & Archief
          </motion.h1>
          <p className="text-cream/70 mt-4">Foto's, video's en archief van onze moskee</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-5xl">
          <SectionHeading subtitle="Galerij" title="Media" description="Bekijk foto's en video's van onze moskee, evenementen en activiteiten." />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Image, title: "Foto's", desc: "Bekijk onze fotogalerij van evenementen en de moskee.", count: "Binnenkort beschikbaar" },
              { icon: Video, title: "Video's", desc: "Lezingen, vrijdagpreken en evenementen.", count: "Binnenkort beschikbaar" },
              { icon: Archive, title: "Archief", desc: "Historische documenten en foto's van onze moskee.", count: "Binnenkort beschikbaar" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card rounded-2xl p-8 border border-border text-center"
              >
                <item.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-xl text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{item.desc}</p>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{item.count}</span>
              </motion.div>
            ))}
          </div>

          <div className="bg-brown rounded-2xl p-12 text-center">
            <h3 className="font-heading text-2xl text-cream mb-3">Media wordt binnenkort toegevoegd</h3>
            <p className="text-cream/70 max-w-xl mx-auto">
              We werken aan het opzetten van onze mediapagina. Binnenkort kunt u hier foto's, video's en archief materiaal bekijken.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
