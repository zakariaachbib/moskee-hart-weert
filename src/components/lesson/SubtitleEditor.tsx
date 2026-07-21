import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface Cue { start: number; end: number; text: string }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vttPath: string;
  onSaved?: () => void;
}

function parseTime(t: string): number {
  const parts = t.trim().split(":");
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) { h = +parts[0]; m = +parts[1]; s = parseFloat(parts[2].replace(",", ".")); }
  else if (parts.length === 2) { m = +parts[0]; s = parseFloat(parts[1].replace(",", ".")); }
  return h * 3600 + m * 60 + s;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec - h * 3600 - m * 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timingIdx = lines.findIndex((l) => l.includes("-->"));
    if (timingIdx === -1) continue;
    const [a, b] = lines[timingIdx].split("-->").map((s) => s.trim().split(" ")[0]);
    const textLines = lines.slice(timingIdx + 1).join("\n");
    if (!a || !b) continue;
    cues.push({ start: parseTime(a), end: parseTime(b), text: textLines });
  }
  return cues.sort((x, y) => x.start - y.start);
}

function serializeVTT(cues: Cue[]): string {
  const out = ["WEBVTT", ""];
  cues.forEach((c, i) => {
    out.push(String(i + 1));
    out.push(`${formatTime(c.start)} --> ${formatTime(c.end)}`);
    out.push(c.text);
    out.push("");
  });
  return out.join("\n");
}

export default function SubtitleEditor({ open, onOpenChange, vttPath, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);

  useEffect(() => {
    if (!open || !vttPath) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage.from("lesson-videos").createSignedUrl(vttPath, 600);
        if (error) throw error;
        const res = await fetch(data.signedUrl);
        const text = await res.text();
        if (!cancelled) setCues(parseVTT(text));
      } catch (e: any) {
        toast({ title: "Kon ondertitels niet laden", description: e.message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, vttPath]);

  function updateCue(i: number, patch: Partial<Cue>) {
    setCues((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeCue(i: number) {
    setCues((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addCue(i: number) {
    setCues((prev) => {
      const prevCue = prev[i];
      const nextCue = prev[i + 1];
      const start = prevCue ? prevCue.end : 0;
      const end = nextCue ? Math.min(nextCue.start, start + 3) : start + 3;
      const newCue: Cue = { start, end, text: "" };
      return [...prev.slice(0, i + 1), newCue, ...prev.slice(i + 1)];
    });
  }

  async function save() {
    setSaving(true);
    try {
      const sorted = [...cues].sort((a, b) => a.start - b.start);
      const vtt = serializeVTT(sorted);
      const blob = new Blob([vtt], { type: "text/vtt" });
      const { error } = await supabase.storage.from("lesson-videos").upload(vttPath, blob, {
        contentType: "text/vtt",
        upsert: true,
      });
      if (error) throw error;
      toast({ title: "Ondertitels opgeslagen", description: `${sorted.length} regels gepubliceerd` });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Opslaan mislukt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ondertitels bewerken</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={16} /> Laden…
            </div>
          ) : cues.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Geen ondertitels gevonden. Voeg een regel toe.
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => addCue(-1)}>
                  <Plus size={14} className="mr-1" /> Regel toevoegen
                </Button>
              </div>
            </div>
          ) : (
            cues.map((c, i) => (
              <div key={i} className="rounded border p-2 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-8">#{i + 1}</span>
                  <Input
                    className="h-7 text-xs font-mono"
                    value={formatTime(c.start)}
                    onChange={(e) => updateCue(i, { start: parseTime(e.target.value) })}
                  />
                  <span>→</span>
                  <Input
                    className="h-7 text-xs font-mono"
                    value={formatTime(c.end)}
                    onChange={(e) => updateCue(i, { end: parseTime(e.target.value) })}
                  />
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => addCue(i)} title="Regel hieronder toevoegen">
                    <Plus size={14} />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeCue(i)} title="Verwijderen">
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={c.text}
                  onChange={(e) => updateCue(i, { text: e.target.value })}
                  className="text-sm"
                />
              </div>
            ))
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuleren</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
            Publiceren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
