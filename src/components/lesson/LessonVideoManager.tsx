import { useCallback, useEffect, useRef, useState } from "react";
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
  if (!entityId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Sla eerst de {folder === "lessons" ? "les" : "module"} op (titel + Opslaan). Daarna kun je hier een video uploaden — dat is nodig om het bestand aan deze {folder === "lessons" ? "les" : "module"} te koppelen zodat cursisten hem kunnen bekijken.
      </div>
    );
  }
  return <LessonVideoManagerInner value={value} onChange={onChange} folder={folder} entityId={entityId} />;
}

function LessonVideoManagerInner({ value, onChange, folder, entityId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewFrameRef = useRef<number | null>(null);
  const hasSeenFrameRef = useRef(false);

  const meta = extractMeta(value);
  const existingPath = meta.path;

  const attachLivePreview = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node || !liveStream) return;
    node.srcObject = null;
    node.srcObject = liveStream;
    node.muted = true;
    node.autoplay = true;
    node.controls = false;
    node.playsInline = true;
    node.setAttribute("playsinline", "true");
    node.setAttribute("webkit-playsinline", "true");
    node.onloadedmetadata = () => void node.play().catch(() => {
      toast({ title: "Camera-preview geblokkeerd", description: "Klik nogmaals op Opnemen of sta camera-toegang toe.", variant: "destructive" });
    });
    void node.play().catch(() => undefined);
  }, [liveStream]);

  useEffect(() => {
    if (!recording || !liveStream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = liveStream;
    video.muted = true;
    video.controls = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.play().catch(() => {
      toast({ title: "Camera-preview geblokkeerd", description: "Klik nogmaals op Opnemen of sta camera-toegang toe.", variant: "destructive" });
    });
  }, [recording, liveStream]);

  useEffect(() => {
    if (!recording || !liveStream) return;

    let imageCapture: any = null;
    const videoTrack = liveStream.getVideoTracks()[0];
    const ImageCaptureCtor = (window as any).ImageCapture;
    if (videoTrack && ImageCaptureCtor) {
      try {
        imageCapture = new ImageCaptureCtor(videoTrack);
      } catch {
        imageCapture = null;
      }
    }

    const paintFrame = (source: CanvasImageSource, sourceWidth: number, sourceHeight: number) => {
      const canvas = canvasRef.current;
      if (!canvas || sourceWidth <= 0 || sourceHeight <= 0) return;

      const ctx = canvas.getContext("2d");
      const box = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (!ctx || box.width <= 0 || box.height <= 0) return;

      const nextWidth = Math.max(1, Math.round(box.width * dpr));
      const nextHeight = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
      const dw = sourceWidth * scale;
      const dh = sourceHeight * scale;
      const dx = (canvas.width - dw) / 2;
      const dy = (canvas.height - dh) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, dx, dy, dw, dh);

      if (!hasSeenFrameRef.current) {
        hasSeenFrameRef.current = true;
        setVideoReady(true);
      }
    };

    const draw = async () => {
      const video = videoRef.current;
      if (!video) {
        previewFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      if (imageCapture) {
        try {
          const bitmap = await imageCapture.grabFrame();
          paintFrame(bitmap, bitmap.width, bitmap.height);
          bitmap.close?.();
        } catch {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            paintFrame(video, video.videoWidth, video.videoHeight);
          }
        }
      } else if (video.videoWidth > 0 && video.videoHeight > 0) {
        paintFrame(video, video.videoWidth, video.videoHeight);
      }

      previewFrameRef.current = requestAnimationFrame(draw);
    };

    previewFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (previewFrameRef.current) cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    };
  }, [recording, liveStream]);

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
    const v = validateVideoFile(file);
    if (!v.ok) {
      toast({ title: v.title, description: v.description, variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (v.warning) toast({ title: v.title, description: v.warning });
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    await uploadBlob(file, ext);
    e.target.value = "";
  }

  async function startRecording() {
    try {
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
      hasSeenFrameRef.current = false;
      setVideoReady(false);
      setRecordedBlob(null);
      setRecordedPreviewUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 25, max: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setLiveStream(stream);
      setShowRecorder(true);
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
        setLiveStream(null);
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
    setVideoReady(false);
    if (previewFrameRef.current) cancelAnimationFrame(previewFrameRef.current);
    previewFrameRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function saveRecording() {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    await uploadBlob(recordedBlob, ext);
  }

  function discardRecording() {
    setRecordedBlob(null);
    setLiveStream(null);
    setVideoReady(false);
    hasSeenFrameRef.current = false;
    if (previewFrameRef.current) cancelAnimationFrame(previewFrameRef.current);
    previewFrameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    setRecordedPreviewUrl(null);
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.removeAttribute("src");
    }
  }

  useEffect(() => {
    return () => {
      if (previewFrameRef.current) cancelAnimationFrame(previewFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
    const v = validateThumbnail(file);
    if (!v.ok) { toast({ title: v.title, description: v.description, variant: "destructive" }); return; }
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
    const v = validateVtt(file);
    if (!v.ok) { toast({ title: v.title, description: v.description, variant: "destructive" }); return; }
    const c = await validateVttContent(file);
    if (!c.ok) { toast({ title: c.title, description: c.description, variant: "destructive" }); return; }
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
            recording ? (
              <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                <video
                  key="live-camera-preview"
                  ref={attachLivePreview}
                  className="absolute inset-0 h-full w-full scale-x-[-1] object-cover bg-black"
                  playsInline
                  autoPlay
                  muted
                  controls={false}
                  onCanPlay={() => void videoRef.current?.play().catch(() => undefined)}
                  onPlaying={() => setVideoReady(true)}
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 h-full w-full scale-x-[-1] bg-black transition-opacity ${videoReady ? "opacity-100" : "opacity-0"}`}
                  aria-label="Live camera preview"
                />
                {!videoReady && (
                  <div className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                    Camera wordt geladen…
                  </div>
                )}
              </div>
            ) : (
              <video
                key="recorded-video-preview"
                src={recordedPreviewUrl || undefined}
                className="w-full rounded-md aspect-video bg-black"
                playsInline
                controls={!!recordedBlob}
              />
            )
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

          <div className="rounded-md border bg-background p-2.5 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Info size={13} /> Ondersteunde formaten
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="text-foreground font-medium">Video:</span> MP4 (H.264 + AAC) ✅ of WebM (VP9/Opus) ✅ — max {VIDEO_MAX_MB} MB.</li>
              <li className="flex gap-1.5"><AlertTriangle size={12} className="mt-0.5 text-amber-600 shrink-0" /><span><span className="text-foreground">.MOV / HEVC (H.265):</span> vaak van iPhone — speelt niet in Chrome/Firefox. Exporteer als MP4 (H.264).</span></li>
              <li><span className="text-foreground font-medium">Thumbnail:</span> JPG, PNG of WebP — max {THUMB_MAX_MB} MB (automatisch gegenereerd, eigen upload optioneel).</li>
              <li><span className="text-foreground font-medium">Ondertitels:</span> WebVTT (.vtt), moet beginnen met <code className="bg-muted px-1 rounded">WEBVTT</code> — max {VTT_MAX_MB} MB. .SRT eerst converteren.</li>
              <li><span className="text-foreground font-medium">Auto-transcriptie:</span> werkt tot ~20 MB video.</li>
            </ul>
          </div>
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
