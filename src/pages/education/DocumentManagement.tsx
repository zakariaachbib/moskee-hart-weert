import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FolderOpen, Plus, Search, Loader2, X, Download, Trash2, FileText, FileSpreadsheet, FileImage } from "lucide-react";

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  academic_year: string | null;
  class_id: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  class_title?: string;
}

const CATEGORIES = [
  { value: "curriculum", label: "Curriculum" },
  { value: "policy", label: "Beleid" },
  { value: "guidelines", label: "Richtlijnen" },
  { value: "schedule", label: "Rooster" },
  { value: "forms", label: "Formulieren" },
  { value: "exams", label: "Examens" },
  { value: "general", label: "Overig" },
];

export default function DocumentManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: docs }, { data: classData }] = await Promise.all([
        supabase.from("edu_documents").select("*, classes!edu_documents_class_id_fkey(title)").order("created_at", { ascending: false }),
        supabase.from("classes").select("id, title").order("title"),
      ]);
      setDocuments((docs || []).map((d: any) => ({ ...d, class_title: d.classes?.title })));
      setClasses(classData || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (form: { title: string; description: string; category: string; academic_year: string; class_id: string; file: File | null }) => {
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (form.file) {
        fileName = form.file.name;
        fileType = form.file.type;
        const filePath = `${Date.now()}-${form.file.name}`;
        const { error: uploadErr } = await supabase.storage.from("edu-documents").upload(filePath, form.file);
        if (uploadErr) throw uploadErr;
        // Store the storage path, not a public URL (bucket is private)
        fileUrl = filePath;
      }

      const { error } = await supabase.from("edu_documents").insert({
        title: form.title,
        description: form.description || null,
        category: form.category,
        academic_year: form.academic_year || null,
        class_id: form.class_id || null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        uploaded_by: user?.id,
      });
      if (error) throw error;
      toast({ title: "Document toegevoegd" });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;
    try {
      await supabase.from("edu_documents").delete().eq("id", docId);
      toast({ title: "Document verwijderd" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getFileIcon = (type: string | null) => {
    if (!type) return <FileText size={20} className="text-muted-foreground" />;
    if (type.includes("image")) return <FileImage size={20} className="text-blue-500" />;
    if (type.includes("spreadsheet") || type.includes("excel")) return <FileSpreadsheet size={20} className="text-emerald-500" />;
    return <FileText size={20} className="text-amber-500" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Documenten</h2>
          <p className="text-muted-foreground text-sm mt-1">{documents.length} document{documents.length !== 1 ? "en" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Document uploaden
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek documenten..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm text-foreground" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-primary">
          <option value="all">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Documents list */}
      <div className="space-y-3">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div className="p-2.5 rounded-lg bg-muted shrink-0">{getFileIcon(doc.file_type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                </span>
                {doc.academic_year && <span className="text-xs text-muted-foreground">{doc.academic_year}</span>}
                {doc.class_title && <span className="text-xs text-muted-foreground">• {doc.class_title}</span>}
                <span className="text-xs text-muted-foreground">• v{doc.version}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Downloaden">
                  <Download size={16} />
                </a>
              )}
              <button onClick={() => handleDelete(doc.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Verwijderen">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p>Geen documenten gevonden</p>
          </div>
        )}
      </div>

      {showModal && <UploadModal classes={classes} onUpload={handleUpload} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function UploadModal({ classes, onUpload, onClose }: {
  classes: { id: string; title: string }[];
  onUpload: (form: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", category: "general", academic_year: "", class_id: "", file: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onUpload(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading text-foreground">Document uploaden</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Titel *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Beschrijving</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm min-h-[60px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Categorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Academisch jaar</label>
            <input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="bijv. 2025-2026"
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Klas (optioneel)</label>
            <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
              <option value="">Geen specifieke klas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bestand</label>
            <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {submitting ? "Uploaden..." : "Document toevoegen"}
          </button>
        </form>
      </div>
    </div>
  );
}
