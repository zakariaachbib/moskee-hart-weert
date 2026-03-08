import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload, Calendar } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminPreken() {
  const queryClient = useQueryClient();
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [omschrijving, setOmschrijving] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
            <Input id="bestand" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploaden..." : "Uploaden"}
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
                  onClick={() => deleteMutation.mutate({ id: sermon.id, bestandspad: sermon.bestandspad })}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
    </AdminLayout>
  );
}
