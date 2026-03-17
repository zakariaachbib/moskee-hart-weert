import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, GraduationCap, Layers, CheckCircle } from "lucide-react";
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
  const { toast } = useToast();

  // Waitlist form
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam.trim() || !email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("course_waitlist").insert({
      naam: naam.trim(),
      email: email.trim(),
      telefoon: telefoon.trim() || null,
    });

    if (error) {
      toast({ title: "Fout", description: "Er ging iets mis. Probeer het opnieuw.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Ingeschreven!", description: "Je staat op de wachtlijst. We nemen contact met je op." });

      // Send notification to admin + confirmation to user
      const emailData = { naam: naam.trim(), email: email.trim(), telefoon: telefoon.trim() || null };
      supabase.functions.invoke("send-email", { body: { type: "waitlist_signup", data: emailData } });
      supabase.functions.invoke("send-email", { body: { type: "waitlist_confirmation", data: emailData } });
    }
    setSubmitting(false);
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
        <div className="text-center mb-8">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-heading text-foreground mb-3">Cursussen</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leer de fundamenten van de Islam op een gestructureerde manier. Schrijf je in, volg de lessen en behaal je certificaat.
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-4 text-center mb-10 max-w-xl mx-auto">
          <p className="text-primary font-semibold">🚀 Binnenkort beschikbaar voor iedereen!</p>
          <p className="text-muted-foreground text-sm mt-1">We werken hard aan ons cursusplatform. Schrijf je in voor de wachtlijst en we laten het je weten zodra het zover is.</p>
        </div>

        {/* Cursussen overzicht */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden">
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
                  <p className="text-sm text-muted-foreground italic">Binnenkort beschikbaar</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Wachtlijst formulier */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Schrijf je in voor de wachtlijst</CardTitle>
              <CardDescription>Ontvang een bericht zodra de cursussen beschikbaar zijn.</CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-foreground">Je staat op de wachtlijst!</p>
                  <p className="text-sm text-muted-foreground mt-1">We nemen contact met je op zodra de cursussen beschikbaar zijn.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Naam *"
                      value={naam}
                      onChange={(e) => setNaam(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="E-mailadres *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Telefoonnummer (optioneel)"
                      value={telefoon}
                      onChange={(e) => setTelefoon(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Bezig..." : "Inschrijven op wachtlijst"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
