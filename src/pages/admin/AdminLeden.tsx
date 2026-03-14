import { useEffect, useState } from "react";
import { Search, Check, X, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;
type MembershipRequest = Tables<"membership_requests">;

const memberStatusConfig: Record<string, { label: string; bg: string }> = {
  pending: { label: "In afwachting", bg: "bg-amber-100 text-amber-700" },
  active: { label: "Actief", bg: "bg-green-100 text-green-700" },
  cancelled: { label: "Geannuleerd", bg: "bg-muted text-muted-foreground" },
  failed: { label: "Mislukt", bg: "bg-destructive/10 text-destructive" },
};

const requestStatusConfig: Record<string, { label: string; bg: string }> = {
  pending: { label: "In behandeling", bg: "bg-primary/10 text-primary" },
  approved: { label: "Goedgekeurd", bg: "bg-green-100 text-green-700" },
  rejected: { label: "Afgewezen", bg: "bg-destructive/10 text-destructive" },
};

export default function AdminLeden() {
  const { toast } = useToast();

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");

  // Requests state
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setMembers(data || []);
    setMembersLoading(false);
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from("membership_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setRequestsLoading(false);
  };

  useEffect(() => { fetchMembers(); fetchRequests(); }, []);

  // Member actions
  const deleteMember = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit lid wilt verwijderen?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Lid verwijderd" });
    fetchMembers();
  };

  // Request actions
  const updateRequestStatus = async (id: string, status: string) => {
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

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const name = `${m.voornaam} ${m.achternaam}`.toLowerCase();
    const matchSearch = name.includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase());
    const matchStatus = memberStatusFilter === "all" || m.status === memberStatusFilter;
    return matchSearch && matchStatus;
  });

  const memberCounts = {
    all: members.length,
    pending: members.filter((m) => m.status === "pending").length,
    active: members.filter((m) => m.status === "active").length,
    cancelled: members.filter((m) => m.status === "cancelled").length,
    failed: members.filter((m) => m.status === "failed").length,
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchSearch = r.naam.toLowerCase().includes(requestSearch.toLowerCase()) || r.email.toLowerCase().includes(requestSearch.toLowerCase());
    const matchStatus = requestStatusFilter === "all" || r.status === requestStatusFilter;
    return matchSearch && matchStatus;
  });

  const requestCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const pendingTotal = memberCounts.pending + requestCounts.pending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Lidmaatschap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingTotal > 0 ? `${pendingTotal} item(s) wacht${pendingTotal === 1 ? "" : "en"} op behandeling` : "Alle aanvragen zijn behandeld"}
          </p>
        </div>

        <Tabs defaultValue="leden" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leden" className="gap-1.5">
              Leden <span className="text-[10px] opacity-70">({members.length})</span>
            </TabsTrigger>
            <TabsTrigger value="aanvragen" className="gap-1.5">
              Aanvragen <span className="text-[10px] opacity-70">({requests.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* LEDEN TAB */}
          <TabsContent value="leden" className="space-y-4">
            <FilterBar
              search={memberSearch}
              onSearchChange={setMemberSearch}
              statusFilter={memberStatusFilter}
              onStatusFilterChange={setMemberStatusFilter}
              statuses={["all", "pending", "active", "cancelled", "failed"]}
              statusConfig={memberStatusConfig}
              counts={memberCounts}
            />
            {membersLoading ? <LoadingSkeleton /> : filteredMembers.length === 0 ? <EmptyState /> : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naam</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adres</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datum</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-4 font-medium text-foreground">{m.voornaam} {m.achternaam}</td>
                          <td className="px-5 py-4 text-muted-foreground text-xs">
                            <div>{m.straat}</div>
                            <div>{m.postcode} {m.plaats}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-foreground">{m.email}</div>
                            {m.telefoon && <div className="text-xs text-muted-foreground">{m.telefoon}</div>}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={m.status} config={memberStatusConfig} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button onClick={() => deleteMember(m.id)}
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
                {/* Mobile */}
                <div className="md:hidden divide-y divide-border">
                  {filteredMembers.map((m) => (
                    <div key={m.id} className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-foreground">{m.voornaam} {m.achternaam}</h4>
                        <StatusBadge status={m.status} config={memberStatusConfig} />
                      </div>
                      <p className="text-xs text-muted-foreground">{m.email}{m.telefoon && ` · ${m.telefoon}`}</p>
                      <p className="text-xs text-muted-foreground">{m.straat}, {m.postcode} {m.plaats}</p>
                      <div className="flex mt-2">
                        <button onClick={() => deleteMember(m.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* AANVRAGEN TAB */}
          <TabsContent value="aanvragen" className="space-y-4">
            <FilterBar
              search={requestSearch}
              onSearchChange={setRequestSearch}
              statusFilter={requestStatusFilter}
              onStatusFilterChange={setRequestStatusFilter}
              statuses={["all", "pending", "approved", "rejected"]}
              statusConfig={requestStatusConfig}
              counts={requestCounts}
            />
            {requestsLoading ? <LoadingSkeleton /> : filteredRequests.length === 0 ? <EmptyState /> : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                      {filteredRequests.map((r) => (
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
                            <StatusBadge status={r.status} config={requestStatusConfig} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1.5 justify-end">
                              {r.status === "pending" && (
                                <>
                                  <button onClick={() => updateRequestStatus(r.id, "approved")}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                    <Check size={12} /> Goedkeuren
                                  </button>
                                  <button onClick={() => updateRequestStatus(r.id, "rejected")}
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
                {/* Mobile */}
                <div className="md:hidden divide-y divide-border">
                  {filteredRequests.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{r.naam}</h4>
                          <p className="text-xs text-muted-foreground">{r.email}{r.telefoon && ` · ${r.telefoon}`}</p>
                        </div>
                        <StatusBadge status={r.status} config={requestStatusConfig} />
                      </div>
                      {r.opmerking && <p className="text-xs text-foreground mb-2">{r.opmerking}</p>}
                      <div className="flex gap-2 mt-2">
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => updateRequestStatus(r.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                              <Check size={12} /> Goedkeuren
                            </button>
                            <button onClick={() => updateRequestStatus(r.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive">
                              <X size={12} /> Afwijzen
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteRequest(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Shared sub-components

function FilterBar({ search, onSearchChange, statusFilter, onStatusFilterChange, statuses, statusConfig, counts }: {
  search: string; onSearchChange: (v: string) => void;
  statusFilter: string; onStatusFilterChange: (v: string) => void;
  statuses: string[]; statusConfig: Record<string, { label: string; bg: string }>;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Zoek op naam of e-mail..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm" />
      </div>
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {statuses.map((f) => (
          <button key={f} onClick={() => onStatusFilterChange(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {f === "all" ? "Alle" : statusConfig[f]?.label || f}
            <span className={`text-[10px] ${statusFilter === f ? "opacity-80" : ""}`}>({counts[f] ?? 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; bg: string }> }) {
  const c = config[status];
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${c?.bg || "bg-muted text-muted-foreground"}`}>
      {c?.label || status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Users size={32} className="mx-auto text-muted-foreground/30 mb-2" />
      <p className="text-muted-foreground">Geen resultaten gevonden</p>
    </div>
  );
}
