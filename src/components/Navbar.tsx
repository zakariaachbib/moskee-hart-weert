import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.gif";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Over Ons", to: "/over-ons" },
  { label: "Gebedstijden", to: "/gebedstijden" },
  { label: "Activiteiten", to: "/activiteiten" },
  { label: "Onderwijs", to: "/onderwijs" },
  { label: "Media", to: "/media" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-brown/95 backdrop-blur-md shadow-lg">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="SIM Weert Logo" className="h-14 w-14 rounded-lg bg-cream/10 p-0.5" />
          <div className="hidden sm:block">
            <span className="block text-cream font-heading text-lg leading-tight">مسجد النهضة</span>
            <span className="block text-cream/60 text-[11px] tracking-wide">Stichting Islamitische Moskee</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                location.pathname === link.to
                  ? "text-gold"
                  : "text-cream/75 hover:text-cream"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user && isAdmin ? (
            <>
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 text-cream/60 hover:text-cream px-3 py-2 text-[13px] transition-colors"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-cream/60 hover:text-cream px-3 py-2 text-[13px] transition-colors"
              >
                <LogOut size={15} /> Uitloggen
              </button>
            </>
          ) : null}
          <Link
            to="/doneren"
            className="bg-gradient-gold text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            Doneren
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-cream p-2"
            aria-label="Menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-cream/10"
          >
            <div className="container py-4 flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "text-gold bg-cream/5"
                      : "text-cream/70 hover:text-cream hover:bg-cream/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile auth links */}
              <div className="mt-3 pt-3 border-t border-cream/10">
                {user && isAdmin ? (
                  <>
                    <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-cream text-sm">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <button onClick={() => { handleSignOut(); setOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-cream text-sm w-full text-left">
                      <LogOut size={16} /> Uitloggen
                    </button>
                  </>
                ) : (
                  <Link to="/admin/login" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-cream/70 hover:text-cream text-sm">
                    <LogIn size={16} /> Inloggen
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
