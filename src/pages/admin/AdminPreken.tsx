import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Trash2, Upload, Calendar, Pencil, X, Loader2, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Polyfill voor oudere browsers (o.a. iOS Safari < 17.4) — pdfjs v6 vereist dit
if (typeof (Promise as any).withResolvers !== "function") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

if (typeof ReadableStream !== "undefined" && !(ReadableStream.prototype as any)[Symbol.asyncIterator]) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ") + "\n";
  }

  return text;
}

export default function AdminPreken() {
  const queryClient = useQueryClient();
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [omschrijving, setOmschrijving] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [titleStep, setTitleStep] = useState<"pdf" | "ai" | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; titel: string; datum: string; omschrijving: string; bestandspad: string } | null>(null);
  const [editGenerating, setEditGenerating] = useState(false);
  const [editTitleError, setEditTitleError] = useState<string | null>(null);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ["admin-sermons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateTitle = async (pdfFile: File) => {
    setGeneratingTitle(true);
    setTitleError(null);

    try {
      setTitleStep("pdf");
      const text = await extractPdfText(pdfFile);
      if (text.trim().length < 20) {
        throw new Error("Er kon geen leesbare tekst uit de PDF worden gehaald. Vul de titel handmatig in.");
      }

      setTitleStep("ai");
      const { data, error } = await supabase.functions.invoke("generate-sermon-title", { body: { text } });
      if (error) throw new Error(error.message || "De titelservice reageerde niet.");
      if (data?.error) throw new Error(data.error);
      if (!data?.title) throw new Error("Er kwam geen titel terug.");

      setTitel(data.title);
      toast.success("Titel automatisch gegenereerd.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Onbekende fout bij het genereren van de titel.";
      setTitleError(message);
      toast.error("Titel genereren mislukt: " + message);
    } finally {
      setGeneratingTitle(false);
      setTitleStep(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setTitleError(null);
    if (selected) void generateTitle(selected);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !titel) {
      toast.error("Vul een titel in en selecteer een PDF-bestand.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("sermons")
        .upload(filePath, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("sermons").insert({
        titel,
        datum,
        omschrijving: omschrijving || null,
        bestandsnaam: file.name,
        bestandspad: filePath,
      });

      if (dbError) throw dbError;

      toast.success("Preek succesvol geüpload!");
      setTitel("");
      setDatum(new Date().toISOString().split("T")[0]);
      setOmschrijving("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-sermons"] });
    } catch (err: any) {
      toast.error("Fout bij uploaden: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (sermon: { id: string; bestandspad: string }) => {
      const { error: storageError } = await supabase.storage
        .from("sermons")
        .remove([sermon.bestandspad]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("sermons")
        .delete()
        .eq("id", sermon.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Preek verwijderd.");
      queryClient.invalidateQueries({ queryKey: ["admin-sermons"] });
    },
    onError: (err: any) => toast.error("Fout: " + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (s: { id: string; titel: string; datum: string; omschrijving: string }) => {
      const { error } = await supabase
        .from("sermons")
        .update({ titel: s.titel, datum: s.datum, omschrijving: s.omschrijving || null })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preek bijgewerkt.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-sermons"] });
    },
    onError: (err: any) => toast.error("Fout: " + err.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Preken beheren</h1>
          <p className="text-muted-foreground text-sm">Upload en beheer preekvertalingen (PDF).</p>
        </div>

        {/* Upload form */}
        <form onSubmit={handleUpload} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-lg text-foreground">Nieuwe preek uploaden</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input id="titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bijv. Vrijdagpreek over geduld" />
              {generatingTitle ? (
                <span className="flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {titleStep === "pdf" ? "PDF wordt gelezen..." : "Titel wordt gegenereerd..."}
                </span>
              ) : file && !titleError ? (
                <button type="button" onClick={() => void generateTitle(file)} className="flex items-center gap-1.5 text-xs text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Titel opnieuw genereren
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="datum">Datum *</Label>
              <Input id="datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="omschrijving">Omschrijving (optioneel)</Label>
            <Textarea id="omschrijving" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} placeholder="Korte beschrijving van de preek..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bestand">PDF-bestand *</Label>
            <Input id="bestand" type="file" accept=".pdf" onChange={handleFileChange} />
            {generatingTitle && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  {titleStep === "pdf" ? "PDF wordt gelezen..." : "Titel wordt automatisch gegenereerd..."}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full w-1/3 rounded-full bg-primary" animate={{ x: ["-110%", "340%"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} />
                </div>
              </div>
            )}
            {!generatingTitle && titleError && (
              <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3" role="alert">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Titel genereren mislukt</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{titleError}</p>
                  </div>
                </div>
                {file && (
                  <button type="button" onClick={() => void generateTitle(file)} className="flex items-center gap-1.5 text-xs text-destructive">
                    <RotateCcw className="h-3.5 w-3.5" /> Opnieuw proberen
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={uploading || generatingTitle}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {generatingTitle ? "Titel genereren..." : uploading ? "Uploaden..." : "Uploaden"}
          </button>
        </form>

        {/* List */}
        <div className="space-y-3">
          <h2 className="font-heading text-lg text-foreground">Geüploade preken</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : sermons && sermons.length > 0 ? (
            sermons.map((sermon) => (
              <div key={sermon.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{sermon.titel}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(sermon.datum), "d MMMM yyyy", { locale: nl })}
                    <span className="mx-1">·</span>
                    {sermon.bestandsnaam}
                  </p>
                </div>
                <button
                  onClick={() => setEditing({ id: sermon.id, titel: sermon.titel, datum: sermon.datum, omschrijving: sermon.omschrijving || "" })}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Wijzigen"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${sermon.titel}" verwijderen?`)) deleteMutation.mutate({ id: sermon.id, bestandspad: sermon.bestandspad });
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">Nog geen preken geüpload.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-foreground">Preek wijzigen</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editing.titel) return toast.error("Vul een titel in.");
                updateMutation.mutate(editing);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-titel">Titel *</Label>
                <Input id="edit-titel" value={editing.titel} onChange={(e) => setEditing({ ...editing, titel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-datum">Datum *</Label>
                <Input id="edit-datum" type="date" value={editing.datum} onChange={(e) => setEditing({ ...editing, datum: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-omschrijving">Omschrijving (optioneel)</Label>
                <Textarea id="edit-omschrijving" value={editing.omschrijving} onChange={(e) => setEditing({ ...editing, omschrijving: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm">
                  Annuleren
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                  {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
