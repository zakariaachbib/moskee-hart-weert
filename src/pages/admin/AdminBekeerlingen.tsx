import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import BekeerlingenPortal from "@/components/bekeerlingen/BekeerlingenPortal";
import { supabase } from "@/integrations/supabase/client";

export default function AdminBekeerlingen() {
  const { data: tenantId, isLoading } = useQuery({
    queryKey: ["convert-committee-admin-tenant"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const { data, error } = await supabase
        .from("convert_committee_members" as any)
        .select("tenant_id")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as { tenant_id?: string } | null)?.tenant_id ?? null;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Bekeerlingen</h1>
          <p className="text-muted-foreground text-sm">Maak en beheer certificaten vanuit het kennismakingsformulier.</p>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : tenantId ? (
          <BekeerlingenPortal tenantId={tenantId} />
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Dit account is nog niet gekoppeld aan de bekeerlingencommissie.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}