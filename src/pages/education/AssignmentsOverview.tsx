import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Search, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number | null;
  class_id: string;
  created_at: string;
  class_title?: string;
  submission_count?: number;
  graded_count?: number;
}

export default function AssignmentsOverview() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: assignData }, { data: classData }] = await Promise.all([
        supabase.from("assignments").select("*, classes!assignments_class_id_fkey(title)").order("created_at", { ascending: false }),
        supabase.from("classes").select("id, title").order("title"),
      ]);

      const enriched = await Promise.all((assignData || []).map(async (a: any) => {
        const [{ count: subCount }, { count: gradedCount }] = await Promise.all([
          supabase.from("submissions").select("*", { count: "exact", head: true }).eq("assignment_id", a.id),
          supabase.from("grades").select("*, submissions!inner(*)", { count: "exact", head: true }).eq("submissions.assignment_id", a.id),
        ]);
        return {
          ...a,
          class_title: a.classes?.title,
          submission_count: subCount || 0,
          graded_count: gradedCount || 0,
        };
      }));

      setAssignments(enriched);
      setClasses(classData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || a.class_id === classFilter;
    return matchSearch && matchClass;
  });

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-foreground">Opdrachten</h2>
        <p className="text-muted-foreground text-sm mt-1">{assignments.length} opdracht{assignments.length !== 1 ? "en" : ""}</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek opdrachten..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary">
          <option value="all">Alle klassen</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Opdracht</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Klas</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deadline</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Inzendingen</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Beoordeeld</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="py-3 px-4">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>}
                </td>
                <td className="py-3 px-4 text-foreground">{a.class_title}</td>
                <td className="py-3 px-4">
                  {a.due_date ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOverdue(a.due_date) ? "text-red-500" : "text-foreground"}`}>
                      {isOverdue(a.due_date) ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {new Date(a.due_date).toLocaleDateString("nl-NL")}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">Geen</span>}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">{a.submission_count}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <CheckCircle size={12} className="text-emerald-500" /> {a.graded_count}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>Geen opdrachten gevonden</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
