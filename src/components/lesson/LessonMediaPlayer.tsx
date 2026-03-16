import { useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Droplets, Hand, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AnimationStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "fard" | "sunnah" | "mustahabb";
  bodyPart?: string;
}

interface LessonMediaPlayerProps {
  lessonTitle: string;
  mediaUrls?: any;
  onComplete?: () => void;
  autoplayNext?: boolean;
}

// Wuḍūʾ animation steps
const wuduSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie in je hart voor het verrichten van wuḍūʾ.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Gezicht wassen", description: "Was het gezicht van de haargrens tot de kin, en van oor tot oor.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Handen en armen wassen", description: "Was beide handen en armen tot en met de ellebogen.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Hoofd bestrijken (masḥ)", description: "Bestrijk het hele hoofd met natte handen van voor naar achter en terug.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Voeten wassen", description: "Was beide voeten tot en met de enkels, inclusief tussen de tenen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Dalk (wrijven)", description: "Wrijf elk lichaamsdeel tijdens het wassen — dit is verplicht in de Maliki madhhab.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Muwālāh (continuïteit)", description: "Verricht alle handelingen zonder lange onderbrekingen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
];

const ghuslSteps: AnimationStep[] = [
  { title: "Niyyah (intentie)", description: "Maak de intentie in je hart om ghusl te verrichten ter opheffing van de staat van janābah.", icon: <Eye className="h-8 w-8" />, type: "fard" },
  { title: "Hele lichaam wassen", description: "Laat water over elk deel van het lichaam stromen, inclusief moeilijk bereikbare plekken.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Dalk (wrijven)", description: "Wrijf elk lichaamsdeel terwijl je het wast — verplicht in de Maliki madhhab.", icon: <Hand className="h-8 w-8" />, type: "fard" },
  { title: "Muwālāh (continuïteit)", description: "Verricht de ghusl zonder onnodige onderbrekingen.", icon: <Droplets className="h-8 w-8" />, type: "fard" },
  { title: "Bismillāh zeggen", description: "Begin met het noemen van de naam van Allah.", icon: <Eye className="h-8 w-8" />, type: "sunnah" },
  { title: "Handen wassen", description: "Was eerst de handen voor je begint met de rest van het lichaam.", icon: <Hand className="h-8 w-8" />, type: "sunnah" },
  { title: "Wuḍūʾ verrichten", description: "Verricht een volledige wuḍūʾ voorafgaand aan de ghusl.", icon: <Droplets className="h-8 w-8" />, type: "sunnah" },
  { title: "Water over het hoofd", description: "Giet driemaal water over het hoofd voordat je de rest van het lichaam wast.", icon: <Droplets className="h-8 w-8" />, type: "sunnah" },
  { title: "Rechts voor links", description: "Begin met de rechterkant van het lichaam vóór de linkerkant.", icon: <Hand className="h-8 w-8" />, type: "mustahabb" },
];

function getStepsForLesson(title: string): AnimationStep[] | null {
  const t = title.toLowerCase();
  if (t.includes("wuḍūʾ") || t.includes("wudu") || t.includes("stap voor stap wuḍūʾ")) return wuduSteps;
  if (t.includes("ghusl") || t.includes("stap voor stap ghusl")) return ghuslSteps;
  return null;
}

const typeColors = {
  fard: "bg-red-500/10 text-red-700 border-red-500/20",
  sunnah: "bg-primary/10 text-primary border-primary/20",
  mustahabb: "bg-green-500/10 text-green-700 border-green-500/20",
};
const typeLabels = { fard: "Farḍ", sunnah: "Sunnah", mustahabb: "Mustaḥabb" };

export default function LessonMediaPlayer({ lessonTitle, mediaUrls, onComplete, autoplayNext = true }: LessonMediaPlayerProps) {
  const steps = getStepsForLesson(lessonTitle);
  const videoUrl = typeof mediaUrls === "string" ? mediaUrls : Array.isArray(mediaUrls) ? mediaUrls[0] : null;

  // If there's a video URL, show video player
  if (videoUrl) {
    return (
      <div className="rounded-2xl overflow-hidden bg-black aspect-video">
        <video controls className="w-full h-full" src={videoUrl}>
          Je browser ondersteunt geen video.
        </video>
      </div>
    );
  }

  // If there are animation steps, show the interactive animation player
  if (steps) {
    return <StepAnimationPlayer steps={steps} lessonTitle={lessonTitle} onComplete={onComplete} />;
  }

  // Default: decorative placeholder
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

function StepAnimationPlayer({ steps, lessonTitle, onComplete }: { steps: AnimationStep[]; lessonTitle: string; onComplete?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < steps.length) {
      setCurrent(idx);
      setVisited(prev => new Set(prev).add(idx));
    }
  }, [steps.length]);

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setCurrent(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          setPlaying(false);
          onComplete?.();
          return prev;
        }
        setVisited(v => new Set(v).add(next));
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [playing, steps.length, onComplete]);

  const step = steps[current];
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      {/* Animation display area */}
      <div className="aspect-video bg-gradient-to-br from-primary/5 via-background to-accent/10 relative flex items-center justify-center overflow-hidden">
        {/* Decorative Islamic pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Water ripple effect */}
        {playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-48 w-48 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute h-32 w-32 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
          </div>
        )}

        {/* Step content */}
        <div className="relative z-10 text-center px-6 max-w-lg animate-fade-in" key={current}>
          {/* Type badge */}
          <div className="flex justify-center mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${typeColors[step.type]}`}>
              {typeLabels[step.type]}
            </span>
          </div>

          {/* Icon */}
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary transition-transform duration-500">
            {step.icon}
          </div>

          {/* Step info */}
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Body part indicator */}
          {step.bodyPart && (
            <p className="mt-2 text-xs text-primary font-medium">
              Lichaamsdeel: {step.bodyPart}
            </p>
          )}
        </div>

        {/* Step counter */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground border border-border">
          Stap {current + 1} / {steps.length}
        </div>
      </div>

      {/* Chapter markers / step pills */}
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

      {/* Progress bar */}
      <div className="px-4">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => goTo(current - 1)} disabled={current === 0}>
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPlaying(!playing)}
          className="gap-2 px-6"
        >
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
