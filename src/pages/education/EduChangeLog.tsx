import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_name: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
};

const labels: Record<string, string> = {
  name: "Naam", class_name: "Klas", teacher_name: "Leraar", birth_date: "Geboortedatum",
  parent_phones: "Telefoonnummers ouders", status: "Status", betaald: "Betaling",
  betaald_op: "Betaald op", bedrag: "Bedrag", phone: "Telefoonnummer",
  voornamen: "Voornamen", achternaam: "Achternaam", ouder_naam: "Ouder",
  telefoon: "Telefoonnummer", email: "E-mail", schooljaar: "Schooljaar",
  geboortedatum: "Geboortedatum", betaalmethode: "Betaalmethode", betaal_notitie: "Betaalnotitie",
};
const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (Array.isArray(value)) return value.join(" / ") || "—";
  if (typeof value === "object") return "—";
  return String(value);
};

export default function EduChangeLog() {
  const { activeTenant } = useTenant();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!activeTenant) { setEntries([]); return; }
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("edu_change_log")
      .select("id, actor_id, entity_type, entity_name, action, changes, created_at")
      .eq("tenant_id", activeTenant.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (queryError) {
      setError("Het logboek kon niet worden geladen.");
      setEntries([]);
    } else {
      const rows = (data ?? []) as Entry[];
      setEntries(rows);
      const ids = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))];
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
        setNames(Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email])));
      }
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [activeTenant?.id]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="relative border-b border-border pb-5">
        <div className="w-full text-center">
          <h1 className="flex items-center justify-center gap-2 text-xl font-rabat font-bold text-foreground" dir="rtl"><History className="h-5 w-5 text-primary" />سجل النشاطات</h1>
          <p className="mt-1 text-sm text-muted-foreground">Wijzigingen aan leerlingen, leraren en aanmeldingen · {activeTenant?.name}</p>
        </div>
        <Button variant="outline" size="icon" className="absolute right-0 top-0" title="Vernieuwen" aria-label="Vernieuwen" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : loading ? <p className="text-sm text-muted-foreground">Laden…</p> : entries.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nog geen wijzigingen vastgelegd.</p> : (
        <div className="divide-y divide-border border-y border-border">
          {entries.map((entry) => {
            const action = entry.action === "insert" ? "Toegevoegd" : entry.action === "delete" ? "Verwijderd" : "Gewijzigd";
            const kind = entry.entity_type === "edu_directory_teachers" ? "Leraar" : entry.entity_type === "education_registrations" ? "Aanmelding" : "Leerling";
            const changes = entry.changes || {};
            const fields = entry.action === "update" ? Object.entries(changes) : [];
            const snapshot = entry.action === "insert" ? changes.nieuw : changes.oud;
            const summary = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot as Record<string, unknown> : {};
            return (
              <div key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[155px_1fr] sm:gap-5">
                <time className="text-xs text-muted-foreground" dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</time>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground"><span className="text-primary">{action}</span> · {kind} <bdi dir="auto" className="break-words">{entry.entity_name}</bdi></p>
                  <p className="text-xs text-muted-foreground">Door {entry.actor_id ? names[entry.actor_id] || "Onbekende beheerder" : "Systeem"}</p>
                  {fields.length > 0 && <div className="pt-1 text-xs text-muted-foreground">{fields.map(([key, change]) => {
                    const values = change as { oud?: unknown; nieuw?: unknown };
                    return <p key={key} className="break-words py-0.5"><span className="font-medium text-foreground">{labels[key] || key}:</span> <bdi dir="auto">{formatValue(values.oud)}</bdi> → <bdi dir="auto">{formatValue(values.nieuw)}</bdi></p>;
                  })}</div>}
                  {entry.action !== "update" && <p className="text-xs text-muted-foreground">{["class_name", "phone", "parent_phones"].filter((key) => key in summary).map((key) => `${labels[key]}: ${formatValue(summary[key])}`).join(" · ")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}