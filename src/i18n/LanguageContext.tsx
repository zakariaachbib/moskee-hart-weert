import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Language, Translations } from "./types";
import { nl } from "./translations/nl";
import { ar } from "./translations/ar";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { tr } from "./translations/tr";

const translationsMap: Record<Language, Translations> = { nl, ar, en, fr, tr };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType>({
  language: "nl",
  setLanguage: () => {},
  t: nl,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("lang") as Language;
    return saved && translationsMap[saved] ? saved : "nl";
  });

  useEffect(() => {
    localStorage.setItem("lang", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = translationsMap[language];
  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
