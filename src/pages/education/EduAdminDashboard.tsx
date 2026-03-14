import { useAuth } from "@/hooks/useAuth";

export default function EduAdminDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welkom, {user?.email}</p>
          </div>
          <button onClick={signOut} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm hover:opacity-90">
            Uitloggen
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Gebruikers", "Klassen", "Academische periodes", "Rapporten"].map((item) => (
            <div key={item} className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground">{item}</h3>
              <p className="text-muted-foreground text-sm mt-1">Beheer {item.toLowerCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
