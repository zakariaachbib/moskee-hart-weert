import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.gif";

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

  return (
    <>
      {/* Top bar */}
      <div className="bg-brown hidden lg:block">
        <div className="container flex items-center justify-between py-2 text-sm text-cream">
          <div className="flex items-center gap-8">
            <a href="tel:+31495546218" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Phone size={14} /> +31 495 546 218
            </a>
            <a href="mailto:info@simweert.nl" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Mail size={14} /> info@simweert.nl
            </a>
            <span className="flex items-center gap-2">
              <MapPin size={14} /> Charitastraat 4, 6001 XT Weert
            </span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-gradient-gold shadow-lg">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="SIM Weert Logo" className="h-12 w-12" />
            <div className="hidden sm:block">
              <span className="block text-primary-foreground font-heading text-lg leading-tight">مسجد النهضة</span>
              <span className="block text-primary-foreground/80 text-xs">Stichting Islamitische Moskee</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/doneren"
              className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Doneren
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden text-primary-foreground p-2"
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
              className="lg:hidden overflow-hidden bg-brown"
            >
              <div className="container py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? "bg-primary/30 text-cream"
                        : "text-cream/80 hover:text-cream hover:bg-primary/20"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-3 pt-3 border-t border-cream/10 flex flex-col gap-2 text-cream/70 text-sm">
                  <a href="tel:+31495546218" className="flex items-center gap-2"><Phone size={14} /> +31 495 546 218</a>
                  <a href="mailto:info@simweert.nl" className="flex items-center gap-2"><Mail size={14} /> info@simweert.nl</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
