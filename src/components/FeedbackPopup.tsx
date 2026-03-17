import { useState } from "react";
import { MessageSquare, X, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !bericht.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback" as any).insert({
        email: email.trim(),
        bericht: bericht.trim(),
      });

      if (error) throw error;

      // Send admin notification + user confirmation
      const feedbackData = { email: email.trim(), bericht: bericht.trim() };
      supabase.functions.invoke("send-email", {
        body: { type: "feedback_admin", data: feedbackData },
      });
      supabase.functions.invoke("send-email", {
        body: { type: "feedback_confirmation", data: feedbackData },
      });

      setSent(true);
    } catch {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      setBericht("");
    }, 300);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-brown text-cream p-3.5 rounded-full shadow-lg hover:bg-brown-light transition-colors group"
            aria-label="Feedback geven"
          >
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50 w-[340px] bg-cream rounded-2xl shadow-2xl border border-cream-dark overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brown px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-gold font-semibold text-sm">Feedback</h3>
                <p className="text-cream/70 text-xs mt-0.5">Help ons de website te verbeteren</p>
              </div>
              <button onClick={handleClose} className="text-cream/50 hover:text-cream transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="text-brown font-semibold text-sm">Bedankt voor je feedback!</p>
                  <p className="text-brown/60 text-xs mt-1">Je ontvangt een bevestiging per e-mail.</p>
                  <button
                    onClick={handleClose}
                    className="mt-4 text-xs text-gold-dark hover:text-gold font-medium transition-colors"
                  >
                    Sluiten
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-brown/70 mb-1 block">E-mailadres *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-cream-dark bg-white text-brown placeholder:text-brown/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brown/70 mb-1 block">Je feedback *</label>
                    <textarea
                      required
                      value={bericht}
                      onChange={(e) => setBericht(e.target.value)}
                      placeholder="Wat kan er beter? Wat vind je goed?"
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-cream-dark bg-white text-brown placeholder:text-brown/30 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !bericht.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-brown text-cream py-2.5 rounded-lg text-sm font-semibold hover:bg-brown-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Verstuur feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
