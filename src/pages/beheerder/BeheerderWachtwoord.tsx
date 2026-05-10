import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BeheerderWachtwoord() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Te kort", description: "Wachtwoord moet minimaal 8 tekens zijn.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Komt niet overeen", description: "De wachtwoorden zijn niet identiek.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setPassword("");
    setConfirm("");
    toast({ title: "Wachtwoord bijgewerkt", description: "Je nieuwe wachtwoord is opgeslagen." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Wachtwoord wijzigen</h1>
        <p className="text-muted-foreground mt-1">Stel hier een nieuw, persoonlijk wachtwoord in.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-6 max-w-md space-y-4 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nieuw wachtwoord</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
              placeholder="Min. 8 tekens"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Herhaal wachtwoord</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
              placeholder="Herhaal wachtwoord"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} /> {saving ? "Opslaan..." : "Wachtwoord opslaan"}
        </button>
      </motion.form>
    </div>
  );
}
