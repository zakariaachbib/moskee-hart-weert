import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AdminCursusNiveaus() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [levelDialog, setLevelDialog] = useState(false);
  const [moduleDialog, setModuleDialog] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [levelForm, setLevelForm] = useState({ title: "", description: "", sort_order: 0 });
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", sort_order: 0, level_id: "" });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: levels, isLoading } = useQuery({
    queryKey: ["admin-levels", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_levels")
        .select("*")
        .eq("course_id", selectedCourse)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["admin-modules", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const levelIds = levels?.map((l) => l.id) || [];
      if (levelIds.length === 0) return [];
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .in("level_id", levelIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveLevel = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from("course_levels").update({ title: data.title, description: data.description, sort_order: data.sort_order }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_levels").insert({ course_id: selectedCourse, title: data.title, description: data.description, sort_order: data.sort_order });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-levels"] });
      setLevelDialog(false);
      setEditingLevel(null);
      setLevelForm({ title: "", description: "", sort_order: 0 });
      toast({ title: "Niveau opgeslagen" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const deleteLevel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-levels"] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: "Niveau verwijderd" });
    },
  });

  const saveModule = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase.from("course_modules").update({ title: data.title, description: data.description, sort_order: data.sort_order, level_id: data.level_id }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_modules").insert({ level_id: data.level_id, title: data.title, description: data.description, sort_order: data.sort_order });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      setModuleDialog(false);
      setEditingModule(null);
      setModuleForm({ title: "", description: "", sort_order: 0, level_id: "" });
      toast({ title: "Module opgeslagen" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules"] });
      toast({ title: "Module verwijderd" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Niveaus & Modules</h1>
            <p className="text-muted-foreground">Beheer de structuur van je cursussen</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecteer een cursus" /></SelectTrigger>
            <SelectContent>
              {courses?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>

          {selectedCourse && (
            <div className="flex gap-2">
              <Dialog open={levelDialog} onOpenChange={(o) => { setLevelDialog(o); if (!o) { setEditingLevel(null); setLevelForm({ title: "", description: "", sort_order: 0 }); } }}>
                <DialogTrigger asChild><Button variant="outline"><Plus size={16} className="mr-2" />Niveau</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingLevel ? "Niveau bewerken" : "Nieuw niveau"}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Titel</Label><Input value={levelForm.title} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></div>
                    <div><Label>Beschrijving</Label><Textarea value={levelForm.description} onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })} rows={2} /></div>
                    <div><Label>Volgorde</Label><Input type="number" value={levelForm.sort_order} onChange={(e) => setLevelForm({ ...levelForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
                    <Button onClick={() => saveLevel.mutate({ ...levelForm, id: editingLevel?.id })} disabled={!levelForm.title} className="w-full">Opslaan</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={moduleDialog} onOpenChange={(o) => { setModuleDialog(o); if (!o) { setEditingModule(null); setModuleForm({ title: "", description: "", sort_order: 0, level_id: "" }); } }}>
                <DialogTrigger asChild><Button variant="outline"><Plus size={16} className="mr-2" />Module</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingModule ? "Module bewerken" : "Nieuwe module"}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Niveau</Label>
                      <Select value={moduleForm.level_id} onValueChange={(v) => setModuleForm({ ...moduleForm, level_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecteer niveau" /></SelectTrigger>
                        <SelectContent>{levels?.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Titel</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} /></div>
                    <div><Label>Beschrijving</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} /></div>
                    <div><Label>Volgorde</Label><Input type="number" value={moduleForm.sort_order} onChange={(e) => setModuleForm({ ...moduleForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
                    <Button onClick={() => saveModule.mutate({ ...moduleForm, id: editingModule?.id })} disabled={!moduleForm.title || !moduleForm.level_id} className="w-full">Opslaan</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {!selectedCourse ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Selecteer eerst een cursus om de niveaus en modules te bekijken.</CardContent></Card>
        ) : isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : levels?.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen niveaus. Maak een niveau aan.</CardContent></Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {levels?.map((level) => {
              const levelModules = modules?.filter((m) => m.level_id === level.id) || [];
              return (
                <AccordionItem key={level.id} value={level.id} className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">#{level.sort_order}</span>
                      <span className="font-semibold">{level.title}</span>
                      <span className="text-xs text-muted-foreground">({levelModules.length} modules)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm text-muted-foreground flex-1">{level.description}</p>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingLevel(level); setLevelForm({ title: level.title, description: level.description || "", sort_order: level.sort_order }); setLevelDialog(true); }}><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Niveau en alle modules verwijderen?")) deleteLevel.mutate(level.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                    {levelModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Geen modules</p>
                    ) : (
                      <div className="space-y-2">
                        {levelModules.map((mod) => (
                          <div key={mod.id} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                            <div>
                              <span className="text-xs text-muted-foreground mr-2">#{mod.sort_order}</span>
                              <span className="text-sm font-medium">{mod.title}</span>
                              {mod.description && <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingModule(mod); setModuleForm({ title: mod.title, description: mod.description || "", sort_order: mod.sort_order, level_id: mod.level_id }); setModuleDialog(true); }}><Edit size={14} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Module verwijderen?")) deleteModule.mutate(mod.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AdminLayout>
  );
}
