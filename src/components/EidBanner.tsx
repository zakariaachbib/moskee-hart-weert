import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EidBanner() {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden bg-primary/95 border-b border-gold/20"
        >
          <div className="relative flex items-center justify-center gap-3 px-8 py-2 text-center">
            <p className="text-sm md:text-base text-primary-foreground/90 tracking-wide">
              <span className="inline-block mr-2 text-gold" style={{ fontFamily: "Rabat3" }}>عيد مبارك</span>
              <span className="hidden sm:inline mx-1 text-gold/50">·</span>
              <span className="block sm:inline">
                Eid-gebed om <span className="font-semibold text-gold">08:30 uur</span> in de Nahda Moskee
              </span>
            </p>
            <button
              onClick={() => setVisible(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Sluiten"
            >
              <X className="h-3.5 w-3.5 text-primary-foreground/60" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}