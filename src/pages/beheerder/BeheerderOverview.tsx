import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Mail, Users, Home, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BeheerderLayout from "@/components/beheerder/BeheerderLayout";

interface RecentRes {
  id: string;
  name: string;
  date: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  pending: "In afwachting",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
};

export default function BeheerderOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ reservations: 0, pendingReservations: 0, messages: 0, members: 0, pendingMembers: 0 });
  const [recent, setRecent] = useState<RecentRes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [resRes, msgRes, memRes, reqRes] = await Promise.all([
          supabase.from("facility_reservations").select("id, name, date, status").order("created_at", { ascending: false }),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }),
          supabase.from("members").select("id, status"),
          supabase.from("membership_requests").select("id, status"),
        ]);
        const all = resRes.data || [];
        setStats({
          reservations: all.length,
          pendingReservations: all.filter((r: any) => r.status === "pending").length,
          messages: msgRes.count || 0,
          members: memRes.data?.length || 0,
          pendingMembers:
            (memRes.data?.filter((m) => m.status === "pending").length || 0) +
            (reqRes.data?.filter((r) => r.status === "pending").length || 0),
        });
        setRecent(all.slice(0, 5) as RecentRes[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "Reserveringen", value: stats.reservations, badge: stats.pendingReservations, icon: Home, link: "/beheerder/reserveringen" },
    { label: "Berichten", value: stats.messages, badge: 0, icon: Mail, link: "/beheerder/berichten" },
    { label: "Lidmaatschap", value: stats.members, badge: stats.pendingMembers, icon: Users, link: "/beheerder/leden" },
  ];

  return (
    <BeheerderLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Beheer Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Overzicht van reserveringen, berichten en leden.</p>
        </div>

        {/* Stat cards: 1 col mobile, 3 col desktop, compact horizontal layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.link)}
              className="bg-card border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-4 flex items-center gap-3 text-left group min-h-[64px]"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <s.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-foreground leading-none">{loading ? "—" : s.value}</span>
                  {s.badge > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-600 text-white px-1.5 py-0.5 rounded-full">{s.badge}</span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{s.label}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground/50 group-hover:text-amber-600 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Recente activiteit</h2>
            <button onClick={() => navigate("/beheerder/reserveringen")} className="text-[12px] text-amber-600 hover:underline">Alles</button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">Nog geen reserveringen.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 min-h-[44px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {format(new Date(r.date), "d MMM yyyy", { locale: nl })}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[r.status] || "bg-gray-100 text-gray-700"}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </BeheerderLayout>
  );
}
