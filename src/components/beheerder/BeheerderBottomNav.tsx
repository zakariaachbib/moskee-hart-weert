import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Mail, Users, Home, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overzicht", icon: LayoutDashboard, path: "/beheerder", exact: true },
  { label: "Reserv.", icon: Home, path: "/beheerder/reserveringen" },
  { label: "Berichten", icon: Mail, path: "/beheerder/berichten" },
  { label: "Leden", icon: Users, path: "/beheerder/leden" },
  { label: "Wachtw.", icon: KeyRound, path: "/beheerder/wachtwoord" },
];

export default function BeheerderBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border flex items-stretch justify-around"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const active = isActive(it.path, it.exact);
        return (
          <button
            key={it.path}
            onClick={() => navigate(it.path)}
            className={cn(
              "flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-amber-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <it.icon size={20} className={cn(active && "text-amber-600")} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
