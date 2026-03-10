import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/types";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export default function LanguageSwitcher({ mobile = false }: { mobile?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = languages.find((l) => l.code === language)!;

  if (mobile) {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`text-xl transition-all rounded-md px-1 py-0.5 ${language === l.code ? "scale-125 ring-2 ring-gold/50" : "opacity-60 hover:opacity-100"}`}
            title={l.label}
          >
            {l.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-cream/70 hover:text-cream px-2 py-1.5 rounded-lg text-[13px] transition-colors"
        title="Taal / Language"
      >
        <Globe size={15} />
        <span className="text-sm">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-brown border border-cream/15 rounded-xl shadow-xl overflow-hidden min-w-[160px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                language === l.code
                  ? "bg-cream/10 text-gold"
                  : "text-cream/70 hover:bg-cream/5 hover:text-cream"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
