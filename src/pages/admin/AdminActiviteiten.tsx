import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type Activity = Tables<"activities">;

export default function AdminActiviteiten() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ titel: "", omschrijving: "", dag: "", tijd: "", locatie: "", actief: true });

  const fetchActivities = async () => {
    const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const filtered = activities.filter((a) => {
    const matchSearch = a.titel.toLowerCase().includes(search.toLowerCase()) ||
      (a.omschrijving || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterActive === "all" || (filterActive === "active" ? a.actief : !a.actief);
    return matchSearch && matchFilter;
  });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
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
              type="text"
              placeholder="Zoek activiteiten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm"
            />
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterActive === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Alle" : f === "active" ? "Actief" : "Inactief"}
              </button>
            ))}
          </div>
        </div>

        {/* New/Edit Form */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
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
                    <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm border border-border hover:bg-muted transition-colors text-foreground">
                      Annuleren
                    </button>
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Geen activiteiten gevonden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-xl p-4 border border-border hover:border-primary/10 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-foreground truncate">{a.titel}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        a.actief ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {a.actief ? "Actief" : "Inactief"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{[a.dag, a.tijd, a.locatie].filter(Boolean).join(" · ") || "Geen details"}</p>
                    {a.omschrijving && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.omschrijving}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil size={15} />
                    </button>
                    {deleteConfirm === a.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
