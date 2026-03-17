import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import jsPDF from "jspdf";
import logoImg from "@/assets/logo-certificaat.png";

interface CertData {
  certificate_number: string;
  issued_at: string;
  courseTitle: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  score: number | null;
}

export default function CursusCertificaat() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      if (!user) { setLoading(false); return; }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      let courseQuery = supabase.from("courses").select("id, title");

      if (isUuid) {
        courseQuery = courseQuery.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        courseQuery = courseQuery.eq("slug", slug!);
      }

      const { data: course } = await courseQuery.single();
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
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      // Get best quiz score
      const { data: attempt } = await supabase
        .from("student_quiz_attempts")
        .select("score")
        .eq("enrollment_id", enrollment.id)
        .eq("passed", true)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCert({
        ...certData,
        courseTitle: course.title,
        studentName: profile?.full_name || user.email || "Student",
        studentEmail: profile?.email || user.email || "",
        studentId: user.id.substring(0, 8).toUpperCase(),
        score: attempt?.score || null,
      });
      setLoading(false);
    };
    fetchCert();
  }, [slug, user]);

  const downloadPDF = async () => {
    if (!cert) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Cream background
    doc.setFillColor(250, 248, 243);
    doc.rect(0, 0, w, h, "F");

    // Outer border - dark green
    doc.setDrawColor(26, 95, 65);
    doc.setLineWidth(2.5);
    doc.rect(8, 8, w - 16, h - 16);

    // Inner border - gold
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.rect(12, 12, w - 24, h - 24);

    // Decorative corner accents (gold)
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    const cornerSize = 15;
    // Top-left
    doc.line(12, 12 + cornerSize, 12, 12); doc.line(12, 12, 12 + cornerSize, 12);
    // Top-right
    doc.line(w - 12 - cornerSize, 12, w - 12, 12); doc.line(w - 12, 12, w - 12, 12 + cornerSize);
    // Bottom-left
    doc.line(12, h - 12 - cornerSize, 12, h - 12); doc.line(12, h - 12, 12 + cornerSize, h - 12);
    // Bottom-right
    doc.line(w - 12 - cornerSize, h - 12, w - 12, h - 12); doc.line(w - 12, h - 12, w - 12, h - 12 - cornerSize);

    // Logo
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = logoImg;
      });
      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, "PNG", w / 2 - 12, 18, 24, 24);
      }
    } catch { /* skip logo */ }

    // Mosque name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 95, 65);
    doc.text("NAHDA MOSKEE WEERT", w / 2, 48, { align: "center" });

    // Gold divider line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(w / 2 - 50, 52, w / 2 + 50, 52);

    // Title
    doc.setFontSize(28);
    doc.setTextColor(26, 95, 65);
    doc.text("CERTIFICAAT", w / 2, 65, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text("van voltooiing", w / 2, 73, { align: "center" });

    // "Uitgereikt aan"
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Dit certificaat wordt met trots uitgereikt aan", w / 2, 85, { align: "center" });

    // Student name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(26, 95, 65);
    doc.text(cert.studentName, w / 2, 98, { align: "center" });

    // Decorative line under name
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(w / 2 - 55, 102, w / 2 + 55, 102);

    // Course description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("voor het succesvol afronden van de cursus", w / 2, 112, { align: "center" });

    // Course title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(cert.courseTitle, w / 2, 123, { align: "center" });

    // Score if available
    if (cert.score) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(26, 95, 65);
      doc.text(`Eindresultaat: ${cert.score}%`, w / 2, 132, { align: "center" });
    }

    // Details section
    const date = new Date(cert.issued_at).toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    
    // Left column - Date & Location
    doc.text("Datum van uitgifte", w / 2 - 60, 148);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(date, w / 2 - 60, 154);

    // Center - Cert number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text("Certificaat Nr.", w / 2, 148, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(cert.certificate_number, w / 2, 154, { align: "center" });

    // Right - Student ID
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text("Leerling ID", w / 2 + 60, 148, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(cert.studentId, w / 2 + 60, 154, { align: "center" });

    // Signature lines
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);

    // Left signature
    doc.line(w / 2 - 70, 175, w / 2 - 20, 175);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Directeur", w / 2 - 45, 180, { align: "center" });

    // Right signature
    doc.line(w / 2 + 20, 175, w / 2 + 70, 175);
    doc.text("Docent", w / 2 + 45, 180, { align: "center" });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Nahda Moskee Weert · Industriestraat 11 · 6004 RC Weert · www.moskee-hart-weert.lovable.app", w / 2, h - 14, { align: "center" });

    doc.save(`certificaat-${cert.certificate_number}.pdf`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!cert) {
    return (
      <div className="py-12">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Je hebt nog geen certificaat voor deze cursus. Rond eerst het eindexamen af om je certificaat te ontvangen.</p>
          <Button variant="outline" asChild>
            <Link to={`/cursussen/${slug}`}>← Terug naar cursus</Link>
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

        <Card className="overflow-hidden border-2 border-primary/20">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-gold/10 p-8 text-center border-b border-border">
            <img src={logoImg} alt="Nahda Moskee Logo" className="h-16 w-16 mx-auto mb-3 object-contain" />
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Nahda Moskee Weert</p>
            <h1 className="text-3xl font-heading text-primary mb-1">Certificaat</h1>
            <p className="text-sm text-muted-foreground">van voltooiing</p>
          </div>

          {/* Body */}
          <CardContent className="p-8 text-center space-y-5">
            <p className="text-muted-foreground text-sm">Dit certificaat wordt met trots uitgereikt aan</p>
            <p className="text-3xl font-bold text-primary">{cert.studentName}</p>
            
            <div className="w-32 h-px bg-gold mx-auto" />
            
            <p className="text-muted-foreground text-sm">voor het succesvol afronden van de cursus</p>
            <p className="text-xl font-semibold text-foreground">{cert.courseTitle}</p>

            {cert.score && (
              <p className="text-primary font-medium">Eindresultaat: {cert.score}%</p>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Datum</p>
                <p className="text-sm font-medium">{date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certificaat Nr.</p>
                <p className="text-sm font-medium">{cert.certificate_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leerling ID</p>
                <p className="text-sm font-medium">{cert.studentId}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={downloadPDF} size="lg">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
