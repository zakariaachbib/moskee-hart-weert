import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  levelCount?: number;
}

export default function CursusOverzicht() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, slug, description, image_url")
        .eq("is_published", true);

      if (coursesData) {
        const enriched = await Promise.all(
          coursesData.map(async (c) => {
            const { count } = await supabase
              .from("course_levels")
              .select("id", { count: "exact", head: true })
              .eq("course_id", c.id);
            return { ...c, levelCount: count || 0 };
          })
        );
        setCourses(enriched);
      }

      if (user) {
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", user.id);
        if (enrollments) {
          setEnrolledIds(new Set(enrollments.map((e) => e.course_id)));
        }
      }
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({ title: "Log eerst in", description: "Je moet ingelogd zijn om je in te schrijven.", variant: "destructive" });
      return;
    }
    setEnrolling(courseId);
    const { error } = await supabase.from("course_enrollments").insert({ course_id: courseId, student_id: user.id });
    if (error) {
      toast({ title: "Fout", description: "Inschrijving mislukt.", variant: "destructive" });
    } else {
      setEnrolledIds((prev) => new Set([...prev, courseId]));
      toast({ title: "Ingeschreven!", description: "Je bent succesvol ingeschreven." });
    }
    setEnrolling(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading text-foreground mb-3">Cursussen</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leer de fundamenten van de Islam op een gestructureerde manier. Schrijf je in, volg de lessen en behaal je certificaat.
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-muted-foreground">Er zijn momenteel geen cursussen beschikbaar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                {course.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="h-4 w-4" /> {course.levelCount} niveaus</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> Cursus</span>
                  </div>
                  {enrolledIds.has(course.id) ? (
                    <Button asChild>
                      <Link to={`/cursussen/${course.slug || course.id}`}>Ga naar cursus</Link>
                    </Button>
                  ) : (
                    <Button onClick={() => handleEnroll(course.id)} disabled={enrolling === course.id}>
                      {enrolling === course.id ? "Bezig..." : "Inschrijven"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
