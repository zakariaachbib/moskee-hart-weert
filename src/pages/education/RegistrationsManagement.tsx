import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Download, Users, Euro, CheckCircle2, AlertCircle, X, Calendar, Phone, Mail, MapPin, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Registration = {
  id: string;
  achternaam: string;
  voornamen: string;
  geboortedatum: string;
  geslacht: string;
  ouder_naam: string;
  telefoon: string;
  adres: string;
  email: string;
  toestemming_foto: boolean;
  akkoord_privacy: boolean;
  opmerkingen: string | null;
  created_at: string;
  schooljaar: string;
  betaald: boolean;
  bedrag: number;
  betaald_op: string | null;
  betaalmethode: string | null;
  betaal_notitie: string | null;
  status: string;
};

const STATUSES = [
  { key: "nieuw", label: "Nieuw", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "goedgekeurd", label: "Goedgekeurd", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "wachtlijst", label: "Wachtlijst", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "afgewezen", label: "Afgewezen", cls: "bg-rose-50 text-rose-700 border-rose-200" },
];

const statusMeta = (s: string) => STATUSES.find((x) => x.key === s) ?? STATUSES[0];

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const age = (d: string) => {
  const b = new Date(d);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
};

export default function RegistrationsManagement() {
  const { toast } = useToast();
  const { activeTenant } = useTenant();
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [payFilter, setPayFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<"new" | "old" | "name">("new");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!activeTenant) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("education_registrations")
      .select("*")
      .eq("tenant_id", activeTenant.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
    setRows((data as Registration[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeTenant?.id]);

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.schooljaar))).sort().reverse(),
    [rows]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (year !== "all" && r.schooljaar !== year) return false;
      if (payFilter === "paid" && !r.betaald) return false;
      if (payFilter === "unpaid" && r.betaald) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!s) return true;
      return [r.voornamen, r.achternaam, r.email, r.telefoon, r.ouder_naam, r.adres]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return `${a.achternaam} ${a.voornamen}`.localeCompare(`${b.achternaam} ${b.voornamen}`);
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "old" ? d : -d;
    });
    return list;
  }, [rows, q, year, payFilter, statusFilter, sort]);

  const grouped = useMemo(() => {
    const map = new Map<string, Registration[]>();
    filtered.forEach((r) => {
      const key = new Date(r.created_at).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(() => {
    const scope = year === "all" ? rows : rows.filter((r) => r.schooljaar === year);
    const paid = scope.filter((r) => r.betaald);
    return {
      total: scope.length,
      paid: paid.length,
      unpaid: scope.length - paid.length,
      received: paid.reduce((s, r) => s + Number(r.bedrag || 0), 0),
      open: scope.filter((r) => !r.betaald).reduce((s, r) => s + Number(r.bedrag || 0), 0),
    };
  }, [rows, year]);

  const patch = async (id: string, values: Partial<Registration>) => {
    setSaving(true);
    const { error } = await supabase.from("education_registrations").update(values as any).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } as Registration : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...values } as Registration : prev));
  };

  const togglePaid = (r: Registration) =>
    patch(r.id, {
      betaald: !r.betaald,
      betaald_op: !r.betaald ? new Date().toISOString().slice(0, 10) : null,
    });

  const removeRegistration = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const { error } = await supabase.from("education_registrations").delete().eq("id", deleteTarget.id);
    setSaving(false);
    if (error) {
      toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    setChecked((prev) => prev.filter((id) => id !== deleteTarget.id));
    toast({ title: "Aanmelding verwijderd" });
  };

  const toggleCheck = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allVisibleChecked = filtered.length > 0 && filtered.every((r) => checked.includes(r.id));
  const toggleAllVisible = () =>
    setChecked(allVisibleChecked ? [] : filtered.map((r) => r.id));

  const bulkStatus = async (status: string) => {
    if (checked.length === 0) return;
    setSaving(true);
    const { error } = await supabase
      .from("education_registrations")
      .update({ status } as any)
      .in("id", checked);
    setSaving(false);
    if (error) {
      toast({ title: "Bijwerken mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (checked.includes(r.id) ? { ...r, status } : r)));
    toast({ title: `${checked.length} aanmelding(en) bijgewerkt` });
    setChecked([]);
  };

  const bulkPaid = async (betaald: boolean) => {
    if (checked.length === 0) return;
    setSaving(true);
    const values = { betaald, betaald_op: betaald ? new Date().toISOString().slice(0, 10) : null };
    const { error } = await supabase
      .from("education_registrations")
      .update(values as any)
      .in("id", checked);
    setSaving(false);
    if (error) {
      toast({ title: "Bijwerken mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (checked.includes(r.id) ? { ...r, ...values } as Registration : r)));
    toast({ title: `${checked.length} betaalstatus(sen) bijgewerkt` });
    setChecked([]);
  };

  const bulkDelete = async () => {
    if (checked.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("education_registrations").delete().in("id", checked);
    setSaving(false);
    if (error) {
      toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => !checked.includes(r.id)));
    if (selected && checked.includes(selected.id)) setSelected(null);
    toast({ title: `${checked.length} aanmelding(en) verwijderd` });
    setChecked([]);
    setBulkDeleteOpen(false);
  };

  const exportCsv = () => {
    const head = ["Achternaam","Voornamen","Geboortedatum","Geslacht","Ouder","Telefoon","E-mail","Adres","Schooljaar","Status","Betaald","Bedrag","Betaald op","Methode","Ingeschreven op"];
    const lines = filtered.map((r) => [
      r.achternaam, r.voornamen, r.geboortedatum, r.geslacht, r.ouder_naam, r.telefoon, r.email, r.adres,
      r.schooljaar, r.status, r.betaald ? "Ja" : "Nee", r.bedrag, r.betaald_op ?? "", r.betaalmethode ?? "",
      new Date(r.created_at).toLocaleDateString("nl-NL"),
    ]);
    const csv = [head, ...lines].map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `inschrijvingen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Leerling-inschrijvingen</h1>
          <p className="text-xs text-muted-foreground">
            {activeTenant?.name ?? "Geen organisatie"} · overzicht, filters en betalingsbeheer (€150 per jaar)
          </p>
        </div>
        <Button
          onClick={exportCsv}
          variant="outline"
          size="sm"
        >
          <Download size={15} /> Exporteer CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Inschrijvingen", value: stats.total, icon: Users, tone: "text-foreground" },
          { label: "Betaald", value: stats.paid, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Openstaand", value: stats.unpaid, icon: AlertCircle, tone: "text-amber-600" },
          { label: "Ontvangen", value: `€ ${stats.received.toLocaleString("nl-NL")}`, icon: Euro, tone: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <s.icon size={15} className="text-muted-foreground" />
            </div>
            <p className={cn("mt-1 text-2xl font-bold", s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam, ouder, e-mail, telefoon of adres..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Alle schooljaren</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Alle statussen</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={payFilter} onChange={(e) => setPayFilter(e.target.value as any)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Betaling: alles</option>
            <option value="paid">Betaald</option>
            <option value="unpaid">Niet betaald</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="new">Nieuwste eerst</option>
            <option value="old">Oudste eerst</option>
            <option value="name">Naam A-Z</option>
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} className="h-4 w-4 accent-primary" />
            Alles selecteren
          </label>
          <span className="text-xs font-medium text-foreground">{checked.length} geselecteerd</span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" disabled={!checked.length || saving} onClick={() => bulkStatus("wachtlijst")}>Op wachtlijst</Button>
            <Button size="sm" variant="outline" disabled={!checked.length || saving} onClick={() => bulkStatus("goedgekeurd")}>Goedkeuren</Button>
            <Button size="sm" variant="outline" disabled={!checked.length || saving} onClick={() => bulkPaid(true)}>Betaald</Button>
            <Button size="sm" variant="outline" disabled={!checked.length || saving} onClick={() => bulkPaid(false)}>Niet betaald</Button>
            <Button size="sm" variant="destructive" disabled={!checked.length || saving} onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} /> Verwijderen
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen inschrijvingen gevonden.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([month, items]) => (
            <div key={month}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {month} · {items.length}
              </p>
              <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                {items.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-accent/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={checked.includes(r.id)}
                      onChange={() => toggleCheck(r.id)}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <button onClick={() => setSelected(r)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.voornamen} {r.achternaam}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {age(r.geboortedatum)} jr · {r.schooljaar} · {fmtDate(r.created_at)}
                      </p>
                    </button>
                    <span className={cn("hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border", statusMeta(r.status).cls)}>
                      {statusMeta(r.status).label}
                    </span>
                    <button
                      onClick={() => togglePaid(r)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                        r.betaald
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      )}
                    >
                      {r.betaald ? `Betaald € ${Number(r.bedrag)}` : "Niet betaald"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Aanmelding verwijderen"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-full sm:max-w-md bg-card h-full overflow-y-auto border-r border-border shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card">
              <h2 className="text-sm font-semibold">{selected.voornamen} {selected.achternaam}</h2>
              <button onClick={() => setSelected(null)} className="p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="space-y-1.5 text-muted-foreground">
                <p className="flex items-center gap-2"><Calendar size={14} /> {fmtDate(selected.geboortedatum)} ({age(selected.geboortedatum)} jr) · {selected.geslacht}</p>
                <p className="flex items-center gap-2"><Users size={14} /> Ouder: {selected.ouder_naam}</p>
                <p className="flex items-center gap-2"><Phone size={14} /> {selected.telefoon}</p>
                <p className="flex items-center gap-2"><Mail size={14} /> {selected.email}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {selected.adres}</p>
                <p className="text-xs">Foto-toestemming: {selected.toestemming_foto ? "ja" : "nee"} · Privacy akkoord: {selected.akkoord_privacy ? "ja" : "nee"}</p>
                {selected.opmerkingen && <p className="text-xs italic">“{selected.opmerkingen}”</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={selected.status}
                  onChange={(e) => patch(selected.id, { status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Betaling</p>
                  <button
                    onClick={() => togglePaid(selected)}
                    disabled={saving}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg font-medium border",
                      selected.betaald
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-primary text-primary-foreground border-transparent"
                    )}
                  >
                    {selected.betaald ? "Markeer als onbetaald" : "Markeer als betaald"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Bedrag (€)</label>
                    <input
                      type="number"
                      value={selected.bedrag}
                      onChange={(e) => setSelected({ ...selected, bedrag: Number(e.target.value) })}
                      onBlur={(e) => patch(selected.id, { bedrag: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Betaald op</label>
                    <input
                      type="date"
                      value={selected.betaald_op ?? ""}
                      onChange={(e) => patch(selected.id, { betaald_op: e.target.value || null })}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Methode</label>
                  <select
                    value={selected.betaalmethode ?? ""}
                    onChange={(e) => patch(selected.id, { betaalmethode: e.target.value || null })}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Onbekend</option>
                    <option value="contant">Contant</option>
                    <option value="overboeking">Overboeking</option>
                    <option value="tikkie">Tikkie / iDEAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Notitie</label>
                  <textarea
                    rows={2}
                    defaultValue={selected.betaal_notitie ?? ""}
                    onBlur={(e) => patch(selected.id, { betaal_notitie: e.target.value || null })}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">Ingeschreven op {fmtDate(selected.created_at)} · schooljaar {selected.schooljaar}</p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setDeleteTarget(selected)}
              >
                <Trash2 size={15} /> Aanmelding verwijderen
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-foreground/40" onClick={() => setSelected(null)} />
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Aanmelding verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              De aanmelding van {deleteTarget?.voornamen} {deleteTarget?.achternaam} wordt definitief verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeRegistration}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{checked.length} aanmeldingen verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              De geselecteerde aanmeldingen worden definitief verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
