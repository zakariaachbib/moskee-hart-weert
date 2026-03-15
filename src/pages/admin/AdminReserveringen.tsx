import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, X, Eye, Trash2, Clock } from "lucide-react";
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

export default function AdminReserveringen() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchReservations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("facility_reservations")
      .select("*")
      .order("date", { ascending: true });
    if (data) setReservations(data as Reservation[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reserveringen</h1>
            <p className="text-muted-foreground text-sm">Beheer zaal- en keukenreserveringen</p>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Alle" : statusConfig[f]?.label || f}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-8 text-center">Laden...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="mx-auto mb-3 opacity-50" size={40} />
            <p>Geen reserveringen gevonden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <Badge variant={statusConfig[r.status]?.variant || "outline"}>
                      {statusConfig[r.status]?.label || r.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(r.date), "d MMM yyyy", { locale: nl })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {r.start_time?.substring(0, 5)} – {r.end_time?.substring(0, 5)}
                    </span>
                    <span>{typeLabels[r.reservation_type] || r.reservation_type}</span>
                    <span>{r.guest_count} personen</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                    <Eye size={14} className="mr-1" /> Details
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => updateStatus(r.id, "approved")} className="bg-green-600 hover:bg-green-700">
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")}>
                        <X size={14} />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteReservation(r.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
    </AdminLayout>
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
