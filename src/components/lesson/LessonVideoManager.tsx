import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Video, Upload, StopCircle, Trash2, Circle, RefreshCw } from "lucide-react";

interface Props {
  value: any; // media_urls jsonb
  onChange: (next: any) => void;
  folder: "lessons" | "modules";
  entityId?: string; // optional id for nicer paths
}

function extractPath(value: any): string | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value) && typeof value.path === "string") return value.path;
  if (Array.isArray(value)) {
    const f = value.find((v) => v && typeof v === "object" && typeof v.path === "string");
    if (f) return f.path;
  }
  return null;
}

export default function LessonVideoManager({ value, onChange, folder, entityId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const existingPath = extractPath(value);

  useEffect(() => {
    let cancelled = false;
    if (existingPath) {
      supabase.storage.from("lesson-videos").createSignedUrl(existingPath, 3600).then(({ data }) => {
        if (!cancelled) setPreviewUrl(data?.signedUrl ?? null);
      });
    } else {
      setPreviewUrl(null);
    }
    return () => { cancelled = true; };
  }, [existingPath]);

  async function uploadBlob(blob: Blob, ext: string) {
    setUploading(true);
    setProgress(10);
    try {
      const filename = `${folder}/${entityId || "new"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("lesson-videos").upload(filename, blob, {
        contentType: blob.type || `video/${ext}`,
        upsert: false,
      });
      if (error) throw error;
      setProgress(100);
      onChange({ path: filename, uploaded_at: new Date().toISOString() });
      toast({ title: "Video geüpload" });
      setRecordedBlob(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
          videoRef.current.muted = false;
          videoRef.current.controls = true;
        }
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
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.removeAttribute("src");
    }
  }

  async function removeExisting() {
    if (!existingPath) return;
    if (!confirm("Video verwijderen?")) return;
    await supabase.storage.from("lesson-videos").remove([existingPath]);
    onChange(null);
  }

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Video size={16} /> Video
      </div>

      {existingPath && !showRecorder && (
        <div className="space-y-2">
          {previewUrl ? (
            <video src={previewUrl} controls playsInline className="w-full rounded-md aspect-video bg-black" />
          ) : (
            <div className="aspect-video bg-black/80 rounded-md animate-pulse" />
          )}
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRecorder(true)}>
              <RefreshCw size={14} className="mr-1" /> Vervangen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={removeExisting}>
              <Trash2 size={14} className="mr-1 text-destructive" /> Verwijderen
            </Button>
          </div>
        </div>
      )}

      {(!existingPath || showRecorder) && (
        <div className="space-y-3">
          {(recording || recordedBlob) && (
            <video ref={videoRef} className="w-full rounded-md aspect-video bg-black" playsInline />
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
            Neem direct op met camera+microfoon, of upload een bestaand bestand (mp4/webm/mov, max 500MB).
          </p>
        </div>
      )}
    </div>
  );
}
