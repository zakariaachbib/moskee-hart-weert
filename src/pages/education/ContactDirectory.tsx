import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Phone, MessageCircle, Download, Users, GraduationCap, Euro, Check, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type Student = { id: string; name: string; class_name: string; teacher_name: string | null; birth_date: string | null; parent_phones: string[]; status: string; sort_order: number; betaald: boolean; betaald_op: string | null; bedrag: number };
type Teacher = { id: string; name: string; phone: string | null; class_name: string | null };

const fmt = (p: string) => p.startsWith("+31") ? p.replace(/^\+31(\d)(\d{4})(\d+)$/, "+31 $1 $2 $3") : p;
const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;
const age = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 3.15576e10);

const STATUS: Record<string, string> = {
  actief: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gestopt: "bg-red-50 text-red-700 border-red-200",
  onzeker: "bg-amber-50 text-amber-700 border-amber-200",
};

function PhoneLink({ p }: { p: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <a href={`tel:${p}`} dir="ltr" className="font-mono text-xs text-foreground hover:text-amber-700">{fmt(p)}</a>
      <a href={wa(p)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-emerald-600" aria-label="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></a>
    </span>
  );
}

export default function ContactDirectory() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("alle");
  const [status, setStatus] = useState("alle");
  const [pay, setPay] = useState("alle");

  useEffect(() => {
    supabase.from("edu_directory_students" as any).select("*").order("sort_order").then(({ data }) => setStudents((data as any) || []));
    supabase.from("edu_directory_teachers" as any).select("*").order("name").then(({ data }) => setTeachers((data as any) || []));
  }, []);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class_name))], [students]);
  const filtered = useMemo(() => students.filter((s) =>
    (cls === "alle" || s.class_name === cls) &&
    (status === "alle" || s.status === status) &&
    (pay === "alle" || (pay === "ja") === s.betaald) &&
    (!q || s.name.includes(q) || s.parent_phones.some((p) => p.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")))
  ), [students, cls, status, q]);
  const grouped = useMemo(() => {
    const m = new Map<string, Student[]>();
    filtered.forEach((s) => m.set(s.class_name, [...(m.get(s.class_name) || []), s]));
    return [...m.entries()];
  }, [filtered]);

  const csvRows = [
    ["Klas", "Lerares", "Naam", "Geboortedatum", "Telefoon ouders", "Status", "Betaald", "Betaald op"],
  ];
  const exportCsv = (rows: (string | null)[][], filename: string) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename;
    a.click();
  };
  const exportAllCsv = () =>
    exportCsv([...csvRows, ...filtered.map((s) => [s.class_name, s.teacher_name || "", s.name, s.birth_date || "", s.parent_phones.join(" / "), s.status, s.betaald ? "ja" : "nee", s.betaald_op || ""])], "leerlingen-contacten.csv");
  const exportUnpaidCsv = () =>
    exportCsv([...csvRows, ...students.filter((s) => !s.betaald && s.status !== "gestopt").map((s) => [s.class_name, s.teacher_name || "", s.name, s.birth_date || "", s.parent_phones.join(" / "), s.status, "nee", ""])], "niet-betaalde-leerlingen.csv");

  const assign = async (t: Teacher, c: string) => {
    const val = c || null;
    const { error } = await supabase.from("edu_directory_teachers" as any).update({ class_name: val }).eq("id", t.id);
    if (error) return toast.error("Opslaan mislukt: " + error.message);
    if (t.class_name && t.class_name !== val) await supabase.from("edu_directory_students" as any).update({ teacher_name: null }).eq("class_name", t.class_name).eq("teacher_name", t.name);
    if (val) await supabase.from("edu_directory_students" as any).update({ teacher_name: t.name }).eq("class_name", val);
    setTeachers((ts) => ts.map((x) => x.id === t.id ? { ...x, class_name: val } : x));
    setStudents((ss) => ss.map((x) => x.class_name === val ? { ...x, teacher_name: t.name } : (x.class_name === t.class_name && x.teacher_name === t.name ? { ...x, teacher_name: null } : x)));
    toast.success(val ? `${t.name} gekoppeld aan ${val}` : "Klas verwijderd");
  };
  const unassigned = classes.filter((c) => !teachers.some((t) => t.class_name === c));

  const togglePaid = async (st: Student) => {
    const betaald = !st.betaald;
    const betaald_op = betaald ? new Date().toISOString().slice(0, 10) : null;
    const { error } = await supabase.from("edu_directory_students" as any).update({ betaald, betaald_op }).eq("id", st.id);
    if (error) return toast.error("Opslaan mislukt: " + error.message);
    setStudents((ss) => ss.map((x) => x.id === st.id ? { ...x, betaald, betaald_op } : x));
    toast.success(betaald ? `${st.name}: betaald` : `${st.name}: niet betaald`);
  };
  const active = students.filter((s) => s.status !== "gestopt");
  const paidCount = active.filter((s) => s.betaald).length;
  const received = active.filter((s) => s.betaald).reduce((a, s) => a + Number(s.bedrag || 150), 0);
  const expected = active.reduce((a, s) => a + Number(s.bedrag || 150), 0);
  const parentCount = new Set(students.flatMap((s) => s.parent_phones)).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leerlingen & contacten</h1>
          <p className="text-xs text-muted-foreground">Schooljaar 2026/2027 · alleen zichtbaar voor beheerders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportUnpaidCsv} className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
            <Download className="h-3.5 w-3.5" /> Niet-betaald CSV
          </button>
          <button onClick={exportAllCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {([["Leerlingen", students.length, `${active.length} actief`, Users], ["Oudernummers", parentCount, "unieke nummers", Phone], ["Leraren", teachers.length, `${classes.length} klassen`, GraduationCap], ["Betaald", `${paidCount}/${active.length}`, `€${received.toLocaleString("nl-NL")} van €${expected.toLocaleString("nl-NL")}`, Euro]] as const).map(([l, v, sub, I]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">{l}<I className="h-3.5 w-3.5" /></div>
            <div className="mt-1 text-xl font-semibold text-foreground">{v}</div>
            <div className="text-[11px] text-muted-foreground">{sub}</div>
            {l === "Betaald" && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500" style={{ width: `${active.length ? (paidCount / active.length) * 100 : 0}%` }} /></div>}
          </div>
        ))}
      </div>

      <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
        {([["students", "Leerlingen", Users], ["teachers", "Leraren", GraduationCap]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium", tab === k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
            <I className="h-3.5 w-3.5" />{l}
          </button>
        ))}
      </div>

      {tab === "students" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek naam of nummer" className="h-9 pl-8 text-sm" />
            </div>
            <select value={cls} onChange={(e) => setCls(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" dir="auto">
              <option value="alle">Alle klassen</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="alle">Alle statussen</option>
              <option value="actief">Actief</option>
              <option value="onzeker">Onzeker (?)</option>
              <option value="gestopt">Gestopt</option>
            </select>
            <select value={pay} onChange={(e) => setPay(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="alle">Alle betalingen</option>
              <option value="ja">Betaald</option>
              <option value="nee">Niet betaald</option>
            </select>
          </div>

          <div className="space-y-3">
            {grouped.map(([c, list]) => {
              const paid = list.filter((x) => x.betaald).length;
              return (
              <section key={c} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                  <div dir="rtl" className="text-right">
                    <div className="text-sm font-semibold text-foreground">{c}</div>
                    <div className="text-[11px] text-muted-foreground">{list[0].teacher_name ? `المعلمة ${list[0].teacher_name}` : "Geen leraar gekoppeld"}</div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground border border-border">{list.length} leerlingen</span>
                    <span className={cn("rounded-full px-2 py-0.5 border", paid === list.length ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>{paid}/{list.length} betaald</span>
                  </div>
                </header>
                <div className="hidden grid-cols-[minmax(140px,1.2fr)_110px_minmax(180px,1.6fr)_80px_120px] gap-4 border-b border-border px-4 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Leerling</span><span>Geboren</span><span>Ouders</span><span>Status</span><span className="text-right">€150 / jaar</span>
                </div>
                <div className="divide-y divide-border">
                  {list.map((s) => (
                    <div key={s.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 px-4 py-2.5 md:grid-cols-[minmax(140px,1.2fr)_110px_minmax(180px,1.6fr)_80px_120px] md:items-center md:gap-4">
                      <div className="text-sm font-medium text-foreground text-right md:text-left" dir="rtl">{s.name}</div>
                      <div className="order-last col-span-2 flex items-center gap-1 text-xs text-muted-foreground md:order-none md:col-span-1"><CalendarDays className="h-3 w-3 md:hidden" />{s.birth_date ? `${new Date(s.birth_date).toLocaleDateString("nl-NL")} · ${age(s.birth_date)} jr` : "—"}</div>
                      <div className="order-last col-span-2 flex flex-wrap gap-x-3 gap-y-1 md:order-none md:col-span-1">
                        {s.parent_phones.length ? s.parent_phones.map((p) => <PhoneLink key={p} p={p} />) : <span className="text-xs text-muted-foreground">Geen nummer</span>}
                      </div>
                      <span className={cn("hidden w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize md:inline-block", STATUS[s.status])}>{s.status}</span>
                      <button onClick={() => togglePaid(s)} title={s.betaald_op ? `Betaald op ${new Date(s.betaald_op).toLocaleDateString("nl-NL")}` : "Markeer als betaald"}
                        className={cn("row-start-1 col-start-2 inline-flex w-fit items-center gap-1 justify-self-end rounded-full border px-2.5 py-1 text-[11px] font-medium transition md:row-auto md:col-auto", s.betaald ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:text-amber-700")}>
                        {s.betaald ? <><Check className="h-3 w-3" />Betaald</> : <><Euro className="h-3 w-3" />Niet betaald</>}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );})}
            {!grouped.length && <p className="py-8 text-center text-sm text-muted-foreground">Geen leerlingen gevonden</p>}
          </div>
        </>
      ) : (
        <div className="space-y-2">
        {unassigned.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Klassen zonder leraar: <span dir="rtl" className="font-medium">{unassigned.join(" · ")}</span>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-3" dir="rtl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">{t.name[0]}</div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <select value={t.class_name || ""} onChange={(e) => assign(t, e.target.value)} dir="auto" className={cn("mt-0.5 h-7 rounded border bg-background px-1.5 text-xs", t.class_name ? "border-input" : "border-amber-300 text-amber-700")}>
                    <option value="">— Geen klas —</option>
                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {t.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><PhoneLink p={t.phone} /></div>}
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
