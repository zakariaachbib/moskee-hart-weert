import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Trash2, Shield, GraduationCap, BookOpen, Users,
  Eye, EyeOff, ChevronDown, X, Loader2
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  edu_role: string | null;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", icon: Shield, color: "text-red-400" },
  { value: "education_management", label: "Onderwijsmanagement", icon: Eye, color: "text-blue-400" },
  { value: "teacher", label: "Docent", icon: BookOpen, color: "text-emerald-400" },
  { value: "student", label: "Student", icon: GraduationCap, color: "text-amber-400" },
];

function getRoleBadge(role: string | null) {
  const r = ROLE_OPTIONS.find((o) => o.value === role);
  if (!r) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Geen rol</span>;
  const Icon = r.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted ${r.color}`}>
      <Icon size={12} /> {r.label}
    </span>
  );
}

export default function UserManagement() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        method: "GET",
      });
      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen? Dit kan niet ongedaan worden.`)) return;
    try {
      const res = await supabase.functions.invoke("manage-users", {
        method: "DELETE",
        body: { user_id: userId },
      });
      if (res.error) throw res.error;
      toast({ title: "Gebruiker verwijderd" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await supabase.functions.invoke("manage-users", {
        method: "PATCH",
        body: { user_id: userId, is_active: !currentActive },
      });
      if (res.error) throw res.error;
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await supabase.functions.invoke("manage-users", {
        method: "PATCH",
        body: { user_id: userId, role: newRole },
      });
      if (res.error) throw res.error;
      toast({ title: "Rol bijgewerkt" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Gebruikersbeheer</h2>
          <p className="text-muted-foreground text-sm mt-1">{users.length} gebruiker{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} /> Nieuwe gebruiker
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Naam</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{u.full_name || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.edu_role || ""}
                        onChange={(e) => e.target.value && handleRoleChange(u.id, e.target.value)}
                        className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Geen rol</option>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                          u.is_active
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {u.is_active ? "Actief" : "Inactief"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(u.id, u.full_name || u.email)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Nog geen gebruikers aangemaakt
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchUsers(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    role: "student",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        method: "POST",
        body: form,
      });
      if (res.error) throw res.error;
      if (res.data.error) throw new Error(res.data.error);
      toast({ title: "Gebruiker aangemaakt", description: `${form.full_name || form.email} is toegevoegd.` });
      onCreated();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading text-foreground">Nieuwe gebruiker</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Volledige naam</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground text-sm"
              placeholder="Naam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mailadres *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground text-sm"
              placeholder="email@voorbeeld.nl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Wachtwoord *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 pr-10 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground text-sm"
                placeholder="Min. 6 tekens"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Telefoonnummer</label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground text-sm"
              placeholder="Optioneel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Rol *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {submitting ? "Aanmaken..." : "Gebruiker aanmaken"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
