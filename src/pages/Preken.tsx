import { motion } from "framer-motion";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeading from "@/components/SectionHeading";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { X } from "lucide-react";
import imamPreekHero from "@/assets/media/imam-preek-hero-2.jpg";

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

  const getPublicUrl = (path: string, downloadFilename?: string) => {
    const { data } = supabase.storage
      .from("sermons")
      .getPublicUrl(path, downloadFilename ? { download: downloadFilename } : undefined);

    return data.publicUrl;
  };

  const getDownloadUrl = (path: string, filename: string) => {
    const { data } = supabase.storage
      .from("sermons")
      .getPublicUrl(path, { download: filename });
    return data.publicUrl;
  };

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || "application/pdf" });

      const isIOSSafari =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        /Safari/.test(navigator.userAgent) &&
        !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

      if (isIOSSafari && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {/* Hero with imam photo */}
      <section className="relative bg-brown overflow-hidden min-h-[350px] md:min-h-[400px]">
        <div className="absolute inset-0">
          <img src={imamPreekHero} alt="Imam Dr. Ayoub ben Aicha tijdens de khutba" className="w-full h-full object-cover opacity-60 object-[center_15%] md:object-[center_25%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brown/40 to-brown" />
        </div>
        <div className="container relative text-center py-24 md:py-32 flex flex-col items-center justify-end min-h-[350px] md:min-h-[400px]">
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

      {/* Belang van Jumu'ah */}
      <section className="py-16 bg-card">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <p className="font-heading text-xl md:text-3xl text-primary leading-relaxed break-words overflow-wrap-anywhere" dir="rtl">
              يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <span className="text-foreground font-medium">"O jullie die geloven, wanneer de oproep tot het gebed op vrijdag wordt gedaan, haast jullie dan naar het gedenken van Allah en laat de handel achter."</span>
              <br />
              <span className="text-sm italic mt-2 inline-block">— Surah Al-Jumu'ah (62:9)</span>
            </p>
            <div className="w-16 h-px bg-primary/30 mx-auto" />
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Het vrijdaggebed (Salat al-Jumu'ah) is een wekelijkse verplichting voor iedere moslim. De khutba (preek) die eraan voorafgaat is een bron van kennis, herinnering en spirituele versterking. Om deze wijsheid toegankelijk te maken voor iedereen, bieden wij hier de Nederlandse vertalingen van onze preken aan.
            </p>
          </motion.div>
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
                const viewUrl = getPublicUrl(sermon.bestandspad);
                const downloadUrl = getPublicUrl(sermon.bestandspad, sermon.bestandsnaam);

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
                    <div className="flex items-center gap-2 sm:flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const isMobile = window.matchMedia("(max-width: 768px)").matches;
                          if (isMobile) {
                            window.open(viewUrl, "_blank", "noopener,noreferrer");
                          } else {
                            setViewingPdf(viewUrl);
                          }
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
                      >
                        <Eye className="w-4 h-4" /> Bekijken
                      </button>
                      <button
                        onClick={() => handleDownload(downloadUrl, sermon.bestandsnaam)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
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
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4"
          onClick={() => setViewingPdf(null)}
        >
          <div className="w-full max-w-4xl flex justify-end mb-2">
            <button
              onClick={() => setViewingPdf(null)}
              className="text-white/70 hover:text-white"
            >
              <X className="h-8 w-8" />
            </button>
          </div>
          <div className="w-full max-w-4xl flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={viewingPdf}
              className="w-full h-full rounded-lg bg-white"
              style={{ minHeight: '70vh', maxHeight: '85vh' }}
              title="PDF Viewer"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
