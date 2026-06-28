import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import BeheerderLayout from "@/components/beheerder/BeheerderLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, X, Eye, Trash2, Clock, Home, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  start_time: string;
  end_time: string;
  reservation_type: string;
  rooms: number;
  guest_count: number;
  activity_type: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In afwachting", variant: "secondary" },
  approved: { label: "Goedgekeurd", variant: "default" },
  rejected: { label: "Afgewezen", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  hall: "Zaal",
  kitchen: "Keuken",
  hall_and_kitchen: "Zaal + keuken",
};

const activityLabels: Record<string, string> = {
  feest: "Feest",
  familie: "Familie bijeenkomst",
  vergadering: "Vergadering",
  overig: "Overig",
};

export default function BeheerderReserveringen() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("facility_reservations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[BeheerderReserveringen] fetch error:", error);
      toast({ title: "Fout bij laden", description: error.message, variant: "destructive" });
    }
    if (data) setReservations(data as Reservation[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
    const onFocus = () => fetchReservations();
    const interval = setInterval(fetchReservations, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("facility_reservations")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Fout", description: "Kon status niet bijwerken.", variant: "destructive" });
    } else {
      toast({ title: "Succes", description: `Reservering ${status === "approved" ? "goedgekeurd" : "afgewezen"}.` });
      setSelected(null);
      setAdminNotes("");
      fetchReservations();
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("Weet u zeker dat u deze reservering wilt verwijderen?")) return;
    await supabase.from("facility_reservations").delete().eq("id", id);
    toast({ title: "Verwijderd" });
    fetchReservations();
  };

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <BeheerderLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reserveringen</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Beheer zaal- en keukenreserveringen</p>
        </div>

        {/* Filter pills */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 px-4 sm:px-0 whitespace-nowrap pb-1">
            {["all", "pending", "approved", "rejected"].map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "shrink-0 px-3.5 min-h-[36px] rounded-full text-[12px] font-medium transition-colors",
                    active
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {f === "all" ? "Alle" : statusConfig[f]?.label || f}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-8 text-center text-[13px]">Laden...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="mx-auto mb-3 opacity-50" size={36} />
            <p className="text-[13px]">Geen reserveringen gevonden.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-[14px] text-foreground truncate">{r.name}</span>
                    <Badge variant={statusConfig[r.status]?.variant || "outline"} className="shrink-0">
                      {statusConfig[r.status]?.label || r.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[12px] text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="shrink-0 text-amber-600" />
                      {format(new Date(r.date), "d MMM yyyy", { locale: nl })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="shrink-0 text-amber-600" />
                      {r.start_time?.substring(0, 5)} – {r.end_time?.substring(0, 5)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Home size={13} className="shrink-0 text-amber-600" />
                      {typeLabels[r.reservation_type] || r.reservation_type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="shrink-0 text-amber-600" />
                      {r.guest_count} pers.
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 justify-end">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(r.id, "approved")} className="bg-green-600 hover:bg-green-700 h-11 min-w-[44px]">
                          <Check size={14} />
                        </Button>
                        <Button size="sm" variant="destructive" className="h-11 min-w-[44px]" onClick={() => updateStatus(r.id, "rejected")}>
                          <X size={14} />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="h-11" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                      <Eye size={14} className="mr-1" /> Details
                    </Button>
                    <Button size="sm" variant="ghost" className="h-11 min-w-[44px] text-gray-500 hover:text-destructive" onClick={() => deleteReservation(r.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50">
                  <tr>
                    {["Naam", "Datum", "Tijd", "Ruimte", "Pers.", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600">{format(new Date(r.date), "d MMM yyyy", { locale: nl })}</td>
                      <td className="px-4 py-3 text-gray-600">{r.start_time?.substring(0, 5)} – {r.end_time?.substring(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-600">{typeLabels[r.reservation_type] || r.reservation_type}</td>
                      <td className="px-4 py-3 text-gray-600">{r.guest_count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[r.status]?.variant || "outline"}>
                          {statusConfig[r.status]?.label || r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateStatus(r.id, "approved")} className="bg-green-600 hover:bg-green-700 h-8 px-2">
                                <Check size={13} />
                              </Button>
                              <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => updateStatus(r.id, "rejected")}>
                                <X size={13} />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                            <Eye size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-gray-500 hover:text-destructive" onClick={() => deleteReservation(r.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reserveringsdetails</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Naam" value={selected.name} />
                <DetailRow label="Telefoon" value={selected.phone} />
                <DetailRow label="E-mail" value={selected.email} />
                <DetailRow label="Datum" value={format(new Date(selected.date), "d MMMM yyyy", { locale: nl })} />
                <DetailRow label="Tijd" value={`${selected.start_time?.substring(0, 5)} – ${selected.end_time?.substring(0, 5)}`} />
                <DetailRow label="Type" value={typeLabels[selected.reservation_type] || selected.reservation_type} />
                <DetailRow label="Zalen" value={String(selected.rooms)} />
                <DetailRow label="Personen" value={String(selected.guest_count)} />
                <DetailRow label="Activiteit" value={activityLabels[selected.activity_type] || selected.activity_type} />
                <DetailRow label="Status" value={statusConfig[selected.status]?.label || selected.status} />
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Opmerkingen aanvrager</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{selected.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Admin notities</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Interne notities..." rows={2} />
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(selected.id, "approved")}>
                    <Check size={14} className="mr-1" /> Goedkeuren
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateStatus(selected.id, "rejected")}>
                    <X size={14} className="mr-1" /> Afwijzen
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BeheerderLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
