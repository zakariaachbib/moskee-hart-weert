import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut, LayoutDashboard, Instagram } from "lucide-react";
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
  { label: "Preken", to: "/preken" },
  { label: "Bekeerlingen", to: "/bekeerlingen" },
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
      <div className="container flex items-center justify-between py-1.5">
        <Link to="/" className="flex items-center self-center">
          <img src={logo} alt="SIM Weert Logo" className="h-14 w-auto sm:h-12 object-contain" />
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
          {/* Social icons */}
          <div className="hidden sm:flex items-center gap-2">
            <a href="https://chat.whatsapp.com/DwcENVtty2fE9pMzYBeVG7" target="_blank" rel="noopener" className="text-cream/60 hover:text-green-400 transition-colors" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="https://www.instagram.com/nahdamoskeeweert?igsh=MXN3d3hobTBkZmtsZA%3D%3D&utm_source=qr" target="_blank" rel="noopener" className="text-cream/60 hover:text-pink-400 transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://www.tiktok.com/@nahdamoskeeweert?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener" className="text-cream/60 hover:text-cream transition-colors" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
            </a>
          </div>
          <Link
            to="/doneren"
            className="bg-gradient-gold text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all shadow-[0_2px_12px_rgba(200,148,63,0.3)] hover:shadow-[0_4px_20px_rgba(200,148,63,0.45)] hover:scale-105 pulse"
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

              {/* Mobile social icons */}
              <div className="flex items-center gap-4 px-4 pt-3 mt-3 border-t border-cream/10">
                <a href="https://chat.whatsapp.com/DwcENVtty2fE9pMzYBeVG7" target="_blank" rel="noopener" className="text-cream/60 hover:text-green-400 transition-colors" aria-label="WhatsApp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://www.instagram.com/nahdamoskeeweert?igsh=MXN3d3hobTBkZmtsZA%3D%3D&utm_source=qr" target="_blank" rel="noopener" className="text-cream/60 hover:text-pink-400 transition-colors" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
                <a href="https://www.tiktok.com/@nahdamoskeeweert?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener" className="text-cream/60 hover:text-cream transition-colors" aria-label="TikTok">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
