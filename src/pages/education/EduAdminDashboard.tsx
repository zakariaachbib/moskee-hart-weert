import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { path: "/education/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/education/admin/gebruikers", label: "Gebruikers", icon: Users },
];

export default function EduAdminDashboard({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4 flex flex-col">
        <div className="mb-8">
          <h2 className="font-heading text-lg text-foreground">Onderwijs Admin</h2>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} /> Uitloggen
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
