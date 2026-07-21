import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Video, Upload, StopCircle, Trash2, Circle, RefreshCw, Image as ImageIcon, Captions, Loader2, Pencil, FileUp, X, Info, AlertTriangle } from "lucide-react";
import SubtitleEditor from "./SubtitleEditor";
import { validateVideoFile, validateThumbnail, validateVtt, validateVttContent, VIDEO_MAX_MB, THUMB_MAX_MB, VTT_MAX_MB } from "./mediaValidation";

interface Props {
  value: any; // media_urls jsonb
  onChange: (next: any) => void;
  folder: "lessons" | "modules";
  entityId?: string;
}

interface Chapter { start: number; title: string }
interface MediaMeta {
  path?: string;
  thumbnail_path?: string;
  vtt_path?: string;
  transcript_path?: string;
  transcript_text?: string;
  chapters?: Chapter[];
  chapters_path?: string;
  uploaded_at?: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function extractMeta(value: any): MediaMeta {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value) && typeof value.path === "string") return value as MediaMeta;
  if (Array.isArray(value)) {
    const f = value.find((v) => v && typeof v === "object" && typeof v.path === "string");
    if (f) return f as MediaMeta;
  }
  return {};
}

async function generateThumbnail(source: Blob | string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const cleanup = () => { if (typeof source !== "string") URL.revokeObjectURL(url); };
    v.onloadedmetadata = () => {
      const t = Math.min(1, (v.duration || 2) * 0.1);
      v.currentTime = isFinite(t) && t > 0 ? t : 0.1;
    };
    v.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = v.videoWidth || 640;
        const h = v.videoHeight || 360;
        const scale = Math.min(1, 640 / w);
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { cleanup(); resolve(null); return; }
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => { cleanup(); resolve(b); }, "image/jpeg", 0.8);
      } catch { cleanup(); resolve(null); }
    };
    v.onerror = () => { cleanup(); resolve(null); };
  });
}

