import { useEffect, useRef, useState } from "react";
import { Mail, ChevronDown } from "lucide-react";

interface Props {
  to: string;
  subject?: string;
  body?: string;
  className?: string;
  label?: string;
}

/**
 * E-mailknop met keuzemenu: Mail-app (mailto), Outlook-app, Gmail of Outlook in de browser.
 */
export default function EmailComposeButton({ to, subject = "", body = "", className = "", label = "E-mail" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const enc = encodeURIComponent;
  const gmailWeb = `https://mail.google.com/mail/?view=cm&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
  const outlookWeb = `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;

  // App-links geven op iOS een foutmelding als de app ontbreekt; probeer de app
  // en val na een korte wachttijd terug op de webversie als de pagina zichtbaar blijft.
  const openApp = (appUrl: string, fallbackUrl: string) => {
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }, 900);
    const cancel = () => window.clearTimeout(timer);
    document.addEventListener("visibilitychange", cancel, { once: true });
    window.location.href = appUrl;
  };

  const options: { id: string; label: string; desc: string; href: string; app?: boolean; fallback?: string }[] = [
    {
      id: "mail",
      label: "Mail-app",
      desc: "Standaard e-mailprogramma",
      href: `mailto:${to}${subject || body ? `?subject=${enc(subject)}&body=${enc(body)}` : ""}`,
    },
    {
      id: "outlook-app",
      label: "Outlook-app",
      desc: "App, anders automatisch de webversie",
      href: `ms-outlook://compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`,
      app: true,
      fallback: outlookWeb,
    },
    {
      id: "gmail-app",
      label: "Gmail-app",
      desc: "App, anders automatisch de webversie",
      href: `googlegmail://co?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`,
      app: true,
      fallback: gmailWeb,
    },
    {
      id: "gmail",
      label: "Gmail",
      desc: "Openen in browser",
      href: gmailWeb,
    },
    {
      id: "outlook",
      label: "Outlook",
      desc: "Openen in browser",
      href: outlookWeb,
    },
  ];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center justify-center gap-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl px-4 py-3 text-sm font-medium transition-all hover:shadow-sm"
      >
        <Mail className="w-5 h-5" />
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
        >
          {options.map((o) => (
            <a
              key={o.id}
              role="menuitem"
              href={o.href}
              target={o.app || o.id === "mail" ? undefined : "_blank"}
              rel={o.app || o.id === "mail" ? undefined : "noopener noreferrer"}
              onClick={() => setOpen(false)}
              className="flex flex-col px-4 py-3 hover:bg-muted/60 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.desc}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
