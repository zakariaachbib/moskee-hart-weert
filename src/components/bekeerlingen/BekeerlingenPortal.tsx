import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Eye, FileText, Loader2, Save, Search, Trash2, Upload, Award } from "lucide-react";
import certUrl from "@/assets/certificaat-bekering.jpg";

type Fields = {
  voornaam: string; achternaam: string; volledige_naam: string; geboortedatum: string;
  geboorteplaats: string; geboorteplaats_ar: string; nationaliteit: string; nationaliteit_ar: string;
  adres: string; adres_ar: string; geboortedatum_ar?: string; email: string; telefoon: string;
};
const EMPTY: Fields = { voornaam: "", achternaam: "", volledige_naam: "", geboortedatum: "", geboorteplaats: "", geboorteplaats_ar: "", nationaliteit: "", nationaliteit_ar: "", adres: "", adres_ar: "", email: "", telefoon: "" };

const PT_W = 595.5;
const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
export function toHijri(d: string): string {
  const m = d.trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/) || null;
  const iso = d.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = m ? new Date(+m[3], +m[2] - 1, +m[1], 12) : iso ? new Date(+iso[1], +iso[2] - 1, +iso[3], 12) : null;
  if (!date || isNaN(+date)) return "";
  try { return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" }).format(date).replace(/\s*هـ\s*$/, "").trim(); } catch { return ""; }
}
const hasArabic = (t: string) => /[\u0600-\u06FF]/.test(t);

const readDataUrl = (f: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });

