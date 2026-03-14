import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Plus, Pencil, Archive, Users, FileText, X, Loader2, Search } from "lucide-react";

interface ClassItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  teacher_id: string | null;
  term_id: string | null;
  created_at: string;
  teacher?: { full_name: string } | null;
  _studentCount?: number;
  _assignmentCount?: number;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Term {
  id: string;
  name: string;
}

export default function ClassManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: classData }, { data: teacherData }, { data: termData }] = await Promise.all([
        supabase.from("classes").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name").in("id",
          (await supabase.from("edu_user_roles").select("user_id").eq("role", "teacher")).data?.map(r => r.user_id) || []
        ),
        supabase.from("academic_terms").select("id, name").order("start_date", { ascending: false }),
      ]);

      // Fetch counts for each class
      const enriched = await Promise.all((classData || []).map(async (c) => {
        const [{ count: studentCount }, { count: assignmentCount }, teacherProfile] = await Promise.all([
          supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("class_id", c.id).eq("status", "active"),
          supabase.from("assignments").select("*", { count: "exact", head: true }).eq("class_id", c.id),
          c.teacher_id ? supabase.from("profiles").select("full_name").eq("id", c.teacher_id).single() : Promise.resolve({ data: null }),
        ]);
        return { ...c, _studentCount: studentCount || 0, _assignmentCount: assignmentCount || 0, teacher: teacherProfile.data };
      }));

      setClasses(enriched);
      setTeachers(teacherData || []);
      setTerms(termData || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (form: { title: string; description: string; teacher_id: string; term_id: string; status: string }) => {
    try {
      if (editingClass) {
        const { error } = await supabase.from("classes").update({
          title: form.title, description: form.description || null,
          teacher_id: form.teacher_id || null, term_id: form.term_id || null, status: form.status as any,
        }).eq("id", editingClass.id);
        if (error) throw error;
        toast({ title: "Klas bijgewerkt" });
      } else {
        const { error } = await supabase.from("classes").insert({
          title: form.title, description: form.description || null,
          teacher_id: form.teacher_id || null, term_id: form.term_id || null,
          status: form.status as any, created_by: user?.id,
        });
        if (error) throw error;
        toast({ title: "Klas aangemaakt" });
      }
      setShowModal(false);
      setEditingClass(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleArchive = async (classId: string) => {
    if (!confirm("Weet je zeker dat je deze klas wilt archiveren?")) return;
    try {
      await supabase.from("classes").update({ status: "archived" as any }).eq("id", classId);
      toast({ title: "Klas gearchiveerd" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const filtered = classes.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500",
    draft: "bg-amber-500/10 text-amber-500",
    archived: "bg-muted text-muted-foreground",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Klassenbeheer</h2>
          <p className="text-muted-foreground text-sm mt-1">{classes.length} klas{classes.length !== 1 ? "sen" : ""}</p>
        </div>
        <button onClick={() => { setEditingClass(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nieuwe klas
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek klassen..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary">
          <option value="all">Alle statussen</option>
          <option value="active">Actief</option>
          <option value="draft">Concept</option>
          <option value="archived">Gearchiveerd</option>
        </select>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status] || ""}`}>
                {c.status === "active" ? "Actief" : c.status === "draft" ? "Concept" : "Gearchiveerd"}
              </span>
            </div>
            {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Users size={12} /> {c._studentCount} studenten</span>
              <span className="flex items-center gap-1"><FileText size={12} /> {c._assignmentCount} opdrachten</span>
            </div>
            {c.teacher && <p className="text-xs text-muted-foreground mb-3">Docent: {c.teacher.full_name}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setEditingClass(c); setShowModal(true); }}
                className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center gap-1">
                <Pencil size={12} /> Bewerken
              </button>
              {c.status !== "archived" && (
                <button onClick={() => handleArchive(c.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1">
                  <Archive size={12} /> Archiveer
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p>Geen klassen gevonden</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ClassFormModal
          classItem={editingClass}
          teachers={teachers}
          terms={terms}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingClass(null); }}
        />
      )}
    </div>
  );
}

function ClassFormModal({ classItem, teachers, terms, onSave, onClose }: {
  classItem: ClassItem | null; teachers: Teacher[]; terms: Term[];
  onSave: (form: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: classItem?.title || "",
    description: classItem?.description || "",
    teacher_id: classItem?.teacher_id || "",
    term_id: classItem?.term_id || "",
    status: classItem?.status || "draft",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading text-foreground">{classItem ? "Klas bewerken" : "Nieuwe klas"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Naam *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" placeholder="Klas naam" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Beschrijving</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm min-h-[80px]" placeholder="Beschrijving" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Docent</label>
            <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
              <option value="">Geen docent toegewezen</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Periode</label>
            <select value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
              <option value="">Geen periode</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
              <option value="draft">Concept</option>
              <option value="active">Actief</option>
              <option value="archived">Gearchiveerd</option>
            </select>
          </div>
          <button type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            {classItem ? "Opslaan" : "Klas aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}
