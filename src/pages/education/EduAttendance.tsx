import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarCheck, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name))), [students]);
  const shown = students.filter((s) => cls === "alle" || s.class_name === cls);
  const byKey = useMemo(() => new Map(rows.map((r) => [`${r.student_id}|${r.lesson_date}`, r.status])), [rows]);

  const mark = async (s: Student, status: Status, forDate = date) => {
    const current = byKey.get(`${s.id}|${forDate}`);
    const { data: u } = await supabase.auth.getUser();
    if (current === status) {
      await supabase.from("edu_directory_attendance" as any).delete().eq("student_id", s.id).eq("lesson_date", date);
      setRows((r) => r.filter((x) => !(x.student_id === s.id && x.lesson_date === date)));
      return;
    }
    const { error } = await supabase.from("edu_directory_attendance" as any).upsert(
      { student_id: s.id, tenant_id: s.tenant_id, lesson_date: date, status, marked_by: u.user?.id },
      { onConflict: "student_id,lesson_date" },
    );
    if (error) return toast.error("Opslaan mislukt");
    setRows((r) => [...r.filter((x) => !(x.student_id === s.id && x.lesson_date === date)), { student_id: s.id, lesson_date: date, status }]);
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
  const chartData = SUNDAYS.filter((s) => inPeriod(s) && (s <= today || scoped.some((r) => r.lesson_date === s))).map((s) => {
    const d = scoped.filter((r) => r.lesson_date === s);
    return { datum: fmt(s).replace(/ \d{4}$/, ""), Aanwezig: d.filter((r) => r.status === "aanwezig").length, "Te laat": d.filter((r) => r.status === "te_laat").length, Afwezig: d.filter((r) => r.status === "afwezig").length };
  });
  const perStudent = shown.map((s) => {
    const r = scoped.filter((x) => x.student_id === s.id);
    return { ...s, laat: r.filter((x) => x.status === "te_laat").length, afw: r.filter((x) => x.status === "afwezig").length, tot: r.length };
  }).sort((a, b) => b.afw + b.laat - (a.afw + a.laat));

  const exportCsv = () => {
    const lines = [["Naam", "Klas", "Geregistreerd", "Te laat", "Afwezig"].join(";"), ...perStudent.map((s) => [s.name, s.class_name, s.tot, s.laat, s.afw].join(";"))];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aanwezigheid.csv"; a.click();
  };

  const dayCounts = OPTIONS.map((o) => shown.filter((s) => byKey.get(`${s.id}|${date}`) === o.v).length);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2"><CalendarCheck className="h-6 w-6 text-primary" /> Aanwezigheid</h1>
        <p className="text-sm text-muted-foreground">Lesjaar 2026-2027 · {SUNDAYS.length} lesdagen (zondagen volgens de jaaragenda)</p>
      </div>

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
          </div>
          <div className="flex justify-center gap-4 text-sm">
            {OPTIONS.map((o, i) => <span key={o.v}>{o.label}: <b>{dayCounts[i]}</b></span>)}
            <span>Open: <b>{shown.length - dayCounts.reduce((a, b) => a + b, 0)}</b></span>
          </div>
          <div className="divide-y">
            {shown.map((s) => {
              const cur = byKey.get(`${s.id}|${date}`);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
                  <div className="text-center sm:text-start" dir={isArabic(s.name) ? "rtl" : "ltr"}>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.class_name}</div>
                  </div>
                  <div className="flex gap-1 justify-center">
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
                <div className={`text-2xl font-bold ${p.pct === null ? "text-muted-foreground" : p.pct >= 85 ? "text-emerald-600" : p.pct >= 70 ? "text-amber-600" : "text-destructive"}`}>
                  {p.pct === null ? "—" : `${p.pct}%`}
                </div>
                <div className="text-xs text-muted-foreground">{p.aanw} aanwezig · {p.laat} te laat · {p.afw} afwezig</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold text-center mb-3">Per zondag</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="datum" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip /><Legend />
                  <Bar dataKey="Aanwezig" stackId="a" fill="hsl(152 60% 38%)" />
                  <Bar dataKey="Te laat" stackId="a" fill="hsl(38 92% 50%)" />
                  <Bar dataKey="Afwezig" stackId="a" fill="hsl(0 72% 51%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Per leerling</h2>
              <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            </div>
            <div className="divide-y text-sm">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 font-medium text-muted-foreground">
                <span>Naam</span><span className="w-14 text-center">Te laat</span><span className="w-14 text-center">Afwezig</span><span className="w-14 text-center">Gemeten</span>
              </div>
              {perStudent.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2 items-center">
                  <span dir={isArabic(s.name) ? "rtl" : "ltr"}>{s.name} <span className="text-xs text-muted-foreground">· {s.class_name}</span></span>
                  <span className={`w-14 text-center ${s.laat ? "text-amber-600 font-semibold" : ""}`}>{s.laat}</span>
                  <span className={`w-14 text-center ${s.afw ? "text-destructive font-semibold" : ""}`}>{s.afw}</span>
                  <span className="w-14 text-center text-muted-foreground">{s.tot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
