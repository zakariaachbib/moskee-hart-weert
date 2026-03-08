import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Calendar,
  Mail,
  Users,
  Heart,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  { key: "overview", label: "Overzicht", icon: LayoutDashboard, path: "/admin" },
  { key: "activiteiten", label: "Activiteiten", icon: Calendar, path: "/admin/activiteiten" },
  { key: "berichten", label: "Berichten", icon: Mail, path: "/admin/berichten" },
  { key: "leden", label: "Lidmaatschap", icon: Users, path: "/admin/leden" },
  { key: "donaties", label: "Donaties", icon: Heart, path: "/admin/donaties" },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <p className="text-[10px] text-sidebar-foreground/50">Moskee Simweert</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
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
      <div className="p-3 border-t border-sidebar-border">
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
