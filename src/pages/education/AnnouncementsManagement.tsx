import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Plus, Loader2, X, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience_role: string | null;
  class_id: string | null;
  created_at: string;
  class_title?: string;
}

const AUDIENCE_OPTIONS = [
  { value: "", label: "Iedereen" },
  { value: "student", label: "Studenten" },
  { value: "teacher", label: "Docenten" },
  { value: "education_management", label: "Management" },
];

export default function AnnouncementsManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: annData }, { data: classData }] = await Promise.all([
        supabase.from("announcements").select("*, classes!announcements_class_id_fkey(title)").order("created_at", { ascending: false }),
        supabase.from("classes").select("id, title").order("title"),
      ]);
      setAnnouncements((annData || []).map((a: any) => ({ ...a, class_title: a.classes?.title })));
      setClasses(classData || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (form: { title: string; message: string; audience_role: string; class_id: string }) => {
    try {
      const insertData: any = {
        title: form.title, message: form.message,
        audience_role: form.audience_role || null,
        class_id: form.class_id || null,
        created_by: user?.id,
      };
      const { error } = await supabase.from("announcements").insert(insertData);
      if (error) throw error;
      toast({ title: "Mededeling geplaatst" });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Mededeling verwijderen?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Mededelingen</h2>
          <p className="text-muted-foreground text-sm mt-1">{announcements.length} mededeling{announcements.length !== 1 ? "en" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nieuwe mededeling
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{a.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  {a.audience_role && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                      {AUDIENCE_OPTIONS.find(o => o.value === a.audience_role)?.label || a.audience_role}
                    </span>
                  )}
                  {a.class_title && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">{a.class_title}</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p>Geen mededelingen</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading text-foreground">Nieuwe mededeling</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <AnnouncementForm classes={classes} onSave={handleCreate} />
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementForm({ classes, onSave }: { classes: { id: string; title: string }[]; onSave: (form: any) => void }) {
  const [form, setForm] = useState({ title: "", message: "", audience_role: "", class_id: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Titel *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Bericht *</label>
        <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm min-h-[100px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Doelgroep</label>
        <select value={form.audience_role} onChange={(e) => setForm({ ...form, audience_role: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
          {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Specifieke klas (optioneel)</label>
        <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
          <option value="">Alle klassen</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
        Mededeling plaatsen
      </button>
    </form>
  );
}
