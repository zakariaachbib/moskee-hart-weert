import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string | null;
}

export default function CursusQuiz() {
  const { slug, quizId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: quizData } = await supabase
        .from("course_quizzes")
        .select("*")
        .eq("id", quizId!)
        .single();
      if (!quizData) { setLoading(false); return; }
      setQuiz(quizData);

      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("id, question_text, options, correct_option_index, explanation")
        .eq("quiz_id", quizId!)
        .order("sort_order");

      if (questionsData) {
        const parsed = questionsData.map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? (q.options as Json[]).map(String) : [],
        }));
        // Shuffle
        const shuffled = [...parsed].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }

      // Get enrollment
      if (user) {
        const courseId = quizData.course_id || null;
        let cId = courseId;
        if (!cId && quizData.module_id) {
          const { data: mod } = await supabase.from("course_modules").select("level_id").eq("id", quizData.module_id).single();
          if (mod) {
            const { data: lvl } = await supabase.from("course_levels").select("course_id").eq("id", mod.level_id).single();
            if (lvl) cId = lvl.course_id;
          }
        }
        if (cId) {
          const { data: enr } = await supabase
            .from("course_enrollments")
            .select("id")
            .eq("course_id", cId)
            .eq("student_id", user.id)
            .maybeSingle();
          if (enr) setEnrollmentId(enr.id);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [quizId, user]);

  const currentQ = questions[currentIdx];
  const selectedAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isCorrect = currentQ ? selectedAnswer === currentQ.correct_option_index : false;

  const handleAnswer = (val: string) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: parseInt(val) }));
  };

  const handleCheck = () => {
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const correct = questions.filter((q) => answers[q.id] === q.correct_option_index).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setFinished(true);

    if (enrollmentId) {
      setSaving(true);
      const passed = pct >= (quiz?.passing_score || 80);
      await supabase.from("student_quiz_attempts").insert({
        enrollment_id: enrollmentId,
        quiz_id: quizId!,
        score: pct,
        passed,
        answers: answers as unknown as Json,
      });

      // If final exam passed, create certificate
      if (passed && quiz?.is_final_exam) {
        const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await supabase.from("course_certificates").insert({
          enrollment_id: enrollmentId,
          certificate_number: certNumber,
        });
      }
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIdx(0);
    setShowFeedback(false);
    setFinished(false);
    setScore(0);
    setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">Quiz niet beschikbaar</p>
            <p className="text-sm text-muted-foreground">
              {!quiz ? "Deze quiz kon niet gevonden worden." : "Er zijn nog geen vragen toegevoegd aan deze quiz."}
            </p>
            <Button variant="outline" asChild>
              <Link to={`/cursussen/${slug}`}>← Terug naar cursus</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passed = score >= (quiz.passing_score || 80);

  if (finished) {
    return (
      <div className="py-12">
        <div className="max-w-xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              {passed ? (
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-3" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-3" />
              )}
              <CardTitle className="text-2xl">{passed ? "Gefeliciteerd!" : "Helaas, niet geslaagd"}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-3xl font-bold text-foreground">{score}%</p>
              <p className="text-muted-foreground">
                {passed
                  ? quiz.is_final_exam
                    ? "Je hebt het eindexamen gehaald! Je certificaat is beschikbaar."
                    : "Je hebt deze quiz succesvol afgerond."
                  : `Je hebt minimaal ${quiz.passing_score}% nodig om te slagen. Probeer het opnieuw.`}
              </p>
              <div className="flex gap-3 justify-center">
                {!passed && (
                  <Button onClick={handleRetry}><RotateCcw className="h-4 w-4 mr-2" /> Opnieuw proberen</Button>
                )}
                {passed && quiz.is_final_exam && (
                  <Button asChild>
                    <Link to={`/cursussen/${slug}/certificaat`}>Bekijk certificaat</Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to={`/cursussen/${slug}`}>Terug naar cursus</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link to={`/cursussen/${slug}`} className="text-sm text-primary hover:underline mb-4 inline-block">← Terug naar cursus</Link>

        <h1 className="text-2xl font-heading mb-2">{quiz.title}</h1>
        <div className="flex items-center gap-3 mb-6">
          <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">{currentIdx + 1}/{questions.length}</span>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-lg font-medium mb-6">{currentQ.question_text}</p>

            <RadioGroup
              value={selectedAnswer !== undefined ? String(selectedAnswer) : ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQ.options.map((opt, i) => {
                let optClass = "border rounded-lg p-3 transition-colors";
                if (showFeedback) {
                  if (i === currentQ.correct_option_index) optClass += " border-green-500 bg-green-50 dark:bg-green-950/30";
                  else if (i === selectedAnswer) optClass += " border-destructive bg-destructive/10";
                } else if (selectedAnswer === i) {
                  optClass += " border-primary bg-primary/5";
                }
                return (
                  <div key={i} className={optClass}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={String(i)} id={`opt-${i}`} disabled={showFeedback} />
                      <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                      {showFeedback && i === currentQ.correct_option_index && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {showFeedback && i === selectedAnswer && i !== currentQ.correct_option_index && <XCircle className="h-5 w-5 text-destructive" />}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {showFeedback && currentQ.explanation && (
              <div className="mt-4 p-3 bg-accent/30 rounded-lg text-sm text-muted-foreground">
                <strong>Uitleg:</strong> {currentQ.explanation}
              </div>
            )}

            <div className="flex justify-end mt-6">
              {!showFeedback ? (
                <Button onClick={handleCheck} disabled={selectedAnswer === undefined}>Controleer antwoord</Button>
              ) : (
                <Button onClick={handleNext}>
                  {currentIdx < questions.length - 1 ? "Volgende vraag" : "Resultaat bekijken"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
