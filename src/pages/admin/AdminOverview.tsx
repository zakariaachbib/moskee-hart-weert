import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Mail, Users, Heart, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Stats {
  activities: number;
  messages: number;
  members: number;
  pendingMembers: number;
  donations: number;
  totalDonations: number;
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ activities: 0, messages: 0, members: 0, pendingMembers: 0, donations: 0, totalDonations: 0 });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [activitiesRes, messagesRes, membersRes, donationsRes, recentMsgRes, recentReqRes] = await Promise.all([
          supabase.from("activities").select("id", { count: "exact", head: true }),
          supabase.from("contact_messages").select("id", { count: "exact", head: true }),
          supabase.from("membership_requests").select("id, status", { count: "exact" }),
          supabase.from("donations").select("bedrag"),
          supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(3),
          supabase.from("membership_requests").select("*").order("created_at", { ascending: false }).limit(3),
        ]);

        const pendingCount = membersRes.data?.filter((m) => m.status === "pending").length || 0;
        const totalDon = donationsRes.data?.reduce((sum, d) => sum + Number(d.bedrag), 0) || 0;

        setStats({
          activities: activitiesRes.count || 0,
          messages: messagesRes.count || 0,
          members: membersRes.count || 0,
          pendingMembers: pendingCount,
          donations: donationsRes.data?.length || 0,
          totalDonations: totalDon,
        });
        setRecentMessages(recentMsgRes.data || []);
        setRecentRequests(recentReqRes.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    { label: "Activiteiten", value: stats.activities, icon: Calendar, color: "bg-primary/10 text-primary", link: "/admin/activiteiten" },
    { label: "Berichten", value: stats.messages, icon: Mail, color: "bg-accent/10 text-accent", link: "/admin/berichten" },
    { label: "Lidmaatschap", value: stats.members, badge: stats.pendingMembers > 0 ? `${stats.pendingMembers} nieuw` : undefined, icon: Users, color: "bg-gold/10 text-gold-dark", link: "/admin/leden" },
    { label: "Donaties", value: `€${stats.totalDonations.toFixed(0)}`, sub: `${stats.donations} donaties`, icon: Heart, color: "bg-destructive/10 text-destructive", link: "/admin/donaties" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welkom terug. Hier is een overzicht van je moskee.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.link)}
              className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-foreground">{loading ? "—" : s.value}</span>
                {s.badge && (
                  <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full mb-1">{s.badge}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">Recente berichten</h3>
              <button onClick={() => navigate("/admin/berichten")} className="text-xs text-primary hover:underline font-medium">
                Alles bekijken →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen berichten</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-background border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">{m.naam}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium">{m.onderwerp}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.bericht}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Membership Requests */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-foreground">Recente aanvragen</h3>
              <button onClick={() => navigate("/admin/leden")} className="text-xs text-primary hover:underline font-medium">
                Alles bekijken →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen aanvragen</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-background border border-border/50 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-foreground">{r.naam}</span>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      r.status === "approved" ? "bg-green-100 text-green-700" :
                      r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {r.status === "pending" ? "Nieuw" : r.status === "approved" ? "Goedgekeurd" : "Afgewezen"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
