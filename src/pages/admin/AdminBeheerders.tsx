import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface BeheerderRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
}

export default function AdminBeheerders() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BeheerderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ naam: "", email: "" });

  const fetchBeheerders = async () => {
    setLoading(true);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "beheerder" as any);

    const ids = (roleRows || []).map((r: any) => r.user_id);
    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .in("id", ids);

    setRows(
      (profiles || []).map((p: any) => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        created_at: p.created_at,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchBeheerders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-beheerder", {
        body: { email: form.email.trim(), naam: form.naam.trim() || null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: "Beheerder aangemaakt",
        description: `${form.email} heeft een uitnodigingsmail ontvangen met een tijdelijk wachtwoord.`,
      });
      setOpen(false);
      setForm({ naam: "", email: "" });
      fetchBeheerders();
    } catch (err: any) {
      toast({
        title: "Aanmaken mislukt",
        description: err?.message || "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (userId: string, email: string | null) => {
    if (!confirm(`Beheerderrol intrekken voor ${email || "deze gebruiker"}?\n\nHet account blijft bestaan maar verliest toegang tot het beheerpaneel.`)) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "beheerder" as any);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Beheerderrol ingetrokken" });
    fetchBeheerders();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Beheerders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Beperkte beheerders kunnen alleen reserveringen, berichten en lidmaatschappen beheren.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1.5 shrink-0">
            <Plus size={16} /> Beheerder toevoegen
          </Button>
        </div>

        {loading ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Loader2 className="mx-auto animate-spin text-muted-foreground" size={28} />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <ShieldCheck className="mx-auto text-muted-foreground/40 mb-3" size={36} />
            <p className="text-muted-foreground">Nog geen beheerders aangemaakt.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naam</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aangemaakt</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">{r.full_name || "—"}</td>
                    <td className="px-5 py-4 text-foreground">{r.email}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(r.user_id, r.email)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Beheerderrol intrekken"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe beheerder aanmaken</DialogTitle>
            <DialogDescription>
              De beheerder ontvangt automatisch een e-mail met een tijdelijk wachtwoord en kan direct inloggen op <strong>/login</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Naam (optioneel)</label>
              <input
                type="text"
                value={form.naam}
                onChange={(e) => setForm({ ...form, naam: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                placeholder="Volledige naam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">E-mailadres</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                  placeholder="naam@voorbeeld.nl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Aanmaken & uitnodigen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
