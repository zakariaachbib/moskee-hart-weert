import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Plus, X, Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface AcademicEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  term_id: string | null;
}

interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const EVENT_TYPES = [
  { value: "semester_start", label: "Start semester", color: "bg-emerald-500" },
  { value: "semester_end", label: "Einde semester", color: "bg-red-500" },
  { value: "exam_period", label: "Examenperiode", color: "bg-purple-500" },
  { value: "holiday", label: "Vakantie", color: "bg-blue-500" },
  { value: "enrollment", label: "Inschrijfperiode", color: "bg-amber-500" },
  { value: "deadline", label: "Deadline", color: "bg-orange-500" },
  { value: "general", label: "Overig", color: "bg-muted-foreground" },
];

export default function AcademicCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: eventData }, { data: termData }] = await Promise.all([
        supabase.from("academic_events").select("*").order("start_date"),
        supabase.from("academic_terms").select("*").order("start_date", { ascending: false }),
      ]);
      setEvents(eventData || []);
      setTerms(termData || []);
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddEvent = async (form: { title: string; description: string; event_type: string; start_date: string; end_date: string; term_id: string }) => {
    try {
      const { error } = await supabase.from("academic_events").insert({
        title: form.title, description: form.description || null,
        event_type: form.event_type, start_date: form.start_date,
        end_date: form.end_date || null, term_id: form.term_id || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({ title: "Evenement toegevoegd" });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleAddTerm = async (form: { name: string; start_date: string; end_date: string }) => {
    try {
      const { error } = await supabase.from("academic_terms").insert(form);
      if (error) throw error;
      toast({ title: "Periode toegevoegd" });
      setShowTermModal(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Evenement verwijderen?")) return;
    await supabase.from("academic_events").delete().eq("id", id);
    fetchData();
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => {
      if (e.start_date === dateStr) return true;
      if (e.end_date && e.start_date <= dateStr && e.end_date >= dateStr) return true;
      return false;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Academische Kalender</h2>
          <p className="text-muted-foreground text-sm mt-1">Plan en bekijk het academisch jaar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTermModal(true)}
            className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            Periode toevoegen
          </button>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} /> Evenement
          </button>
        </div>
      </div>

      {/* Terms overview */}
      {terms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {terms.map(t => (
            <div key={t.id} className={`bg-card border border-border rounded-xl p-4 ${t.is_active ? "ring-2 ring-primary/30" : ""}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground text-sm">{t.name}</h4>
                {t.is_active && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Actief</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(t.start_date).toLocaleDateString("nl-NL")} — {new Date(t.end_date).toLocaleDateString("nl-NL")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft size={18} className="text-foreground" />
          </button>
          <h3 className="text-lg font-heading text-foreground capitalize">{monthName}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight size={18} className="text-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {/* Offset for first day (Monday = 0) */}
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <div key={day}
                className={`min-h-[60px] p-1 rounded-lg border text-xs ${isToday ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}>
                <span className={`font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                {dayEvents.slice(0, 2).map(e => {
                  const typeInfo = EVENT_TYPES.find(t => t.value === e.event_type);
                  return (
                    <div key={e.id} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] text-white truncate ${typeInfo?.color || "bg-muted-foreground"}`}>
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-heading text-foreground mb-4">Komende evenementen</h3>
        <div className="space-y-2">
          {events.filter(e => e.start_date >= new Date().toISOString().split("T")[0]).slice(0, 10).map(e => {
            const typeInfo = EVENT_TYPES.find(t => t.value === e.event_type);
            return (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-3 h-3 rounded-full shrink-0 ${typeInfo?.color || "bg-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.start_date).toLocaleDateString("nl-NL")}
                    {e.end_date && ` — ${new Date(e.end_date).toLocaleDateString("nl-NL")}`}
                    {" · "}{typeInfo?.label}
                  </p>
                </div>
                <button onClick={() => handleDeleteEvent(e.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={14} /></button>
              </div>
            );
          })}
          {events.length === 0 && <p className="text-sm text-muted-foreground py-4">Geen evenementen gepland</p>}
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading text-foreground">Nieuw evenement</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <EventForm terms={terms} onSave={handleAddEvent} />
          </div>
        </div>
      )}

      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowTermModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading text-foreground">Nieuwe periode</h3>
              <button onClick={() => setShowTermModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <TermForm onSave={handleAddTerm} />
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({ terms, onSave }: { terms: Term[]; onSave: (form: any) => void }) {
  const [form, setForm] = useState({ title: "", description: "", event_type: "general", start_date: "", end_date: "", term_id: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Titel *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Type</label>
        <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
          {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Startdatum *</label>
          <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Einddatum</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Periode</label>
        <select value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm">
          <option value="">Geen specifieke periode</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
        Evenement toevoegen
      </button>
    </form>
  );
}

function TermForm({ onSave }: { onSave: (form: any) => void }) {
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Naam *</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="bijv. Semester 1 2025-2026"
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Startdatum *</label>
          <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Einddatum *</label>
          <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-foreground text-sm" />
        </div>
      </div>
      <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
        Periode toevoegen
      </button>
    </form>
  );
}
