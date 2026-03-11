import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import donerenHero from "@/assets/media/doneren-hero.jpg";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Bedankt() {
  const { t } = useLanguage();

  return (
    <>
      <section className="relative bg-brown py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={donerenHero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brown/70" />
        </div>
        <div className="container relative text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl text-cream"
          >
            {t.donate.thankYou}
          </motion.h1>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-12 border border-border"
          >
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="font-heading text-2xl text-foreground mb-4">
              {t.donate.donationReceived}
            </h2>
            <p className="text-muted-foreground mb-2">
              {t.donate.donationReceivedDesc}
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              De definitieve status van uw betaling wordt via onze betalingsverwerker bevestigd.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/doneren"
                className="bg-gradient-gold text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                {t.donate.anotherDonation}
              </Link>
              <Link
                to="/"
                className="border border-border text-foreground px-6 py-3 rounded-full font-semibold hover:bg-accent transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> Terug naar home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
