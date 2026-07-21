import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useViewAsStudent } from "@/hooks/useViewAsStudent";

export default function ViewAsStudentToggle() {
  const { isAdmin, eduRole } = useAuth();
  const isCourseAdmin = !!(isAdmin || eduRole === "admin" || eduRole === "education_management");
  const { viewAsStudent, setViewAsStudent } = useViewAsStudent();

  if (!isCourseAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur shadow-lg px-3 py-2 text-xs">
      {viewAsStudent ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
      <label htmlFor="view-as-student" className="font-medium cursor-pointer select-none">
        Bekijk als cursist
      </label>
      <Switch id="view-as-student" checked={viewAsStudent} onCheckedChange={setViewAsStudent} />
    </div>
  );
}
