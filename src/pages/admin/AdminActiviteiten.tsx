import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Search, Phone, Mail, MessageCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";

type Activity = Tables<"activities">;
type ActivityRequest = Tables<"activity_requests">;

type TopTab = "activiteiten" | "aanvragen";
type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: "In behandeling", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Goedgekeurd", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Afgekeurd", cls: "bg-red-100 text-red-700" },
};

export default function AdminActiviteiten() {
  const { toast } = useToast();
  const [topTab, setTopTab] = useState<TopTab>("activiteiten");

  // ───────── Activities state ─────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true });

  // ───────── Requests state ─────────
  const [requests, setRequests] = useState<ActivityRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqSearch, setReqSearch] = useState("");
  const [reqFilter, setReqFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ActivityRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActivities = async () => {
    const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from("activity_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setReqLoading(false);
  };

  useEffect(() => { fetchActivities(); fetchRequests(); }, []);

  useEffect(() => {
    if (selected) setAdminNotes(selected.admin_notes || "");
  }, [selected]);

  const filtered = activities.filter((a) => {
    const matchSearch = a.titel.toLowerCase().includes(search.toLowerCase()) ||
      (a.omschrijving || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterActive === "all" || (filterActive === "active" ? a.actief : !a.actief);
    return matchSearch && matchFilter;
  });

  const filteredRequests = useMemo(() => {
    const s = reqSearch.toLowerCase();
    return requests.filter((r) => {
      const ms = !s || r.activiteit_naam.toLowerCase().includes(s) || r.naam.toLowerCase().includes(s);
      const mf = reqFilter === "all" || r.status === reqFilter;
      return ms && mf;
    });
  }, [requests, reqSearch, reqFilter]);

  const reqCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests]);

  const handleSave = async () => {
    if (!form.titel.trim()) { toast({ title: "Titel is verplicht", variant: "destructive" }); return; }
    const payload = {
      titel: form.titel, omschrijving: form.omschrijving || null, dag: form.dag || null,
      tijd: form.tijd || null, locatie: form.locatie || null, actief: form.actief,
    };

    if (editing) {
      const { error } = await supabase.from("activities").update(payload).eq("id", editing);
      if (error) { toast({ title: "Fout bij opslaan", variant: "destructive" }); return; }
      toast({ title: "Activiteit bijgewerkt ✓" });
    } else {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) { toast({ title: "Fout bij toevoegen", variant: "destructive" }); return; }
      toast({ title: "Activiteit toegevoegd ✓" });
    }
    resetForm();
    fetchActivities();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Activiteit verwijderd" });
    setDeleteConfirm(null);
    fetchActivities();
  };

  const startEdit = (a: Activity) => {
    setEditing(a.id);
    setShowNew(true);
    setForm({ titel: a.titel, omschrijving: a.omschrijving || "", dag: a.dag || "", tijd: a.tijd || "", locatie: a.locatie || "", actief: a.actief });
  };

  const resetForm = () => {
    setEditing(null);
    setShowNew(false);
    setForm({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true });
  };

  // ───────── Request actions ─────────
  const saveAdminNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const { error } = await supabase.from("activity_requests")
      .update({ admin_notes: adminNotes }).eq("id", selected.id);
    setSavingNotes(false);
    if (error) { toast({ title: "Fout bij opslaan notitie", variant: "destructive" }); return; }
    toast({ title: "Notitie opgeslagen ✓" });
    setSelected({ ...selected, admin_notes: adminNotes });
    setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, admin_notes: adminNotes } : r));
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      // 1. Update request status
      const { error: updErr } = await supabase.from("activity_requests")
        .update({ status: "approved", admin_notes: adminNotes }).eq("id", selected.id);
      if (updErr) throw updErr;

      // 2. Copy to activities
      const { error: insErr } = await supabase.from("activities").insert({
        titel: selected.activiteit_naam,
        omschrijving: selected.omschrijving,
        dag: selected.gewenste_datum,
        tijd: selected.tijdstip || null,
        locatie: selected.locatie || null,
        actief: true,
      });
      if (insErr) throw insErr;

      // 3. Send emails (fire and forget)
      supabase.functions.invoke("send-email", { body: { type: "activity_request_approved", data: { ...selected, admin_notes: adminNotes } } });
      supabase.functions.invoke("send-email", { body: { type: "activity_request_approved_admin", data: { ...selected, admin_notes: adminNotes } } });

      toast({ title: "Aanvraag goedgekeurd ✓", description: "Activiteit toegevoegd en e-mails verstuurd." });
      setSelected(null);
      fetchRequests();
      fetchActivities();
    } catch (e: any) {
      toast({ title: "Fout bij goedkeuren", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) {
      toast({ title: "Reden is verplicht", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const newNotes = `${adminNotes ? adminNotes + "\n\n" : ""}Afwijzingsreden: ${rejectReason}`;
      const { error } = await supabase.from("activity_requests")
        .update({ status: "rejected", admin_notes: newNotes }).eq("id", selected.id);
      if (error) throw error;

      supabase.functions.invoke("send-email", { body: { type: "activity_request_rejected", data: { ...selected, reden: rejectReason } } });

      toast({ title: "Aanvraag afgewezen", description: "E-mail met reden verstuurd." });
      setRejectOpen(false);
      setRejectReason("");
      setSelected(null);
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Fout bij afwijzen", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top tabs */}
        <div className="flex gap-1 border-b border-border">
          {([["activiteiten", "Activiteiten"], ["aanvragen", `Aanvragen${reqCounts.pending ? ` (${reqCounts.pending})` : ""}`]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTopTab(k as TopTab)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                topTab === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {topTab === k && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {topTab === "activiteiten" ? (
            <motion.div key="act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-heading text-3xl text-foreground">Activiteiten</h1>
                  <p className="text-sm text-muted-foreground mt-1">{activities.length} activiteiten totaal</p>
                </div>
                <button
                  onClick={() => { setShowNew(true); setEditing(null); setForm({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true }); }}
                  className="bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow self-start"
                >
                  <Plus size={16} /> Nieuwe activiteit
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" placeholder="Zoek activiteiten..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm"
                  />
                </div>
                <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
                  {(["all", "active", "inactive"] as const).map((f) => (
                    <button key={f} onClick={() => setFilterActive(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterActive === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      {f === "all" ? "Alle" : f === "active" ? "Actief" : "Inactief"}
                    </button>
                  ))}
                </div>
              </div>

              {/* New/Edit Form */}
              <AnimatePresence>
                {showNew && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-card rounded-2xl p-6 border border-primary/20 shadow-sm">
                      <h3 className="font-heading text-lg text-foreground mb-4">
                        {editing ? "Activiteit bewerken" : "Nieuwe activiteit"}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="Titel *" value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })}
                          className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
                        <input type="text" placeholder="Dag (bijv. Elke vrijdag)" value={form.dag} onChange={(e) => setForm({ ...form, dag: e.target.value })}
                          className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
                        <input type="text" placeholder="Tijd" value={form.tijd} onChange={(e) => setForm({ ...form, tijd: e.target.value })}
                          className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
                        <input type="text" placeholder="Locatie" value={form.locatie} onChange={(e) => setForm({ ...form, locatie: e.target.value })}
                          className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
                      </div>
                      <textarea placeholder="Omschrijving" value={form.omschrijving} onChange={(e) => setForm({ ...form, omschrijving: e.target.value })} rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground resize-none mb-4 text-sm" />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <div className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.actief ? "bg-primary" : "bg-muted"}`}
                            onClick={() => setForm({ ...form, actief: !form.actief })}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${form.actief ? "left-[18px]" : "left-0.5"}`} />
                          </div>
                          Zichtbaar op website
                        </label>
                        <div className="flex gap-2">
                          <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm border border-border hover:bg-muted transition-colors text-foreground">Annuleren</button>
                          <button onClick={handleSave} className="bg-gradient-gold text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                            <Check size={14} /> Opslaan
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List */}
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16"><p className="text-muted-foreground">Geen activiteiten gevonden</p></div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((a) => (
                    <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-card rounded-xl p-4 border border-border hover:border-primary/10 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-foreground truncate">{a.titel}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              a.actief ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                            }`}>{a.actief ? "Actief" : "Inactief"}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{[a.dag, a.tijd, a.locatie].filter(Boolean).join(" · ") || "Geen details"}</p>
                          {a.omschrijving && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.omschrijving}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil size={15} /></button>
                          {deleteConfirm === a.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Check size={15} /></button>
                              <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={15} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="req" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-5">
              <div>
                <h1 className="font-heading text-3xl text-foreground">Aanvragen</h1>
                <p className="text-sm text-muted-foreground mt-1">{requests.length} aanvragen totaal</p>
              </div>

              {/* Status filter pills */}
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "Alle", reqCounts.all],
                  ["pending", "In behandeling", reqCounts.pending],
                  ["approved", "Goedgekeurd", reqCounts.approved],
                  ["rejected", "Afgekeurd", reqCounts.rejected],
                ] as const).map(([k, label, n]) => (
                  <button key={k} onClick={() => setReqFilter(k as StatusFilter)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                      reqFilter === k ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}>
                    {label} <span className="opacity-70">({n})</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Zoek op activiteit of aanvrager..."
                  value={reqSearch} onChange={(e) => setReqSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm" />
              </div>

              {/* Table / list */}
              {reqLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-16"><p className="text-muted-foreground">Geen aanvragen gevonden</p></div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block bg-card rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Activiteit</th>
                          <th className="text-left px-4 py-3 font-medium">Aanvrager</th>
                          <th className="text-left px-4 py-3 font-medium">Datum</th>
                          <th className="text-left px-4 py-3 font-medium">Categorie</th>
                          <th className="text-left px-4 py-3 font-medium">Doelgroep</th>
                          <th className="text-left px-4 py-3 font-medium">Pers.</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                          <th className="text-left px-4 py-3 font-medium">Ingediend</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((r) => {
                          const st = statusLabels[r.status] || statusLabels.pending;
                          return (
                            <tr key={r.id} onClick={() => setSelected(r)}
                              className="border-t border-border cursor-pointer hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{r.activiteit_naam}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.naam}</td>
                              <td className="px-4 py-3 text-muted-foreground">{new Date(r.gewenste_datum).toLocaleDateString("nl-NL")}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.categorie}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.doelgroep}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.aantal_personen}</td>
                              <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span></td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("nl-NL")}</td>
                              <td className="px-2 text-muted-foreground"><ChevronRight size={16} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="lg:hidden space-y-2">
                    {filteredRequests.map((r) => {
                      const st = statusLabels[r.status] || statusLabels.pending;
                      return (
                        <button key={r.id} onClick={() => setSelected(r)}
                          className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{r.activiteit_naam}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${st.cls}`}>{st.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {r.naam} · {r.categorie} · {r.aantal_personen} pers.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Datum: {new Date(r.gewenste_datum).toLocaleDateString("nl-NL")} · Ingediend {new Date(r.created_at).toLocaleDateString("nl-NL")}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail side panel */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${(statusLabels[selected.status] || statusLabels.pending).cls}`}>
                    {(statusLabels[selected.status] || statusLabels.pending).label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ingediend {new Date(selected.created_at).toLocaleDateString("nl-NL")}
                  </span>
                </div>
                <SheetTitle className="text-left">{selected.activiteit_naam}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact */}
                <Section title="Contact aanvrager">
                  <Field label="Naam" value={selected.naam} />
                  <Field label="Werkgroep" value={selected.werkgroep} />
                  <Field label="E-mail" value={selected.email} />
                  <Field label="Telefoon" value={selected.telefoon} />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={`tel:${selected.telefoon}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/70">
                      <Phone size={13} /> Bellen
                    </a>
                    <a href={`https://wa.me/${selected.telefoon.replace(/[^\d]/g, "").replace(/^0/, "31")}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-medium hover:bg-green-200">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/70">
                      <Mail size={13} /> E-mail
                    </a>
                  </div>
                </Section>

                {/* Uitgangspunt */}
                <Section title="Uitgangspunt">
                  <Field label="Doel" value={selected.doel} multiline />
                  <Field label="Doelgroep" value={selected.doelgroep} />
                  {selected.grondslag && <Field label="Islamitische grondslag" value={selected.grondslag} multiline />}
                  {selected.verwacht_resultaat && <Field label="Verwacht resultaat" value={selected.verwacht_resultaat} multiline />}
                </Section>

                {/* Activiteit */}
                <Section title="Activiteit">
                  <Field label="Categorie" value={selected.categorie} />
                  <Field label="Omschrijving" value={selected.omschrijving} multiline />
                  <Field label="Gewenste datum" value={new Date(selected.gewenste_datum).toLocaleDateString("nl-NL")} />
                  {selected.tijdstip && <Field label="Tijdstip" value={selected.tijdstip} />}
                  <Field label="Aantal personen" value={String(selected.aantal_personen)} />
                  {selected.locatie && <Field label="Locatie" value={selected.locatie} />}
                </Section>

                {/* Vrijwilligers */}
                <Section title="Vrijwilligers">
                  <Field label="Aantal nodig" value={String(selected.vrijwilligers_aantal)} />
                  <Field label="Status" value={selected.vrijwilligers_status} />
                  {selected.vrijwilligers_taken && <Field label="Taken" value={selected.vrijwilligers_taken} multiline />}
                </Section>

                {(selected.budget || selected.opmerkingen) && (
                  <Section title="Aanvullend">
                    {selected.budget && <Field label="Budget" value={selected.budget} />}
                    {selected.opmerkingen && <Field label="Opmerkingen" value={selected.opmerkingen} multiline />}
                  </Section>
                )}

                {/* Coordinator notes */}
                <Section title="Notitie coördinator">
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4}
                    placeholder="Interne notitie..." className="text-sm" />
                  <button onClick={saveAdminNotes} disabled={savingNotes}
                    className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50">
                    {savingNotes ? "Opslaan..." : "Notitie opslaan"}
                  </button>
                </Section>

                {/* Actions */}
                {selected.status === "pending" && (
                  <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t border-border flex gap-2">
                    <button onClick={() => setRejectOpen(true)} disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                      Afwijzen
                    </button>
                    <button onClick={handleApprove} disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                      {actionLoading ? "Bezig..." : "Goedkeuren"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aanvraag afwijzen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Geef een duidelijke reden. Deze wordt opgenomen in de e-mail aan de aanvrager.
          </p>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={5}
            placeholder="Reden van afwijzing (verplicht)..." className="text-sm" />
          <DialogFooter>
            <button onClick={() => setRejectOpen(false)} disabled={actionLoading}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">
              Annuleren
            </button>
            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {actionLoading ? "Bezig..." : "Definitief afwijzen"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className={`text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</div>
    </div>
  );
}
