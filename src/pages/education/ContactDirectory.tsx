import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Phone, MessageCircle, Download, Users, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Student = { id: string; name: string; class_name: string; teacher_name: string | null; birth_date: string | null; parent_phones: string[]; status: string; sort_order: number };
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

  useEffect(() => {
    supabase.from("edu_directory_students" as any).select("*").order("sort_order").then(({ data }) => setStudents((data as any) || []));
    supabase.from("edu_directory_teachers" as any).select("*").order("name").then(({ data }) => setTeachers((data as any) || []));
  }, []);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class_name))], [students]);
  const filtered = useMemo(() => students.filter((s) =>
    (cls === "alle" || s.class_name === cls) &&
    (status === "alle" || s.status === status) &&
    (!q || s.name.includes(q) || s.parent_phones.some((p) => p.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")))
  ), [students, cls, status, q]);
  const grouped = useMemo(() => {
    const m = new Map<string, Student[]>();
    filtered.forEach((s) => m.set(s.class_name, [...(m.get(s.class_name) || []), s]));
    return [...m.entries()];
  }, [filtered]);

  const exportCsv = () => {
    const rows = [["Klas", "Lerares", "Naam", "Geboortedatum", "Telefoon ouders", "Status"], ...filtered.map((s) => [s.class_name, s.teacher_name || "", s.name, s.birth_date || "", s.parent_phones.join(" / "), s.status])];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leerlingen-contacten.csv";
    a.click();
  };

  const parentCount = new Set(students.flatMap((s) => s.parent_phones)).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leerlingen & contacten</h1>
          <p className="text-xs text-muted-foreground">Schooljaar 2026/2027 · alleen zichtbaar voor beheerders</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[["Leerlingen", students.length], ["Oudernummers", parentCount], ["Leraren", teachers.length]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className="text-lg font-semibold text-foreground">{v}</div>
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
          </div>

          <div className="space-y-3">
            {grouped.map(([c, list]) => (
              <section key={c} className="overflow-hidden rounded-lg border border-border bg-card">
                <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2" dir="rtl">
                  <div className="text-sm font-semibold text-foreground">{c}{list[0].teacher_name && <span className="ms-2 text-xs font-normal text-muted-foreground">· المعلمة {list[0].teacher_name}</span>}</div>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </header>
                <div className="divide-y divide-border">
                  {list.map((s) => (
                    <div key={s.id} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[1fr_auto_1.2fr_auto] sm:items-center sm:gap-4">
                      <div className="text-sm font-medium text-foreground" dir="rtl">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.birth_date ? `${new Date(s.birth_date).toLocaleDateString("nl-NL")} · ${age(s.birth_date)} jr` : "—"}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {s.parent_phones.length ? s.parent_phones.map((p) => <PhoneLink key={p} p={p} />) : <span className="text-xs text-muted-foreground">Geen nummer</span>}
                      </div>
                      <span className={cn("w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize", STATUS[s.status])}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {!grouped.length && <p className="py-8 text-center text-sm text-muted-foreground">Geen leerlingen gevonden</p>}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-3" dir="rtl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">{t.name[0]}</div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  {t.class_name && <div className="text-xs text-muted-foreground">{t.class_name}</div>}
                </div>
              </div>
              {t.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><PhoneLink p={t.phone} /></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
