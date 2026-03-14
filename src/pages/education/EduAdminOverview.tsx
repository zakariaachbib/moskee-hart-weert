import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, FileText, ClipboardCheck, GraduationCap, Bell, TrendingUp, AlertTriangle } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  totalAssignments: number;
  pendingSubmissions: number;
  recentAnnouncements: number;
  attendanceRate: number;
  atRiskStudents: number;
}

export default function EduAdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, totalTeachers: 0, activeClasses: 0, totalAssignments: 0,
    pendingSubmissions: 0, recentAnnouncements: 0, attendanceRate: 0, atRiskStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: summary },
        { count: assignmentCount },
        { count: pendingSubs },
        { count: announcementCount },
        { data: attendance },
        { data: atRisk },
        { data: actLogs },
      ] = await Promise.all([
        supabase.from("management_dashboard_summary").select("*").single(),
        supabase.from("assignments").select("*", { count: "exact", head: true }),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("attendance").select("status"),
        supabase.from("at_risk_students").select("*"),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      const totalAttendance = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      setStats({
        totalStudents: summary?.total_active_students || 0,
        totalTeachers: summary?.total_active_teachers || 0,
        activeClasses: summary?.total_active_classes || 0,
        totalAssignments: assignmentCount || 0,
        pendingSubmissions: pendingSubs || 0,
        recentAnnouncements: announcementCount || 0,
        attendanceRate,
        atRiskStudents: atRisk?.length || 0,
      });
      setRecentActivity(actLogs || []);
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Studenten", value: stats.totalStudents, icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Docenten", value: stats.totalTeachers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Actieve Klassen", value: stats.activeClasses, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Opdrachten", value: stats.totalAssignments, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Te beoordelen", value: stats.pendingSubmissions, icon: ClipboardCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Mededelingen", value: stats.recentAnnouncements, icon: Bell, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Aanwezigheid", value: `${stats.attendanceRate}%`, icon: TrendingUp, color: "text-teal-500", bg: "bg-teal-500/10" },
    { label: "Aandacht nodig", value: stats.atRiskStudents, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Overzicht van het onderwijssysteem</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-heading text-foreground mb-4">Recente Activiteit</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nog geen activiteit geregistreerd</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.entity_type && <span className="capitalize">{log.entity_type}</span>}
                    {" · "}
                    {new Date(log.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
