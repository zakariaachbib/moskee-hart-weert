import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Users, GraduationCap, Clock, Mail, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCursussen() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", image_url: "" });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-courses-stats"],
    queryFn: async () => {
      const [levels, modules, lessons, enrollments, waitlist] = await Promise.all([
        supabase.from("course_levels").select("id, course_id"),
        supabase.from("course_modules").select("id"),
        supabase.from("course_lessons").select("id"),
        supabase.from("course_enrollments").select("id"),
        supabase.from("course_waitlist" as any).select("id"),
      ]);
      return {
        levels: levels.data?.length || 0,
        modules: modules.data?.length || 0,
        lessons: lessons.data?.length || 0,
        enrollments: enrollments.data?.length || 0,
        waitlist: (waitlist.data as any[])?.length || 0,
      };
    },
  });

  const { data: waitlistEntries, isLoading: waitlistLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_waitlist" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteWaitlist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_waitlist" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses-stats"] });
      toast({ title: "Inschrijving verwijderd" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string; is_published?: boolean }) => {
      if (data.id) {
        const { error } = await supabase.from("courses").update({
          title: data.title,
          slug: data.slug,
          description: data.description,
          image_url: data.image_url || null,
        }).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert({
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description: data.description,
          image_url: data.image_url || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setDialogOpen(false);
      setEditingCourse(null);
      setForm({ title: "", slug: "", description: "", image_url: "" });
      toast({ title: editingCourse ? "Cursus bijgewerkt" : "Cursus aangemaakt" });
    },
    onError: (err: any) => toast({ title: "Fout", description: err.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("courses").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Status bijgewerkt" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Cursus verwijderd" });
    },
  });

  const openEdit = (course: any) => {
    setEditingCourse(course);
    setForm({ title: course.title, slug: course.slug || "", description: course.description || "", image_url: course.image_url || "" });
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cursussen</h1>
            <p className="text-muted-foreground">Beheer alle cursussen van het leerplatform</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingCourse(null); setForm({ title: "", slug: "", description: "", image_url: "" }); } }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" />Nieuwe cursus</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Cursus bewerken" : "Nieuwe cursus"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Titel</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bijv. Fundamenten van de Islam" />
                </div>
                <div>
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="fundamenten-van-de-islam" />
                </div>
                <div>
                  <Label>Beschrijving</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div>
                  <Label>Afbeelding URL</Label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <Button onClick={() => saveMutation.mutate({ ...form, id: editingCourse?.id })} disabled={!form.title || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? "Opslaan..." : editingCourse ? "Bijwerken" : "Aanmaken"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6 text-center"><BookOpen className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{courses?.length || 0}</p><p className="text-xs text-muted-foreground">Cursussen</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><GraduationCap className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{stats?.levels || 0}</p><p className="text-xs text-muted-foreground">Niveaus</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><BookOpen className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{stats?.lessons || 0}</p><p className="text-xs text-muted-foreground">Lessen</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Users className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{stats?.enrollments || 0}</p><p className="text-xs text-muted-foreground">Inschrijvingen</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="mx-auto mb-2 text-primary" size={24} /><p className="text-2xl font-bold">{stats?.waitlist || 0}</p><p className="text-xs text-muted-foreground">Wachtlijst</p></CardContent></Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses">Cursussen</TabsTrigger>
            <TabsTrigger value="waitlist">
              Wachtlijst
              {(stats?.waitlist || 0) > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{stats?.waitlist}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {/* Course list */}
            {isLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : courses?.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen cursussen aangemaakt.</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {courses?.map((course) => (
                  <Card key={course.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <Badge variant={course.is_published ? "default" : "secondary"}>
                              {course.is_published ? "Gepubliceerd" : "Concept"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">/{course.slug}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => togglePublish.mutate({ id: course.id, published: !course.is_published })} title={course.is_published ? "Verbergen" : "Publiceren"}>
                            {course.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(course)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Weet je zeker dat je deze cursus wilt verwijderen?")) deleteMutation.mutate(course.id); }}><Trash2 size={16} className="text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="waitlist">
            {waitlistLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
            ) : !waitlistEntries?.length ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nog geen wachtlijst-inschrijvingen.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefoon</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlistEntries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.naam}</TableCell>
                          <TableCell>
                            <a href={`mailto:${entry.email}`} className="text-primary hover:underline flex items-center gap-1">
                              <Mail size={14} />{entry.email}
                            </a>
                          </TableCell>
                          <TableCell>{entry.telefoon || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(entry.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Verwijderen?")) deleteWaitlist.mutate(entry.id); }}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
