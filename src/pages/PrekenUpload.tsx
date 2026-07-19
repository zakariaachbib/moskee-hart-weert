import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, LogIn, Eye, EyeOff, Upload, FileText, Trash2, Calendar, LogOut, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast as sonnerToast } from "sonner";

function LoginForm() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Inloggen mislukt", description: "Controleer uw e-mailadres en wachtwoord.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 border border-border shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="bg-gradient-gold w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="text-primary-foreground" size={28} />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Preken uploaden</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in om preken te beheren</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
                placeholder="uw@email.nl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <LogIn size={16} /> {submitting ? "Bezig..." : "Inloggen"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return sonnerToast.error("Wachtwoord moet minimaal 8 tekens zijn.");
    if (newPassword !== confirmPassword) return sonnerToast.error("Wachtwoorden komen niet overeen.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (error) return sonnerToast.error("Wijzigen mislukt: " + error.message);
    sonnerToast.success("Wachtwoord bijgewerkt.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 border border-border shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-lg text-foreground mb-4">Wachtwoord wijzigen</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nieuw wachtwoord</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label>Bevestig nieuw wachtwoord</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm">Annuleren</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {submitting ? "Bezig..." : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploaderPanel() {
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [omschrijving, setOmschrijving] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ["uploader-sermons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("*").order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !titel) return sonnerToast.error("Vul een titel in en selecteer een PDF-bestand.");
    setUploading(true);
    try {
      const filePath = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("sermons").upload(filePath, file, { contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("sermons").insert({
        titel, datum, omschrijving: omschrijving || null, bestandsnaam: file.name, bestandspad: filePath,
      });
      if (dbErr) throw dbErr;
      sonnerToast.success("Preek succesvol geüpload!");
      setTitel(""); setDatum(new Date().toISOString().split("T")[0]); setOmschrijving(""); setFile(null);
      (document.getElementById("bestand") as HTMLInputElement | null)?.value && ((document.getElementById("bestand") as HTMLInputElement).value = "");
      queryClient.invalidateQueries({ queryKey: ["uploader-sermons"] });
    } catch (err: any) {
      sonnerToast.error("Fout bij uploaden: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (s: { id: string; bestandspad: string }) => {
      const { error: sErr } = await supabase.storage.from("sermons").remove([s.bestandspad]);
      if (sErr) throw sErr;
      const { error: dErr } = await supabase.from("sermons").delete().eq("id", s.id);
      if (dErr) throw dErr;
    },
    onSuccess: () => {
      sonnerToast.success("Preek verwijderd.");
      queryClient.invalidateQueries({ queryKey: ["uploader-sermons"] });
    },
    onError: (err: any) => sonnerToast.error("Fout: " + err.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg sm:text-xl text-foreground">Preken portaal</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChangePwd(true)} className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted">
              <KeyRound className="w-3.5 h-3.5" /> Wachtwoord
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted">
              <LogOut className="w-3.5 h-3.5" /> Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <form onSubmit={handleUpload} className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
          <h2 className="font-heading text-lg text-foreground">Nieuwe preek uploaden</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input id="titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bijv. Vrijdagpreek over geduld" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="datum">Datum *</Label>
              <Input id="datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="omschrijving">Omschrijving (optioneel)</Label>
            <Textarea id="omschrijving" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bestand">PDF-bestand *</Label>
            <Input id="bestand" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {uploading ? "Uploaden..." : "Uploaden"}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-heading text-lg text-foreground">Geüploade preken</h2>
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : sermons && sermons.length > 0 ? (
            sermons.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{s.titel}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1 flex-wrap">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(s.datum), "d MMMM yyyy", { locale: nl })}
                    <span className="mx-1">·</span>
                    <span className="truncate">{s.bestandsnaam}</span>
                  </p>
                </div>
                <button onClick={() => {
                  if (confirm(`"${s.titel}" verwijderen?`)) deleteMutation.mutate({ id: s.id, bestandspad: s.bestandspad });
                }} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">Nog geen preken geüpload.</p>
          )}
        </div>
      </main>

      {showChangePwd && <ChangePasswordDialog onClose={() => setShowChangePwd(false)} />}
    </div>
  );
}

export default function PrekenUpload() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setAllowed(null); return; }
    (async () => {
      const [{ data: isUploader }, { data: isAdmin }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "preken_uploader" as any }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      setAllowed(!!isUploader || !!isAdmin);
    })();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!user) return <LoginForm />;
  if (allowed === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!allowed) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-lg max-w-md text-center">
          <h1 className="font-heading text-xl text-foreground mb-2">Geen toegang</h1>
          <p className="text-muted-foreground text-sm mb-4">Uw account heeft geen toegang tot het preken-portaal.</p>
          <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Uitloggen</button>
        </div>
      </section>
    );
  }
  return <UploaderPanel />;
}
