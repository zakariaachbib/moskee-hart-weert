import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function AdminCursusQuizzen() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizDialog, setQuizDialog] = useState(false);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [activeQuizId, setActiveQuizId] = useState("");
  const [quizForm, setQuizForm] = useState({ title: "", passing_score: 80, is_final_exam: false, module_id: "" });
  const [qForm, setQForm] = useState({ question_text: "", options: ["", "", "", ""], correct_option_index: 0, explanation: "", sort_order: 0 });

  const { data: courses } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").order("title");
      return data || [];
    },
  });

  const { data: allModules } = useQuery({
    queryKey: ["modules-for-quizzes", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data: levels } = await supabase.from("course_levels").select("id, title").eq("course_id", selectedCourse).order("sort_order");
      if (!levels?.length) return [];
      const { data: mods } = await supabase.from("course_modules").select("id, title, level_id").in("level_id", levels.map(l => l.id)).order("sort_order");
      return (mods || []).map(m => ({ ...m, levelTitle: levels.find(l => l.id === m.level_id)?.title }));
    },
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_quizzes")
        .select("*")
        .or(`course_id.eq.${selectedCourse},module_id.in.(${(allModules || []).map(m => m.id).join(",")})`)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["quiz-questions", activeQuizId],
    enabled: !!activeQuizId,
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_questions").select("*").eq("quiz_id", activeQuizId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveQuiz = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = { title: data.title, passing_score: data.passing_score, is_final_exam: data.is_final_exam };
      if (data.is_final_exam) {
        payload.course_id = selectedCourse;
        payload.module_id = null;
      } else {
        payload.module_id = data.module_id;
        payload.course_id = null;
      }
      if (data.id) {
        const { error } = await supabase.from("course_quizzes").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_quizzes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setQuizDialog(false);
      setEditingQuiz(null);
      toast({ title: "Quiz opgeslagen" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz verwijderd" });
    },
  });

  const saveQuestion = useMutation({
    mutationFn: async (data: any) => {
      const payload = { quiz_id: activeQuizId, question_text: data.question_text, options: data.options.filter((o: string) => o.trim()), correct_option_index: data.correct_option_index, explanation: data.explanation || null, sort_order: data.sort_order };
      if (data.id) {
        const { error } = await supabase.from("quiz_questions").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quiz_questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
      setQuestionDialog(false);
      setEditingQuestion(null);
      setQForm({ question_text: "", options: ["", "", "", ""], correct_option_index: 0, explanation: "", sort_order: 0 });
      toast({ title: "Vraag opgeslagen" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
      toast({ title: "Vraag verwijderd" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quizzen & Examens</h1>
          <p className="text-muted-foreground">Beheer quizzen en eindexamens</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Selecteer cursus" /></SelectTrigger>
            <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
          {selectedCourse && (
            <Dialog open={quizDialog} onOpenChange={(o) => { setQuizDialog(o); if (!o) setEditingQuiz(null); }}>
              <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Nieuwe quiz</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingQuiz ? "Quiz bewerken" : "Nieuwe quiz"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Titel</Label><Input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} /></div>
                  <div className="flex items-center gap-2">
                    <Switch checked={quizForm.is_final_exam} onCheckedChange={v => setQuizForm({ ...quizForm, is_final_exam: v })} />
                    <Label>Eindexamen</Label>
                  </div>
                  {!quizForm.is_final_exam && (
                    <div>
                      <Label>Module</Label>
                      <Select value={quizForm.module_id} onValueChange={v => setQuizForm({ ...quizForm, module_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecteer module" /></SelectTrigger>
                        <SelectContent>{allModules?.map(m => <SelectItem key={m.id} value={m.id}>{m.levelTitle} → {m.title}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div><Label>Slagingspercentage (%)</Label><Input type="number" value={quizForm.passing_score} onChange={e => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 80 })} /></div>
                  <Button onClick={() => saveQuiz.mutate({ ...quizForm, id: editingQuiz?.id })} disabled={!quizForm.title} className="w-full">Opslaan</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!selectedCourse ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Selecteer een cursus.</CardContent></Card>
        ) : isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : (
          <Accordion type="single" collapsible value={activeQuizId} onValueChange={setActiveQuizId}>
            {quizzes?.map(quiz => {
              const moduleName = allModules?.find(m => m.id === quiz.module_id);
              return (
                <AccordionItem key={quiz.id} value={quiz.id} className="border rounded-lg bg-card mb-3">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{quiz.title}</span>
                      {quiz.is_final_exam && <Badge variant="destructive">Eindexamen</Badge>}
                      <Badge variant="outline">{quiz.passing_score}% slaaggrens</Badge>
                      {moduleName && <span className="text-xs text-muted-foreground">{moduleName.title}</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Dialog open={questionDialog && activeQuizId === quiz.id} onOpenChange={o => { setQuestionDialog(o); if (!o) { setEditingQuestion(null); setQForm({ question_text: "", options: ["", "", "", ""], correct_option_index: 0, explanation: "", sort_order: 0 }); } }}>
                        <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Vraag toevoegen</Button></DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>{editingQuestion ? "Vraag bewerken" : "Nieuwe vraag"}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div><Label>Vraag</Label><Textarea value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} rows={3} /></div>
                            {qForm.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input type="radio" name="correct" checked={qForm.correct_option_index === i} onChange={() => setQForm({ ...qForm, correct_option_index: i })} />
                                <Input value={opt} onChange={e => { const opts = [...qForm.options]; opts[i] = e.target.value; setQForm({ ...qForm, options: opts }); }} placeholder={`Optie ${i + 1}`} />
                              </div>
                            ))}
                            <div><Label>Uitleg (optioneel)</Label><Textarea value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} rows={2} /></div>
                            <div><Label>Volgorde</Label><Input type="number" value={qForm.sort_order} onChange={e => setQForm({ ...qForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
                            <Button onClick={() => saveQuestion.mutate({ ...qForm, id: editingQuestion?.id })} disabled={!qForm.question_text} className="w-full">Opslaan</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingQuiz(quiz); setQuizForm({ title: quiz.title, passing_score: quiz.passing_score, is_final_exam: quiz.is_final_exam, module_id: quiz.module_id || "" }); setQuizDialog(true); }}><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Quiz verwijderen?")) deleteQuiz.mutate(quiz.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>

                    {activeQuizId === quiz.id && questions && (
                      <div className="space-y-2">
                        {questions.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nog geen vragen.</p>
                        ) : questions.map((q, idx) => (
                          <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{idx + 1}. {q.question_text}</p>
                                <div className="mt-1 space-y-0.5">
                                  {Array.isArray(q.options) && (q.options as string[]).map((opt: string, i: number) => (
                                    <p key={i} className={`text-xs ${i === q.correct_option_index ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                                      {String.fromCharCode(65 + i)}. {opt} {i === q.correct_option_index && "✓"}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingQuestion(q);
                                  const opts = Array.isArray(q.options) ? [...(q.options as string[])] : ["", "", "", ""];
                                  while (opts.length < 4) opts.push("");
                                  setQForm({ question_text: q.question_text, options: opts, correct_option_index: q.correct_option_index, explanation: q.explanation || "", sort_order: q.sort_order });
                                  setQuestionDialog(true);
                                }}><Edit size={14} /></Button>
                                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Vraag verwijderen?")) deleteQuestion.mutate(q.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AdminLayout>
  );
}
