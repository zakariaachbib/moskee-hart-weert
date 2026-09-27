import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Phone, MessageCircle, Download, Users, GraduationCap, Euro, Check, CalendarDays, Plus, Trash2, Link2, Inbox, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Student = { id: string; name: string; class_name: string; teacher_name: string | null; birth_date: string | null; parent_phones: string[]; status: string; sort_order: number; betaald: boolean; betaald_op: string | null; bedrag: number };
type Teacher = { id: string; name: string; phone: string | null; class_name: string | null };

const fmt = (p: string) => p.startsWith("+31") ? p.replace(/^\+31(\d)(\d{4})(\d+)$/, "+31 $1 $2 $3") : p;
const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;
const age = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 3.15576e10);
const nameFont = (name: string) => /[\u0600-\u06FF]/.test(name) ? "font-rabat" : "font-body";

const STATUS: Record<string, string> = {
  actief: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gestopt: "bg-red-50 text-red-700 border-red-200",
  onzeker: "bg-amber-50 text-amber-700 border-amber-200",
  nieuw: "bg-amber-50 text-amber-700 border-amber-200",
  wachtlijst: "bg-blue-50 text-blue-700 border-blue-200",
  afgewezen: "bg-red-50 text-red-700 border-red-200",
};

function PhoneLink({ p }: { p: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <a href={`tel:${p}`} dir="ltr" className="font-mono text-xs text-foreground hover:text-amber-700">{fmt(p)}</a>
      <a href={wa(p)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-emerald-600" aria-label="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></a>
    </span>
  );
}

type Reg = { id: string; voornamen: string; achternaam: string; geboortedatum: string; ouder_naam: string; telefoon: string; email: string; schooljaar: string; status: string; created_at: string; tenant_id: string | null };
const SIGNUP_URL = "https://www.simweert.nl/onderwijs/inschrijving";

export default function ContactDirectory() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [tab, setTab] = useState<"students" | "teachers" | "regs">("students");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("alle");
  const [status, setStatus] = useState("alle");
  const [pay, setPay] = useState("alle");
  const [openClasses, setOpenClasses] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", class_name: "", birth_date: "", phones: "" });

  useEffect(() => {
    supabase.from("edu_directory_students" as any).select("*").order("sort_order").then(({ data }) => setStudents((data as any) || []));
    supabase.from("edu_directory_teachers" as any).select("*").order("name").then(({ data }) => setTeachers((data as any) || []));
    supabase.from("education_registrations").select("*").order("created_at", { ascending: false }).then(({ data }) => setRegs((data as any) || []));
  }, []);

  const tenantId = (students[0] as any)?.tenant_id ?? null;
  const addStudent = async (f: { name: string; class_name: string; birth_date: string; phones: string }, regId?: string) => {
    if (!f.name.trim() || !f.class_name.trim()) { toast.error("Vul naam en klas in"); return false; }
    const teacher = teachers.find((t) => t.class_name === f.class_name)?.name ?? null;
    const row = { tenant_id: tenantId, name: f.name.trim(), class_name: f.class_name.trim(), teacher_name: teacher, birth_date: f.birth_date || null, parent_phones: f.phones.split(/[,/;]+/).map((p) => p.trim()).filter(Boolean), status: "actief", sort_order: students.length + 1 };
    const { data, error } = await supabase.from("edu_directory_students" as any).insert(row).select().single();
    if (error) { toast.error("Toevoegen mislukt: " + error.message); return false; }
    setStudents((s) => [...s, data as any]);
    if (regId) {
      await supabase.from("education_registrations").update({ status: "goedgekeurd" }).eq("id", regId);
      setRegs((r) => r.map((x) => x.id === regId ? { ...x, status: "goedgekeurd" } : x));
    }
    toast.success(`${row.name} toegevoegd aan ${row.class_name}`);
    return true;
  };
  const removeStudent = async (s: Student) => {
    if (!confirm(`${s.name} verwijderen?`)) return;
    const { error } = await supabase.from("edu_directory_students" as any).delete().eq("id", s.id);
    if (error) return toast.error("Verwijderen mislukt: " + error.message);
    setStudents((ss) => ss.filter((x) => x.id !== s.id));
    toast.success(`${s.name} verwijderd`);
  };
  const removeReg = async (r: Reg) => {
    if (!confirm(`Aanmelding van ${r.voornamen} verwijderen?`)) return;
    const { error } = await supabase.from("education_registrations").delete().eq("id", r.id);
    if (error) return toast.error("Verwijderen mislukt: " + error.message);
    setRegs((x) => x.filter((y) => y.id !== r.id));
  };
  const [regClass, setRegClass] = useState<Record<string, string>>({});
  const copyLink = async () => { await navigator.clipboard.writeText(SIGNUP_URL); toast.success("Aanmeldlink gekopieerd"); };
  const shareWa = `https://wa.me/?text=${encodeURIComponent(`Assalamu alaikum, via deze link kunt u uw kind aanmelden voor het onderwijs van Nahda Moskee Weert: ${SIGNUP_URL}`)}`;
  const newRegs = regs.filter((r) => r.status !== "goedgekeurd").length;

  const AR_LETTER: Record<string, number> = { "أ": 0, "ب": 1, "ا": 0, "بـ": 1 };
  const classOrder = (c: string) => {
    const m = c.match(/(تمهيدي|ابتدائي)?\s*([\u0621-\u064A0-9\u0660-\u0669]+)$/);
    const tok = m?.[2] ?? "";
    if (m?.[1] === "تمهيدي") return AR_LETTER[tok] ?? 99;
    const n = parseInt(tok.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)), 10);
    return Number.isFinite(n) ? n : 99;
  };
  const classes = useMemo(() => [...new Set(students.map((s) => s.class_name))].sort((a, b) => classOrder(a) - classOrder(b) || a.localeCompare(b)), [students]);
  const filtered = useMemo(() => students.filter((s) =>
    (cls === "alle" || s.class_name === cls) &&
    (status === "alle" || s.status === status) &&
    (pay === "alle" || (pay === "ja") === s.betaald) &&
    (!q || s.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()) || s.parent_phones.some((p) => p.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")))
  ), [students, cls, status, pay, q]);
  const grouped = useMemo(() => {
    const m = new Map<string, Student[]>();
    filtered.forEach((s) => m.set(s.class_name, [...(m.get(s.class_name) || []), s]));
    return [...m.entries()];
  }, [filtered]);
  useEffect(() => {
    if (q || cls !== "alle" || status !== "alle" || pay !== "alle") {
      setOpenClasses(grouped.map(([name]) => name));
    } else {
      setOpenClasses([]);
    }
  }, [q, cls, status, pay]);

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
        {([["students", "Leerlingen", Users], ["regs", "Aanmeldingen", Inbox], ["teachers", "Leraren", GraduationCap]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium", tab === k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
            <I className="h-3.5 w-3.5" />{l}
            {k === "regs" && newRegs > 0 && <span className="rounded-full bg-amber-600 px-1.5 text-[10px] text-white">{newRegs}</span>}
          </button>
        ))}
      </div>

      {tab === "students" ? (
        <>
          {adding ? (
            <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-[1.4fr_1fr_140px_1.4fr_auto]">
              <Input placeholder="Naam leerling" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" dir="auto" />
              <Input list="dir-classes" placeholder="Klas" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="h-9 text-sm" dir="auto" />
              <datalist id="dir-classes">{classes.map((c) => <option key={c} value={c} />)}</datalist>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="h-9 text-sm" />
              <Input placeholder="Telefoon ouders (scheid met ,)" value={form.phones} onChange={(e) => setForm({ ...form, phones: e.target.value })} className="h-9 text-sm" dir="ltr" />
              <div className="flex gap-1">
                <button onClick={async () => { if (await addStudent(form)) { setForm({ name: "", class_name: form.class_name, birth_date: "", phones: "" }); } }} className="rounded-md bg-amber-600 px-3 text-xs font-medium text-white hover:bg-amber-700">Opslaan</button>
                <button onClick={() => setAdding(false)} aria-label="Sluiten" className="rounded-md border border-border bg-background px-2"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"><Plus className="h-3.5 w-3.5" />Leerling toevoegen</button>
          )}
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek naam of nummer" className="h-9 pl-8 text-sm" dir="auto" />
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
             <div className="flex items-center justify-between border-b border-border pb-2 text-xs text-muted-foreground">
               <span>{filtered.length} leerlingen in {grouped.length} klassen</span>
               <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpenClasses(openClasses.length === grouped.length ? [] : grouped.map(([name]) => name))}>
                 {openClasses.length === grouped.length && grouped.length > 0 ? "Alles sluiten" : "Alles openen"}
               </Button>
             </div>
             <Accordion type="multiple" value={openClasses} onValueChange={setOpenClasses} className="space-y-2">
               {grouped.map(([c, list]) => {
                 const paid = list.filter((x) => x.betaald).length;
                 const teacher = teachers.find((t) => t.class_name === c)?.name || list[0]?.teacher_name;
                 return (
                   <AccordionItem key={c} value={c} className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                       <AccordionTrigger className="group min-h-16 flex-row-reverse gap-3 px-4 py-3 hover:no-underline hover:bg-muted/40 sm:px-5 [&>svg]:order-3 [&[data-state=open]>svg]:rotate-180">
                         <span className="order-2 shrink-0 rounded border border-border bg-background px-2 py-1 text-[11px] font-normal text-muted-foreground">{paid}/{list.length} betaald</span>
                         <div className="order-1 min-w-0 flex-1 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                            <span className="text-xs font-normal text-muted-foreground">{list.length} leerlingen</span>
                            <span dir="auto" className="font-rabat text-base font-semibold text-foreground">{c}</span>
                          </div>
                          <div className="mt-0.5 text-xs font-normal text-muted-foreground">{teacher ? <>Leraar: <bdi dir="auto" className={nameFont(teacher)}>{teacher}</bdi></> : "Nog geen leraar gekoppeld"}</div>
                        </div>
                     </AccordionTrigger>
                     <AccordionContent className="p-0">
                        <div className="hidden grid-cols-[minmax(130px,1.3fr)_110px_minmax(150px,1.4fr)_80px_126px] items-center gap-2 border-y border-border bg-muted/30 px-4 py-2 text-center text-[11px] font-semibold text-muted-foreground lg:grid lg:[direction:rtl] sm:px-5">
                          <span className="text-right">Leerling</span><span>Geboortedatum</span><span>Ouders</span><span>Status</span><span>Betaling · €150</span>
                       </div>
                       <div className="divide-y divide-border">
                         {list.map((s) => (
                            <div key={s.id} className="relative grid gap-3 px-4 py-4 text-center hover:bg-muted/20 sm:px-5 lg:grid-cols-[minmax(130px,1.3fr)_110px_minmax(150px,1.4fr)_80px_126px] lg:items-center lg:gap-2 lg:py-3 lg:[direction:rtl]">
                              <div className="min-w-0 text-right">
                                <span dir="auto" className={cn("inline-block max-w-full break-words text-right text-base font-medium leading-relaxed text-foreground", nameFont(s.name))}>{s.name}</span>
                             </div>
                              <div dir="ltr" className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3 lg:hidden" />{s.birth_date ? `${new Date(s.birth_date).toLocaleDateString("nl-NL")} · ${age(s.birth_date)} jr` : "Geboortedatum onbekend"}</div>
                              <div dir="ltr" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                               {s.parent_phones?.length ? s.parent_phones.map((p) => <PhoneLink key={p} p={p} />) : <span className="text-xs text-muted-foreground">Geen nummer</span>}
                             </div>
                              <span dir="ltr" className={cn("w-fit justify-self-center rounded border px-2 py-0.5 text-[11px] font-medium capitalize", STATUS[s.status] || "bg-muted text-muted-foreground")}>{s.status}</span>
                              <div dir="ltr" className="flex items-center justify-center gap-1">
                               <Button variant="outline" size="sm" onClick={() => togglePaid(s)} title={s.betaald_op ? `Betaald op ${new Date(s.betaald_op).toLocaleDateString("nl-NL")}` : "Markeer als betaald"} className={cn("h-8 min-w-[96px] px-2 text-xs", s.betaald ? "border-primary text-foreground" : "text-muted-foreground")}>
                                 {s.betaald ? <><Check />Betaald</> : <><Euro />Niet betaald</>}
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => removeStudent(s)} aria-label={`${s.name} verwijderen`} title="Verwijderen" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 /></Button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 );
               })}
             </Accordion>
             {!grouped.length && <p className="py-8 text-center text-sm text-muted-foreground">Geen leerlingen gevonden</p>}
           </div>
        </>
      ) : tab === "regs" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900"><Link2 className="h-4 w-4" />Aanmeldlink voor nieuwe ouders</div>
            <p className="mt-0.5 text-xs text-amber-800">Deel deze link. Aanmeldingen verschijnen hier automatisch.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <code className="flex-1 min-w-[200px] truncate rounded border border-amber-200 bg-background px-2 py-1.5 text-xs">{SIGNUP_URL}</code>
              <button onClick={copyLink} className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">Kopiëren</button>
              <a href={shareWa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[minmax(160px,1.4fr)_120px_minmax(160px,1.2fr)_110px_minmax(240px,1.4fr)] gap-4 border-b border-border px-4 py-1.5 text-center text-[10px] uppercase tracking-wide text-muted-foreground md:grid">
               <span className="text-right">Aanmelding</span><span>Geboren</span><span className="text-right">Ouder</span><span>Status</span><span>Actie</span>
            </div>
            <div className="divide-y divide-border">
              {regs.map((r) => (
                <div key={r.id} className="flex flex-col items-center gap-1.5 px-4 py-2.5 text-center md:grid md:grid-cols-[minmax(160px,1.4fr)_120px_minmax(160px,1.2fr)_110px_minmax(240px,1.4fr)] md:items-center md:gap-4 md:text-center">
                    <div className="min-w-0 w-full text-right">
                      <div className={cn("max-w-full break-words text-right text-base font-medium text-foreground", nameFont(`${r.voornamen} ${r.achternaam}`))} dir="auto">{r.voornamen} {r.achternaam}</div>
                    <div className="text-[11px] text-muted-foreground">{r.schooljaar} · aangemeld {new Date(r.created_at).toLocaleDateString("nl-NL")}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.geboortedatum).toLocaleDateString("nl-NL")} · {age(r.geboortedatum)} jr</div>
                   <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                     <span dir="auto" className="text-right text-foreground">{r.ouder_naam}</span>
                    <PhoneLink p={r.telefoon} />
                  </div>
                  <div className="md:justify-self-center">
                    {r.status === "goedgekeurd" ? (
                      <span className="inline-block w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">In leerlingenlijst</span>
                    ) : (
                      <span className={cn("inline-block w-fit rounded-full border px-2 py-0.5 text-[11px] capitalize", STATUS[r.status] || "border-amber-200 bg-amber-50 text-amber-700")}>{r.status}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 md:justify-self-center">
                    {r.status === "goedgekeurd" ? (
                      <button onClick={() => removeReg(r)} aria-label="Verwijderen" className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    ) : (
                      <>
                        <select value={regClass[r.id] || ""} onChange={(e) => setRegClass((m) => ({ ...m, [r.id]: e.target.value }))} dir="auto" className="h-7 rounded border border-input bg-background px-1.5 text-xs">
                          <option value="">Kies klas</option>
                          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={() => addStudent({ name: `${r.voornamen} ${r.achternaam}`, class_name: regClass[r.id] || "", birth_date: r.geboortedatum, phones: r.telefoon }, r.id)} className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-700"><UserPlus className="h-3 w-3" />Toevoegen</button>
                        <button onClick={() => removeReg(r)} aria-label="Verwijderen" className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!regs.length && <p className="py-8 text-center text-sm text-muted-foreground">Nog geen aanmeldingen</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
        {unassigned.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Klassen zonder leraar: <span dir="rtl" className="font-medium">{unassigned.join(" · ")}</span>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
          {teachers.map((t) => (
              <div key={t.id} className="flex flex-col items-end justify-center gap-2 px-3 py-3 text-right sm:flex-row-reverse sm:justify-between">
                 <div dir="rtl">
                  <div className="text-right">
                    <div className={cn("text-right text-sm font-medium text-foreground", nameFont(t.name))} dir="auto">{t.name}</div>
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
