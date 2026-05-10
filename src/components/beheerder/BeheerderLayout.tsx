import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BeheerderSidebar from "./BeheerderSidebar";

export default function BeheerderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isBeheerder, loading } = useAuth();
  const navigate = useNavigate();

  const allowed = isAdmin === true || isBeheerder === true;

  useEffect(() => {
    if (!loading && (!user || (isAdmin === false && isBeheerder === false))) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, isBeheerder, loading, navigate]);

  if (loading || (user && isAdmin === null && isBeheerder === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowed) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <BeheerderSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
