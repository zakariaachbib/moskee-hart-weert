import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users, LayoutDashboard, LogOut, Calendar, Mail, Heart,
  FileText, Megaphone, GraduationCap, BookOpen, ChevronLeft, ChevronDown, Menu, Home,
  ClipboardCheck, UserCheck, FolderOpen, CalendarDays, BarChart3, Bell, Settings, Library
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-web-2.png";

const EDUCATION_ITEMS = [
  { path: "/education/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/education/admin/gebruikers", label: "Gebruikers", icon: Users },
  { path: "/education/admin/klassen", label: "Klassen", icon: BookOpen },
  { path: "/education/admin/inschrijvingen", label: "Inschrijvingen", icon: UserCheck },
  { path: "/education/admin/aanwezigheid", label: "Aanwezigheid", icon: ClipboardCheck },
  { path: "/education/admin/opdrachten", label: "Opdrachten", icon: FileText },
  { path: "/education/admin/documenten", label: "Documenten", icon: FolderOpen },
  { path: "/education/admin/kalender", label: "Academische Kalender", icon: CalendarDays },
  { path: "/education/admin/rapportages", label: "Rapportages", icon: BarChart3 },
  { path: "/education/admin/mededelingen", label: "Mededelingen", icon: Bell },
];

const MOSQUE_ITEMS = [
  { path: "/admin", label: "Overzicht", icon: LayoutDashboard },
  { path: "/admin/activiteiten", label: "Activiteiten", icon: Calendar },
  { path: "/admin/berichten", label: "Berichten", icon: Mail },
  { path: "/admin/leden", label: "Lidmaatschap", icon: Users },
  { path: "/admin/donaties", label: "Donaties", icon: Heart },
  { path: "/admin/preken", label: "Preken", icon: FileText },
  { path: "/admin/crowdfunding", label: "Crowdfunding", icon: Megaphone },
];

const CURSUS_ITEMS = [
  { path: "/admin/cursussen", label: "Cursussen", icon: Library },
  { path: "/admin/cursussen/niveaus", label: "Niveaus & Modules", icon: BookOpen },
  { path: "/admin/cursussen/lessen", label: "Lessen", icon: FileText },
  { path: "/admin/cursussen/quizzen", label: "Quizzen", icon: GraduationCap },
  { path: "/admin/cursussen/certificaten", label: "Certificaten", icon: FileText },
  { path: "/admin/cursussen/voortgang", label: "Voortgang", icon: Users },
];

export default function EduAdminDashboard({ children }: { children?: React.ReactNode }) {
  const { user, isAdmin, eduRole, signOut } = useAuth();

  const roleLabel = useMemo(() => {
    if (isAdmin) return 'Superbeheerder';
    switch (eduRole) {
      case 'education_management': return 'Onderwijs Manager';
      case 'teacher': return 'Leraar';
      case 'student': return 'Student';
      default: return 'Onderwijs';
    }
  }, [isAdmin, eduRole]);
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eduOpen, setEduOpen] = useState(true);
  const [mosqueOpen, setMosqueOpen] = useState(false);
  const [cursusOpen, setCursusOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/education/admin" && location.pathname === "/education/admin") return true;
    if (path === "/admin" && location.pathname === "/admin") return true;
    if (path !== "/education/admin" && path !== "/admin" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-bold text-sidebar-foreground truncate">{roleLabel}</h2>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {/* Mosque section - only for superadmins */}
        {isAdmin && (
          <>
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
            {(collapsed || mosqueOpen) && MOSQUE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
            <div className="my-2 border-t border-sidebar-border" />
          </>
        )}

        {/* Education section */}
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
        {(collapsed || eduOpen) && EDUCATION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
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
    <div className="min-h-screen flex bg-background">
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
        >
          <ChevronLeft size={12} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
