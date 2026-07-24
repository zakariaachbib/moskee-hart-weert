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
import { Video, Edit, Search, CheckCircle2, AlertCircle, Image as ImageIcon, Captions, ArrowUpDown, Download, FileText } from "lucide-react";
import LessonVideoManager from "@/components/lesson/LessonVideoManager";
import LessonThumb from "@/components/lesson/LessonThumb";
import jsPDF from "jspdf";

type StatusFilter = "all" | "missing-video" | "missing-thumb" | "missing-subs" | "complete";
type SortKey = "priority" | "course" | "title" | "status";

function classify(media: any) {
  const m = media && typeof media === "object" ? media : null;
  const hasVideo = !!m?.path;
  const hasThumb = !!m?.thumbnail_path;
  const hasSubs = !!m?.vtt_path;
  // Priority: lower = more urgent
  let priority = 4;
  if (!hasVideo) priority = 0;
  else if (!hasThumb) priority = 1;
  else if (!hasSubs) priority = 2;
  else priority = 3;
  return { hasVideo, hasThumb, hasSubs, priority };
}

function statusLabel(c: { hasVideo: boolean; hasThumb: boolean; hasSubs: boolean }) {
  if (!c.hasVideo) return "Geen video";
  const missing = [!c.hasThumb && "thumbnail", !c.hasSubs && "ondertitels"].filter(Boolean).join(" + ");
  return missing ? `Ontbreekt: ${missing}` : "Compleet";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function exportCsv(rows: any[]) {
  const headers = ["Cursus", "Niveau", "Module", "#", "Les", "Video", "Thumbnail", "Ondertitels", "Status"];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    const c = r._cls;
    lines.push([
      esc(r.courseTitle), esc(r.levelTitle), esc(r.moduleTitle), r.sort_order, esc(r.title),
      c.hasVideo ? "ja" : "nee", c.hasThumb ? "ja" : "nee", c.hasSubs ? "ja" : "nee", esc(statusLabel(c)),
    ].join(","));
  }
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `lesvideos-${stamp}.csv`);
}