export default function LessonVideoManager({ value, onChange, folder, entityId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const meta = extractMeta(value);
  const existingPath = meta.path;

  useEffect(() => {
    if (!recording || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.muted = true;
    video.controls = false;
    video.playsInline = true;
    video.play().catch(() => {
      toast({ title: "Camera-preview geblokkeerd", description: "Klik nogmaals op Opnemen of sta camera-toegang toe.", variant: "destructive" });
    });
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    };
  }, [recordedPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (existingPath) {
        const { data } = await supabase.storage.from("lesson-videos").createSignedUrl(existingPath, 3600);
        if (!cancelled) setPreviewUrl(data?.signedUrl ?? null);
      } else {
        setPreviewUrl(null);
      }
      if (meta.thumbnail_path) {
        const { data } = await supabase.storage.from("lesson-videos").createSignedUrl(meta.thumbnail_path, 3600);
        if (!cancelled) setThumbUrl(data?.signedUrl ?? null);
      } else {
        setThumbUrl(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [existingPath, meta.thumbnail_path]);

  async function uploadBlob(blob: Blob, ext: string) {
    setUploading(true);
    setProgress(10);
    try {
      const base = `${folder}/${entityId || "new"}/${Date.now()}`;
      const filename = `${base}.${ext}`;
      const { error } = await supabase.storage.from("lesson-videos").upload(filename, blob, {
        contentType: blob.type || `video/${ext}`,
        upsert: false,
      });
      if (error) throw error;
      setProgress(60);

      // Generate + upload thumbnail
      let thumbnail_path: string | undefined;
      try {
        const thumb = await generateThumbnail(blob);
        if (thumb) {
          const tp = `${base}.jpg`;
          const up = await supabase.storage.from("lesson-videos").upload(tp, thumb, {
            contentType: "image/jpeg",
            upsert: true,
          });
          if (!up.error) thumbnail_path = tp;
        }
      } catch { /* ignore thumbnail failure */ }

      setProgress(100);
      const next: MediaMeta = { path: filename, thumbnail_path, uploaded_at: new Date().toISOString() };
      onChange(next);
      toast({ title: "Video geüpload", description: thumbnail_path ? "Thumbnail gegenereerd" : "Zonder thumbnail" });
      setRecordedBlob(null);
      setRecordedPreviewUrl(null);
      setShowRecorder(false);
    } catch (e: any) {
      toast({ title: "Upload mislukt", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Max 500MB", variant: "destructive" });
      return;
    }
    await uploadBlob(file, ext);
    e.target.value = "";
  }

  async function startRecording() {
    try {
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedBlob(null);
      setRecordedPreviewUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedPreviewUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e: any) {
      toast({ title: "Camera niet beschikbaar", description: e.message, variant: "destructive" });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function saveRecording() {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    await uploadBlob(recordedBlob, ext);
  }

  function discardRecording() {
    setRecordedBlob(null);
    if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    setRecordedPreviewUrl(null);
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.removeAttribute("src");
    }
  }

  async function removeExisting() {
    if (!existingPath) return;
    if (!confirm("Video verwijderen?")) return;
    const toRemove = [existingPath];
    if (meta.thumbnail_path) toRemove.push(meta.thumbnail_path);
    if (meta.vtt_path) toRemove.push(meta.vtt_path);
    if (meta.transcript_path) toRemove.push(meta.transcript_path);
    await supabase.storage.from("lesson-videos").remove(toRemove);
    onChange(null);
  }

  async function generateSubtitles() {
    if (!existingPath) return;
    setTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("transcribe-lesson-video", {
        body: { path: existingPath, language: "Nederlands" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onChange({
        ...meta,
        vtt_path: data.vtt_path,
        transcript_path: data.transcript_path,
        transcript_text: data.transcript_text,
        chapters: data.chapters || [],
        chapters_path: data.chapters_path || undefined,
      });
      toast({
        title: "Ondertitels gegenereerd",
        description: data.chapters?.length ? `${data.chapters.length} hoofdstukken aangemaakt` : undefined,
      });
    } catch (e: any) {
      toast({ title: "Transcriptie mislukt", description: e.message, variant: "destructive" });
    } finally {
      setTranscribing(false);
    }
  }

  async function regenerateThumbnail() {
    if (!previewUrl || !existingPath) return;
    try {
      const thumb = await generateThumbnail(previewUrl);
      if (!thumb) { toast({ title: "Kon geen thumbnail maken", description: "Video kan niet decoderen in browser. Upload een eigen afbeelding.", variant: "destructive" }); return; }
      const tp = existingPath.replace(/\.[^./]+$/, "") + ".jpg";
      const { error } = await supabase.storage.from("lesson-videos").upload(tp, thumb, {
        contentType: "image/jpeg", upsert: true,
      });
      if (error) throw error;
      onChange({ ...meta, thumbnail_path: tp });
      const { data } = await supabase.storage.from("lesson-videos").createSignedUrl(tp, 3600);
      setThumbUrl(data?.signedUrl ?? null);
      toast({ title: "Thumbnail bijgewerkt" });
    } catch (e: any) {
      toast({ title: "Thumbnail mislukt", description: e.message, variant: "destructive" });
    }
  }

  async function uploadCustomThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !existingPath) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Kies een afbeelding", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Afbeelding te groot", description: "Max 5MB", variant: "destructive" }); return; }
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const tp = existingPath.replace(/\.[^./]+$/, "") + `-thumb.${ext}`;
      const { error } = await supabase.storage.from("lesson-videos").upload(tp, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      onChange({ ...meta, thumbnail_path: tp });
      const { data } = await supabase.storage.from("lesson-videos").createSignedUrl(tp, 3600);
      setThumbUrl(data?.signedUrl ?? null);
      toast({ title: "Thumbnail geüpload" });
    } catch (err: any) {
      toast({ title: "Upload mislukt", description: err.message, variant: "destructive" });
    }
  }

  async function removeThumbnail() {
    if (!meta.thumbnail_path) return;
    try {
      await supabase.storage.from("lesson-videos").remove([meta.thumbnail_path]);
    } catch { /* ignore */ }
    const { thumbnail_path, ...rest } = meta;
    onChange(rest);
    setThumbUrl(null);
    toast({ title: "Thumbnail verwijderd" });
  }

  async function uploadCustomVtt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !existingPath) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".vtt")) { toast({ title: "Kies een .vtt bestand", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "VTT te groot", description: "Max 2MB", variant: "destructive" }); return; }
    try {
      const vp = existingPath.replace(/\.[^./]+$/, "") + ".vtt";
      const { error } = await supabase.storage.from("lesson-videos").upload(vp, file, { contentType: "text/vtt", upsert: true });
      if (error) throw error;
      onChange({ ...meta, vtt_path: vp });
      toast({ title: "Ondertitels geüpload" });
    } catch (err: any) {
      toast({ title: "Upload mislukt", description: err.message, variant: "destructive" });
    }
  }

  async function removeSubtitles() {
    if (!meta.vtt_path && !meta.transcript_path) return;
    const toRemove: string[] = [];
    if (meta.vtt_path) toRemove.push(meta.vtt_path);
    if (meta.transcript_path) toRemove.push(meta.transcript_path);
    if (toRemove.length) { try { await supabase.storage.from("lesson-videos").remove(toRemove); } catch { /* ignore */ } }
    const { vtt_path, transcript_path, transcript_text, chapters, chapters_path, ...rest } = meta;
    onChange(rest);
    toast({ title: "Ondertitels verwijderd" });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Video size={16} /> Video
      </div>

      {existingPath && !showRecorder && (
        <div className="space-y-2">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              playsInline
              poster={thumbUrl || undefined}
              className="w-full rounded-md aspect-video bg-black"
              onError={() => toast({ title: "Video kan niet worden afgespeeld", description: "Formaat wordt niet ondersteund door de browser (probeer mp4/H.264).", variant: "destructive" })}
            />
          ) : (
            <div className="aspect-video bg-black/80 rounded-md animate-pulse" />
          )}

          {thumbUrl ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <img src={thumbUrl} alt="thumbnail" className="h-12 w-20 object-cover rounded border" />
              <span className="flex-1">Thumbnail actief</span>
              <Button type="button" variant="ghost" size="sm" onClick={removeThumbnail}>
                <X size={14} className="mr-1" /> Verwijder
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Geen thumbnail — genereer automatisch of upload een eigen afbeelding.</div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRecorder(true)}>
              <RefreshCw size={14} className="mr-1" /> Video vervangen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={regenerateThumbnail}>
              <ImageIcon size={14} className="mr-1" /> Thumbnail auto
            </Button>
            <label>
              <input type="file" accept="image/*" className="hidden" onChange={uploadCustomThumbnail} />
              <Button type="button" variant="outline" size="sm" asChild>
                <span><FileUp size={14} className="mr-1" /> Thumbnail uploaden</span>
              </Button>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={generateSubtitles} disabled={transcribing}>
              {transcribing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Captions size={14} className="mr-1" />}
              {meta.vtt_path ? "Ondertitels vernieuwen" : "Ondertitels genereren"}
            </Button>
            <label>
              <input type="file" accept=".vtt,text/vtt" className="hidden" onChange={uploadCustomVtt} />
              <Button type="button" variant="outline" size="sm" asChild>
                <span><FileUp size={14} className="mr-1" /> .vtt uploaden</span>
              </Button>
            </label>
            {meta.vtt_path && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                  <Pencil size={14} className="mr-1" /> Ondertitels bewerken
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={removeSubtitles}>
                  <X size={14} className="mr-1 text-destructive" /> Ondertitels verwijderen
                </Button>
              </>
            )}
            <Button type="button" variant="outline" size="sm" onClick={removeExisting}>
              <Trash2 size={14} className="mr-1 text-destructive" /> Video verwijderen
            </Button>
          </div>


          {meta.chapters && meta.chapters.length > 0 && (
            <div className="text-xs bg-background rounded border p-2">
              <div className="font-medium mb-1">Hoofdstukken ({meta.chapters.length})</div>
              <ol className="space-y-0.5">
                {meta.chapters.map((c, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span className="tabular-nums text-primary font-medium min-w-[42px]">{formatTime(c.start)}</span>
                    <span>{c.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {meta.transcript_text && (
            <details className="text-xs bg-background rounded border p-2">
              <summary className="cursor-pointer font-medium">Transcriptie ({meta.transcript_text.length} tekens)</summary>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground max-h-40 overflow-auto">{meta.transcript_text}</p>
            </details>
          )}
        </div>
      )}

      {(!existingPath || showRecorder) && (
        <div className="space-y-3">
          {(recording || recordedBlob) && (
            <video
              ref={recording ? videoRef : undefined}
              src={!recording ? recordedPreviewUrl || undefined : undefined}
              className="w-full rounded-md aspect-video bg-black"
              playsInline
              autoPlay={recording}
              muted={recording}
              controls={!recording && !!recordedBlob}
            />
          )}

          {!recording && !recordedBlob && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={startRecording} disabled={uploading}>
                <Circle size={14} className="mr-1 text-red-500 fill-red-500" /> Opnemen
              </Button>
              <label>
                <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading} />
                <Button type="button" size="sm" variant="outline" asChild disabled={uploading}>
                  <span><Upload size={14} className="mr-1" /> Bestand kiezen</span>
                </Button>
              </label>
              {showRecorder && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowRecorder(false)}>Annuleren</Button>
              )}
            </div>
          )}

          {recording && (
            <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
              <StopCircle size={14} className="mr-1" /> Stop opname
            </Button>
          )}

          {recordedBlob && !uploading && (
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={saveRecording}>Opslaan</Button>
              <Button type="button" size="sm" variant="outline" onClick={discardRecording}>Opnieuw</Button>
            </div>
          )}

          {uploading && (
            <div className="text-xs text-muted-foreground">
              Uploaden… {progress}%
              <div className="h-1 mt-1 bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Neem direct op met camera+microfoon of upload een bestand (mp4/webm/mov, max 500MB). Thumbnail wordt automatisch gegenereerd. Ondertitels kun je daarna optioneel genereren (max 20MB video).
          </p>
        </div>
      )}

      {meta.vtt_path && meta.path && (
        <SubtitleEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          vttPath={meta.vtt_path}
          videoPath={meta.path}
          onSaved={() => onChange({ ...meta, uploaded_at: new Date().toISOString() })}
        />
      )}
    </div>
  );
}
