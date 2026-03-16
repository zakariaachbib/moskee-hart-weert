import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdminCursusLessen() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", arabic_terms: "", sort_order: 0 });

  const { data: courses } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").order("title");
      return data || [];
    },
  });

  const { data: allModules } = useQuery({
    queryKey: ["all-modules-for-lessons", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data: levels } = await supabase.from("course_levels").select("id, title").eq("course_id", selectedCourse).order("sort_order");
      if (!levels?.length) return [];
      const { data: mods } = await supabase.from("course_modules").select("id, title, level_id").in("level_id", levels.map(l => l.id)).order("sort_order");
      return (mods || []).map(m => ({ ...m, levelTitle: levels.find(l => l.id === m.level_id)?.title }));
    },
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", selectedModule],
    enabled: !!selectedModule,
    queryFn: async () => {
      const { data, error } = await supabase.from("course_lessons").select("*").eq("module_id", selectedModule).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const arabicTerms = data.arabic_terms ? data.arabic_terms.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
      const payload = { title: data.title, content: data.content, arabic_terms: arabicTerms, sort_order: data.sort_order, module_id: selectedModule };
      if (data.id) {
        const { error } = await supabase.from("course_lessons").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_lessons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ title: "", content: "", arabic_terms: "", sort_order: 0 });
      toast({ title: "Les opgeslagen" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Les verwijderd" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Lessen beheer</h1>
          <p className="text-muted-foreground">Maak en bewerk lesinhoud</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedModule(""); }}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Selecteer cursus" /></SelectTrigger>
            <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
          {selectedCourse && (
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Selecteer module" /></SelectTrigger>
              <SelectContent>
                {allModules?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.levelTitle} → {m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedModule && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm({ title: "", content: "", arabic_terms: "", sort_order: 0 }); } }}>
              <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Nieuwe les</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editing ? "Les bewerken" : "Nieuwe les"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Titel</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>Inhoud</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-sm" /></div>
                  <div><Label>Arabische termen (kommagescheiden)</Label><Input value={form.arabic_terms} onChange={(e) => setForm({ ...form, arabic_terms: e.target.value })} placeholder="wuḍūʾ, ṣalāh, ghusl" /></div>
                  <div><Label>Volgorde</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
                  <Button onClick={() => saveMutation.mutate({ ...form, id: editing?.id })} disabled={!form.title} className="w-full">Opslaan</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!selectedModule ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Selecteer een cursus en module om lessen te bekijken.</CardContent></Card>
        ) : isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : lessons?.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen lessen in deze module.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {lessons?.map((lesson) => (
              <Card key={lesson.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#{lesson.sort_order}</span>
                        <h3 className="font-semibold">{lesson.title}</h3>
                      </div>
                      {lesson.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.content.substring(0, 200)}...</p>}
                      {lesson.arabic_terms && Array.isArray(lesson.arabic_terms) && (lesson.arabic_terms as string[]).length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {(lesson.arabic_terms as string[]).map((term: string, i: number) => (
                            <span key={i} className="text-xs bg-accent px-2 py-0.5 rounded">{term}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditing(lesson);
                        setForm({
                          title: lesson.title,
                          content: lesson.content || "",
                          arabic_terms: Array.isArray(lesson.arabic_terms) ? (lesson.arabic_terms as string[]).join(", ") : "",
                          sort_order: lesson.sort_order,
                        });
                        setDialogOpen(true);
                      }}><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Les verwijderen?")) deleteMutation.mutate(lesson.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
