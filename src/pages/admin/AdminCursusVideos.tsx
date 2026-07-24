import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Video, Edit, Search, CheckCircle2, AlertCircle } from "lucide-react";
import LessonVideoManager from "@/components/lesson/LessonVideoManager";
import LessonThumb from "@/components/lesson/LessonThumb";

type Filter = "all" | "with" | "without";

export default function AdminCursusVideos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [editing, setEditing] = useState<any>(null);
  const [mediaDraft, setMediaDraft] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["all-lesson-videos"],
    queryFn: async () => {
      const [{ data: courses }, { data: levels }, { data: modules }, { data: lessons }] = await Promise.all([
        supabase.from("courses").select("id, title").order("title"),
        supabase.from("course_levels").select("id, title, course_id, sort_order"),
        supabase.from("course_modules").select("id, title, level_id, sort_order"),
        supabase.from("course_lessons").select("id, title, module_id, sort_order, media_urls").order("sort_order"),
      ]);
      const modMap = new Map((modules || []).map((m: any) => [m.id, m]));
      const lvlMap = new Map((levels || []).map((l: any) => [l.id, l]));
      const crsMap = new Map((courses || []).map((c: any) => [c.id, c]));
      const rows = (lessons || []).map((l: any) => {
        const mod = modMap.get(l.module_id) as any;
        const lvl = mod ? (lvlMap.get(mod.level_id) as any) : null;
        const crs = lvl ? (crsMap.get(lvl.course_id) as any) : null;
        return {
          ...l,
          moduleTitle: mod?.title ?? "—",
          levelTitle: lvl?.title ?? "—",
          courseTitle: crs?.title ?? "—",
          courseId: crs?.id ?? null,
        };
      });
      return { rows, courses: courses || [] };
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, media_urls }: any) => {
      const { error } = await supabase.from("course_lessons").update({ media_urls }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-lesson-videos"] });
      toast({ title: "Video opgeslagen" });
      setEditing(null);
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r) => {
      const hasVideo = !!(r.media_urls && typeof r.media_urls === "object" && (r.media_urls as any).path);
      if (filter === "with" && !hasVideo) return false;
      if (filter === "without" && hasVideo) return false;
      if (courseFilter !== "all" && r.courseId !== courseFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![r.title, r.moduleTitle, r.levelTitle, r.courseTitle].some((v) => (v || "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [data, filter, search, courseFilter]);

  const total = data?.rows.length ?? 0;
  const withVideo = (data?.rows ?? []).filter((r) => !!(r.media_urls && typeof r.media_urls === "object" && (r.media_urls as any).path)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Lesvideo's</h1>
            <p className="text-muted-foreground text-sm">Overzicht van alle {total} lessen — snel video's toevoegen, bewerken of vervangen.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1"><CheckCircle2 size={12} className="text-green-600" /> {withVideo} met video</Badge>
            <Badge variant="secondary" className="gap-1"><AlertCircle size={12} className="text-amber-600" /> {total - withVideo} zonder</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Zoek les, module, cursus..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Cursus" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle cursussen</SelectItem>
              {data?.courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-md border overflow-hidden">
            {(["all", "with", "without"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm ${filter === f ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                {f === "all" ? "Alle" : f === "with" ? "Met video" : "Zonder"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Geen lessen gevonden.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((lesson) => {
              const hasVideo = !!(lesson.media_urls && typeof lesson.media_urls === "object" && (lesson.media_urls as any).path);
              return (
                <Card key={lesson.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <LessonThumb media={lesson.media_urls} />
                    {!hasVideo && (
                      <div className="w-20 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <Video size={16} className="text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{lesson.courseTitle} · {lesson.levelTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">#{lesson.sort_order}</span>
                        <h3 className="font-medium truncate">{lesson.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">Module: {lesson.moduleTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasVideo ? (
                        <Badge variant="outline" className="gap-1 text-green-700 border-green-200"><CheckCircle2 size={12} /> Video</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200"><AlertCircle size={12} /> Geen video</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setEditing(lesson); setMediaDraft(lesson.media_urls ?? null); }}>
                        <Edit size={14} className="mr-1" /> {hasVideo ? "Bewerken" : "Uploaden"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Video — {editing?.title}</DialogTitle>
              <p className="text-xs text-muted-foreground">{editing?.courseTitle} · {editing?.levelTitle} · {editing?.moduleTitle}</p>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <LessonVideoManager value={mediaDraft} onChange={setMediaDraft} folder="lessons" entityId={editing.id} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(null)}>Annuleren</Button>
                  <Button onClick={() => save.mutate({ id: editing.id, media_urls: mediaDraft })} disabled={save.isPending}>Opslaan</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
