import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import jsPDF from "jspdf";

interface CertData {
  certificate_number: string;
  issued_at: string;
  courseTitle: string;
  studentName: string;
}

export default function CursusCertificaat() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }

      const { data: course } = await supabase
        .from("courses")
        .select("id, title")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();
      if (!course) { setLoading(false); return; }

      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", course.id)
        .eq("student_id", user.id)
        .maybeSingle();
      if (!enrollment) { setLoading(false); return; }

      const { data: certData } = await supabase
        .from("course_certificates")
        .select("certificate_number, issued_at")
        .eq("enrollment_id", enrollment.id)
        .maybeSingle();
      if (!certData) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setCert({
        ...certData,
        courseTitle: course.title,
        studentName: profile?.full_name || user.email || "Student",
      });
      setLoading(false);
    };
    fetch();
  }, [slug, user]);

  const downloadPDF = () => {
    if (!cert) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(245, 243, 237);
    doc.rect(0, 0, w, h, "F");

    // Border
    doc.setDrawColor(26, 95, 65);
    doc.setLineWidth(2);
    doc.rect(10, 10, w - 20, h - 20);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, w - 28, h - 28);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 95, 65);
    doc.text("ISLAMITISCHE ACADEMIE", w / 2, 35, { align: "center" });

    doc.setFontSize(32);
    doc.setTextColor(33, 33, 33);
    doc.text("CERTIFICAAT", w / 2, 55, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Dit certificaat wordt uitgereikt aan", w / 2, 72, { align: "center" });

    // Student name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(26, 95, 65);
    doc.text(cert.studentName, w / 2, 90, { align: "center" });

    // Line
    doc.setDrawColor(26, 95, 65);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - 60, 95, w / 2 + 60, 95);

    // Course
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("voor het succesvol afronden van de cursus", w / 2, 108, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text(cert.courseTitle, w / 2, 122, { align: "center" });

    // Date & cert number
    const date = new Date(cert.issued_at).toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(`Datum: ${date}`, w / 2, 145, { align: "center" });
    doc.text(`Certificaat ID: ${cert.certificate_number}`, w / 2, 153, { align: "center" });

    // Signature line
    doc.setDrawColor(150, 150, 150);
    doc.line(w / 2 - 30, 175, w / 2 + 30, 175);
    doc.setFontSize(10);
    doc.text("Directeur", w / 2, 181, { align: "center" });

    doc.save(`certificaat-${cert.certificate_number}.pdf`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!cert) {
    return (
      <div className="py-12">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">Je hebt nog geen certificaat voor deze cursus.</p>
          <Button variant="outline" asChild>
            <Link to={`/cursussen/${slug}`}>Terug naar cursus</Link>
          </Button>
        </div>
      </div>
    );
  }

  const date = new Date(cert.issued_at).toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link to={`/cursussen/${slug}`} className="text-sm text-primary hover:underline mb-4 inline-block">← Terug naar cursus</Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border">
            <Award className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Certificaat</p>
            <h1 className="text-2xl font-heading text-foreground mb-1">Gefeliciteerd!</h1>
          </div>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Dit certificaat is uitgereikt aan</p>
            <p className="text-2xl font-bold text-primary">{cert.studentName}</p>
            <p className="text-muted-foreground">voor het succesvol afronden van</p>
            <p className="text-xl font-semibold">{cert.courseTitle}</p>
            <div className="pt-4 text-sm text-muted-foreground space-y-1">
              <p>Datum: {date}</p>
              <p>Certificaat ID: {cert.certificate_number}</p>
            </div>
            <Button onClick={downloadPDF} size="lg" className="mt-6">
              <Download className="h-4 w-4 mr-2" /> Download als PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
