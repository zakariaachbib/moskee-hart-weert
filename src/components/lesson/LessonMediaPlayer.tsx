import { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AnimationStep,
  typeColors,
  typeLabels,
  getStepsForLesson,
  generateStepsFromContent,
} from "./animationSteps";

interface LessonMediaPlayerProps {
  lessonTitle: string;
  lessonContent?: string;
  mediaUrls?: any;
  onComplete?: () => void;
  autoplayNext?: boolean;
}

function resolveVideoUrl(mediaUrls: any): string | null {
  if (typeof mediaUrls === "string" && mediaUrls.trim()) return mediaUrls;

  if (Array.isArray(mediaUrls)) {
    const firstString = mediaUrls.find((item) => typeof item === "string" && item.trim());
    if (firstString) return firstString;

    const firstObjectUrl = mediaUrls.find(
      (item) =>
        item &&
        typeof item === "object" &&
        ((typeof item.url === "string" && item.url.trim()) ||
          (typeof item.src === "string" && item.src.trim()))
    );

    if (firstObjectUrl) return firstObjectUrl.url || firstObjectUrl.src;
  }

  if (mediaUrls && typeof mediaUrls === "object") {
    if (typeof mediaUrls.url === "string" && mediaUrls.url.trim()) return mediaUrls.url;
    if (typeof mediaUrls.src === "string" && mediaUrls.src.trim()) return mediaUrls.src;
  }

  return null;
}

export default function LessonMediaPlayer({
  lessonTitle,
  lessonContent,
  mediaUrls,
  onComplete,
  autoplayNext = false,
}: LessonMediaPlayerProps) {
  const videoUrl = useMemo(() => resolveVideoUrl(mediaUrls), [mediaUrls]);

  if (videoUrl) {
    return (
      <div className="rounded-2xl overflow-hidden bg-black aspect-video">
        <video controls playsInline preload="metadata" className="w-full h-full" src={videoUrl}>
          Je browser ondersteunt geen video.
        </video>
      </div>
    );
  }

  // Try hardcoded steps first, then auto-generate from content
  const steps = getStepsForLesson(lessonTitle) || (lessonContent ? generateStepsFromContent(lessonContent) : []);

  if (steps.length > 0) {
    return <StepAnimationPlayer steps={steps} onComplete={onComplete} autoPlay={autoplayNext} />;
  }

  // Minimal fallback
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 aspect-video flex items-center justify-center border border-border">
      <div className="text-center space-y-3 px-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Play className="h-7 w-7 text-primary ml-1" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Video binnenkort beschikbaar</p>
        <p className="text-xs text-muted-foreground">Lees de geschreven uitleg hieronder</p>
      </div>
    </div>
  );
}

function StepAnimationPlayer({
  steps,
  onComplete,
  autoPlay = false,
}: {
  steps: AnimationStep[];
  onComplete?: () => void;
  autoPlay?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < steps.length) {
        setCurrent(idx);
        setVisited((prev) => new Set(prev).add(idx));
      }
    },
    [steps.length]
  );

  useEffect(() => {
    if (!autoPlay) return;
    setPlaying(true);
  }, [autoPlay, steps.length]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setPlaying(false);
          onComplete?.();
          return prev;
        }
        setVisited((v) => new Set(v).add(next));
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [playing, steps.length, onComplete]);

  const step = steps[current];
  if (!step) return null;

  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      <div className="aspect-video bg-gradient-to-br from-primary/5 via-background to-accent/10 relative flex items-center justify-center overflow-hidden">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-48 w-48 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
            <div
              className="absolute h-32 w-32 rounded-full border-2 border-primary/10 animate-ping"
              style={{ animationDuration: "2s", animationDelay: "0.5s" }}
            />
          </div>
        )}

        <div className="relative z-10 text-center px-6 max-w-lg animate-fade-in" key={current}>
          <div className="flex justify-center mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${typeColors[step.type]}`}>
              {typeLabels[step.type]}
            </span>
          </div>
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">{step.icon}</div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground border border-border">
          Stap {current + 1} / {steps.length}
        </div>
      </div>

      {/* Step pills */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                i === current
                  ? "bg-primary text-primary-foreground"
                  : visited.has(i)
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {s.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => goTo(current - 1)} disabled={current === 0}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPlaying(!playing)} className="gap-2 px-6">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pauzeer" : "Afspelen"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => goTo(current + 1)} disabled={current === steps.length - 1}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
