import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Check, X, Eye, Trash2, Clock, Mail, List, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TourRequest {
  id: string;
  naam: string;
  email: string;
  telefoon: string | null;
  datum: string | null;
  tijd: string | null;
  bericht: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In afwachting", variant: "secondary" },
  approved: { label: "Goedgekeurd", variant: "default" },
  rejected: { label: "Afgewezen", variant: "destructive" },
};

export default function RondleidingenPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TourRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"lijst" | "agenda">("lijst");

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from("tour_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[Rondleidingen] fetch error:", error);
      toast({ title: "Fout bij laden", description: error.message, variant: "destructive" });
    }
    if (data) setRows(data as TourRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    const onFocus = () => fetchRows();
    const interval = setInterval(fetchRows, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const fmtDate = (d: string | null) => (d ? format(new Date(d), "d MMM yyyy", { locale: nl }) : "—");

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const note = notes ?? (selected?.id === id ? adminNotes : "");
    const { error } = await supabase
      .from("tour_requests")
      .update({ status, admin_notes: note || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Fout", description: "Kon status niet bijwerken.", variant: "destructive" });
      return;
    }
    if (status === "approved") {
      const r = rows.find((x) => x.id === id);
      if (r?.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "tour_request_approved",
              data: {
                naam: r.naam,
                email: r.email,
                datum: r.datum ? format(new Date(r.datum), "d MMMM yyyy", { locale: nl }) : null,
                tijd: r.tijd,
                admin_notes: note || null,
              },
            },
          });
        } catch (e) {
          console.error("Goedkeuringsmail rondleiding mislukt", e);
        }
      }
    }
    toast({
      title: "Succes",
      description: `Rondleiding ${status === "approved" ? "goedgekeurd — bevestigingsmail verstuurd" : "afgewezen"}.`,
    });
    setSelected(null);
    setAdminNotes("");
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm("Weet u zeker dat u deze aanvraag wilt verwijderen?")) return;
    await supabase.from("tour_requests").delete().eq("id", id);
    toast({ title: "Verwijderd" });
    fetchRows();
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const agendaItems = rows
    .filter((r) => r.status === "approved" && r.datum)
    .sort((a, b) => (a.datum! + (a.tijd || "")).localeCompare(b.datum! + (b.tijd || "")));

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcoming = agendaItems.filter((r) => r.datum! >= todayStr);
  const past = agendaItems.filter((r) => r.datum! < todayStr).reverse();

  const downloadIcs = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const toStamp = (dateStr: string, timeStr: string | null, addHour = false) => {
      const [h, m] = (timeStr || "10:00").split(":").map(Number);
      const d = new Date(`${dateStr}T00:00:00`);
      d.setHours(h + (addHour ? 1 : 0), m || 0, 0, 0);
      return (
        d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
        pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z"
      );
    };
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Moskee Weert//Rondleidingen//NL",
      ...agendaItems.flatMap((r) => [
        "BEGIN:VEVENT",
        `UID:${r.id}@simweert.nl`,
        `DTSTART:${toStamp(r.datum!, r.tijd)}`,
        `DTEND:${toStamp(r.datum!, r.tijd, true)}`,
        `SUMMARY:Rondleiding ${r.naam}`,
        `DESCRIPTION:${(r.bericht || "").replace(/\n/g, " ")} (${r.email}${r.telefoon ? ", " + r.telefoon : ""})`,
        "LOCATION:Charitastraat 4, 6001 XT Weert",
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rondleidingen.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Rondleidingen</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Beheer aanvragen en geplande rondleidingen</p>
        </div>
        {view === "agenda" && agendaItems.length > 0 && (
          <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={downloadIcs}>
            <Download size={14} className="mr-1.5" /> Agenda
          </Button>
        )}
      </div>

      <div className="inline-flex rounded-full bg-gray-100 p-1">
        {([["lijst", "Aanvragen", List], ["agenda", "Agenda", CalendarDays]] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12px] font-medium transition-colors",
              view === k ? "bg-white text-amber-600 shadow-sm" : "text-gray-500"
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {view === "agenda" ? (
        <AgendaView upcoming={upcoming} past={past} onSelect={(r) => { setSelected(r); setAdminNotes(r.admin_notes || ""); }} />
      ) : (
      <>
      <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-4 sm:px-0 whitespace-nowrap pb-1">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 px-3.5 min-h-[36px] rounded-full text-[12px] font-medium transition-colors",
                filter === f ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f === "all" ? "Alle" : statusConfig[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center text-[13px]">Laden...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 opacity-50" size={36} />
          <p className="text-[13px]">Geen aanvragen gevonden.</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-[14px] text-foreground truncate">{r.naam}</span>
                  <Badge variant={statusConfig[r.status]?.variant || "outline"} className="shrink-0">
                    {statusConfig[r.status]?.label || r.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[12px] text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} className="shrink-0 text-amber-600" />
                    {fmtDate(r.datum)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="shrink-0 text-amber-600" />
                    {r.tijd || "—"}
                  </span>
                  <span className="flex items-center gap-1.5 col-span-2 truncate">
                    <Mail size={13} className="shrink-0 text-amber-600" />
                    {r.email}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 justify-end">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(r.id, "approved", "")} className="bg-green-600 hover:bg-green-700 h-11 min-w-[44px]">
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" className="h-11 min-w-[44px]" onClick={() => updateStatus(r.id, "rejected", "")}>
                        <X size={14} />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" className="h-11" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                    <Eye size={14} className="mr-1" /> Details
                  </Button>
                  <Button size="sm" variant="ghost" className="h-11 min-w-[44px] text-gray-500 hover:text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50">
                <tr>
                  {["Naam", "E-mail", "Datum", "Tijd", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.naam}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(r.datum)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.tijd || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[r.status]?.variant || "outline"}>
                        {statusConfig[r.status]?.label || r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(r.id, "approved", "")} className="bg-green-600 hover:bg-green-700 h-8 px-2">
                              <Check size={13} />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => updateStatus(r.id, "rejected", "")}>
                              <X size={13} />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                          <Eye size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-gray-500 hover:text-destructive" onClick={() => remove(r.id)}>
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

      </>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rondleiding aanvraag</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Naam" value={selected.naam} />
                <DetailRow label="E-mail" value={selected.email} />
                <DetailRow label="Telefoon" value={selected.telefoon || "—"} />
                <DetailRow label="Gewenste datum" value={fmtDate(selected.datum)} />
                <DetailRow label="Voorkeurstijd" value={selected.tijd || "—"} />
                <DetailRow label="Status" value={statusConfig[selected.status]?.label || selected.status} />
              </div>
              {selected.bericht && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Bericht aanvrager</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{selected.bericht}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Opmerking (komt in de bevestigingsmail)</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Bijv. definitieve tijd of instructies..." rows={2} />
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
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  );
}

function AgendaView({
  upcoming,
  past,
  onSelect,
}: {
  upcoming: TourRequest[];
  past: TourRequest[];
  onSelect: (r: TourRequest) => void;
}) {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarDays className="mx-auto mb-3 opacity-50" size={36} />
        <p className="text-[13px]">Nog geen goedgekeurde rondleidingen ingepland.</p>
      </div>
    );
  }

  const Group = ({ title, items, muted }: { title: string; items: TourRequest[]; muted?: boolean }) => {
    if (items.length === 0) return null;
    const byMonth = new Map<string, TourRequest[]>();
    items.forEach((r) => {
      const key = format(new Date(r.datum!), "MMMM yyyy", { locale: nl });
      byMonth.set(key, [...(byMonth.get(key) || []), r]);
    });
    return (
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        {[...byMonth.entries()].map(([month, list]) => (
          <div key={month} className="space-y-2">
            <p className="text-[12px] font-medium text-amber-700 capitalize">{month}</p>
            {list.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className={cn(
                  "w-full text-left flex items-center gap-3 bg-white border border-gray-100 rounded-xl shadow-sm p-3 hover:border-amber-300 transition-colors",
                  muted && "opacity-60"
                )}
              >
                <div className="shrink-0 w-12 text-center">
                  <p className="text-[18px] font-semibold leading-none text-foreground">
                    {format(new Date(r.datum!), "d")}
                  </p>
                  <p className="text-[10px] uppercase text-gray-500 mt-0.5">
                    {format(new Date(r.datum!), "EEE", { locale: nl })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-foreground truncate">{r.naam}</p>
                  <div className="flex items-center gap-3 text-[12px] text-gray-600 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-600" />
                      {r.tijd || "tijd n.t.b."}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <Mail size={12} className="text-amber-600" />
                      <span className="truncate">{r.email}</span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Group title="Komende rondleidingen" items={upcoming} />
      <Group title="Geweest" items={past} muted />
    </div>
  );
}
