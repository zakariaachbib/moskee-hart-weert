import { useEffect, useMemo, useState } from "react";
// LINE_COLORS: vaste kleuren per klas in de lijngrafiek
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarCheck, Camera, Eraser, FileDown, Loader2, Undo2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import { compareEducationClasses } from "@/lib/educationClassOrder";
import { PhotoCropDialog } from "@/components/education/PhotoCropDialog";

type Status = "aanwezig" | "te_laat" | "afwezig";
type Student = { id: string; name: string; class_name: string; tenant_id: string | null };
type Row = { student_id: string; lesson_date: string; status: Status };

// Lesjaar 2026-2027 (Ta3leem agenda): zondagen 6 sep 2026 t/m 18 jul 2027, minus vakanties
const HOLIDAYS: [string, string][] = [
  ["2026-10-11", "2026-10-19"], ["2027-02-13", "2027-02-21"],
  ["2027-03-10", "2027-03-12"], ["2027-04-24", "2027-05-09"], ["2027-05-15", "2027-05-18"],
];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const SUNDAYS: string[] = (() => {
  const out: string[] = [];
  for (let d = new Date(2026, 8, 6); d <= new Date(2027, 6, 18); d.setDate(d.getDate() + 7)) {
    const s = iso(d);
    if (!HOLIDAYS.some(([a, b]) => s >= a && s <= b)) out.push(s);
  }
  return out;
})();
const fmt = (s: string) => new Date(s + "T12:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const isArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

const OPTIONS: { v: Status; label: string; cls: string }[] = [
  { v: "aanwezig", label: "Aanwezig", cls: "bg-emerald-600 text-white border-emerald-600" },
  { v: "te_laat", label: "Te laat", cls: "bg-amber-500 text-white border-amber-500" },
  { v: "afwezig", label: "Afwezig", cls: "bg-destructive text-destructive-foreground border-destructive" },
];

export default function EduAttendance() {
  const { activeTenant } = useTenant();
  const today = iso(new Date());
  const [date, setDate] = useState(SUNDAYS.filter((s) => s <= today).pop() ?? SUNDAYS[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [cls, setCls] = useState("alle");
  const [tab, setTab] = useState<"invullen" | "overzicht">("invullen");
  const [from, setFrom] = useState(SUNDAYS[0]);
  const [to, setTo] = useState(SUNDAYS[SUNDAYS.length - 1]);
  const [editId, setEditId] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<{ s: Student; date: string; prev: Status | null } | null>(null);
  const [lastClear, setLastClear] = useState<{ date: string; entries: { student_id: string; tenant_id: string | null; status: Status }[] } | null>(null);
  const [lineDetail, setLineDetail] = useState<{ c: string; d: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [scanPhase, setScanPhase] = useState<"preparing" | "uploading" | "reading">("preparing");
  const [scanElapsed, setScanElapsed] = useState(0);
  const [scanResult, setScanResult] = useState<{ entries: { student_id: string; date: string; status: Status }[]; unmatched: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from("edu_directory_students").select("id,name,class_name,tenant_id").neq("status", "gestopt").order("class_name").order("sort_order");
      if (activeTenant?.id) q = q.eq("tenant_id", activeTenant.id);
      const { data } = await q;
      setStudents((data as Student[]) ?? []);
      let a = supabase.from("edu_directory_attendance" as any).select("student_id,lesson_date,status");
      if (activeTenant?.id) a = a.eq("tenant_id", activeTenant.id);
      const { data: att } = await a;
      setRows(((att as unknown) as Row[]) ?? []);
    })();
  }, [activeTenant?.id]);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class_name))].sort(compareEducationClasses), [students]);
  const shown = students.filter((s) => cls === "alle" || s.class_name === cls);
  const byKey = useMemo(() => new Map(rows.map((r) => [`${r.student_id}|${r.lesson_date}`, r.status])), [rows]);

  const mark = async (s: Student, status: Status, forDate = date) => {
    const current = byKey.get(`${s.id}|${forDate}`);
    const { data: u } = await supabase.auth.getUser();
    if (current === status) {
      await supabase.from("edu_directory_attendance" as any).delete().eq("student_id", s.id).eq("lesson_date", forDate);
      setRows((r) => r.filter((x) => !(x.student_id === s.id && x.lesson_date === forDate)));
      setLastChange({ s, date: forDate, prev: current ?? null });
      return;
    }
    const { error } = await supabase.from("edu_directory_attendance" as any).upsert(
      { student_id: s.id, tenant_id: s.tenant_id, lesson_date: forDate, status, marked_by: u.user?.id },
      { onConflict: "student_id,lesson_date" },
    );
    if (error) return toast.error("Opslaan mislukt");
    setRows((r) => [...r.filter((x) => !(x.student_id === s.id && x.lesson_date === forDate)), { student_id: s.id, lesson_date: forDate, status }]);
    setLastChange({ s, date: forDate, prev: current ?? null });
    if (forDate !== date) toast.success(`${s.name} · ${fmt(forDate)} opgeslagen`);
  };

  const undoLast = async () => {
    if (!lastChange) return;
    const { s, date: d, prev } = lastChange;
    if (prev === null) {
      await supabase.from("edu_directory_attendance" as any).delete().eq("student_id", s.id).eq("lesson_date", d);
      setRows((r) => r.filter((x) => !(x.student_id === s.id && x.lesson_date === d)));
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("edu_directory_attendance" as any).upsert(
        { student_id: s.id, tenant_id: s.tenant_id, lesson_date: d, status: prev, marked_by: u.user?.id },
        { onConflict: "student_id,lesson_date" },
      );
      if (error) return toast.error("Ongedaan maken mislukt");
      setRows((r) => [...r.filter((x) => !(x.student_id === s.id && x.lesson_date === d)), { student_id: s.id, lesson_date: d, status: prev }]);
    }
    toast.success(`Wijziging bij ${s.name} (${fmt(d)}) ongedaan gemaakt`);
    setLastChange(null);
  };

  const markRestPresent = async () => {
    const { data: u } = await supabase.auth.getUser();
    const todo = shown.filter((s) => !byKey.get(`${s.id}|${date}`));
    if (!todo.length) return;
    const payload = todo.map((s) => ({ student_id: s.id, tenant_id: s.tenant_id, lesson_date: date, status: "aanwezig", marked_by: u.user?.id }));
    const { error } = await supabase.from("edu_directory_attendance" as any).upsert(payload, { onConflict: "student_id,lesson_date" });
    if (error) return toast.error("Opslaan mislukt");
    setRows((r) => [...r, ...todo.map((s) => ({ student_id: s.id, lesson_date: date, status: "aanwezig" as Status }))]);
    toast.success(`${todo.length} leerlingen aanwezig gezet`);
  };

  // Alles leegmaken: alle registraties van de gekozen dag voor de getoonde leerlingen wissen
  const clearAll = async () => {
    const todo = shown.filter((s) => byKey.get(`${s.id}|${date}`));
    if (!todo.length) return toast.info("Er is nog niets ingevuld voor deze dag");
    const ids = new Set(todo.map((s) => s.id));
    const entries = todo.map((s) => ({
      student_id: s.id,
      tenant_id: s.tenant_id,
      status: byKey.get(`${s.id}|${date}`) as Status,
    }));
    const { error } = await supabase
      .from("edu_directory_attendance" as any)
      .delete()
      .eq("lesson_date", date)
      .in("student_id", [...ids]);
    if (error) return toast.error("Leegmaken mislukt");
    setRows((r) => r.filter((x) => !(ids.has(x.student_id) && x.lesson_date === date)));
    setLastChange(null);
    setLastClear({ date, entries });
    toast.success(`${todo.length} registraties geleegd (${fmt(date)})`);
  };

  // Alles terugzetten: de zojuist geleegde registraties van die dag opnieuw opslaan
  const undoClearAll = async () => {
    if (!lastClear) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("edu_directory_attendance" as any).upsert(
      lastClear.entries.map((e) => ({
        student_id: e.student_id,
        tenant_id: e.tenant_id,
        lesson_date: lastClear.date,
        status: e.status,
        marked_by: u.user?.id,
      })),
      { onConflict: "student_id,lesson_date" },
    );
    if (error) return toast.error("Terugzetten mislukt");
    const restored = new Set(lastClear.entries.map((e) => e.student_id));
    setRows((r) => [
      ...r.filter((x) => !(x.lesson_date === lastClear.date && restored.has(x.student_id))),
      ...lastClear.entries.map((e) => ({ student_id: e.student_id, lesson_date: lastClear.date, status: e.status })),
    ]);
    toast.success(`${lastClear.entries.length} registraties teruggezet (${fmt(lastClear.date)})`);
    setLastClear(null);
  };

  const scanPhoto = async (file: File) => {
    setScanning(true);
    setScanPhase("preparing");
    setScanElapsed(0);
    const startedAt = Date.now();
    const ticker = setInterval(() => setScanElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    try {
      const { dataUrl, issues } = await new Promise<{ dataUrl: string; issues: string[] }>((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = img.width * scale; c.height = img.height * scale;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(img, 0, 0, c.width, c.height);
          // Kwaliteitscontrole op verkleinde kopie (max 500px)
          const qs = Math.min(1, 500 / Math.max(c.width, c.height));
          const q = document.createElement("canvas");
          q.width = Math.round(c.width * qs); q.height = Math.round(c.height * qs);
          const qctx = q.getContext("2d")!;
          qctx.drawImage(c, 0, 0, q.width, q.height);
          const px = qctx.getImageData(0, 0, q.width, q.height).data;
          const w = q.width, h = q.height;
          const g = new Float32Array(w * h);
          let sum = 0;
          for (let i = 0; i < w * h; i++) { const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; g[i] = v; sum += v; }
          const mean = sum / (w * h);
          let ls = 0, ls2 = 0, n = 0;
          for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const l = g[i - 1] + g[i + 1] + g[i - w] + g[i + w] - 4 * g[i];
            ls += l; ls2 += l * l; n++;
          }
          const lapVar = ls2 / n - (ls / n) ** 2;
          const issues: string[] = [];
          if (mean < 70) issues.push("te donker");
          else if (mean > 235) issues.push("overbelicht");
          if (lapVar < 60) issues.push("onscherp/wazig");
          URL.revokeObjectURL(img.src);
          res({ dataUrl: c.toDataURL("image/jpeg", 0.75), issues });
        };
        img.onerror = rej;
        img.src = URL.createObjectURL(file);
      });
      if (issues.length && !window.confirm(`De foto lijkt ${issues.join(" en ")}. Dat kan fouten geven bij het uitlezen.\n\nOK = toch uitlezen\nAnnuleren = nieuwe foto maken`)) {
        toast.info("Maak een nieuwe, scherpe foto bij goed licht.");
        return;
      }
      setScanPhase("uploading");
      // Korte pauze zodat de uploadfase zichtbaar is, daarna het uitlezen
      await new Promise((r) => setTimeout(r, 400));
      setScanPhase("reading");
      const { data, error } = await supabase.functions.invoke("scan-attendance-sheet", {
        body: { image: dataUrl, date, students: shown.map(({ id, name, class_name }) => ({ id, name, class_name })) },
      });
      if (error || data?.error) throw new Error(data?.error || "Foto lezen mislukt");
      setScanResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Foto lezen mislukt");
    } finally { clearInterval(ticker); setScanning(false); }
  };

  const saveScan = async () => {
    if (!scanResult) return;
    const { data: u } = await supabase.auth.getUser();
    // Altijd opslaan op de gekozen zondag: per leerling de laatst ingevulde kolom van de foto.
    const latest = new Map<string, (typeof scanResult.entries)[number]>();
    scanResult.entries.forEach((e) => {
      const prev = latest.get(e.student_id);
      if (!prev || (e.date ?? "") >= (prev.date ?? "")) latest.set(e.student_id, e);
    });
    const payload = [...latest.values()].map((e) => ({
      student_id: e.student_id, status: e.status, lesson_date: date,
      tenant_id: students.find((s) => s.id === e.student_id)?.tenant_id, marked_by: u.user?.id,
    }));
    const { error } = await supabase.from("edu_directory_attendance" as any).upsert(payload, { onConflict: "student_id,lesson_date" });
    if (error) return toast.error("Opslaan mislukt");
    const keys = new Set(payload.map((p) => `${p.student_id}|${p.lesson_date}`));
    setRows((r) => [...r.filter((x) => !keys.has(`${x.student_id}|${x.lesson_date}`)), ...payload.map((p) => ({ student_id: p.student_id, lesson_date: p.lesson_date, status: p.status as Status }))]);
    toast.success(`${payload.length} registraties opgeslagen`);
    setScanResult(null);
  };

  const shownIds = new Set(shown.map((s) => s.id));
  const inPeriod = (d: string) => d >= from && d <= to;
  const scoped = rows.filter((r) => shownIds.has(r.student_id) && inPeriod(r.lesson_date));
  const perClass = (cls === "alle" ? classes : [cls]).map((c) => {
    const ids = new Set(students.filter((s) => s.class_name === c).map((s) => s.id));
    const r = rows.filter((x) => ids.has(x.student_id) && inPeriod(x.lesson_date));
    const aanw = r.filter((x) => x.status === "aanwezig").length;
    const laat = r.filter((x) => x.status === "te_laat").length;
    const pct = r.length ? Math.round(((aanw + laat * 0.5) / r.length) * 100) : null;
    return { c, pct, aanw, laat, afw: r.length - aanw - laat, tot: r.length };
  });
  const lineClasses = cls === "alle" ? classes : [cls];
  const LINE_COLORS = ["hsl(152 60% 38%)", "hsl(38 92% 50%)", "hsl(210 80% 55%)", "hsl(280 60% 55%)", "hsl(0 72% 51%)", "hsl(180 60% 40%)", "hsl(45 90% 45%)", "hsl(320 60% 50%)"];
  const lineData = SUNDAYS.filter((d) => inPeriod(d) && (d <= today || rows.some((r) => r.lesson_date === d))).map((d) => {
    const point: Record<string, string | number | null> = { datum: fmt(d).replace(/ \d{4}$/, ""), _date: d };
    lineClasses.forEach((c) => {
      const ids = new Set(students.filter((s) => s.class_name === c).map((s) => s.id));
      const r = rows.filter((x) => ids.has(x.student_id) && x.lesson_date === d);
      if (!r.length) { point[c] = null; return; }
      const aanw = r.filter((x) => x.status === "aanwezig").length;
      const laat = r.filter((x) => x.status === "te_laat").length;
      point[c] = Math.round(((aanw + laat * 0.5) / r.length) * 100);
    });
    return point;
  });
  const chartData = SUNDAYS.filter((s) => inPeriod(s) && (s <= today || scoped.some((r) => r.lesson_date === s))).map((s) => {
    const d = scoped.filter((r) => r.lesson_date === s);
    return { datum: fmt(s).replace(/ \d{4}$/, ""), Aanwezig: d.filter((r) => r.status === "aanwezig").length, "Te laat": d.filter((r) => r.status === "te_laat").length, Afwezig: d.filter((r) => r.status === "afwezig").length };
  });
  const perStudent = shown.map((s) => {
    const r = scoped.filter((x) => x.student_id === s.id);
    return { ...s, laat: r.filter((x) => x.status === "te_laat").length, afw: r.filter((x) => x.status === "afwezig").length, tot: r.length };
  }).sort((a, b) => b.afw + b.laat - (a.afw + a.laat));

  const classPctOn = (c: string, d: string): number | null => {
    const ids = new Set(students.filter((s) => s.class_name === c).map((s) => s.id));
    const r = rows.filter((x) => ids.has(x.student_id) && x.lesson_date === d);
    if (!r.length) return null;
    const aanw = r.filter((x) => x.status === "aanwezig").length;
    const laat = r.filter((x) => x.status === "te_laat").length;
    return Math.round(((aanw + laat * 0.5) / r.length) * 100);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const days = SUNDAYS.filter((d) => inPeriod(d));
    let y = 20;
    doc.setFontSize(16);
    doc.text("Aanwezigheidsrapport onderwijs", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Periode: ${fmt(from)} t/m ${fmt(to)} · Gegenereerd op ${fmt(today)}`, 14, y); y += 10;
    perClass.forEach((p) => {
      if (y > 250) { doc.addPage(); y = 20; }
      // Trend: gemiddelde eerste helft vs tweede helft van de periode
      const half = Math.ceil(days.length / 2);
      const avg = (ds: string[]) => {
        const vals = ds.map((d) => classPctOn(p.c, d)).filter((v): v is number => v !== null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };
      const first = avg(days.slice(0, half));
      const second = avg(days.slice(half));
      const trend = first === null || second === null ? "onvoldoende data"
        : second - first >= 5 ? `stijgend (+${Math.round(second - first)}%)`
        : first - second >= 5 ? `dalend (-${Math.round(first - second)}%)` : "stabiel";
      doc.setFontSize(12);
      doc.text(p.c, 14, y); y += 6;
      doc.setFontSize(10);
      doc.text(`Aanwezigheid: ${p.pct === null ? "—" : p.pct + "%"} · Trend: ${trend}`, 20, y); y += 5;
      doc.text(`${p.aanw} aanwezig · ${p.laat} te laat · ${p.afw} afwezig · ${p.tot} registraties`, 20, y); y += 8;
    });
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("Percentage per zondag", 14, y); y += 7;
    doc.setFontSize(9);
    days.forEach((d) => {
      const parts = perClass.map((p) => `${p.c}: ${classPctOn(p.c, d) ?? "—"}%`).join("   ");
      if (y > 285) { doc.addPage(); y = 20; }
      doc.text(`${fmt(d)}   ${parts}`, 14, y); y += 5;
    });
    doc.save("aanwezigheidsrapport.pdf");
  };

  const dayCounts = OPTIONS.map((o) => shown.filter((s) => byKey.get(`${s.id}|${date}`) === o.v).length);

  return (
    <div className="space-y-5 max-w-5xl mx-auto font-rabat text-right" dir="rtl">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-rabat font-bold flex items-center justify-center gap-2"><CalendarCheck className="h-6 w-6 text-primary" /> الحضور والغياب</h1>
        <p className="text-sm text-muted-foreground font-body">Lesjaar 2026-2027 · {SUNDAYS.length} lesdagen (zondagen volgens de jaaragenda)</p>
      </div>

      {lastClear && (
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-amber-500 bg-amber-500/10 px-4 py-3 text-center">
            <span dir="ltr" className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {lastClear.entries.length} registraties geleegd van zondag {fmt(lastClear.date)}
            </span>
            <Button size="sm" onClick={undoClearAll} className="gap-1">
              <Undo2 className="h-4 w-4" /> Alles terugzetten
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setLastClear(null)}>
              Laten staan
            </Button>
          </div>
        </div>
      )}

      {lastChange && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={undoLast} className="border-amber-500 text-amber-700 dark:text-amber-400">
            <Undo2 className="h-4 w-4 mr-1" /> Ongedaan maken: {lastChange.s.name} · {fmt(lastChange.date)}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant={tab === "invullen" ? "default" : "outline"} onClick={() => setTab("invullen")}>Invullen</Button>
        <Button variant={tab === "overzicht" ? "default" : "outline"} onClick={() => setTab("overzicht")}>Overzicht & grafiek</Button>
        <Select value={cls} onValueChange={setCls}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle klassen</SelectItem>
            {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {tab === "invullen" ? (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Select value={date} onValueChange={setDate}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {SUNDAYS.map((s) => <SelectItem key={s} value={s}>Zondag {fmt(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={markRestPresent}>Rest aanwezig</Button>
            <Button variant="outline" onClick={clearAll} className="border-amber-500 text-amber-700 dark:text-amber-400">
              <Eraser className="h-4 w-4 mr-1" /> Alles leegmaken
            </Button>
            <label className={`inline-flex items-center gap-2 h-10 px-4 rounded-md border border-input bg-background cursor-pointer text-sm ${scanning ? "opacity-60 pointer-events-none" : ""}`}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {scanning ? "Foto lezen…" : "Foto van lijst"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setCropFile(f); }} />
            </label>
            <PhotoCropDialog file={cropFile} onCancel={() => setCropFile(null)} onDone={(f) => { setCropFile(null); scanPhoto(f); }} />
          </div>
          {scanning && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3 max-w-md mx-auto w-full" dir="ltr">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {scanPhase === "preparing" && "Foto voorbereiden…"}
                  {scanPhase === "uploading" && "Foto uploaden…"}
                  {scanPhase === "reading" && "Lijst uitlezen, dit duurt even…"}
                </span>
                <span className="text-muted-foreground tabular-nums">{scanElapsed}s</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: scanPhase === "preparing" ? "15%" : scanPhase === "uploading" ? "35%" : `${Math.min(95, 35 + scanElapsed * 4)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={scanPhase === "preparing" ? "text-foreground font-medium" : ""}>1. Voorbereiden</span>
                <span className={scanPhase === "uploading" ? "text-foreground font-medium" : ""}>2. Uploaden</span>
                <span className={scanPhase === "reading" ? "text-foreground font-medium" : ""}>3. Uitlezen</span>
              </div>
            </div>
          )}
          {scanResult && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
              <p className="font-medium text-center">{scanResult.entries.length} registraties gevonden op de foto</p>
              <div className="max-h-56 overflow-auto space-y-1" dir="rtl">
                {scanResult.entries.map((e, i) => {
                  const s = students.find((x) => x.id === e.student_id);
                  return <div key={i} className="flex justify-between gap-2"><span>{s?.name}</span><span dir="ltr" className="text-muted-foreground">{fmt(e.date)} · {OPTIONS.find((o) => o.v === e.status)?.label}</span></div>;
                })}
              </div>
              {scanResult.unmatched.length > 0 && <p className="text-xs text-amber-700 text-center">Niet herkend: {scanResult.unmatched.join(", ")}</p>}
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={saveScan} disabled={!scanResult.entries.length}>Opslaan</Button>
                <Button size="sm" variant="outline" onClick={() => setScanResult(null)}>Annuleren</Button>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-4 text-sm">
            {OPTIONS.map((o, i) => <span key={o.v} className="font-body">{o.label}: <b>{dayCounts[i]}</b></span>)}
            <span className="font-body">Open: <b>{shown.length - dayCounts.reduce((a, b) => a + b, 0)}</b></span>
          </div>
          <div className="divide-y text-right" dir="rtl">
            {shown.map((s) => {
              const cur = byKey.get(`${s.id}|${date}`);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2" dir="rtl">
                  <div className="text-center sm:text-right font-rabat" dir={isArabic(s.name) ? "rtl" : "ltr"}>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.class_name}</div>
                  </div>
                  <div className="flex gap-1 justify-center" dir="ltr">
                    {OPTIONS.map((o) => (
                      <button key={o.v} onClick={() => mark(s, o.v)}
                        className={`px-3 py-1.5 rounded-md border text-xs font-medium transition ${cur === o.v ? o.cls : "bg-background hover:bg-muted"}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {!shown.length && <p className="text-center text-sm text-muted-foreground py-6">Geen leerlingen</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Periode:</span>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {SUNDAYS.map((s) => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">t/m</span>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {SUNDAYS.map((s) => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {perClass.map((p) => (
              <div key={p.c} className="rounded-xl border bg-card p-3 text-center space-y-1">
                <div className="font-semibold">{p.c}</div>
                <div className={`text-2xl font-bold font-body ${p.pct === null ? "text-muted-foreground" : p.pct >= 85 ? "text-emerald-600" : p.pct >= 70 ? "text-amber-600" : "text-destructive"}`}>
                  {p.pct === null ? "—" : `${p.pct}%`}
                </div>
                <div className="text-xs text-muted-foreground">{p.aanw} aanwezig · {p.laat} te laat · {p.afw} afwezig</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold text-center mb-3">Aanwezigheidspercentage per klas per zondag</h2>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="datum" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} width={42} tickFormatter={(v: number) => `${v}%`} />
                   <Tooltip formatter={(v: number | null) => (v === null ? "geen data" : `${v}%`)} /><Legend formatter={(value) => <span className="font-rabat">{value}</span>} />
                  {lineClasses.map((c, i) => (
                    <Line key={c} type="monotone" dataKey={c} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} connectNulls
                      dot={{ r: 2, cursor: "pointer", onClick: (e: any) => { const d = e?.payload?._date ?? e?._date; if (d) setLineDetail({ c, d }); } }}
                      activeDot={{ r: 6, cursor: "pointer", onClick: (e: any) => { const d = e?.payload?._date ?? e?._date; if (d) setLineDetail({ c, d }); } }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {lineDetail && (() => {
              const list = students.filter((s) => s.class_name === lineDetail.c).sort((a, b) => a.name.localeCompare(b.name, "nl"));
              const cnt = OPTIONS.map((o) => list.filter((s) => byKey.get(`${s.id}|${lineDetail.d}`) === o.v).length);
              const open = list.length - cnt.reduce((a, b) => a + b, 0);
              return (
                <div className="mt-4 rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">{lineDetail.c} · Zondag {fmt(lineDetail.d)}</h3>
                    <Button size="sm" variant="ghost" onClick={() => setLineDetail(null)}>Sluiten</Button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                    <span className="font-body">Aanwezig: <b className="text-emerald-600">{cnt[0]}</b></span>
                    <span className="font-body">Te laat: <b className="text-amber-600">{cnt[1]}</b></span>
                    <span className="font-body">Afwezig: <b className="text-destructive">{cnt[2]}</b></span>
                    <span className="font-body">Open: <b>{open}</b></span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Tik een status om aan te passen · wordt direct opgeslagen</p>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {list.map((s) => {
                      const cur = byKey.get(`${s.id}|${lineDetail.d}`);
                      return (
                        <div key={s.id} className="flex items-center justify-between gap-2 py-1.5" dir="rtl">
                          <span className="text-sm truncate text-right font-rabat" dir={isArabic(s.name) ? "rtl" : "ltr"}>{s.name}</span>
                          <div className="flex gap-1 shrink-0" dir="ltr">
                            {OPTIONS.map((o) => (
                              <button key={o.v} onClick={() => mark(s, o.v, lineDetail.d)}
                                className={`px-2 py-1 rounded-md border text-[11px] font-medium transition ${cur === o.v ? o.cls : "bg-background hover:bg-muted"}`}>
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {!list.length && <p className="text-center text-sm text-muted-foreground py-3">Geen leerlingen</p>}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold text-center mb-3">Per zondag</h2>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="datum" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                   <Tooltip /><Legend formatter={(value) => <span className="font-rabat">{value}</span>} />
                   <Bar dataKey="Aanwezig" name="حاضر" stackId="a" fill="hsl(152 60% 38%)" />
                   <Bar dataKey="Te laat" name="متأخر" stackId="a" fill="hsl(38 92% 50%)" />
                   <Bar dataKey="Afwezig" name="غائب" stackId="a" fill="hsl(0 72% 51%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-right">Per leerling</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportPdf}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
              </div>
            </div>
            <div className="divide-y text-sm">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 font-medium text-muted-foreground [direction:rtl]">
                <span>Naam</span><span dir="ltr" className="w-14 text-center">Te laat</span><span dir="ltr" className="w-14 text-center">Afwezig</span><span dir="ltr" className="w-14 text-center">Gemeten</span>
              </div>
              {perStudent.map((s) => (
                <div key={s.id} className="py-2">
                  <button onClick={() => setEditId(editId === s.id ? null : s.id)} className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center text-start hover:bg-muted/50 rounded-md px-1 -mx-1 [direction:rtl]">
                    <span className="text-right font-rabat" dir={isArabic(s.name) ? "rtl" : "ltr"}>{s.name} <span className="text-xs text-muted-foreground">· {s.class_name}</span></span>
                    <span className={`w-14 text-center ${s.laat ? "text-amber-600 font-semibold" : ""}`}>{s.laat}</span>
                    <span className={`w-14 text-center ${s.afw ? "text-destructive font-semibold" : ""}`}>{s.afw}</span>
                    <span className="w-14 text-center text-muted-foreground">{s.tot}</span>
                  </button>
                  {editId === s.id && (
                     <div className="mt-2 mb-1 rounded-lg border bg-muted/30 p-3 space-y-3 min-w-0">
                      <p className="text-xs text-muted-foreground text-center">Tik een status om aan te passen · nogmaals tikken wist de registratie · wordt direct opgeslagen</p>
                      {SUNDAYS.filter((d) => d <= today).map((d) => {
                        const cur = byKey.get(`${s.id}|${d}`);
                        return (
                           <div key={d} className="grid grid-cols-1 gap-1.5 border-t pt-2 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3" dir="rtl">
                             <span className="text-sm text-right font-body" dir="ltr">{fmt(d)}</span>
                             <div className="grid grid-cols-3 gap-1 min-w-0 w-full sm:w-auto" dir="rtl">
                              {OPTIONS.map((o) => (
                                <button key={o.v} onClick={() => mark(s, o.v, d)}
                                   className={`min-w-0 px-1.5 py-2 rounded-md border text-xs font-medium text-center transition ${cur === o.v ? o.cls : "bg-background hover:bg-muted"}`}>
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
