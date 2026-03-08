import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.gif";

export default function Footer() {
  return (
    <footer className="bg-brown text-cream">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Logo" className="h-12 w-12" />
              <div>
                <span className="block font-heading text-lg">مسجد النهضة</span>
                <span className="block text-cream/60 text-xs">Stichting Islamitische Moskee</span>
              </div>
            </div>
            <p className="text-cream/70 text-sm leading-relaxed">
              Samen bouwen we aan een sterke en verbonden gemeenschap in Weert.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4 text-gold">Snelle Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Over Ons", to: "/over-ons" },
                { label: "Gebedstijden", to: "/gebedstijden" },
                { label: "Activiteiten", to: "/activiteiten" },
                { label: "Onderwijs", to: "/onderwijs" },
                { label: "Word Lid", to: "/word-lid" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-cream/70 hover:text-gold text-sm transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4 text-gold">Contact</h4>
            <div className="flex flex-col gap-3 text-sm text-cream/70">
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
            <h4 className="font-heading text-lg mb-4 text-gold">Faciliteiten</h4>
            <div className="flex flex-wrap gap-2">
              {["Vrouwenruimte", "Wasruimte", "Cursussen", "Kinderlessen", "Parkeren", "Toegankelijk"].map((f) => (
                <span key={f} className="text-xs bg-cream/10 px-3 py-1 rounded-full text-cream/80">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-6 text-center text-cream/50 text-sm">
          © {new Date().getFullYear()} Stichting Islamitische Moskee Weert — Alle rechten voorbehouden
        </div>
      </div>
    </footer>
  );
}
