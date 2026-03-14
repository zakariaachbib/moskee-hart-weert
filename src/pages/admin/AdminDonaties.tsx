import { useEffect, useState } from "react";
import { Search, Heart, TrendingUp, DollarSign, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type Donation = Tables<"donations">;

export default function AdminDonaties() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDonations = async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    setDonations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDonations(); }, []);

  const deleteDonation = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze donatie wilt verwijderen?")) return;
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) return;
    fetchDonations();
  };

  const filtered = donations.filter((d) =>
    (d.naam || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.notitie || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = donations.reduce((sum, d) => sum + d.bedrag, 0);
  const avg = donations.length > 0 ? total / donations.length : 0;

  // Monthly stats
  const thisMonth = donations.filter((d) => {
    const date = new Date(d.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((sum, d) => sum + d.bedrag, 0);

  const summaryCards = [
    { label: "Totaal ontvangen", value: `€${total.toFixed(2)}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "Deze maand", value: `€${monthTotal.toFixed(2)}`, icon: TrendingUp, color: "bg-green-100 text-green-700" },
    { label: "Aantal donaties", value: donations.length, icon: Heart, color: "bg-destructive/10 text-destructive" },
    { label: "Gemiddeld bedrag", value: `€${avg.toFixed(2)}`, icon: DollarSign, color: "bg-accent/10 text-accent" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Donaties</h1>
          <p className="text-sm text-muted-foreground mt-1">Overzicht van alle ontvangen donaties</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className={`p-2 rounded-xl w-fit ${s.color} mb-2`}>
                <s.icon size={16} />
              </div>
              <p className="text-xl font-bold text-foreground">{loading ? "—" : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek donaties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={32} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">Geen donaties gevonden</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bedrag</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Donor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notitie</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-primary">€{d.bedrag}</td>
                      <td className="px-5 py-4">
                        <div className="text-foreground">{d.naam || "Anoniem"}</div>
                        {d.email && <div className="text-xs text-muted-foreground">{d.email}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">{d.type}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{d.notitie || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteDonation(d.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Verwijderen">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary text-lg">€{d.bedrag}</span>
                    <p className="text-xs text-muted-foreground">{d.naam || "Anoniem"}</p>
                    {d.notitie && <p className="text-xs text-foreground mt-0.5">{d.notitie}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{d.type}</span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(d.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
