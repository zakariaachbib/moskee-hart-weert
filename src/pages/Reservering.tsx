import { useState, useMemo } from "react";
import { format, isSunday, addDays, isBefore, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Clock, CalendarDays, AlertTriangle, CheckCircle2, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import zaalVerhuur1 from "@/assets/media/zaal-verhuur.jpg";
import zaalVerhuur2 from "@/assets/media/keuken-verhuur.jpg";

const DURATION_HOURS = 8;
const MIN_START_HOUR = 8;
const MAX_START_HOUR = 16;
const SUNDAY_MIN_START = "15:30";

function generateTimeSlots(date: Date | undefined): string[] {
  if (!date) return [];
  const slots: string[] = [];
  if (isSunday(date)) {
    slots.push("15:30");
    slots.push("16:00");
  } else {
    for (let h = MIN_START_HOUR; h <= MAX_START_HOUR; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      if (h < MAX_START_HOUR) {
        slots.push(`${String(h).padStart(2, "0")}:30`);
      }
    }
  }
  return slots;
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const endHours = (hours + DURATION_HOURS) % 24;
  return `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type Step = "calendar" | "time" | "form" | "summary" | "confirmation";

export default function Reservering() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("calendar");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    reservationType: "",
    rooms: "1",
    guestCount: "",
    activityType: "",
    notes: "",
    agreed: false,
  });

  const endTime = startTime ? calculateEndTime(startTime) : "";
  const timeSlots = useMemo(() => generateTimeSlots(date), [date]);

  const fetchBookedSlots = async (selectedDate: Date) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data } = await supabase
      .from("facility_reservations")
      .select("start_time")
      .eq("date", dateStr)
      .in("status", ["approved", "pending"]);
    if (data) {
      setBookedSlots(data.map((r: any) => r.start_time?.substring(0, 5)));
    }
  };

  const handleDateSelect = async (d: Date | undefined) => {
    if (!d) return;
    setDate(d);
    setStartTime("");
    await fetchBookedSlots(d);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setStartTime(time);
    setStep("form");
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.email.includes("@") &&
    formData.reservationType &&
    formData.activityType &&
    formData.guestCount &&
    formData.agreed;

  const handleSubmit = async () => {
    if (!date || !startTime || !isFormValid) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("facility_reservations").insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        date: format(date, "yyyy-MM-dd"),
        start_time: startTime + ":00",
        end_time: endTime + ":00",
        duration_hours: DURATION_HOURS,
        reservation_type: formData.reservationType,
        rooms: parseInt(formData.rooms),
        guest_count: parseInt(formData.guestCount) || 0,
        activity_type: formData.activityType,
        notes: formData.notes || null,
        status: "pending",
      });
      if (error) throw error;

      const emailData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        date: format(date, "d MMMM yyyy", { locale: nl }),
        start_time: startTime,
        end_time: endTime,
        reservation_type: formData.reservationType,
        rooms: formData.rooms,
        guest_count: formData.guestCount || "0",
        activity_type: formData.activityType,
        notes: formData.notes || null,
      };

      // Send admin notification + confirmation to applicant in parallel
      const [adminEmail, confirmEmail] = await Promise.allSettled([
        supabase.functions.invoke("send-email", {
          body: { type: "facility_reservation", data: emailData },
        }),
        supabase.functions.invoke("send-email", {
          body: { type: "facility_reservation_confirmation", data: emailData },
        }),
      ]);

      if (adminEmail.status === "rejected" || (adminEmail.status === "fulfilled" && adminEmail.value.error)) {
        console.error("Admin email failed:", adminEmail);
      }
      if (confirmEmail.status === "rejected" || (confirmEmail.status === "fulfilled" && confirmEmail.value.error)) {
        console.error("Confirmation email failed:", confirmEmail);
      }
      setStep("confirmation");
    } catch (err: any) {
      console.error("Reservation error:", err);
      toast({ title: "Fout", description: "Er ging iets mis bij het verzenden. Probeer het opnieuw.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reservationTypeLabel: Record<string, string> = {
    hall: "Alleen zaal",
    kitchen: "Alleen keuken",
    hall_and_kitchen: "Zaal + keuken",
  };

  const activityTypeLabel: Record<string, string> = {
    feest: "Feest (zonder muziek)",
    familie: "Familie bijeenkomst",
    vergadering: "Vergadering",
    overig: "Overig",
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="bg-brown text-cream py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl mb-4">
            Zaal- en keukenreservering
          </h1>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Via dit formulier kunt u een reserveringsaanvraag indienen voor een zaal, de keuken of beide.
            Reserveringen duren altijd 8 uur. U kiest zelf een starttijd en de eindtijd wordt automatisch berekend.
          </p>
        </div>
      </section>

      {/* Photo banner */}
      <section className="container max-w-4xl -mt-6 mb-4 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-2xl relative group">
            <img src={zaalVerhuur} alt="Zaalverhuur" className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <span className="text-white font-heading text-lg">Zaalverhuur</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="overflow-hidden rounded-2xl relative group">
            <img src={keukenVerhuur} alt="Keukenverhuur" className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <span className="text-white font-heading text-lg">Keukenverhuur</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info cards */}
      <section className="container max-w-4xl -mt-8 mb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex gap-3">
            <AlertTriangle className="text-gold shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-sm text-foreground">Zondagsregel</p>
              <p className="text-sm text-muted-foreground mt-1">
                Op zondag is reserveren vóór 15:30 niet mogelijk vanwege onderwijs.
              </p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex gap-3">
            <Info className="text-destructive shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-sm text-foreground">Niet toegestaan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Muziek, onderwijs en lezingen zijn niet toegestaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stepper */}
      <section className="container max-w-4xl pb-20">
        {/* Progress bar */}
        {step !== "confirmation" && (
          <div className="flex items-center gap-2 mb-8">
            {(["calendar", "time", "form", "summary"] as Step[]).map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    step === s || (["calendar", "time", "form", "summary"].indexOf(step) > i)
                      ? "bg-gold text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className={cn(
                    "flex-1 h-0.5 transition-colors",
                    ["calendar", "time", "form", "summary"].indexOf(step) > i ? "bg-gold" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Calendar */}
          {step === "calendar" && (
            <motion.div key="cal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h2 className="font-heading text-xl mb-1">Kies een datum</h2>
                <p className="text-sm text-muted-foreground mb-4">Selecteer de gewenste datum voor uw reservering.</p>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  locale={nl}
                  disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                  className="p-3 pointer-events-auto w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_cell]:w-auto [&_.rdp-cell]:w-auto [&_.rdp-cell]:flex-1 [&_.rdp-head_cell]:flex-1 [&_.rdp-row]:flex [&_.rdp-head_row]:flex [&_.rdp-day]:h-12 [&_.rdp-day]:w-full"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Time selection */}
          {step === "time" && date && (
            <motion.div key="time" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-heading text-xl">Kies een starttijd</h2>
                  <button onClick={() => setStep("calendar")} className="text-sm text-gold hover:underline">← Datum wijzigen</button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(date, "EEEE d MMMM yyyy", { locale: nl })}
                </p>
                {isSunday(date) && (
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-3 mb-4 flex gap-2 text-sm">
                    <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
                    <span>Het is zondag — reserveringen starten pas vanaf 15:30 vanwege onderwijs.</span>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => handleTimeSelect(slot)}
                        className={cn(
                          "py-3 px-2 rounded-lg text-sm font-medium border transition-all",
                          isBooked
                            ? "bg-muted text-muted-foreground border-muted cursor-not-allowed line-through"
                            : startTime === slot
                            ? "bg-gold text-white border-gold"
                            : "bg-card border-border hover:border-gold hover:text-gold"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {timeSlots.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Geen beschikbare tijden op deze datum.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Form */}
          {step === "form" && date && startTime && (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-heading text-xl">Reserveringsgegevens</h2>
                  <button onClick={() => setStep("time")} className="text-sm text-gold hover:underline">← Tijd wijzigen</button>
                </div>

                {/* Time summary banner */}
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-6 mt-3 flex items-center gap-3">
                  <Clock size={18} className="text-gold shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold">{format(date, "EEEE d MMMM yyyy", { locale: nl })}</span>
                    <br />
                    Uw reservering loopt van <strong>{startTime}</strong> tot <strong>{endTime}</strong> (8 uur)
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Naam reserveerder *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Uw volledige naam" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefoonnummer *</Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+31 6 12345678" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">E-mailadres *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="uw@email.nl" className="mt-1" />
                  </div>

                  {/* Reservation type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Wat wilt u reserveren? *</Label>
                      <Select value={formData.reservationType} onValueChange={(v) => updateField("reservationType", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Kies een optie" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hall">Alleen zaal</SelectItem>
                          <SelectItem value="kitchen">Alleen keuken</SelectItem>
                          <SelectItem value="hall_and_kitchen">Zaal + keuken</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rooms">Aantal zalen / lokalen</Label>
                      <Select value={formData.rooms} onValueChange={(v) => updateField("rooms", v)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestCount">Aantal personen *</Label>
                      <Input id="guestCount" type="number" min="1" value={formData.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} placeholder="Bijv. 50" className="mt-1" />
                    </div>
                    <div>
                      <Label>Type activiteit *</Label>
                      <Select value={formData.activityType} onValueChange={(v) => updateField("activityType", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Kies een type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feest">Feest (zonder muziek)</SelectItem>
                          <SelectItem value="familie">Familie bijeenkomst</SelectItem>
                          <SelectItem value="vergadering">Vergadering</SelectItem>
                          <SelectItem value="overig">Overig</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Opmerkingen</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Eventuele bijzonderheden..." className="mt-1" rows={3} />
                  </div>

                  {/* Agreement */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Reserveringsvoorwaarden</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Muziek is niet toegestaan</li>
                      <li>Onderwijs en lezingen zijn niet toegestaan</li>
                      <li>De reservering duurt altijd 8 uur</li>
                      <li>De reservering is pas definitief na bevestiging door de beheerder</li>
                    </ul>
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="agree"
                        checked={formData.agreed}
                        onCheckedChange={(checked) => updateField("agreed", !!checked)}
                      />
                      <Label htmlFor="agree" className="text-sm cursor-pointer">
                        Ik ga akkoord met de reserveringsvoorwaarden *
                      </Label>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep("summary")}
                    disabled={!isFormValid}
                    className="w-full bg-gold hover:bg-gold-dark text-white py-6"
                  >
                    Bekijk samenvatting
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Summary */}
          {step === "summary" && date && startTime && (
            <motion.div key="summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl">Samenvatting</h2>
                  <button onClick={() => setStep("form")} className="text-sm text-gold hover:underline">← Gegevens wijzigen</button>
                </div>
                <div className="space-y-3 text-sm">
                  <SummaryRow label="Datum" value={format(date, "EEEE d MMMM yyyy", { locale: nl })} />
                  <SummaryRow label="Tijd" value={`${startTime} – ${endTime} (8 uur)`} />
                  <SummaryRow label="Reservering" value={reservationTypeLabel[formData.reservationType] || formData.reservationType} />
                  <SummaryRow label="Aantal zalen" value={formData.rooms} />
                  <SummaryRow label="Aantal personen" value={formData.guestCount} />
                  <SummaryRow label="Type activiteit" value={activityTypeLabel[formData.activityType] || formData.activityType} />
                  <div className="border-t border-border pt-3 mt-3" />
                  <SummaryRow label="Naam" value={formData.name} />
                  <SummaryRow label="Telefoon" value={formData.phone} />
                  <SummaryRow label="E-mail" value={formData.email} />
                  {formData.notes && <SummaryRow label="Opmerkingen" value={formData.notes} />}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                    Terug
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-gold hover:bg-gold-dark text-white"
                  >
                    {loading ? "Verzenden..." : "Aanvraag versturen"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Confirmation */}
          {step === "confirmation" && date && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-card rounded-xl border border-border p-8 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h2 className="font-heading text-2xl mb-2">Aanvraag ontvangen</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  Uw reserveringsaanvraag is succesvol ontvangen. De reservering is pas definitief na bevestiging door de beheerder.
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Er is een bevestigingsmail verzonden naar <strong className="text-foreground">{formData.email}</strong>.
                </p>

                {/* WhatsApp button */}
                <a
                  href={`https://wa.me/31616958298?text=${encodeURIComponent(
                    `Assalamu alaikum,\n\nIk heb zojuist een reserveringsaanvraag ingediend via de website.\n\n📅 Datum: ${format(date, "d MMMM yyyy", { locale: nl })}\n🕐 Tijd: ${startTime} – ${endTime}\n📍 Type: ${reservationTypeLabel[formData.reservationType] || formData.reservationType}\n👥 Personen: ${formData.guestCount}\n👤 Naam: ${formData.name}\n\nKunt u de reservering bevestigen?\n\nBedankt!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Bevestig via WhatsApp
                </a>
                <p className="text-xs text-muted-foreground mt-3">
                  Stuur de coördinator direct een bericht voor snellere bevestiging
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact coordinator */}
        <div className="mt-10 bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-heading text-lg mb-3">Reserveringscoördinator</h3>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Tarik Ghanmi</p>
            <a href="tel:+31616958298" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Phone size={14} /> +31 6 16958298
            </a>
            <a href="https://wa.me/31616958298?text=Assalamu%20alaikum%2C%20ik%20wil%20graag%20een%20zaal%2Fkeuken%20reservering%20maken." target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <p className="mt-2 text-xs">
              Voor vragen over reserveringen kunt u contact opnemen met de reserveringscoördinator.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
