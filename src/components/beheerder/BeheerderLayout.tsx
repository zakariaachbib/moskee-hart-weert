import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import BeheerderSidebar from "./BeheerderSidebar";
import BeheerderBottomNav from "./BeheerderBottomNav";

export default function BeheerderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isBeheerder, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const allowed = isAdmin === true || isBeheerder === true;

  useEffect(() => {
    if (!loading && (!user || (isAdmin === false && isBeheerder === false))) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, isBeheerder, loading, navigate]);

  if (loading || (user && isAdmin === null && isBeheerder === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowed) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <BeheerderSidebar />
      <main className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto w-full lg:px-6 lg:py-8"
            style={{ maxWidth: "832px" }}
          >
            <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <BeheerderBottomNav />
    </div>
  );
}
