import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

      // Get sibling lessons in same module
      const { data: allLessons } = await supabase
        .from("course_lessons")
        .select("id, sort_order")
        .eq("module_id", lessonData.module_id)
        .order("sort_order");

      if (allLessons) {
        const idx = allLessons.findIndex((l) => l.id === lessonId);
        setSiblings({
          prev: idx > 0 ? allLessons[idx - 1].id : null,
          next: idx < allLessons.length - 1 ? allLessons[idx + 1].id : null,
        });
      }

      // Check enrollment & progress
      if (user) {
        // Find course_id through module -> level -> course
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

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link to={`/cursussen/${slug}`} className="text-sm text-primary hover:underline mb-4 inline-block">← Terug naar cursus</Link>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-primary mt-1 shrink-0" />
            <h1 className="text-2xl font-heading text-foreground">{lesson.title}</h1>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground mb-8" style={{ whiteSpace: "pre-wrap" }}>
            {lesson.content || "Geen inhoud beschikbaar."}
          </div>

          {/* Arabic Terms */}
          {arabicTerms.length > 0 && (
            <div className="bg-accent/30 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-sm mb-3">Arabische termen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {arabicTerms.map((t, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-primary">{t.term}</span>
                    <span className="text-muted-foreground">— {t.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark complete */}
          {enrollmentId && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              {completed ? (
                <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5" /> Les afgerond
                </span>
              ) : (
                <Button onClick={markComplete} disabled={marking}>
                  {marking ? "Opslaan..." : "Markeer als afgerond"}
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {siblings.prev ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/cursussen/${slug}/les/${siblings.prev}`}><ChevronLeft className="h-4 w-4 mr-1" /> Vorige les</Link>
              </Button>
            ) : <div />}
            {siblings.next ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/cursussen/${slug}/les/${siblings.next}`}>Volgende les <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}
