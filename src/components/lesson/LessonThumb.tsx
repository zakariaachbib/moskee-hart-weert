import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";

interface Props {
  media: any;
  className?: string;
}

// Toont thumbnail voor een lesvideo. Vraagt een signed URL op (private bucket).
export default function LessonThumb({ media, className = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const thumbPath = media && typeof media === "object" ? media.thumbnail_path : null;
  const hasVideo = !!(media && typeof media === "object" && media.path);

  useEffect(() => {
    let cancelled = false;
    if (!thumbPath) { setUrl(null); return; }
    supabase.storage.from("lesson-videos").createSignedUrl(thumbPath, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [thumbPath]);

  if (!hasVideo) return null;

  return (
    <div className={`relative w-20 h-12 rounded overflow-hidden bg-muted shrink-0 ${className}`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video size={16} className="text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <Video size={14} className="text-white drop-shadow" />
      </div>
    </div>
  );
}
