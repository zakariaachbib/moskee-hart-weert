import { useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Loader2, Send, Eye, Sparkles } from "lucide-react";
import templateUrl from "@/assets/khutbah-template.jpg";

// Content area as fractions of the page (between logo and footer)
const AREA = { top: 0.175, bottom: 0.8, left: 0.08, right: 0.92 };
const isArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

type Line = { text: string; font: string; size: number; rtl: boolean; gap: number; align: "center" | "start" };

function layout(ctx: CanvasRenderingContext2D, W: number, titel: string, datum: string, tekst: string): Line[] {
  const maxW = (AREA.right - AREA.left) * W;
  const base = W / 62; // body font size
  const lines: Line[] = [];
  const wrap = (para: string, font: string, size: number, align: Line["align"], gapAfter: number) => {
    const rtl = isArabic(para);
    ctx.font = `${font.replace("{s}", String(size))}`;
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push({ text: "", font, size, rtl, gap: size * 0.8, align }); return; }
    let cur = "";
    words.forEach((w) => {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push({ text: cur, font, size, rtl, gap: size * 1.55, align }); cur = w; }
      else cur = test;
    });
    lines.push({ text: cur, font, size, rtl, gap: size * 1.55 + gapAfter, align });
  };
  void titel;
  tekst.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)
    .forEach((p) => wrap(p, "{s}px Georgia, 'Times New Roman', serif", Math.round(base), "start", base * 0.9));
  return lines;
}

async function renderPages(titel: string, datum: string, tekst: string): Promise<HTMLCanvasElement[]> {
  const bg = await loadImage(templateUrl);
  const W = bg.naturalWidth, H = bg.naturalHeight;
  const measure = document.createElement("canvas").getContext("2d")!;
  const lines = layout(measure, W, titel, datum, tekst);
  // group lines into paragraphs (last line of a paragraph has extra gap)
  const paras: Line[][] = [];
  let cur: Line[] = [];
  lines.forEach((l) => { cur.push(l); if (l.gap > l.size * 1.6) { paras.push(cur); cur = []; } });
  if (cur.length) paras.push(cur);

  const pages: HTMLCanvasElement[] = [];
  let ctx: CanvasRenderingContext2D | null = null;
  let y = 0;
  const top = AREA.top * H, bottom = AREA.bottom * H;
  const newPage = () => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    ctx = c.getContext("2d")!;
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.fillStyle = "#2b1d10";
    ctx.textBaseline = "top";
    pages.push(c);
    y = top;
  };
  const draw = (l: Line) => {
    const c = ctx!;
    c.font = l.font.replace("{s}", String(l.size));
    c.direction = l.rtl ? "rtl" : "ltr";
    if (l.rtl) { c.textAlign = "right"; c.fillText(l.text, AREA.right * W, y); }
    else { c.textAlign = "left"; c.fillText(l.text, AREA.left * W, y); }
    y += l.gap;
  };
  const lineH = (l: Line) => l.size * 1.55;
  newPage();
  for (const p of paras) {
    const fits = (n: number) => y + n * lineH(p[0]) - (lineH(p[0]) - p[0].size) <= bottom;
    if (fits(p.length)) { p.forEach(draw); continue; }
    // how many lines fit on this page
    let n = 0; while (n < p.length && fits(n + 1)) n++;
    // avoid splitting short paragraphs or leaving 1 line alone
    if (p.length <= 4 || n < 2 || p.length - n < 2) {
      if (p.length - n < 2 && n >= 3) n = p.length - 2; else n = 0;
    }
    if (n > 0) { p.slice(0, n).forEach(draw); }
    newPage();
    let rest = p.slice(n);
    while (rest.length) {
      let k = 0; while (k < rest.length && fits(k + 1)) k++;
      rest.slice(0, k).forEach(draw); rest = rest.slice(k);
      if (rest.length) newPage();
    }
  }
  return pages;
}

async function buildPdf(titel: string, datum: string, tekst: string): Promise<Blob> {
  const pages = await renderPages(titel, datum, tekst);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pages.forEach((c, i) => {
    if (i) pdf.addPage();
    pdf.addImage(c.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, 210, 297);
  });
  return pdf.output("blob");
}

