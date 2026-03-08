import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Calendar, Mail, Users, Heart, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Activity = Tables<"activities">;
type ContactMessage = Tables<"contact_messages">;
type MembershipRequest = Tables<"membership_requests">;
type Donation = Tables<"donations">;

type Tab = "activiteiten" | "berichten" | "leden" | "donaties";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("activiteiten");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading || !user || !isAdmin) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Laden...</div>;
  }

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "activiteiten", label: "Activiteiten", icon: Calendar },
    { key: "berichten", label: "Berichten", icon: Mail },
    { key: "leden", label: "Lidmaatschap", icon: Users },
    { key: "donaties", label: "Donaties", icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brown">
        <div className="container flex items-center justify-between py-4">
          <h1 className="font-heading text-2xl text-cream">Admin Dashboard</h1>
          <button onClick={() => { signOut(); navigate("/"); }} className="text-cream/70 hover:text-cream flex items-center gap-2 text-sm">
            <LogOut size={16} /> Uitloggen
          </button>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key ? "bg-gradient-gold text-primary-foreground" : "bg-card border border-border text-foreground hover:border-primary/30"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "activiteiten" && <ActiviteitenTab />}
        {tab === "berichten" && <BerichtenTab />}
        {tab === "leden" && <LedenTab />}
        {tab === "donaties" && <DonatiesTab />}
      </div>
    </div>
  );
}

function ActiviteitenTab() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true });

  const fetchActivities = async () => {
    const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleSave = async () => {
    if (!form.titel.trim()) { toast({ title: "Titel is verplicht", variant: "destructive" }); return; }
    if (editing) {
      const { error } = await supabase.from("activities").update({
        titel: form.titel, omschrijving: form.omschrijving || null, dag: form.dag || null,
        tijd: form.tijd || null, locatie: form.locatie || null, actief: form.actief,
      }).eq("id", editing);
      if (error) { toast({ title: "Fout bij opslaan", variant: "destructive" }); return; }
      toast({ title: "Activiteit bijgewerkt" });
    } else {
      const { error } = await supabase.from("activities").insert({
        titel: form.titel, omschrijving: form.omschrijving || null, dag: form.dag || null,
        tijd: form.tijd || null, locatie: form.locatie || null, actief: form.actief,
      });
      if (error) { toast({ title: "Fout bij toevoegen", variant: "destructive" }); return; }
      toast({ title: "Activiteit toegevoegd" });
    }
    setEditing(null); setShowNew(false);
    setForm({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true });
    fetchActivities();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Activiteit verwijderd" });
    fetchActivities();
  };

  const startEdit = (a: Activity) => {
    setEditing(a.id);
    setShowNew(true);
    setForm({ titel: a.titel, omschrijving: a.omschrijving || "", dag: a.dag || "", tijd: a.tijd || "", locatie: a.locatie || "", actief: a.actief });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-foreground">Activiteiten</h2>
        <button onClick={() => { setShowNew(true); setEditing(null); setForm({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true }); }}
          className="bg-gradient-gold text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Nieuwe activiteit
        </button>
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-border mb-6">
          <h3 className="font-heading text-lg text-foreground mb-4">{editing ? "Activiteit bewerken" : "Nieuwe activiteit"}</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Titel *" value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })}
              className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground" />
            <input type="text" placeholder="Dag (bijv. Elke vrijdag)" value={form.dag} onChange={(e) => setForm({ ...form, dag: e.target.value })}
              className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground" />
            <input type="text" placeholder="Tijd" value={form.tijd} onChange={(e) => setForm({ ...form, tijd: e.target.value })}
              className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground" />
            <input type="text" placeholder="Locatie" value={form.locatie} onChange={(e) => setForm({ ...form, locatie: e.target.value })}
              className="px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground" />
          </div>
          <textarea placeholder="Omschrijving" value={form.omschrijving} onChange={(e) => setForm({ ...form, omschrijving: e.target.value })} rows={2}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground resize-none mb-4" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.actief} onChange={(e) => setForm({ ...form, actief: e.target.checked })} className="rounded" /> Actief (zichtbaar op website)
            </label>
            <div className="flex gap-2">
              <button onClick={() => { setShowNew(false); setEditing(null); }} className="px-4 py-2 rounded-xl text-sm border border-border hover:bg-muted transition-colors text-foreground">Annuleren</button>
              <button onClick={handleSave} className="bg-gradient-gold text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
                <Check size={14} /> Opslaan
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? <p className="text-muted-foreground">Laden...</p> : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="bg-card rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{a.titel}</h4>
                  {!a.actief && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Inactief</span>}
                </div>
                <p className="text-sm text-muted-foreground">{[a.dag, a.tijd, a.locatie].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {activities.length === 0 && <p className="text-muted-foreground text-center py-8">Geen activiteiten gevonden</p>}
        </div>
      )}
    </div>
  );
}

function BerichtenTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setMessages(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-6">Contactberichten ({messages.length})</h2>
      {loading ? <p className="text-muted-foreground">Laden...</p> : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-foreground">{m.naam}</h4>
                  <p className="text-sm text-muted-foreground">{m.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-sm font-medium text-primary mb-1">{m.onderwerp}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{m.bericht}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-muted-foreground text-center py-8">Geen berichten gevonden</p>}
        </div>
      )}
    </div>
  );
}

function LedenTab() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase.from("membership_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("membership_requests").update({ status }).eq("id", id);
    if (error) { toast({ title: "Fout", variant: "destructive" }); return; }
    toast({ title: `Status gewijzigd naar ${status}` });
    fetchRequests();
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-6">Lidmaatschapsaanvragen ({requests.length})</h2>
      {loading ? <p className="text-muted-foreground">Laden...</p> : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{r.naam}</h4>
                  <p className="text-sm text-muted-foreground">{r.email} {r.telefoon && `· ${r.telefoon}`}</p>
                  {r.adres && <p className="text-sm text-muted-foreground">{r.adres}</p>}
                  {r.geboortedatum && <p className="text-sm text-muted-foreground">Geb: {r.geboortedatum}</p>}
                  {r.opmerking && <p className="text-sm text-foreground mt-1">{r.opmerking}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    r.status === "approved" ? "bg-green-100 text-green-800" :
                    r.status === "rejected" ? "bg-red-100 text-red-800" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {r.status === "pending" ? "In behandeling" : r.status === "approved" ? "Goedgekeurd" : "Afgewezen"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("nl-NL")}</span>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateStatus(r.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                    <Check size={12} /> Goedkeuren
                  </button>
                  <button onClick={() => updateStatus(r.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                    <X size={12} /> Afwijzen
                  </button>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && <p className="text-muted-foreground text-center py-8">Geen aanvragen gevonden</p>}
        </div>
      )}
    </div>
  );
}

function DonatiesTab() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("donations").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setDonations(data || []);
      setLoading(false);
    });
  }, []);

  const total = donations.reduce((sum, d) => sum + d.bedrag, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-foreground">Donaties ({donations.length})</h2>
        <span className="bg-gradient-gold text-primary-foreground px-4 py-2 rounded-xl font-semibold">Totaal: €{total.toFixed(2)}</span>
      </div>
      {loading ? <p className="text-muted-foreground">Laden...</p> : (
        <div className="space-y-3">
          {donations.map((d) => (
            <div key={d.id} className="bg-card rounded-xl p-4 border border-border flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-primary">€{d.bedrag}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{d.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {d.naam || "Anoniem"} {d.email && `· ${d.email}`}
                </p>
                {d.notitie && <p className="text-sm text-foreground mt-1">{d.notitie}</p>}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(d.created_at).toLocaleDateString("nl-NL")}</span>
            </div>
          ))}
          {donations.length === 0 && <p className="text-muted-foreground text-center py-8">Geen donaties gevonden</p>}
        </div>
      )}
    </div>
  );
}
