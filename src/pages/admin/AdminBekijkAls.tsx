import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, BookOpen, CheckCircle, XCircle, Award, Trophy,
  GraduationCap, Clock, FileText,
} from "lucide-react";

export default function AdminBekijkAls() {
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch all users with edu roles
  const { data: users } = useQuery({
    queryKey: ["all-users-impersonate"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      const { data: eduRoles } = await supabase
        .from("edu_user_roles")
        .select("user_id, role");
      return (profiles || []).map((p) => ({
        ...p,
        role: (eduRoles || []).find((r) => r.user_id === p.id)?.role || null,
      }));
    },
  });

  // Fetch enrollments for selected user
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["user-enrollments", selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("*, courses(id, title, slug)")
        .eq("student_id", selectedUserId)
        .order("enrolled_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch lesson progress
  const { data: lessonProgress } = useQuery({
    queryKey: ["user-lesson-progress", selectedUserId],
    enabled: !!selectedUserId && !!enrollments?.length,
    queryFn: async () => {
      const ids = enrollments!.map((e) => e.id);
      const { data } = await supabase
        .from("student_lesson_progress")
        .select("*")
        .in("enrollment_id", ids);
      return data || [];
    },
  });

  // Fetch quiz attempts
  const { data: quizAttempts } = useQuery({
    queryKey: ["user-quiz-attempts", selectedUserId],
    enabled: !!selectedUserId && !!enrollments?.length,
    queryFn: async () => {
      const ids = enrollments!.map((e) => e.id);
      const { data } = await supabase
        .from("student_quiz_attempts")
        .select("*, course_quizzes(title, passing_score, is_final_exam)")
        .in("enrollment_id", ids)
        .order("attempted_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch certificates
  const { data: certificates } = useQuery({
    queryKey: ["user-certificates", selectedUserId],
    enabled: !!selectedUserId && !!enrollments?.length,
    queryFn: async () => {
      const ids = enrollments!.map((e) => e.id);
      const { data } = await supabase
        .from("course_certificates")
        .select("*")
        .in("enrollment_id", ids);
      return data || [];
    },
  });

  // Fetch badges
  const { data: badges } = useQuery({
    queryKey: ["user-badges", selectedUserId],
    enabled: !!selectedUserId && !!enrollments?.length,
    queryFn: async () => {
      const ids = enrollments!.map((e) => e.id);
      const { data } = await supabase
        .from("student_badges")
        .select("*, course_badges(title, description, icon)")
        .in("enrollment_id", ids);
      return data || [];
    },
  });

  // Fetch course structure for progress calculation
  const { data: courseStructures } = useQuery({
    queryKey: ["course-structures-impersonate", enrollments?.map((e) => (e.courses as any)?.id)],
    enabled: !!enrollments?.length,
    queryFn: async () => {
      const courseIds = [...new Set(enrollments!.map((e) => (e.courses as any)?.id).filter(Boolean))];
      const result: Record<string, number> = {};
      for (const courseId of courseIds) {
        const { data: levels } = await supabase.from("course_levels").select("id").eq("course_id", courseId);
        if (!levels?.length) { result[courseId] = 0; continue; }
        const { data: modules } = await supabase.from("course_modules").select("id").in("level_id", levels.map((l) => l.id));
        if (!modules?.length) { result[courseId] = 0; continue; }
        const { data: lessons } = await supabase.from("course_lessons").select("id").in("module_id", modules.map((m) => m.id));
        result[courseId] = lessons?.length || 0;
      }
      return result;
    },
  });

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  const roleLabel = (role: string | null) => {
    switch (role) {
      case "admin": return "Admin";
      case "education_management": return "Onderwijs Manager";
      case "teacher": return "Leraar";
      case "student": return "Student";
      default: return "Geen rol";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-primary" size={24} />
            Bekijk als gebruiker
          </h1>
          <p className="text-muted-foreground">
            Selecteer een gebruiker om hun cursusdata, voortgang en resultaten te bekijken
          </p>
        </div>

        {/* User selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-96">
              <SelectValue placeholder="Selecteer een gebruiker..." />
            </SelectTrigger>
            <SelectContent>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="flex items-center gap-2">
                    {u.full_name || u.email}
                    <span className="text-muted-foreground text-xs">
                      ({roleLabel(u.role)})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected user info */}
        {selectedUser && (
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{selectedUser.full_name || "Geen naam"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Badge variant="outline">{roleLabel(selectedUser.role)}</Badge>
            </CardContent>
          </Card>
        )}

        {!selectedUserId ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <User className="mx-auto mb-3 opacity-30" size={48} />
              <p>Selecteer een gebruiker om hun data te bekijken</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <Tabs defaultValue="overzicht" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
              <TabsTrigger value="quizzen">Quizresultaten</TabsTrigger>
              <TabsTrigger value="badges">Badges & Certificaten</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overzicht" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <BookOpen className="mx-auto mb-2 text-primary" size={24} />
                    <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Inschrijvingen</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
                    <p className="text-2xl font-bold">{lessonProgress?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Lessen afgerond</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <GraduationCap className="mx-auto mb-2 text-primary" size={24} />
                    <p className="text-2xl font-bold">
                      {quizAttempts?.filter((q) => q.passed).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Quizzen geslaagd</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="mx-auto mb-2 text-amber-500" size={24} />
                    <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Certificaten</p>
                  </CardContent>
                </Card>
              </div>

              {enrollments?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Deze gebruiker is niet ingeschreven voor cursussen.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {enrollments?.map((enrollment) => {
                    const course = enrollment.courses as any;
                    const courseId = course?.id;
                    const totalLessons = courseStructures?.[courseId] || 1;
                    const completed = (lessonProgress || []).filter(
                      (p) => p.enrollment_id === enrollment.id
                    ).length;
                    const pct = Math.round((completed / totalLessons) * 100);
                    const hasCert = certificates?.some(
                      (c) => c.enrollment_id === enrollment.id
                    );

                    return (
                      <Card key={enrollment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold">{course?.title || "Onbekende cursus"}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={12} />
                                Ingeschreven op{" "}
                                {new Date(enrollment.enrolled_at).toLocaleDateString("nl-NL")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasCert && (
                                <Badge className="bg-green-600 text-white">
                                  <Award size={12} className="mr-1" /> Certificaat
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={pct} className="flex-1 h-2" />
                            <span className="text-sm font-medium w-12 text-right">{pct}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {completed} / {totalLessons} lessen afgerond
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Quiz results tab */}
            <TabsContent value="quizzen" className="space-y-3">
              {!quizAttempts?.length ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Geen quizpogingen gevonden.
                  </CardContent>
                </Card>
              ) : (
                quizAttempts.map((attempt) => {
                  const quiz = attempt.course_quizzes as any;
                  return (
                    <Card key={attempt.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {attempt.passed ? (
                            <CheckCircle className="text-green-600 shrink-0" size={20} />
                          ) : (
                            <XCircle className="text-destructive shrink-0" size={20} />
                          )}
                          <div>
                            <p className="font-semibold">
                              {quiz?.title || "Quiz"}
                              {quiz?.is_final_exam && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Eindexamen
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(attempt.attempted_at).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{attempt.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            Slaaggrens: {quiz?.passing_score || 80}%
                          </p>
                          <Badge
                            variant={attempt.passed ? "default" : "destructive"}
                            className="mt-1"
                          >
                            {attempt.passed ? "Geslaagd" : "Gezakt"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Badges & Certificates tab */}
            <TabsContent value="badges" className="space-y-4">
              <CardHeader className="px-0 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-amber-500" /> Badges
                </CardTitle>
              </CardHeader>
              {!badges?.length ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nog geen badges behaald.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badges.map((b) => {
                    const badge = b.course_badges as any;
                    return (
                      <Card key={b.id}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                            {badge?.icon || "🏅"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{badge?.title}</p>
                            <p className="text-xs text-muted-foreground">{badge?.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Behaald op{" "}
                              {new Date(b.earned_at).toLocaleDateString("nl-NL")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <CardHeader className="px-0 pb-2 pt-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText size={20} className="text-primary" /> Certificaten
                </CardTitle>
              </CardHeader>
              {!certificates?.length ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nog geen certificaten behaald.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => {
                    const enrollment = enrollments?.find((e) => e.id === cert.enrollment_id);
                    const course = enrollment?.courses as any;
                    return (
                      <Card key={cert.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="text-primary shrink-0" size={20} />
                            <div>
                              <p className="font-semibold">{course?.title || "Cursus"}</p>
                              <Badge variant="outline" className="text-xs">
                                {cert.certificate_number}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(cert.issued_at).toLocaleDateString("nl-NL")}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
