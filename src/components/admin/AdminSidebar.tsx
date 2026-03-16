import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Calendar,
  Mail,
  Users,
  Heart,
  FileText,
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  GraduationCap,
  BookOpen,
  Home,
  Library,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-web-2.png";

const mosqueItems = [
  { key: "overview", label: "Overzicht", icon: LayoutDashboard, path: "/admin" },
  { key: "activiteiten", label: "Activiteiten", icon: Calendar, path: "/admin/activiteiten" },
  { key: "berichten", label: "Berichten", icon: Mail, path: "/admin/berichten" },
  { key: "leden", label: "Lidmaatschap", icon: Users, path: "/admin/leden" },
  { key: "donaties", label: "Donaties", icon: Heart, path: "/admin/donaties" },
  { key: "preken", label: "Preken", icon: FileText, path: "/admin/preken" },
  { key: "crowdfunding", label: "Crowdfunding", icon: Megaphone, path: "/admin/crowdfunding" },
  { key: "reserveringen", label: "Reserveringen", icon: Home, path: "/admin/reserveringen" },
];

const educationItems = [
  { key: "edu-dashboard", label: "Onderwijs Dashboard", icon: GraduationCap, path: "/education/admin" },
  { key: "edu-management", label: "Onderwijsmanagement", icon: BookOpen, path: "/education/management" },
  { key: "edu-gebruikers", label: "Gebruikersbeheer", icon: Users, path: "/education/admin/gebruikers" },
];

const cursusItems = [
  { key: "cursussen", label: "Cursussen", icon: Library, path: "/admin/cursussen" },
  { key: "cursus-niveaus", label: "Niveaus & Modules", icon: BookOpen, path: "/admin/cursussen/niveaus" },
  { key: "cursus-lessen", label: "Lessen", icon: FileText, path: "/admin/cursussen/lessen" },
  { key: "cursus-quizzen", label: "Quizzen", icon: GraduationCap, path: "/admin/cursussen/quizzen" },
  { key: "cursus-certificaten", label: "Certificaten", icon: FileText, path: "/admin/cursussen/certificaten" },
  { key: "cursus-voortgang", label: "Voortgang", icon: Users, path: "/admin/cursussen/voortgang" },
  { key: "bekijk-als", label: "Bekijk als...", icon: Eye, path: "/admin/bekijk-als" },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mosqueOpen, setMosqueOpen] = useState(true);
  const [eduOpen, setEduOpen] = useState(false);
  const [cursusOpen, setCursusOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-bold text-sidebar-foreground truncate">Admin Panel</h2>
            <p className="text-[10px] text-sidebar-foreground/50">Nahda Moskee Weert</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {/* Mosque section */}
        {!collapsed ? (
          <button
            onClick={() => setMosqueOpen(!mosqueOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 mb-1"
          >
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
              Moskee beheer
            </p>
            <ChevronDown size={12} className={cn("text-sidebar-foreground/40 transition-transform", !mosqueOpen && "-rotate-90")} />
          </button>
        ) : (
          <div className="w-full h-px bg-sidebar-border my-2" />
        )}
        {(collapsed || mosqueOpen) && mosqueItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Education section */}
        <div className="my-2 border-t border-sidebar-border" />
        {!collapsed ? (
          <button
            onClick={() => setEduOpen(!eduOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 mb-1"
          >
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
              Onderwijs
            </p>
            <ChevronDown size={12} className={cn("text-sidebar-foreground/40 transition-transform", !eduOpen && "-rotate-90")} />
          </button>
        ) : (
          <div className="w-full h-px bg-sidebar-border my-2" />
        )}
        {(collapsed || eduOpen) && educationItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
           </button>
        ))}

        {/* Cursussen section */}
        <div className="my-2 border-t border-sidebar-border" />
        {!collapsed ? (
          <button
            onClick={() => setCursusOpen(!cursusOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 mb-1"
          >
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
              Cursussen
            </p>
            <ChevronDown size={12} className={cn("text-sidebar-foreground/40 transition-transform", !cursusOpen && "-rotate-90")} />
          </button>
        ) : (
          <div className="w-full h-px bg-sidebar-border my-2" />
        )}
        {(collapsed || cursusOpen) && cursusItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Home size={18} className="shrink-0" />
          {!collapsed && <span>Terug naar website</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Uitloggen</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-foreground/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "w-[68px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
        >
          <ChevronLeft size={12} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  );
}
