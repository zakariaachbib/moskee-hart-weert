import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  titel: string;
  beschrijving: string | null;
  doelbedrag: number;
  opgehaald_bedrag: number;
  afbeelding_url: string | null;
  actief: boolean;
  slug: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  bedrag: number;
  naam: string | null;
  email: string | null;
  anoniem: boolean;
  status: string;
  created_at: string;
}

export default function AdminCrowdfunding() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [doelbedrag, setDoelbedrag] = useState("");
  const [slug, setSlug] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("crowdfunding_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjects(data as Project[]);
    setLoading(false);
  };

  const fetchDonations = async (projectId: string) => {
    setSelectedProject(projectId);
    const { data } = await supabase
      .from("crowdfunding_donations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (data) setDonations(data as Donation[]);
  };

  const resetForm = () => {
    setTitel(""); setBeschrijving(""); setDoelbedrag(""); setSlug(""); setImageFile(null);
    setEditing(null); setShowForm(false);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setTitel(p.titel);
    setBeschrijving(p.beschrijving || "");
    setDoelbedrag(String(p.doelbedrag));
    setSlug(p.slug || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!titel || !doelbedrag) {
      toast({ title: "Vul titel en doelbedrag in", variant: "destructive" });
      return;
    }

    let afbeelding_url = editing?.afbeelding_url || null;

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("crowdfunding").upload(path, imageFile);
      if (uploadError) {
        toast({ title: "Fout bij uploaden afbeelding", variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("crowdfunding").getPublicUrl(path);
      afbeelding_url = urlData.publicUrl;
    }

    const record = {
      titel,
      beschrijving: beschrijving || null,
      doelbedrag: parseFloat(doelbedrag),
      slug: slug || null,
      afbeelding_url,
    };

    if (editing) {
      const { error } = await supabase.from("crowdfunding_projects").update(record).eq("id", editing.id);
      if (error) { toast({ title: "Fout bij opslaan", variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("crowdfunding_projects").insert(record);
      if (error) { toast({ title: "Fout bij aanmaken", variant: "destructive" }); return; }
    }

    toast({ title: editing ? "Project bijgewerkt" : "Project aangemaakt" });
    resetForm();
    fetchProjects();
  };

  const toggleActive = async (p: Project) => {
    await supabase.from("crowdfunding_projects").update({ actief: !p.actief }).eq("id", p.id);
    fetchProjects();
  };

  const deleteProject = async (p: Project) => {
    if (!confirm(`Weet je zeker dat je "${p.titel}" wilt verwijderen?`)) return;
    await supabase.from("crowdfunding_projects").delete().eq("id", p.id);
    toast({ title: "Project verwijderd" });
    fetchProjects();
    if (selectedProject === p.id) setSelectedProject(null);
  };

  const totalRaised = donations.filter(d => d.status === "paid").reduce((s, d) => s + d.bedrag, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Crowdfunding</h1>
            <p className="text-sm text-muted-foreground">Beheer crowdfunding projecten en bekijk donaties</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nieuw project
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-heading text-lg text-foreground">
              {editing ? "Project bewerken" : "Nieuw project"}
            </h3>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Titel"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:border-primary outline-none"
            />
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Beschrijving van het project..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:border-primary outline-none resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="number"
                min="1"
                value={doelbedrag}
                onChange={(e) => setDoelbedrag(e.target.value)}
                placeholder="Doelbedrag (€)"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:border-primary outline-none"
              />
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="URL slug (bijv. moskee-bouw)"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground focus:border-primary outline-none"
              />
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Upload size={16} /> {imageFile ? imageFile.name : "Afbeelding uploaden"}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                {editing ? "Opslaan" : "Aanmaken"}
              </button>
              <button onClick={resetForm} className="px-6 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border">
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Projects list */}
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className={`bg-card rounded-xl border border-border p-4 flex items-center gap-4 ${!p.actief ? "opacity-60" : ""}`}>
              {p.afbeelding_url && (
                <img src={p.afbeelding_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{p.titel}</h4>
                <p className="text-sm text-muted-foreground">
                  €{p.opgehaald_bedrag.toLocaleString("nl-NL")} / €{p.doelbedrag.toLocaleString("nl-NL")}
                  {!p.actief && <span className="ml-2 text-destructive">(Inactief)</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => fetchDonations(p.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Donaties bekijken">
                  <Users size={16} />
                </button>
                <button onClick={() => toggleActive(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title={p.actief ? "Deactiveren" : "Activeren"}>
                  {p.actief ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Bewerken">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteProject(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive" title="Verwijderen">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Donations for selected project */}
        {selectedProject && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">
                Donaties ({donations.length})
              </h3>
              <span className="text-sm font-medium text-primary">
                Totaal betaald: €{totalRaised.toLocaleString("nl-NL")}
              </span>
            </div>
            {donations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Geen donaties gevonden.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 text-muted-foreground font-medium">Naam</th>
                      <th className="pb-2 text-muted-foreground font-medium">Email</th>
                      <th className="pb-2 text-muted-foreground font-medium">Bedrag</th>
                      <th className="pb-2 text-muted-foreground font-medium">Status</th>
                      <th className="pb-2 text-muted-foreground font-medium">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => (
                      <tr key={d.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{d.anoniem ? "Anoniem" : d.naam || "-"}</td>
                        <td className="py-2 text-muted-foreground">{d.email || "-"}</td>
                        <td className="py-2 font-medium text-foreground">€{d.bedrag}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            d.status === "paid" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("nl-NL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
