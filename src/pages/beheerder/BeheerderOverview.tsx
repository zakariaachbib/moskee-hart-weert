import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Users, Home, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BeheerderLayout from "@/components/beheerder/BeheerderLayout";

export default function BeheerderOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ reservations: 0, pendingReservations: 0, messages: 0, members: 0, pendingMembers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [resRes, msgRes, memRes, reqRes] = await Promise.all([
          supabase.from("facility_reservations").select("id, status"),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }),
          supabase.from("members").select("id, status"),
          supabase.from("membership_requests").select("id, status"),
        ]);
        setStats({
          reservations: resRes.data?.length || 0,
          pendingReservations: resRes.data?.filter((r) => r.status === "pending").length || 0,
          messages: msgRes.count || 0,
          members: memRes.data?.length || 0,
          pendingMembers:
            (memRes.data?.filter((m) => m.status === "pending").length || 0) +
            (reqRes.data?.filter((r) => r.status === "pending").length || 0),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "Reserveringen", value: stats.reservations, badge: stats.pendingReservations > 0 ? `${stats.pendingReservations} nieuw` : undefined, icon: Home, color: "bg-primary/10 text-primary", link: "/beheerder/reserveringen" },
    { label: "Berichten", value: stats.messages, icon: Mail, color: "bg-accent/10 text-accent", link: "/beheerder/berichten" },
    { label: "Lidmaatschap", value: stats.members, badge: stats.pendingMembers > 0 ? `${stats.pendingMembers} nieuw` : undefined, icon: Users, color: "bg-gold/10 text-gold-dark", link: "/beheerder/leden" },
  ];

  return (
    <BeheerderLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Beheer dashboard</h1>
          <p className="text-muted-foreground mt-1">Welkom. Beheer hier reserveringen, berichten en lidmaatschap.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.link)}
              className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={20} /></div>
                <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-foreground">{loading ? "—" : s.value}</span>
                {s.badge && (
                  <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full mb-1">{s.badge}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>
      </div>
    </BeheerderLayout>
  );
}
