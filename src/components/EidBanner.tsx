import { useState } from "react";
import { X, Star } from "lucide-react";
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
          className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-primary-foreground shadow-lg"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M10%200l2%206h6l-5%204%202%206-5-4-5%204%202-6-5-4h6z%22%20fill%3D%22%23fff%22%20opacity%3D%220.08%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex items-center justify-center gap-3 px-4 py-2.5 text-center">
            <Star className="h-4 w-4 text-white fill-white animate-pulse flex-shrink-0" />
            <p className="text-sm md:text-base font-bold text-white tracking-wide">
              <span className="inline-block mr-2" style={{ fontFamily: "Rabat3" }}>عيد مبارك</span>
              <span className="hidden sm:inline mx-1.5">—</span>
              <span className="block sm:inline">
                Eid-gebed op <span className="underline decoration-2 underline-offset-2">zondag 30 maart</span> om <span className="underline decoration-2 underline-offset-2">08:30 uur</span> in de Nahda Moskee
              </span>
            </p>
            <Star className="h-4 w-4 text-white fill-white animate-pulse flex-shrink-0" />
            <button
              onClick={() => setVisible(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Sluiten"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
