import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardCheck, Loader2, Search, Check, X as XIcon, Clock, Download } from "lucide-react";

interface ClassOption {
  id: string;
  title: string;
}

interface StudentEnrollment {
  student_id: string;
  profile: { full_name: string; email: string };
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  status: string;
  notes: string;
}

export default function AttendanceManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyView, setHistoryView] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("classes").select("id, title").eq("status", "active").order("title").then(({ data }) => {
      setClasses(data || []);
      if (data && data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
      setLoading(false);
    });
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const [{ data: enrollments }, { data: records }] = await Promise.all([
        supabase.from("enrollments").select("student_id, profiles!enrollments_student_id_fkey(full_name, email)")
          .eq("class_id", selectedClass).eq("status", "active"),
        supabase.from("attendance").select("*").eq("class_id", selectedClass).eq("date", selectedDate),
      ]);

      const studentList = (enrollments || []).map((e: any) => ({
        student_id: e.student_id,
        profile: e.profiles || { full_name: "Onbekend", email: "" },
      }));
      setStudents(studentList);

      const attendanceMap: Record<string, AttendanceRecord> = {};
      studentList.forEach(s => {
        const existing = records?.find(r => r.student_id === s.student_id);
        attendanceMap[s.student_id] = existing
          ? { id: existing.id, student_id: s.student_id, status: existing.status, notes: existing.notes || "" }
          : { student_id: s.student_id, status: "present", notes: "" };
      });
      setAttendance(attendanceMap);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, toast]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const updateStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance).map(a => ({
        class_id: selectedClass,
        student_id: a.student_id,
        date: selectedDate,
        status: a.status,
        notes: a.notes || null,
        marked_by: user?.id,
      }));

      const { error } = await supabase.from("attendance").upsert(records, {
        onConflict: "class_id,student_id,date",
      });
      if (error) throw error;
      toast({ title: "Aanwezigheid opgeslagen" });
      fetchAttendance();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    if (!selectedClass) return;
    const { data } = await supabase.from("attendance")
      .select("*, profiles!attendance_student_id_fkey(full_name)")
      .eq("class_id", selectedClass)
      .order("date", { ascending: false })
      .limit(200);
    setHistoryData(data || []);
    setHistoryView(true);
  };

  const exportCSV = () => {
    const rows = [["Datum", "Student", "Status", "Notities"]];
    historyData.forEach(r => {
      rows.push([r.date, (r.profiles as any)?.full_name || "", r.status, r.notes || ""]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aanwezigheid-${selectedClass}.csv`;
    a.click();
  };

  const statusBtn = (studentId: string, status: string, icon: React.ReactNode, label: string, color: string) => (
    <button
      onClick={() => updateStatus(studentId, status)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        attendance[studentId]?.status === status ? color : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {icon} {label}
    </button>
  );

  const presentCount = Object.values(attendance).filter(a => a.status === "present").length;
  const absentCount = Object.values(attendance).filter(a => a.status === "absent").length;
  const lateCount = Object.values(attendance).filter(a => a.status === "late").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Aanwezigheid</h2>
          <p className="text-muted-foreground text-sm mt-1">Registreer en bekijk aanwezigheid</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchHistory} className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            Geschiedenis
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary min-w-[200px]">
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary" />
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="flex gap-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">Aanwezig: {presentCount}</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-500/10 text-red-500">Afwezig: {absentCount}</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-500">Te laat: {lateCount}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
      ) : historyView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading text-foreground">Aanwezigheidsgeschiedenis</h3>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">
                <Download size={12} /> CSV Export
              </button>
              <button onClick={() => setHistoryView(false)} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">
                Terug
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Datum</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notities</th>
              </tr></thead>
              <tbody>
                {historyData.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-4 text-foreground">{new Date(r.date).toLocaleDateString("nl-NL")}</td>
                    <td className="py-2 px-4 text-foreground">{(r.profiles as any)?.full_name}</td>
                    <td className="py-2 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === "present" ? "bg-emerald-500/10 text-emerald-500" :
                        r.status === "absent" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                      }`}>{r.status === "present" ? "Aanwezig" : r.status === "absent" ? "Afwezig" : "Te laat"}</span>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground text-xs">{r.notes || "—"}</td>
                  </tr>
                ))}
                {historyData.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Geen gegevens gevonden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Attendance Form */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notities</th>
              </tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{s.profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.profile.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {statusBtn(s.student_id, "present", <Check size={12} />, "Aanwezig", "bg-emerald-500/20 text-emerald-600")}
                        {statusBtn(s.student_id, "absent", <XIcon size={12} />, "Afwezig", "bg-red-500/20 text-red-600")}
                        {statusBtn(s.student_id, "late", <Clock size={12} />, "Te laat", "bg-amber-500/20 text-amber-600")}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={attendance[s.student_id]?.notes || ""}
                        onChange={(e) => setAttendance(prev => ({
                          ...prev, [s.student_id]: { ...prev[s.student_id], notes: e.target.value }
                        }))}
                        className="w-full px-2 py-1 rounded-lg bg-background border border-border text-xs text-foreground outline-none focus:border-primary"
                        placeholder="Optionele notitie"
                      />
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">
                    <ClipboardCheck size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Geen studenten ingeschreven in deze klas</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <button onClick={saveAttendance} disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "Opslaan..." : "Aanwezigheid opslaan"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
