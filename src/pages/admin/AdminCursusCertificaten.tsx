import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

export default function AdminCursusCertificaten() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_certificates")
        .select(`
          *,
          course_enrollments!inner(
            student_id,
            course_id,
            courses(title),
            profiles(full_name, email)
          )
        `)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Certificaten</h1>
          <p className="text-muted-foreground">Overzicht van alle uitgereikte certificaten</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-2xl font-bold">{certificates?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Totaal uitgereikte certificaten</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : certificates?.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen certificaten uitgedeeld.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {certificates?.map((cert) => {
              const enrollment = cert.course_enrollments as any;
              return (
                <Card key={cert.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="text-primary shrink-0" size={20} />
                      <div>
                        <p className="font-semibold">{enrollment?.profiles?.full_name || "Onbekend"}</p>
                        <p className="text-sm text-muted-foreground">{enrollment?.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{enrollment?.courses?.title}</p>
                      <Badge variant="outline" className="text-xs">{cert.certificate_number}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(cert.issued_at).toLocaleDateString("nl-NL")}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
