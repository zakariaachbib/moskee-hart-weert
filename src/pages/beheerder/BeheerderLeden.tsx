import { useEffect, useState } from "react";
import { Search, Check, X, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BeheerderLayout from "@/components/beheerder/BeheerderLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Member = Tables<"members">;
type MembershipRequest = Tables<"membership_requests">;

const memberStatusConfig: Record<string, { label: string; bg: string }> = {
  pending: { label: "In afwachting", bg: "bg-amber-100 text-amber-700" },
  active: { label: "Actief", bg: "bg-green-100 text-green-700" },
  cancelled: { label: "Geannuleerd", bg: "bg-gray-100 text-gray-600" },
  failed: { label: "Mislukt", bg: "bg-red-100 text-red-700" },
};

const requestStatusConfig: Record<string, { label: string; bg: string }> = {
  pending: { label: "In behandeling", bg: "bg-amber-100 text-amber-700" },
  approved: { label: "Goedgekeurd", bg: "bg-green-100 text-green-700" },
  rejected: { label: "Afgewezen", bg: "bg-red-100 text-red-700" },
};

function initials(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p) => p.trim()[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
}

export default function BeheerderLeden() {
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");

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

  const deleteMember = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit lid wilt verwijderen?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Lid verwijderd" });
    fetchMembers();
  };

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
    <BeheerderLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lidmaatschap</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {pendingTotal > 0 ? `${pendingTotal} item(s) wacht${pendingTotal === 1 ? "" : "en"} op behandeling` : "Alle aanvragen zijn behandeld"}
          </p>
        </div>

        <Tabs defaultValue="leden" className="space-y-4">
          <TabsList className="bg-transparent p-0 h-auto border-b border-gray-100 rounded-none w-full justify-start gap-4">
            <TabsTrigger
              value="leden"
              className="relative px-0 py-2.5 text-[13px] font-medium text-gray-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-amber-600 gap-2"
            >
              Leden
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{members.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="aanvragen"
              className="relative px-0 py-2.5 text-[13px] font-medium text-gray-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-amber-600 gap-2"
            >
              Aanvragen
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{requests.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* LEDEN */}
          <TabsContent value="leden" className="space-y-3">
            <FilterBar
              search={memberSearch}
              onSearchChange={setMemberSearch}
              statusFilter={memberStatusFilter}
              onStatusFilterChange={setMemberStatusFilter}
              statuses={["all", "pending", "active", "cancelled"]}
              statusConfig={memberStatusConfig}
              counts={memberCounts}
            />
            {membersLoading ? <LoadingSkeleton /> : filteredMembers.length === 0 ? <EmptyState /> : (
              <ul className="bg-card border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {filteredMembers.map((m) => (
                  <li key={m.id} className="relative p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-semibold">
                        {initials(m.voornaam, m.achternaam)}
                      </div>
                      <div className="flex-1 min-w-0 sm:flex sm:items-center sm:gap-4">
                        <div className="min-w-0 sm:flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium text-foreground truncate">{m.voornaam} {m.achternaam}</p>
                            <StatusBadge status={m.status} config={memberStatusConfig} />
                          </div>
                          <div className="mt-0.5 sm:flex sm:gap-3 text-[12px] text-muted-foreground">
                            <span className="truncate block sm:inline">{m.email}</span>
                            {m.telefoon && <span className="block sm:inline">{m.telefoon}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMember(m.id)}
                        className="shrink-0 w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* AANVRAGEN */}
          <TabsContent value="aanvragen" className="space-y-3">
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
              <ul className="bg-card border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {filteredRequests.map((r) => (
                  <li key={r.id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-semibold">
                        {initials(...r.naam.split(" "))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-foreground truncate">{r.naam}</p>
                          <StatusBadge status={r.status} config={requestStatusConfig} />
                        </div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">
                          <span className="truncate block sm:inline">{r.email}</span>
                          {r.telefoon && <span className="block sm:inline sm:ml-3">{r.telefoon}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRequest(r.id)}
                        className="shrink-0 w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 mt-3 pl-11">
                        <button onClick={() => updateRequestStatus(r.id, "approved")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 min-h-[36px] rounded-lg text-[12px] font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                          <Check size={12} /> Goedkeuren
                        </button>
                        <button onClick={() => updateRequestStatus(r.id, "rejected")} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 min-h-[36px] rounded-lg text-[12px] font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                          <X size={12} /> Afwijzen
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </BeheerderLayout>
  );
}

function FilterBar({ search, onSearchChange, statusFilter, onStatusFilterChange, statuses, statusConfig, counts }: {
  search: string; onSearchChange: (v: string) => void;
  statusFilter: string; onStatusFilterChange: (v: string) => void;
  statuses: string[]; statusConfig: Record<string, { label: string; bg: string }>;
  counts: Record<string, number>;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-2 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek op naam of e-mail..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 h-11 rounded-lg bg-white border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-foreground text-[13px] transition-shadow"
        />
      </div>
      <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 px-4 sm:px-0 whitespace-nowrap">
          {statuses.map((f) => {
            const active = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => onStatusFilterChange(f)}
                className={cn(
                  "shrink-0 px-3 min-h-[32px] rounded-full text-[12px] font-medium transition-colors flex items-center gap-1",
                  active ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f === "all" ? "Alle" : statusConfig[f]?.label || f}
                <span className="text-[10px] opacity-70">({counts[f] ?? 0})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; bg: string }> }) {
  const c = config[status];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${c?.bg || "bg-gray-100 text-gray-600"}`}>
      {c?.label || status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Users size={32} className="mx-auto text-muted-foreground/30 mb-2" />
      <p className="text-[13px] text-muted-foreground">Geen resultaten gevonden</p>
    </div>
  );
}
