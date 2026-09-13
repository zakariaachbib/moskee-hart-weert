import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  is_active: boolean;
};

type TenantContextType = {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  setActiveTenantId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);
const STORAGE_KEY = "edu_active_tenant";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("edu_tenants")
      .select("id, name, slug, city, is_active")
      .order("name");
    const list = (data as Tenant[]) ?? [];
    setTenants(list);
    setActiveId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0]?.id ?? null));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setActiveTenantId = (id: string) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeTenant = tenants.find((t) => t.id === activeId) ?? null;

  return (
    <TenantContext.Provider value={{ tenants, activeTenant, setActiveTenantId, loading, refresh }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
