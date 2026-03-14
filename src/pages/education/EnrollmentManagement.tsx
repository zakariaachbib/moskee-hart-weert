import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Plus, Search, Loader2, X, ArrowRightLeft } from "lucide-react";

interface Enrollment {
  id: string;
  class_id: string;
  student_id: string;
  status: string;
  enrolled_at: string;
  student_name?: string;
  student_email?: string;
  class_title?: string;
}

export default function EnrollmentManagement() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: enrollData }, { data: classData }, { data: studentProfiles }] = await Promise.all([
        supabase.from("enrollments")
          .select("*, profiles!enrollments_student_id_fkey(full_name, email), classes!enrollments_class_id_fkey(title)")
          .order("enrolled_at", { ascending: false }),
        supabase.from("classes").select("id, title").order("title"),
        supabase.from("profiles").select("id, full_name, email").eq("is_active", true).order("full_name"),
      ]);

      setEnrollments((enrollData || []).map((e: any) => ({
        ...e,
        student_name: e.profiles?.full_name || "Onbekend",
        student_email: e.profiles?.email || "",
        class_title: e.classes?.title || "Onbekend",
      })));
      setClasses(classData || []);
      setStudents(studentProfiles || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnroll = async (studentId: string, classId: string) => {
    try {
      const { error } = await supabase.from("enrollments").insert({ student_id: studentId, class_id: classId });
      if (error) throw error;
      toast({ title: "Student ingeschreven" });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("enrollments").update({ status: newStatus as any }).eq("id", enrollmentId);
      if (error) throw error;
      toast({ title: "Status bijgewerkt" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const filtered = enrollments.filter(e => {
    const matchSearch = (e.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.student_email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchClass = classFilter === "all" || e.class_id === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500",
    dropped: "bg-red-500/10 text-red-500",
    completed: "bg-blue-500/10 text-blue-500",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Inschrijvingen</h2>
          <p className="text-muted-foreground text-sm mt-1">{enrollments.length} inschrijving{enrollments.length !== 1 ? "en" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nieuwe inschrijving
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek student..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary">
          <option value="all">Alle klassen</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary">
          <option value="all">Alle statussen</option>
          <option value="active">Actief</option>
          <option value="dropped">Uitgeschreven</option>
          <option value="completed">Afgerond</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Klas</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ingeschreven op</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acties</th>
            </tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{e.student_name}</p>
                    <p className="text-xs text-muted-foreground">{e.student_email}</p>
                  </td>
                  <td className="py-3 px-4 text-foreground">{e.class_title}</td>
                  <td className="py-3 px-4">
                    <select value={e.status} onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-none outline-none cursor-pointer ${statusColors[e.status] || "bg-muted text-muted-foreground"}`}>
                      <option value="active">Actief</option>
                      <option value="dropped">Uitgeschreven</option>
                      <option value="completed">Afgerond</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(e.enrolled_at).toLocaleDateString("nl-NL")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleStatusChange(e.id, e.status === "active" ? "dropped" : "active")}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Status wijzigen">
                      <ArrowRightLeft size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">
                  <UserCheck size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Geen inschrijvingen gevonden</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      {showModal && (
        <EnrollModal classes={classes} students={students} onEnroll={handleEnroll} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function EnrollModal({ classes, students, onEnroll, onClose }: {
  classes: { id: string; title: string }[];
  students: { id: string; full_name: string; email: string }[];
  onEnroll: (studentId: string, classId: string) => void;
  onClose: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading text-foreground">Nieuwe inschrijving</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Student *</label>
            <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Zoek student..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground mb-2" />
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
              {filteredStudents.slice(0, 20).map(s => (
                <button key={s.id} onClick={() => { setStudentId(s.id); setStudentSearch(s.full_name); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${studentId === s.id ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                  {s.full_name} <span className="text-xs text-muted-foreground">({s.email})</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Klas *</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground">
              <option value="">Selecteer klas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <button onClick={() => studentId && classId && onEnroll(studentId, classId)}
            disabled={!studentId || !classId}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            Inschrijven
          </button>
        </div>
      </div>
    </div>
  );
}
