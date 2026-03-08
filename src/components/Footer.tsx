import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brown text-cream">
      <div className="container py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-heading text-lg mb-3 text-gold">Contact</h4>
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

          <div>
            <h4 className="font-heading text-lg mb-3 text-gold">Faciliteiten</h4>
            <div className="flex flex-wrap gap-2">
              {["Vrouwenruimte", "Wasruimte", "Cursussen", "Kinderlessen", "Parkeren", "Toegankelijk"].map((f) => (
                <span key={f} className="text-xs bg-cream/10 px-3 py-1 rounded-full text-cream/80">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-8 pt-4 text-center text-cream/50 text-sm">
          © {new Date().getFullYear()} Stichting Islamitische Moskee Weert — Alle rechten voorbehouden
        </div>
      </div>
    </footer>
  );
}