export default function KhutbahTemplateEditor({ onPublished }: { onPublished?: () => void }) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [tekst, setTekst] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "download" | "publish">(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [genBusy, setGenBusy] = useState(false);

  const genTitle = async () => {
    if (tekst.trim().length < 20) return toast.error("Schrijf eerst meer inhoud.");
    setGenBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sermon-title", { body: { text: tekst } });
      if (error || !data?.title) throw new Error(data?.error || error?.message || "Geen titel");
      setTitel(data.title);
    } catch (e: any) {
      toast.error("Titel genereren mislukt: " + e.message);
    } finally { setGenBusy(false); }
  };

  const datumLabel = datum ? new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "";
  const fileName = `${(titel || "khutbah").replace(/[^\w\u0600-\u06FF-]+/g, "_").slice(0, 60)}.pdf`;

  const doPreview = async () => {
    setBusy("preview");
    try { setPreview((await renderPages(titel, datumLabel, tekst)).map((c) => c.toDataURL("image/jpeg", 0.6))); }
    finally { setBusy(null); }
  };

  const doDownload = async () => {
    setBusy("download");
    try {
      const blob = await buildPdf(titel, datumLabel, tekst);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } finally { setBusy(null); }
  };

  const doPublish = async () => {
    if (!titel.trim() || !tekst.trim()) return toast.error("Vul een titel en tekst in.");
    setBusy("publish");
    try {
      const blob = await buildPdf(titel, datumLabel, tekst);
      const filePath = `${Date.now()}-${fileName}`;
      const { error: upErr } = await supabase.storage.from("sermons").upload(filePath, blob, { contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { error } = await supabase.from("sermons").insert({ titel: titel.trim(), datum, omschrijving: null, bestandsnaam: fileName, bestandspad: filePath });
      if (error) throw error;
      toast.success("Samenvatting gepubliceerd bij de preken!");
      setTitel(""); setTekst(""); setPreview([]);
      onPublished?.();
    } catch (e: any) {
      toast.error("Publiceren mislukt: " + e.message);
    } finally { setBusy(null); }
  };

  const btn = "flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50";

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
      <h2 className="font-heading text-lg text-foreground">Khutbah-samenvatting schrijven</h2>
      <p className="text-sm text-muted-foreground">Typ hier de inhoud; die wordt op het briefpapier van de moskee gezet. Arabische tekst gaat automatisch van rechts naar links.</p>
      <div className="space-y-2">
        <Label htmlFor="kt-tekst">Inhoud *</Label>
        <Textarea id="kt-tekst" value={tekst} onChange={(e) => setTekst(e.target.value)} onBlur={() => { if (!titel.trim() && tekst.trim().length >= 20) genTitle(); }} rows={14} dir="auto" placeholder="Schrijf hier de samenvatting van de khutbah…" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kt-titel">Titel *</Label>
          <Input id="kt-titel" value={titel} onChange={(e) => setTitel(e.target.value)} dir={isArabic(titel) ? "rtl" : "ltr"} placeholder="Wordt automatisch gemaakt uit de inhoud" />
          <button type="button" onClick={genTitle} disabled={genBusy || tekst.trim().length < 20} className="flex items-center gap-1.5 text-xs text-primary disabled:opacity-50">
            {genBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {genBusy ? "Titel genereren…" : "Titel genereren uit inhoud"}
          </button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kt-datum">Datum</Label>
          <Input id="kt-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={doPreview} disabled={!!busy} className={btn}>
          {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Voorbeeld
        </button>
        <button type="button" onClick={doDownload} disabled={!!busy} className={btn}>
          {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF downloaden
        </button>
        <button type="button" onClick={doPublish} disabled={!!busy} className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publiceren bij preken
        </button>
      </div>
      {preview.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          {preview.map((src, i) => <img key={i} src={src} alt={`Pagina ${i + 1}`} className="w-full border border-border rounded-lg shadow-sm" />)}
        </div>
      )}
    </div>
  );
}
