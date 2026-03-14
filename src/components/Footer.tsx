import { Link, useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, LogIn, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export default function Footer() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <footer className="bg-brown text-cream">
      <div className="container py-10">
        <div className="max-w-md mx-auto md:mx-0">
            <h4 className="font-heading text-lg mb-3 text-gold">{t.footer.contact}</h4>
            <div className="flex flex-col gap-2 text-sm text-cream/70">
              <a href="tel:+31495546218" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone size={14} /> +31 495 546 218
              </a>
              <a href="mailto:info@simweert.nl" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Mail size={14} /> info@simweert.nl
              </a>
              <span className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" /> Charitastraat 4, 6001 XT Weert
              </span>
            </div>
        </div>

        <div className="border-t border-cream/10 mt-8 pt-4 flex items-center justify-between text-cream/50 text-sm">
          <span>© {new Date().getFullYear()} {t.footer.copyright}</span>
          <Link to="/admin" className="flex items-center gap-1 hover:text-gold transition-colors opacity-40 hover:opacity-100">
            <LogIn size={12} />
            <span className="text-xs">{t.adminLogin.login}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
