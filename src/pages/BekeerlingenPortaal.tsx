import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navigate as RouterNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import BekeerlingenPortal from "@/components/bekeerlingen/BekeerlingenPortal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function BekeerlingenPortaal() {
  const { user, isAdmin, loading } = useAuth();

  const { data: tenantId, isLoading } = useQuery({
    queryKey: ["convert-committee-tenant", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convert_committee_members" as any)
        .select("tenant_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as { tenant_id?: string } | null)?.tenant_id ?? null;
    },
  });

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <RouterNavigate to="/login" replace />;
  }

  if (!isAdmin && !tenantId) {
    return <RouterNavigate to="/" replace />;
  }

  return (
    <Layout>
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="font-heading text-2xl text-foreground">Bekeerlingen</h1>
            <p className="text-muted-foreground text-sm">Maak en beheer certificaten vanuit het kennismakingsformulier.</p>
          </div>
          {tenantId ? (
            <BekeerlingenPortal tenantId={tenantId} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Dit account is nog niet gekoppeld aan de bekeerlingencommissie.
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
