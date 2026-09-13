import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2, UserPlus, X } from "lucide-react";

const FUNCTIONS = [
  { key: "beheerder", label: "Beheerder" },
  { key: "penningmeester", label: "Penningmeester" },
  { key: "coordinator", label: "Coördinator" },
  { key: "woordvoerder", label: "Woordvoerder" },
];

type Member = {
  id: string;
  user_id: string;
  function_role: string;
  tenant_id: string;
  profile?: { full_name: string; email: string } | null;
};

export default function TenantTeamManagement() {
  const { isAdmin } = useAuth();
  const { tenants, activeTenant, refresh } = useTenant();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMember, setShowMember] = useState(false);
  const [showTenant, setShowTenant] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone_number: "", function_role: "penningmeester", edu_role: "education_management" });
  const [tenantForm, setTenantForm] = useState({ name: "", slug: "", city: "" });

  const loadMembers = async () => {
    if (!activeTenant) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("edu_tenant_members")
      .select("id, user_id, function_role, tenant_id")
      .eq("tenant_id", activeTenant.id);
    const list = (data as Member[]) ?? [];
    if (list.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", list.map((m) => m.user_id));
      list.forEach((m) => {
        const p = (profiles ?? []).find((x: any) => x.id === m.user_id);
        m.profile = p ? { full_name: p.full_name, email: p.email } : null;
      });
    }
    setMembers(list);
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, [activeTenant?.id]);

  const addMember = async () => {
    if (!activeTenant) return;
    if (!form.email || !form.password) {
      toast({ title: "E-mail en wachtwoord zijn verplicht", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-users", {
      method: "POST",
      body: {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone_number: form.phone_number,
        role: form.edu_role,
        tenant_id: activeTenant.id,
        function_role: form.function_role,
      },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Toevoegen mislukt", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Teamlid toegevoegd" });
    setShowMember(false);
    setForm({ email: "", password: "", full_name: "", phone_number: "", function_role: "penningmeester", edu_role: "education_management" });
    loadMembers();
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("edu_tenant_members").delete().eq("id", id);
    if (error) return toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  const changeFunction = async (id: string, function_role: string) => {
    const { error } = await supabase.from("edu_tenant_members").update({ function_role }).eq("id", id);
    if (error) return toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, function_role } : x)));
  };

  const addTenant = async () => {
    const slug = (tenantForm.slug || tenantForm.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!tenantForm.name || !slug) return toast({ title: "Naam is verplicht", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("edu_tenants").insert({ name: tenantForm.name, slug, city: tenantForm.city || null });
    setBusy(false);
    if (error) return toast({ title: "Aanmaken mislukt", description: error.message, variant: "destructive" });
    toast({ title: "Organisatie aangemaakt" });
    setShowTenant(false);
    setTenantForm({ name: "", slug: "", city: "" });
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Onderwijsteam</h1>
          <p className="text-xs text-muted-foreground">
            Beheer wie toegang heeft tot {activeTenant?.name ?? "deze organisatie"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowTenant(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
              <Building2 size={15} /> Nieuwe organisatie
            </button>
            <button onClick={() => setShowMember(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              <UserPlus size={15} /> Teamlid toevoegen
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Laden...</p>
        ) : members.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nog geen teamleden voor deze organisatie.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile?.full_name || "Onbekend"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.profile?.email}</p>
              </div>
              <select
                value={m.function_role}
                onChange={(e) => changeFunction(m.id, e.target.value)}
                disabled={!isAdmin}
                className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
              >
                {FUNCTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              {isAdmin && (
                <button onClick={() => removeMember(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Organisaties</p>
        <div className="flex flex-wrap gap-2">
          {tenants.map((t) => (
            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full border border-border">
              {t.name}{t.city ? ` · ${t.city}` : ""}
            </span>
          ))}
        </div>
      </div>

      {showMember && (
        <Modal title="Teamlid toevoegen" onClose={() => setShowMember(false)}>
          <div className="space-y-3">
            <Field label="Naam"><input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="E-mail"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Tijdelijk wachtwoord"><input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Telefoon"><input className={inputCls} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></Field>
            <Field label="Functie">
              <select className={inputCls} value={form.function_role} onChange={(e) => setForm({ ...form, function_role: e.target.value })}>
                {FUNCTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="Portaalrol">
              <select className={inputCls} value={form.edu_role} onChange={(e) => setForm({ ...form, edu_role: e.target.value })}>
                <option value="education_management">Onderwijs manager</option>
                <option value="teacher">Leraar</option>
                <option value="admin">Onderwijs admin</option>
              </select>
            </Field>
            <button onClick={addMember} disabled={busy} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {busy ? "Bezig..." : "Toevoegen"}
            </button>
          </div>
        </Modal>
      )}

      {showTenant && (
        <Modal title="Nieuwe organisatie" onClose={() => setShowTenant(false)}>
          <div className="space-y-3">
            <Field label="Naam"><input className={inputCls} value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} /></Field>
            <Field label="Plaats"><input className={inputCls} value={tenantForm.city} onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })} /></Field>
            <button onClick={addTenant} disabled={busy} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              <Plus size={14} className="inline mr-1" /> Aanmaken
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
