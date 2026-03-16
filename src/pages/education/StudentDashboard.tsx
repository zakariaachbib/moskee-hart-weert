import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Award, Trophy, GraduationCap } from "lucide-react";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string | null;
  enrollmentId: string;
  totalLessons: number;
  completedLessons: number;
  hasCertificate: boolean;
}

interface Badge {
  title: string;
  description: string | null;
  icon: string | null;
  earned_at: string;
}

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("id, course_id")
        .eq("student_id", user.id);

      if (enrollments && enrollments.length > 0) {
        const progressList: CourseProgress[] = await Promise.all(
          enrollments.map(async (enr) => {
            const { data: course } = await supabase
              .from("courses")
              .select("title, slug")
              .eq("id", enr.course_id)
              .single();

            // Count total lessons through levels -> modules -> lessons
            const { data: levels } = await supabase
              .from("course_levels")
              .select("id")
              .eq("course_id", enr.course_id);

            let totalLessons = 0;
            if (levels) {
              for (const lvl of levels) {
                const { data: mods } = await supabase
                  .from("course_modules")
                  .select("id")
                  .eq("level_id", lvl.id);
                if (mods) {
                  for (const mod of mods) {
                    const { count } = await supabase
                      .from("course_lessons")
                      .select("id", { count: "exact", head: true })
                      .eq("module_id", mod.id);
                    totalLessons += count || 0;
                  }
                }
              }
            }

            const { count: completedCount } = await supabase
              .from("student_lesson_progress")
              .select("id", { count: "exact", head: true })
              .eq("enrollment_id", enr.id);

            const { data: cert } = await supabase
              .from("course_certificates")
              .select("id")
              .eq("enrollment_id", enr.id)
              .maybeSingle();

            return {
              courseId: enr.course_id,
              courseTitle: course?.title || "Cursus",
              courseSlug: course?.slug || enr.course_id,
              enrollmentId: enr.id,
              totalLessons,
              completedLessons: completedCount || 0,
              hasCertificate: !!cert,
            };
          })
        );
        setCourses(progressList);

        // Get badges
        const enrollmentIds = enrollments.map((e) => e.id);
        const { data: studentBadges } = await supabase
          .from("student_badges")
          .select("earned_at, badge_id")
          .in("enrollment_id", enrollmentIds);

        if (studentBadges && studentBadges.length > 0) {
          const badgeIds = studentBadges.map((b) => b.badge_id);
          const { data: badgeDetails } = await supabase
            .from("course_badges")
            .select("title, description, icon")
            .in("id", badgeIds);

          if (badgeDetails) {
            const merged = badgeDetails.map((bd, i) => ({
              ...bd,
              earned_at: studentBadges[i]?.earned_at || "",
            }));
            setBadges(merged);
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welkom, {user?.email}</p>
          </div>
          <button onClick={signOut} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm hover:opacity-90">
            Uitloggen
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Cursusvoortgang */}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Mijn cursussen
            </h2>
            {courses.length === 0 ? (
              <Card className="mb-8">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-3">Je bent nog niet ingeschreven voor een cursus.</p>
                  <Button asChild><Link to="/cursussen">Bekijk cursussen</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {courses.map((cp) => {
                  const pct = cp.totalLessons > 0 ? Math.round((cp.completedLessons / cp.totalLessons) * 100) : 0;
                  return (
                    <Card key={cp.enrollmentId}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          {cp.courseTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cp.completedLessons}/{cp.totalLessons} lessen</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link to={`/cursussen/${cp.courseSlug}`}>Ga naar cursus</Link>
                          </Button>
                          {cp.hasCertificate && (
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/cursussen/${cp.courseSlug}/certificaat`}>
                                <Award className="h-4 w-4 mr-1" /> Certificaat
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Behaalde badges
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {badges.map((badge, i) => (
                    <Card key={i} className="text-center p-4">
                      <span className="text-3xl mb-2 block">{badge.icon || "🏅"}</span>
                      <p className="font-semibold text-sm">{badge.title}</p>
                      {badge.description && <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Mijn klassen", "Opdrachten", "Cijfers"].map((item) => (
                <Card key={item}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground">{item}</h3>
                    <p className="text-muted-foreground text-sm mt-1">Bekijk {item.toLowerCase()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