function exportPdf(rows: any[], stats: { total: number; noVideo: number; noThumb: number; noSubs: number; complete: number }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  let y = margin;

  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("Lesvideo's — Statusoverzicht", margin, y); y += 20;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Gegenereerd: ${new Date().toLocaleString("nl-NL")}`, margin, y); y += 14;
  doc.setTextColor(0);
  doc.text(
    `Totaal: ${stats.total}   Zonder video: ${stats.noVideo}   Zonder thumbnail: ${stats.noThumb}   Zonder ondertitels: ${stats.noSubs}   Compleet: ${stats.complete}`,
    margin, y,
  );
  y += 18;

  // Table header
  const cols = [
    { k: "courseTitle", w: 110, label: "Cursus" },
    { k: "moduleTitle", w: 110, label: "Module" },
    { k: "num", w: 26, label: "#" },
    { k: "title", w: 150, label: "Les" },
    { k: "v", w: 28, label: "Vid" },
    { k: "t", w: 32, label: "Thumb" },
    { k: "s", w: 32, label: "Subs" },
    { k: "status", w: pageW - margin * 2 - (110 + 110 + 26 + 150 + 28 + 32 + 32), label: "Status" },
  ];

  const drawHeader = () => {
    doc.setFillColor(240); doc.rect(margin, y, pageW - margin * 2, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    let x = margin + 4;
    for (const c of cols) { doc.text(c.label, x, y + 12); x += c.w; }
    y += 20;
    doc.setFont("helvetica", "normal");
  };
  drawHeader();

  doc.setFontSize(8);
  for (const r of rows) {
    if (y > pageH - margin - 20) { doc.addPage(); y = margin; drawHeader(); }
    const c = r._cls;
    const row: Record<string, string> = {
      courseTitle: String(r.courseTitle ?? ""),
      moduleTitle: String(r.moduleTitle ?? ""),
      num: String(r.sort_order ?? ""),
      title: String(r.title ?? ""),
      v: c.hasVideo ? "✓" : "—",
      t: c.hasThumb ? "✓" : "—",
      s: c.hasSubs ? "✓" : "—",
      status: statusLabel(c),
    };
    let x = margin + 4;
    if (!c.hasVideo) { doc.setTextColor(200, 40, 40); }
    else if (!c.hasThumb || !c.hasSubs) { doc.setTextColor(180, 100, 20); }
    else { doc.setTextColor(30, 130, 60); }
    for (const col of cols) {
      const text = doc.splitTextToSize(row[col.k], col.w - 6)[0] || "";
      if (["v", "t", "s"].includes(col.k)) {
        doc.text(text, x + col.w / 2, y + 10, { align: "center" });
      } else {
        doc.text(text, x, y + 10);
      }
      x += col.w;
    }
    doc.setTextColor(0);
    y += 14;
    doc.setDrawColor(230); doc.line(margin, y, pageW - margin, y);
    y += 2;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`lesvideos-${stamp}.pdf`);
}

export default function AdminCursusVideos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
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
          _cls: classify(l.media_urls),
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
    const out = rows.filter((r) => {
      const c = r._cls;
      if (status === "missing-video" && c.hasVideo) return false;
      if (status === "missing-thumb" && (!c.hasVideo || c.hasThumb)) return false;
      if (status === "missing-subs" && (!c.hasVideo || c.hasSubs)) return false;
      if (status === "complete" && !(c.hasVideo && c.hasThumb && c.hasSubs)) return false;
      if (courseFilter !== "all" && r.courseId !== courseFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (![r.title, r.moduleTitle, r.levelTitle, r.courseTitle].some((v) => (v || "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
    out.sort((a: any, b: any) => {
      if (sortKey === "priority") {
        if (a._cls.priority !== b._cls.priority) return a._cls.priority - b._cls.priority;
        return (a.courseTitle || "").localeCompare(b.courseTitle || "") || a.sort_order - b.sort_order;
      }
      if (sortKey === "course") {
        return (a.courseTitle || "").localeCompare(b.courseTitle || "") ||
          (a.levelTitle || "").localeCompare(b.levelTitle || "") ||
          (a.moduleTitle || "").localeCompare(b.moduleTitle || "") ||
          a.sort_order - b.sort_order;
      }
      if (sortKey === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortKey === "status") return b._cls.priority - a._cls.priority;
      return 0;
    });
    return out;
  }, [data, status, search, courseFilter, sortKey]);

  const rows = data?.rows ?? [];
  const total = rows.length;
  const noVideo = rows.filter((r) => !r._cls.hasVideo).length;
  const noThumb = rows.filter((r) => r._cls.hasVideo && !r._cls.hasThumb).length;
  const noSubs = rows.filter((r) => r._cls.hasVideo && !r._cls.hasSubs).length;
  const complete = rows.filter((r) => r._cls.hasVideo && r._cls.hasThumb && r._cls.hasSubs).length;

  const stat = (label: string, value: number, key: StatusFilter, icon: any, color: string) => (
    <button
      onClick={() => setStatus(key)}
      className={`flex-1 min-w-[130px] text-left border rounded-lg p-3 transition ${status === key ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Lesvideo's</h1>
            <p className="text-muted-foreground text-sm">Overzicht van alle {total} lessen — filter op ontbrekende media en werk op prioriteit.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
              <Download size={14} className="mr-1" /> CSV ({filtered.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPdf(filtered, { total, noVideo, noThumb, noSubs, complete })}>
              <FileText size={14} className="mr-1" /> PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {stat("Totaal", total, "all", <Video size={12} />, "text-foreground")}
          {stat("Zonder video", noVideo, "missing-video", <AlertCircle size={12} />, "text-red-600")}
          {stat("Zonder thumbnail", noThumb, "missing-thumb", <ImageIcon size={12} />, "text-amber-600")}
          {stat("Zonder ondertitels", noSubs, "missing-subs", <Captions size={12} />, "text-blue-600")}
          {stat("Compleet", complete, "complete", <CheckCircle2 size={12} />, "text-green-600")}
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
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-52"><ArrowUpDown size={14} className="mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Prioriteit (urgent eerst)</SelectItem>
              <SelectItem value="course">Cursus → Niveau → Module</SelectItem>
              <SelectItem value="title">Titel (A-Z)</SelectItem>
              <SelectItem value="status">Compleet eerst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Geen lessen gevonden.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((lesson: any) => {
              const c = lesson._cls;
              return (
                <Card key={lesson.id} className={!c.hasVideo ? "border-red-200" : !c.hasThumb ? "border-amber-200" : ""}>
                  <CardContent className="p-3 flex items-center gap-3">
                    {c.hasVideo ? (
                      <LessonThumb media={lesson.media_urls} />
                    ) : (
                      <div className="w-20 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <Video size={16} className="text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{lesson.courseTitle} · {lesson.levelTitle}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">#{lesson.sort_order}</span>
                        <h3 className="font-medium truncate">{lesson.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">Module: {lesson.moduleTitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`gap-1 ${c.hasVideo ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}`}>
                        <Video size={11} /> {c.hasVideo ? "Video" : "Geen"}
                      </Badge>
                      <Badge variant="outline" className={`gap-1 hidden sm:inline-flex ${c.hasThumb ? "text-green-700 border-green-200" : "text-amber-700 border-amber-200"}`}>
                        <ImageIcon size={11} /> {c.hasThumb ? "Thumb" : "—"}
                      </Badge>
                      <Badge variant="outline" className={`gap-1 hidden sm:inline-flex ${c.hasSubs ? "text-green-700 border-green-200" : "text-muted-foreground"}`}>
                        <Captions size={11} /> {c.hasSubs ? "Subs" : "—"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(lesson); setMediaDraft(lesson.media_urls ?? null); }}>
                        <Edit size={14} className="sm:mr-1" /><span className="hidden sm:inline">{c.hasVideo ? "Bewerken" : "Uploaden"}</span>
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
