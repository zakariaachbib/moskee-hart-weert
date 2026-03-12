import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import SectionHeading from "@/components/SectionHeading";

interface Project {
  id: string;
  titel: string;
  beschrijving: string | null;
  doelbedrag: number;
  opgehaald_bedrag: number;
  afbeelding_url: string | null;
  slug: string | null;
}

export default function CrowdfundingOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("crowdfunding_projects")
      .select("*")
      .eq("actief", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as Project[]);
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="container relative text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl text-cream"
          >
            Crowdfunding
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-xl mx-auto">
            Steun onze projecten en draag bij aan de gemeenschap
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="py-16 islamic-pattern">
        <div className="container max-w-5xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Er zijn momenteel geen actieve projecten.</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {projects.map((p, i) => {
                const pct = Math.min(100, Math.round((p.opgehaald_bedrag / p.doelbedrag) * 100));
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={`/crowdfunding/${p.slug || p.id}`}
                      className="block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <div className="grid md:grid-cols-[1fr_1.2fr]">
                        {/* Image */}
                        <div className="aspect-[16/10] md:aspect-auto bg-muted overflow-hidden">
                          {p.afbeelding_url ? (
                            <img
                              src={p.afbeelding_url}
                              alt={p.titel}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Heart size={48} className="text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                          <h2 className="font-heading text-2xl text-foreground mb-2 group-hover:text-primary transition-colors">
                            {p.titel}
                          </h2>
                          {p.beschrijving && (
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                              {p.beschrijving}
                            </p>
                          )}
                          {/* Progress */}
                          <div className="space-y-3">
                            <Progress value={pct} className="h-2.5" />
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-foreground">
                                €{p.opgehaald_bedrag.toLocaleString("nl-NL")}
                                <span className="font-normal text-muted-foreground">
                                  {" "}van €{p.doelbedrag.toLocaleString("nl-NL")}
                                </span>
                              </span>
                              <span className="text-primary font-semibold">{pct}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
