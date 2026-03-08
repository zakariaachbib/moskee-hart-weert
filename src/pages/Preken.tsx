import { motion } from "framer-motion";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeading from "@/components/SectionHeading";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { X } from "lucide-react";

export default function Preken() {
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ["sermons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("sermons").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <>
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl text-cream"
          >
            Preekvertalingen
          </motion.h1>
          <p className="text-cream/70 mt-4 max-w-xl mx-auto">
            Lees de Nederlandse vertalingen van de preken (khutba's) die in onze moskee worden gehouden.
          </p>
        </div>
      </section>

      <section className="py-16 islamic-pattern">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : sermons && sermons.length > 0 ? (
            <div className="space-y-4">
              {sermons.map((sermon, i) => {
                const url = getPublicUrl(sermon.bestandspad);
                return (
                  <motion.div
                    key={sermon.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg text-foreground truncate">{sermon.titel}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(sermon.datum), "d MMMM yyyy", { locale: nl })}</span>
                      </div>
                      {sermon.omschrijving && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{sermon.omschrijving}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <button
                        onClick={() => setViewingPdf(url)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
                      >
                        <Eye className="w-4 h-4" /> Bekijken
                      </button>
                      <a
                        href={url}
                        download={sermon.bestandsnaam}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl text-foreground mb-2">Nog geen preken beschikbaar</h3>
              <p className="text-muted-foreground text-sm">Binnenkort worden hier preekvertalingen geplaatst.</p>
            </div>
          )}
        </div>
      </section>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingPdf(null)}
        >
          <button
            onClick={() => setViewingPdf(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>
          <iframe
            src={viewingPdf}
            className="w-full max-w-4xl h-[85vh] rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
            title="PDF Viewer"
          />
        </motion.div>
      )}
    </>
  );
}
