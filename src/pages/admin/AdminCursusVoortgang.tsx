import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, CheckCircle } from "lucide-react";

export default function AdminCursusVoortgang() {
  const [selectedCourse, setSelectedCourse] = useState("");

  const { data: courses } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").order("title");
      return data || [];
    },
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["course-enrollments", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq("course_id", selectedCourse)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: courseStructure } = useQuery({
    queryKey: ["course-structure", selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const { data: levels } = await supabase.from("course_levels").select("id").eq("course_id", selectedCourse);
      if (!levels?.length) return { totalLessons: 0 };
      const { data: modules } = await supabase.from("course_modules").select("id").in("level_id", levels.map(l => l.id));
      if (!modules?.length) return { totalLessons: 0 };
      const { data: lessons } = await supabase.from("course_lessons").select("id").in("module_id", modules.map(m => m.id));
      return { totalLessons: lessons?.length || 0 };
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ["all-progress", selectedCourse],
    enabled: !!selectedCourse && !!enrollments?.length,
    queryFn: async () => {
      const enrollmentIds = enrollments?.map(e => e.id) || [];
      if (!enrollmentIds.length) return {};
      const { data: progress } = await supabase.from("student_lesson_progress").select("enrollment_id").in("enrollment_id", enrollmentIds);
      const { data: quizAttempts } = await supabase.from("student_quiz_attempts").select("enrollment_id, passed").in("enrollment_id", enrollmentIds);
      const { data: certs } = await supabase.from("course_certificates").select("enrollment_id").in("enrollment_id", enrollmentIds);

      const result: Record<string, { lessonsCompleted: number; quizzesPassed: number; hasCertificate: boolean }> = {};
      enrollmentIds.forEach(id => {
        result[id] = {
          lessonsCompleted: (progress || []).filter(p => p.enrollment_id === id).length,
          quizzesPassed: (quizAttempts || []).filter(q => q.enrollment_id === id && q.passed).length,
          hasCertificate: (certs || []).some(c => c.enrollment_id === id),
        };
      });
      return result;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Studentvoortgang</h1>
          <p className="text-muted-foreground">Bekijk de voortgang van studenten per cursus</p>
        </div>

        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Selecteer een cursus" /></SelectTrigger>
          <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>

        {!selectedCourse ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Selecteer een cursus om de voortgang te bekijken.</CardContent></Card>
        ) : isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : enrollments?.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen studenten ingeschreven.</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="pt-6 text-center"><Users className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{enrollments?.length || 0}</p><p className="text-xs text-muted-foreground">Ingeschreven</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><BookOpen className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{courseStructure?.totalLessons || 0}</p><p className="text-xs text-muted-foreground">Totaal lessen</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><CheckCircle className="mx-auto mb-2 text-green-600" size={24} /><p className="text-2xl font-bold">{Object.values(progressData || {}).filter(p => p.hasCertificate).length}</p><p className="text-xs text-muted-foreground">Geslaagd</p></CardContent></Card>
            </div>

            <div className="space-y-3">
              {enrollments?.map(enrollment => {
                const profile = enrollment.profiles as any;
                const progress = progressData?.[enrollment.id];
                const totalLessons = courseStructure?.totalLessons || 1;
                const pct = Math.round(((progress?.lessonsCompleted || 0) / totalLessons) * 100);

                return (
                  <Card key={enrollment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{profile?.full_name || "Onbekend"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress?.hasCertificate && <Badge className="bg-green-600">Certificaat</Badge>}
                          <Badge variant="outline">{progress?.quizzesPassed || 0} quizzen</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={pct} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12 text-right">{pct}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{progress?.lessonsCompleted || 0} / {totalLessons} lessen afgerond</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
