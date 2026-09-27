import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function WachtwoordInstellen() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => sub.subscription.unsubscribe();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Minimaal 8 tekens.");
    if (pw !== pw2) return toast.error("Wachtwoorden komen niet overeen.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Wachtwoord ingesteld.");
    navigate("/education/admin");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Wachtwoord instellen</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Link wordt gecontroleerd… Werkt het niet? De link is mogelijk verlopen — gebruik "Wachtwoord vergeten" op de loginpagina.
          </p>
        ) : (
          <>
            <Input type="password" placeholder="Nieuw wachtwoord" value={pw} onChange={(e) => setPw(e.target.value)} />
            <Input type="password" placeholder="Herhaal wachtwoord" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Opslaan…" : "Opslaan en inloggen"}
            </Button>
          </>
        )}
      </form>
    </main>
  );
}