async function imageToJpeg(file: File): Promise<string> {
  const img = await loadImage(URL.createObjectURL(file));
  const k = Math.min(1, 2000 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

async function renderCertificate(f: Fields): Promise<HTMLCanvasElement> {
  await Promise.all([document.fonts.load("120px 'Great Vibes'"), document.fonts.load("40px 'Times New Roman'")]).catch(() => {});
  const bg = await loadImage(certUrl);
  const W = bg.naturalWidth, H = bg.naturalHeight, s = W / PT_W;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = "#111111"; ctx.textBaseline = "alphabetic";
  const fit = (text: string, font: (px: number) => string, size: number, maxW: number) => {
    let px = size * s; ctx.font = font(px);
    while (ctx.measureText(text).width > maxW * s && px > 6 * s) { px -= s; ctx.font = font(px); }
  };
  // Name
  const name = f.volledige_naam.trim();
  if (name) {
    fit(name, (px) => `${px}px 'Great Vibes', cursive`, 64, 470);
    ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillText(name, W / 2, 377 * s);
  }
  const rows: [string, string, number][] = [
    [f.geboortedatum, f.geboortedatum_ar ?? toHijri(f.geboortedatum), 558],
    [f.geboorteplaats, f.geboorteplaats_ar, 574.5],
    [f.nationaliteit, f.nationaliteit_ar, 591],
    [f.adres, f.adres_ar, 607.5],
  ];
  rows.forEach(([nl, ar, y], i) => {
    const serif = (px: number) => `${px}px 'Times New Roman', Times, serif`;
    if (nl) { fit(nl, serif, 12, 215); ctx.textAlign = "left"; ctx.direction = "ltr"; ctx.fillText(nl, 150 * s, y * s); }
    if (ar) {
      const right = i === 3 ? 497 : 452;
      fit(ar, serif, 12, i === 3 ? 135 : 95);
      ctx.direction = hasArabic(ar) ? "rtl" : "ltr"; ctx.textAlign = "right";
      ctx.fillText(ar, right * s, y * s);
    }
  });
  return c;
}

async function certificatePdf(f: Fields): Promise<Blob> {
  const c = await renderCertificate(f);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
  return pdf.output("blob");
}

const fileSafe = (s: string) => (s || "certificaat").replace(/[^\w-]+/g, "_").slice(0, 60);

export default function BekeerlingenPortal({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [readError, setReadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "preview" | "save" | "download">(null);
  const [search, setSearch] = useState("");
  const [archivePreview, setArchivePreview] = useState<{ id: string; url: string } | null>(null);
  const [archivePreviewBusy, setArchivePreviewBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!reading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [reading]);

  const { data: archive = [], isLoading } = useQuery({
    queryKey: ["convert-certificates", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("convert_certificates" as any).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const set = (k: keyof Fields, v: string) => { setFields((p) => ({ ...p, [k]: v, ...(k === "geboortedatum" ? { geboortedatum_ar: toHijri(v) } : {}) })); setPreview(null); };

  const readForm = async (file: File) => {
    setFormFile(file); setReadError(null); setPreview(null); setReading(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const dataUrl = isPdf ? (await readDataUrl(file)).replace(/^data:[^;]*;/, "data:application/pdf;") : await imageToJpeg(file);
      const { data, error } = await supabase.functions.invoke("extract-intake-form", { body: { file: dataUrl, filename: file.name } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setFields({ ...EMPTY, ...data, geboortedatum_ar: toHijri(data.geboortedatum || ""), adres_ar: data.adres || data.adres_ar || "" });
      toast.success("Formulier uitgelezen — controleer de gegevens.");
    } catch (e: any) {
      setReadError(e.message || "Uitlezen mislukt");
    } finally { setReading(false); }
  };

  const doPreview = async () => {
    setBusy("preview");
    try { setPreview((await renderCertificate(fields)).toDataURL("image/jpeg", 0.7)); } finally { setBusy(null); }
  };

  const doDownload = async (f: Fields = fields) => {
    setBusy("download");
    try {
      const blob = await certificatePdf(f);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Certificaat_${fileSafe(f.volledige_naam)}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } finally { setBusy(null); }
  };

  const doSave = async () => {
    if (!fields.volledige_naam.trim()) return toast.error("Vul de naam in.");
    setBusy("save");
    try {
      const stamp = Date.now(), base = fileSafe(fields.volledige_naam);
      const certPath = `${tenantId}/${stamp}-certificaat-${base}.pdf`;
      const { error: e1 } = await supabase.storage.from("convert-certificates").upload(certPath, await certificatePdf(fields), { contentType: "application/pdf" });
      if (e1) throw e1;
      let formPath: string | null = null;
      if (formFile) {
        const ext = formFile.name.split(".").pop()?.toLowerCase() || "pdf";
        formPath = `${tenantId}/${stamp}-formulier-${base}.${ext}`;
        const { error: e2 } = await supabase.storage.from("convert-certificates").upload(formPath, formFile, { contentType: formFile.type || undefined });
        if (e2) throw e2;
      }
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("convert_certificates" as any).insert({ ...(({ geboortedatum_ar, ...r }) => r)(fields), tenant_id: tenantId, certificate_path: certPath, form_path: formPath, created_by: u.user?.id });
      if (error) throw error;
      toast.success("Certificaat opgeslagen in het archief.");
      setFields(EMPTY); setFormFile(null); setPreview(null);
      qc.invalidateQueries({ queryKey: ["convert-certificates", tenantId] });
    } catch (e: any) {
      toast.error("Opslaan mislukt: " + e.message);
    } finally { setBusy(null); }
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("convert-certificates").createSignedUrl(path, 3600);
    if (error || !data) return toast.error("Openen mislukt");
    window.open(data.signedUrl, "_blank");
  };

  const toggleArchivePreview = async (row: any) => {
    if (archivePreview?.id === row.id) return setArchivePreview(null);
    setArchivePreviewBusy(row.id);
    try {
      const c = await renderCertificate({ ...EMPTY, ...row });
      setArchivePreview({ id: row.id, url: c.toDataURL("image/jpeg", 0.7) });
    } catch {
      toast.error("Voorbeeld maken mislukt");
    } finally { setArchivePreviewBusy(null); }
  };

  const remove = async (row: any) => {
    if (!confirm(`Certificaat van ${row.volledige_naam} verwijderen?`)) return;
    const paths = [row.certificate_path, row.form_path].filter(Boolean);
    if (paths.length) await supabase.storage.from("convert-certificates").remove(paths);
    const { error } = await supabase.from("convert_certificates" as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["convert-certificates", tenantId] });
  };

  const field = (k: keyof Fields, label: string, ar = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={`bk-${k}`} className={ar ? "font-rabat" : ""}>{label}</Label>
      <Input id={`bk-${k}`} value={fields[k] ?? ""} onChange={(e) => set(k, e.target.value)} dir={ar ? "rtl" : "ltr"} />
    </div>
  );

  const btn = "flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50";
  const filtered = archive.filter((r) => !search.trim() || `${r.volledige_naam} ${r.geboortedatum} ${r.adres}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Template */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h2 className="font-heading text-lg text-foreground">Template kennismakingsformulier</h2>
            <p className="text-sm text-muted-foreground">Leeg formulier om te printen of door te sturen naar de bekeerling.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/templates/kennismakingsformulier.pdf" download="Kennismakingsformulier.pdf" className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
            <Download className="w-4 h-4" /> PDF
          </a>
          <a href="/templates/kennismakingsformulier.docx" download="Kennismakingsformulier.docx" className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10">
            <Download className="w-4 h-4" /> Word
          </a>
        </div>
      </div>

      {/* New certificate */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-heading text-lg text-foreground">Nieuw certificaat maken</h2>
          <p className="text-sm text-muted-foreground">Upload het ingevulde kennismakingsformulier (PDF of foto). De gegevens worden automatisch uitgelezen; controleer ze voordat je opslaat.</p>
        </div>
        <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-6 cursor-pointer hover:bg-muted ${reading ? "pointer-events-none opacity-60" : ""}`}>
          <Upload className="w-5 h-5 text-primary" />
          <span className="text-sm text-foreground">{formFile ? formFile.name : "Kies ingevuld formulier (PDF of foto)"}</span>
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readForm(f); e.target.value = ""; }} />
        </label>
        {reading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-primary"><span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Formulier uitlezen…</span><span>{elapsed}s</span></div>
            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(95, 10 + elapsed * 4)}%` }} /></div>
          </div>
        )}
        {readError && (
          <div className="flex items-center justify-between gap-3 border border-destructive/40 bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            <span>Uitlezen mislukt: {readError}. Vul de gegevens handmatig in of probeer opnieuw.</span>
            {formFile && <button type="button" onClick={() => readForm(formFile)} className="underline shrink-0">Opnieuw</button>}
          </div>
        )}

        <div className="space-y-4">
          {field("volledige_naam", "Naam op certificaat *")}
          <div className="grid sm:grid-cols-2 gap-4">
            {field("geboortedatum", "Geboortedatum (dd/mm/jjjj)")}
            {field("geboortedatum_ar", "تاريخ الازدياد (هجري)", true)}
            {field("geboorteplaats", "Geboorteplaats")}
            {field("geboorteplaats_ar", "مكان الازدياد", true)}
            {field("nationaliteit", "Nationaliteit")}
            {field("nationaliteit_ar", "الجنسية", true)}
            {field("adres", "Adres")}
            {field("adres_ar", "العنوان", true)}
            {field("email", "E-mail (niet op certificaat)")}
            {field("telefoon", "Telefoon (niet op certificaat)")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={doPreview} disabled={!!busy} className={btn}>{busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Voorbeeld</button>
          <button type="button" onClick={() => doDownload()} disabled={!!busy} className={btn}>{busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF downloaden</button>
          <button type="button" onClick={doSave} disabled={!!busy} className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">{busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Opslaan in archief</button>
        </div>
        {preview && <img src={preview} alt="Voorbeeld certificaat" className="w-full max-w-xl mx-auto border border-border rounded-lg shadow-sm" />}
      </div>

      {/* Archive */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-heading text-lg text-foreground">Archief certificaten ({archive.length})</h2>
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek op naam…" className="pl-9" />
          </div>
        </div>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /> : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nog geen certificaten.</p>
        ) : filtered.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{r.volledige_naam}</p>
                <p className="text-xs text-muted-foreground">Geboren {r.geboortedatum || "?"} · opgeslagen {new Date(r.created_at).toLocaleDateString("nl-NL")}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleArchivePreview(r)} className="p-2 rounded-lg hover:bg-muted" title="Voorbeeld">
                  {archivePreviewBusy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                </button>
                {r.certificate_path && <button onClick={() => openFile(r.certificate_path)} className="p-2 rounded-lg hover:bg-muted" title="Certificaat openen"><Award className="w-4 h-4" /></button>}
                {r.form_path && <button onClick={() => openFile(r.form_path)} className="p-2 rounded-lg hover:bg-muted" title="Formulier openen"><FileText className="w-4 h-4" /></button>}
                <button onClick={() => doDownload(r)} className="p-2 rounded-lg hover:bg-muted" title="Opnieuw downloaden"><Download className="w-4 h-4" /></button>
                <button onClick={() => remove(r)} className="p-2 rounded-lg hover:bg-muted text-destructive" title="Verwijderen"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {archivePreview?.id === r.id && <img src={archivePreview.url} alt={`Voorbeeld certificaat ${r.volledige_naam}`} className="w-full max-w-xl mx-auto border border-border rounded-lg shadow-sm" />}
          </div>
        ))}
      </div>
    </div>
  );
}
