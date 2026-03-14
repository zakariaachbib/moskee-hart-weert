import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Loader2, Download, TrendingUp, Users, BookOpen, FileText } from "lucide-react";

interface ClassPerformance {
  class_id: string;
  class_title: string;
  teacher_name: string;
  total_students: number;
  total_assignments: number;
  completed_submissions: number;
  late_submissions: number;
  average_score: number;
}

interface AtRiskStudent {
  student_id: string;
  full_name: string;
  email: string;
  average_score: number;
  late_submissions: number;
  missed_deadlines: number;
}

export default function ReportsManagement() {
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "students">("overview");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [{ data: perfData }, { data: riskData }, { data: summaryData }] = await Promise.all([
        supabase.from("class_performance_summary").select("*"),
        supabase.from("at_risk_students").select("*"),
        supabase.from("management_dashboard_summary").select("*").single(),
      ]);
      setClassPerformance((perfData || []) as ClassPerformance[]);
      setAtRiskStudents((riskData || []) as AtRiskStudent[]);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportClassCSV = () => {
    const rows = [["Klas", "Docent", "Studenten", "Opdrachten", "Inzendingen", "Te laat", "Gemiddeld cijfer"]];
    classPerformance.forEach(c => {
      rows.push([c.class_title, c.teacher_name, String(c.total_students), String(c.total_assignments),
        String(c.completed_submissions), String(c.late_submissions), String(c.average_score || 0)]);
    });
    downloadCSV(rows, "klasprestaties.csv");
  };

  const exportStudentCSV = () => {
    const rows = [["Student", "E-mail", "Gemiddeld", "Te laat", "Gemiste deadlines"]];
    atRiskStudents.forEach(s => {
      rows.push([s.full_name || "", s.email || "", String(s.average_score || 0), String(s.late_submissions), String(s.missed_deadlines)]);
    });
    downloadCSV(rows, "aandacht-studenten.csv");
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
  };

  const tabs = [
    { key: "overview", label: "Overzicht", icon: TrendingUp },
    { key: "classes", label: "Klasprestaties", icon: BookOpen },
    { key: "students", label: "Aandacht studenten", icon: Users },
  ] as const;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-foreground">Rapportages</h2>
        <p className="text-muted-foreground text-sm mt-1">Inzicht in prestaties en voortgang</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Actieve studenten", value: summary.total_active_students || 0 },
              { label: "Actieve docenten", value: summary.total_active_teachers || 0 },
              { label: "Actieve klassen", value: summary.total_active_classes || 0 },
              { label: "Inschrijvingen", value: summary.total_active_enrollments || 0 },
              { label: "Gemiddeld cijfer", value: summary.overall_average_score ? Number(summary.overall_average_score).toFixed(1) : "—" },
              { label: "Aandacht nodig", value: summary.total_at_risk_students || 0 },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Simple bar visualization */}
          {classPerformance.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-heading text-foreground mb-4">Gemiddeld cijfer per klas</h3>
              <div className="space-y-3">
                {classPerformance.map(c => (
                  <div key={c.class_id} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-32 truncate shrink-0">{c.class_title}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-primary/80 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.min((c.average_score || 0) * 10, 100)}%` }}>
                        <span className="text-[10px] font-bold text-primary-foreground">{c.average_score ? Number(c.average_score).toFixed(1) : "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={exportClassCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">
              <Download size={12} /> CSV Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Klas</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Docent</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Studenten</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Opdrachten</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Inzendingen</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Te laat</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gem. cijfer</th>
              </tr></thead>
              <tbody>
                {classPerformance.map(c => (
                  <tr key={c.class_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">{c.class_title}</td>
                    <td className="py-3 px-4 text-foreground">{c.teacher_name || "—"}</td>
                    <td className="py-3 px-4 text-foreground">{c.total_students}</td>
                    <td className="py-3 px-4 text-foreground">{c.total_assignments}</td>
                    <td className="py-3 px-4 text-foreground">{c.completed_submissions}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${(c.late_submissions || 0) > 0 ? "text-amber-500" : "text-foreground"}`}>
                        {c.late_submissions || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{c.average_score ? Number(c.average_score).toFixed(1) : "—"}</span>
                    </td>
                  </tr>
                ))}
                {classPerformance.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Geen gegevens</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={exportStudentCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">
              <Download size={12} /> CSV Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gemiddeld</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Te laat</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gemiste deadlines</th>
              </tr></thead>
              <tbody>
                {atRiskStudents.map(s => (
                  <tr key={s.student_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${(s.average_score || 0) < 5.5 ? "text-red-500" : "text-foreground"}`}>
                        {s.average_score ? Number(s.average_score).toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-500 font-medium">{s.late_submissions || 0}</td>
                    <td className="py-3 px-4 text-red-500 font-medium">{s.missed_deadlines || 0}</td>
                  </tr>
                ))}
                {atRiskStudents.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Geen studenten die extra aandacht nodig hebben</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
