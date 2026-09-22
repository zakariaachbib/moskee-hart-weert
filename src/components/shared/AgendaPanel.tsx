import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, Mail, Phone, Users, Home, MapPin, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type AgendaItem = {
  id: string;
  kind: "rondleiding" | "reservering";
  titel: string;
  datum: string;
  tijd: string | null;
  email: string | null;
  telefoon: string | null;
  details: string | null;
  personen: number | null;
};

const kindConfig = {
  rondleiding: { label: "Rondleiding", icon: MapPin, chip: "bg-emerald-100 text-emerald-700" },
  reservering: { label: "Reservering", icon: Home, chip: "bg-amber-100 text-amber-700" },
} as const;

export default function AgendaPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "rondleiding" | "reservering">("all");

  const fetchAll = async () => {
    const [tours, res] = await Promise.all([
      supabase.from("tour_requests").select("*").in("status", ["approved", "goedgekeurd"]),
      supabase.from("facility_reservations").select("*").in("status", ["approved", "goedgekeurd"]),
    ]);

    if (tours.error || res.error) {
      toast({
        title: "Fout bij laden",
        description: (tours.error || res.error)?.message,
        variant: "destructive",
      });
    }

    const list: AgendaItem[] = [
      ...((tours.data || []) as any[])
        .filter((r) => r.datum)
        .map((r) => ({
          id: r.id,
          kind: "rondleiding" as const,
          titel: r.naam,
          datum: r.datum as string,
          tijd: r.tijd ?? null,
          email: r.email ?? null,
          telefoon: r.telefoon ?? null,
          details: r.bericht ?? null,
          personen: null,
        })),
      ...((res.data || []) as any[])
        .filter((r) => r.date)
        .map((r) => ({
          id: r.id,
          kind: "reservering" as const,
          titel: r.name,
          datum: r.date as string,
          tijd: r.start_time ? `${String(r.start_time).slice(0, 5)} – ${String(r.end_time).slice(0, 5)}` : null,
          email: r.email ?? null,
          telefoon: r.phone ?? null,
          details: [r.reservation_type === "zaal_keuken" ? "Zaal + keuken" : "Zaal", r.activity_type]
            .filter(Boolean)
            .join(" · "),
          personen: r.guest_count ?? null,
        })),
    ].sort((a, b) => (a.datum + (a.tijd || "")).localeCompare(b.datum + (b.tijd || "")));

    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const onFocus = () => fetchAll();
    const interval = setInterval(fetchAll, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = visible.filter((i) => i.datum >= today);
  const past = visible.filter((i) => i.datum < today).reverse();

  const downloadIcs = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = (dateStr: string, timeStr: string | null, addHour = false) => {
      const [h, m] = (timeStr || "10:00").slice(0, 5).split(":").map(Number);
      const d = new Date(`${dateStr}T00:00:00`);
      d.setHours((h || 10) + (addHour ? 1 : 0), m || 0, 0, 0);
      return (
        d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
        pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z"
      );
    };
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Moskee Weert//Agenda//NL",
      ...visible.flatMap((i) => [
        "BEGIN:VEVENT",
        `UID:${i.kind}-${i.id}@simweert.nl`,
        `DTSTART:${stamp(i.datum, i.tijd)}`,
        `DTEND:${stamp(i.datum, i.tijd, true)}`,
        `SUMMARY:${kindConfig[i.kind].label}: ${i.titel}`,
        `DESCRIPTION:${[i.details, i.email, i.telefoon].filter(Boolean).join(" · ").replace(/\n/g, " ")}`,
        "LOCATION:Charitastraat 4, 6001 XT Weert",
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "moskee-agenda.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const Group = ({ title, list, muted }: { title: string; list: AgendaItem[]; muted?: boolean }) => {
    if (list.length === 0) return null;
    const byMonth = new Map<string, AgendaItem[]>();
    list.forEach((i) => {
      const key = format(new Date(i.datum), "MMMM yyyy", { locale: nl });
      byMonth.set(key, [...(byMonth.get(key) || []), i]);
    });
    return (
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        {[...byMonth.entries()].map(([month, group]) => (
          <div key={month} className="space-y-2">
            <p className="text-[12px] font-medium text-amber-700 capitalize">{month}</p>
            {group.map((i) => {
              const Icon = kindConfig[i.kind].icon;
              return (
                <div
                  key={i.kind + i.id}
                  className={cn(
                    "flex items-start gap-3 bg-white border border-gray-100 rounded-xl shadow-sm p-3",
                    muted && "opacity-60"
                  )}
                >
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-[18px] font-semibold leading-none text-foreground">
                      {format(new Date(i.datum), "d")}
                    </p>
                    <p className="text-[10px] uppercase text-gray-500 mt-0.5">
                      {format(new Date(i.datum), "EEE", { locale: nl })}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-medium text-foreground truncate">{i.titel}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          kindConfig[i.kind].chip
                        )}
                      >
                        <Icon size={10} /> {kindConfig[i.kind].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-gray-600 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-amber-600" />
                        {i.tijd || "tijd n.t.b."}
                      </span>
                      {i.personen != null && (
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-amber-600" />
                          {i.personen} pers.
                        </span>
                      )}
                      {i.email && (
                        <a href={`mailto:${i.email}`} className="flex items-center gap-1 truncate hover:text-amber-700">
                          <Mail size={12} className="text-amber-600" />
                          <span className="truncate">{i.email}</span>
                        </a>
                      )}
                      {i.telefoon && (
                        <a href={`tel:${i.telefoon}`} className="flex items-center gap-1 hover:text-amber-700">
                          <Phone size={12} className="text-amber-600" />
                          {i.telefoon}
                        </a>
                      )}
                    </div>
                    {i.details && <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{i.details}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Goedgekeurde rondleidingen en reserveringen op datum
          </p>
        </div>
        {visible.length > 0 && (
          <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={downloadIcs}>
            <Download size={14} className="mr-1.5" /> Exporteer
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "rondleiding", "reservering"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 min-h-[36px] rounded-full text-[12px] font-medium transition-colors",
              filter === f ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all" ? "Alles" : f === "rondleiding" ? "Rondleidingen" : "Reserveringen"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[13px] text-muted-foreground">Laden…</p>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 opacity-50" size={36} />
          <p className="text-[13px]">Nog niets ingepland.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Group title="Komend" list={upcoming} />
          <Group title="Geweest" list={past} muted />
        </div>
      )}
    </div>
  );
}
