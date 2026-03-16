import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, CheckCircle2, FileQuestion, GraduationCap, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Level {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: { id: string; title: string; sort_order: number }[];
  quiz: { id: string; title: string } | null;
}

export default function CursusDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const [finalExam, setFinalExam] = useState<any>(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      // Get course
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      let query = supabase.from("courses").select("*").eq("is_published", true);
      if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        query = query.eq("slug", slug!);
      }
      const { data: courseData } = await query.single();

      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      // Get levels with modules, lessons, quizzes
      const { data: levelsData } = await supabase
        .from("course_levels")
        .select("id, title, description, sort_order")
        .eq("course_id", courseData.id)
        .order("sort_order");

      if (levelsData) {
        const enriched: Level[] = await Promise.all(
          levelsData.map(async (level) => {
            const { data: modulesData } = await supabase
              .from("course_modules")
              .select("id, title, description, sort_order")
              .eq("level_id", level.id)
              .order("sort_order");

            const modules: Module[] = await Promise.all(
              (modulesData || []).map(async (mod) => {
                const { data: lessons } = await supabase
                  .from("course_lessons")
                  .select("id, title, sort_order")
                  .eq("module_id", mod.id)
                  .order("sort_order");

                const { data: quizzes } = await supabase
                  .from("course_quizzes")
                  .select("id, title")
                  .eq("module_id", mod.id)
                  .eq("is_final_exam", false)
                  .limit(1);

                return { ...mod, lessons: lessons || [], quiz: quizzes?.[0] || null };
              })
            );
            return { ...level, modules };
          })
        );
        setLevels(enriched);
      }

      // Final exam
      const { data: examData } = await supabase
        .from("course_quizzes")
        .select("id, title")
        .eq("course_id", courseData.id)
        .eq("is_final_exam", true)
        .limit(1);
      if (examData?.[0]) setFinalExam(examData[0]);

      // Enrollment + progress
      if (user) {
        const { data: enr } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", courseData.id)
          .eq("student_id", user.id)
          .maybeSingle();

        if (enr) {
          setEnrolled(true);
          setEnrollmentId(enr.id);

          const { data: progress } = await supabase
            .from("student_lesson_progress")
            .select("lesson_id")
            .eq("enrollment_id", enr.id);
          if (progress) setCompletedLessons(new Set(progress.map((p) => p.lesson_id)));

          const { data: attempts } = await supabase
            .from("student_quiz_attempts")
            .select("quiz_id, passed")
            .eq("enrollment_id", enr.id)
            .eq("passed", true);
          if (attempts) setPassedQuizzes(new Set(attempts.map((a) => a.quiz_id)));

          const { data: cert } = await supabase
            .from("course_certificates")
            .select("id")
            .eq("enrollment_id", enr.id)
            .maybeSingle();
          if (cert) setHasCertificate(true);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user) { navigate("/login"); return; }
    setEnrolling(true);
    const { data, error } = await supabase
      .from("course_enrollments")
      .insert({ course_id: course.id, student_id: user.id })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Fout", description: "Inschrijving mislukt.", variant: "destructive" });
    } else {
      setEnrolled(true);
      setEnrollmentId(data.id);
      toast({ title: "Ingeschreven!", description: "Je kunt nu beginnen met leren." });
    }
    setEnrolling(false);
  };

  const totalLessons = levels.reduce((sum, l) => sum + l.modules.reduce((s, m) => s + m.lessons.length, 0), 0);
  const progressPct = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cursus niet gevonden.</p></div>;
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link to="/cursussen" className="text-sm text-primary hover:underline mb-2 inline-block">← Terug naar cursussen</Link>
          <h1 className="text-3xl font-heading text-foreground mb-2">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        {/* Enrollment / Progress */}
        {!enrolled ? (
          <div className="bg-card border border-border rounded-xl p-6 mb-8 text-center">
            <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Schrijf je in voor deze cursus</h2>
            <p className="text-muted-foreground mb-4">Gratis toegang tot alle lessen, quizzen en het eindexamen.</p>
            <Button onClick={handleEnroll} disabled={enrolling} size="lg">
              {enrolling ? "Bezig..." : "Inschrijven"}
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Voortgang</span>
              <span className="text-sm text-muted-foreground">{completedLessons.size}/{totalLessons} lessen</span>
            </div>
            <Progress value={progressPct} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">{progressPct}% voltooid</p>
          </div>
        )}

        {/* Levels & Modules */}
        <Accordion type="multiple" className="space-y-3">
          {levels.map((level, li) => (
            <AccordionItem key={level.id} value={level.id} className="border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">{li + 1}</span>
                  <div>
                    <p className="font-semibold">{level.title}</p>
                    {level.description && <p className="text-sm text-muted-foreground">{level.description}</p>}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                {level.modules.map((mod) => (
                  <div key={mod.id} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-sm mb-2 text-foreground">{mod.title}</h4>
                    <ul className="space-y-1 ml-2">
                      {mod.lessons.map((lesson) => {
                        const done = completedLessons.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            {enrolled ? (
                              <Link
                                to={`/cursussen/${slug}/les/${lesson.id}`}
                                className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-accent transition-colors"
                              >
                                {done ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                                <span className={done ? "text-muted-foreground line-through" : ""}>{lesson.title}</span>
                              </Link>
                            ) : (
                              <span className="flex items-center gap-2 text-sm py-1.5 px-2 text-muted-foreground">
                                <Lock className="h-4 w-4" /> {lesson.title}
                              </span>
                            )}
                          </li>
                        );
                      })}
                      {mod.quiz && (
                        <li>
                          {enrolled ? (
                            <Link
                              to={`/cursussen/${slug}/quiz/${mod.quiz.id}`}
                              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-accent transition-colors font-medium"
                            >
                              {passedQuizzes.has(mod.quiz.id) ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <FileQuestion className="h-4 w-4 text-primary" />}
                              Quiz: {mod.quiz.title}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2 text-sm py-1.5 px-2 text-muted-foreground">
                              <Lock className="h-4 w-4" /> Quiz: {mod.quiz.title}
                            </span>
                          )}
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Final Exam & Certificate */}
        {enrolled && finalExam && (
          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Eindexamen
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Rond alle lessen af en maak het eindexamen om je certificaat te behalen.</p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to={`/cursussen/${slug}/quiz/${finalExam.id}`}>Start eindexamen</Link>
              </Button>
              {hasCertificate && (
                <Button variant="outline" asChild>
                  <Link to={`/cursussen/${slug}/certificaat`}>Download certificaat</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
