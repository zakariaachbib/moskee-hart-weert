import { forwardRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AllowedRole = "admin" | "education_management" | "teacher" | "student";

interface EduProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

const EduProtectedRoute = forwardRef<HTMLDivElement, EduProtectedRouteProps>(
  ({ children, allowedRoles }, _ref) => {
    const { user, eduRole, isAdmin, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Mosque admin (superadmin) has access to everything
    if (isAdmin) {
      return <>{children}</>;
    }

    if (!eduRole || !allowedRoles.includes(eduRole as AllowedRole)) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  }
);

EduProtectedRoute.displayName = "EduProtectedRoute";

export default EduProtectedRoute;
