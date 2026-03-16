import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen, Target, AlertTriangle, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import LessonMediaPlayer from "@/components/lesson/LessonMediaPlayer";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  arabic_terms: any;
  sort_order: number;
  module_id: string;
}

export default function CursusLes() {
  const { slug, lessonId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [totalLessons, setTotalLessons] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: lessonData } = await supabase
        .from("course_lessons")
        .select("id, title, content, arabic_terms, sort_order, module_id")
        .eq("id", lessonId!)
        .single();

      if (!lessonData) { setLoading(false); return; }
      setLesson(lessonData);

      const { data: allLessons } = await supabase
        .from("course_lessons")
        .select("id, sort_order")
        .eq("module_id", lessonData.module_id)
        .order("sort_order");

      if (allLessons) {
        const idx = allLessons.findIndex((l) => l.id === lessonId);
        setCurrentIndex(idx + 1);
        setTotalLessons(allLessons.length);
        setSiblings({
          prev: idx > 0 ? allLessons[idx - 1].id : null,
          next: idx < allLessons.length - 1 ? allLessons[idx + 1].id : null,
        });
      }

      if (user) {
        const { data: mod } = await supabase.from("course_modules").select("level_id").eq("id", lessonData.module_id).single();
        if (mod) {
          const { data: level } = await supabase.from("course_levels").select("course_id").eq("id", mod.level_id).single();
          if (level) {
            const { data: enr } = await supabase
              .from("course_enrollments")
              .select("id")
              .eq("course_id", level.course_id)
              .eq("student_id", user.id)
              .maybeSingle();
            if (enr) {
              setEnrollmentId(enr.id);
              const { data: prog } = await supabase
                .from("student_lesson_progress")
                .select("id")
                .eq("enrollment_id", enr.id)
                .eq("lesson_id", lessonId!)
                .maybeSingle();
              if (prog) setCompleted(true);
            }
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [lessonId, user]);

  const markComplete = async () => {
    if (!enrollmentId) return;
    setMarking(true);
    const { error } = await supabase.from("student_lesson_progress").insert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId!,
    });
    if (!error) {
      setCompleted(true);
      toast({ title: "Les afgerond!", description: "Je voortgang is opgeslagen." });
      if (siblings.next) {
        setTimeout(() => navigate(`/cursussen/${slug}/les/${siblings.next}`), 1200);
      }
    }
    setMarking(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!lesson) {
    return <div className="min-h-screen flex items-center justify-center"><p>Les niet gevonden.</p></div>;
  }

  const arabicTerms = Array.isArray(lesson.arabic_terms) ? lesson.arabic_terms as { term: string; meaning: string }[] : [];

  // Parse content sections
  const contentText = lesson.content || "Geen inhoud beschikbaar.";
  const sections = contentText.split("━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Extract learning goals if present
  const learningGoals: string[] = [];
  let mainContent = contentText;
  if (contentText.startsWith("Leerdoelen:")) {
    const goalSection = sections[0];
    const goalLines = goalSection.split("\n").filter(l => l.startsWith("•"));
    goalLines.forEach(l => learningGoals.push(l.replace("• ", "")));
    mainContent = sections.slice(1).join("\n\n");
  }

  // Extract summary if present
  let summary = "";
  const summaryIdx = mainContent.indexOf("SAMENVATTING");
  if (summaryIdx !== -1) {
    summary = mainContent.substring(summaryIdx + "SAMENVATTING".length).trim();
    mainContent = mainContent.substring(0, summaryIdx).trim();
  }

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* Breadcrumb */}
        <Link to={`/cursussen/${slug}`} className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> Terug naar cursus
        </Link>

        {/* Progress bar */}
        {totalLessons > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Les {currentIndex} van {totalLessons}</span>
              <span>{Math.round((currentIndex / totalLessons) * 100)}%</span>
            </div>
            <Progress value={(currentIndex / totalLessons) * 100} className="h-1.5" />
          </div>
        )}

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border px-6 md:px-8 py-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Les {currentIndex}</p>
                <h1 className="text-xl md:text-2xl font-heading text-foreground leading-tight">{lesson.title}</h1>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-8 py-6 space-y-6">
            {/* Learning Goals */}
            {learningGoals.length > 0 && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <h3 className="flex items-center gap-2 font-semibold text-sm text-primary mb-3">
                  <Target className="h-4 w-4" /> Leerdoelen
                </h3>
                <ul className="space-y-1.5">
                  {learningGoals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
              {mainContent.trim()}
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-accent/40 rounded-xl p-4 border border-accent">
                <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
                  <List className="h-4 w-4 text-primary" /> Samenvatting
                </h3>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{summary}</div>
              </div>
            )}

            {/* Arabic Terms */}
            {arabicTerms.length > 0 && (
              <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">📖</span> Arabische Termen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {arabicTerms.map((t, i) => (
                    <div key={i} className="flex items-baseline gap-2 text-sm bg-background rounded-lg px-3 py-2">
                      <span className="font-semibold text-primary whitespace-nowrap">{t.term}</span>
                      <span className="text-muted-foreground">— {t.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mark complete */}
            {enrollmentId && (
              <div className="flex items-center justify-center border-t border-border pt-6">
                {completed ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle2 className="h-6 w-6" /> Les afgerond!
                    </span>
                    {siblings.next && (
                      <p className="text-xs text-muted-foreground">Automatisch naar de volgende les...</p>
                    )}
                  </div>
                ) : (
                  <Button onClick={markComplete} disabled={marking} size="lg" className="px-8">
                    {marking ? "Opslaan..." : "✓ Markeer als afgerond"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="border-t border-border px-6 md:px-8 py-4 flex justify-between items-center bg-muted/30">
            {siblings.prev ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/cursussen/${slug}/les/${siblings.prev}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Vorige les
                </Link>
              </Button>
            ) : <div />}
            {siblings.next ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/cursussen/${slug}/les/${siblings.next}`}>
                  Volgende les <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
