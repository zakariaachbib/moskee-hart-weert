import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Mail, Users, Home, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overzicht", icon: LayoutDashboard, path: "/beheerder", exact: true },
  { label: "Reserveringen", icon: Home, path: "/beheerder/reserveringen" },
  { label: "Berichten", icon: Mail, path: "/beheerder/berichten" },
  { label: "Leden", icon: Users, path: "/beheerder/leden" },
  { label: "Wachtwoord", icon: KeyRound, path: "/beheerder/wachtwoord" },
];

export default function BeheerderBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-stretch justify-around"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const active = isActive(it.path, it.exact);
        return (
          <button
            key={it.path}
            onClick={() => navigate(it.path)}
            className={cn(
              "relative flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-amber-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <span
              className={cn(
                "absolute top-1.5 w-[3px] h-[3px] rounded-full transition-opacity",
                active ? "bg-amber-600 opacity-100" : "opacity-0"
              )}
            />
            <it.icon size={20} />
            <span className="hidden min-[380px]:inline truncate max-w-full px-1">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
