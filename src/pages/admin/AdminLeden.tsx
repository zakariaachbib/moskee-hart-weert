import { useEffect, useState } from "react";
import { Search, Check, X, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type MembershipRequest = Tables<"membership_requests">;

export default function AdminLeden() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchRequests = async () => {
    const { data } = await supabase.from("membership_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("membership_requests").update({ status }).eq("id", id);
    if (error) { toast({ title: "Fout", variant: "destructive" }); return; }
    toast({ title: `Status gewijzigd naar ${status === "approved" ? "goedgekeurd" : "afgewezen"} ✓` });
    fetchRequests();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Weet je zeker dat je deze aanvraag wilt verwijderen?")) return;
    const { error } = await supabase.from("membership_requests").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Aanvraag verwijderd" });
    fetchRequests();
  };

  const filtered = requests.filter((r) => {
    const matchSearch = r.naam.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const statusConfig = {
    pending: { label: "In behandeling", bg: "bg-primary/10 text-primary" },
    approved: { label: "Goedgekeurd", bg: "bg-green-100 text-green-700" },
    rejected: { label: "Afgewezen", bg: "bg-destructive/10 text-destructive" },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Lidmaatschap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.pending > 0 ? `${counts.pending} aanvra${counts.pending === 1 ? "ag" : "gen"} wacht${counts.pending === 1 ? "" : "en"} op behandeling` : "Alle aanvragen zijn behandeld"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Zoek op naam of e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm"
            />
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Alle" : statusConfig[f].label}
                <span className={`text-[10px] ${statusFilter === f ? "opacity-80" : ""}`}>({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">Geen aanvragen gevonden</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naam</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datum</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{r.naam}</div>
                        {r.geboortedatum && <div className="text-xs text-muted-foreground">Geb: {r.geboortedatum}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-foreground">{r.email}</div>
                        {r.telefoon && <div className="text-xs text-muted-foreground">{r.telefoon}</div>}
                        {r.adres && <div className="text-xs text-muted-foreground">{r.adres}</div>}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusConfig[r.status as keyof typeof statusConfig]?.bg || "bg-muted text-muted-foreground"}`}>
                          {statusConfig[r.status as keyof typeof statusConfig]?.label || r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 justify-end">
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => updateStatus(r.id, "approved")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                <Check size={12} /> Goedkeuren
                              </button>
                              <button onClick={() => updateStatus(r.id, "rejected")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                                <X size={12} /> Afwijzen
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteRequest(r.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Verwijderen">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{r.naam}</h4>
                      <p className="text-xs text-muted-foreground">{r.email}{r.telefoon && ` · ${r.telefoon}`}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusConfig[r.status as keyof typeof statusConfig]?.bg}`}>
                      {statusConfig[r.status as keyof typeof statusConfig]?.label}
                    </span>
                  </div>
                  {r.opmerking && <p className="text-xs text-foreground mb-2">{r.opmerking}</p>}
                  <div className="flex gap-2 mt-2">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(r.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                          <Check size={12} /> Goedkeuren
                        </button>
                        <button onClick={() => updateStatus(r.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                          <X size={12} /> Afwijzen
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteRequest(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto" title="Verwijderen">
                      <Trash2 size={14} />
                    </button>
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
