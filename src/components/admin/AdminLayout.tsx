import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useViewAsStudent } from "@/hooks/useViewAsStudent";
import AdminSidebar from "./AdminSidebar";
import ViewAsStudentToggle from "@/components/ViewAsStudentToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const { viewAsStudent } = useViewAsStudent();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || isAdmin === false)) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (viewAsStudent && location.pathname.startsWith("/admin")) {
      navigate("/cursussen", { replace: true });
    }
  }, [viewAsStudent, location.pathname, navigate]);

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
      <ViewAsStudentToggle />
    </div>
  );
}
