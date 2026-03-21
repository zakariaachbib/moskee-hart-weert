import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Send, CheckCircle2, CalendarDays, GraduationCap } from "lucide-react";
import { z } from "zod";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const schema = z.object({
  achternaam: z.string().trim().min(1, "Achternaam is verplicht").max(100),
  voornamen: z.string().trim().min(1, "Voornamen is verplicht").max(100),
  geboortedatum: z.date({ required_error: "Geboortedatum is verplicht" }),
  geslacht: z.enum(["jongen", "meisje"], { required_error: "Geslacht is verplicht" }),
  ouder_naam: z.string().trim().min(1, "Naam ouder/verzorger is verplicht").max(100),
  telefoon: z.string().trim().min(6, "Telefoonnummer is verplicht").max(20),
  adres: z.string().trim().min(3, "Adres is verplicht").max(200),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  toestemming_foto: z.boolean(),
  akkoord_privacy: z.literal(true, { errorMap: () => ({ message: "U dient akkoord te gaan met de privacyverklaring" }) }),
  opmerkingen: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

type FieldErrors = Partial<Record<keyof FormData, string>>;

export default function Inschrijving() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    achternaam: "",
    voornamen: "",
    geboortedatum: undefined as Date | undefined,
    geslacht: "" as "" | "jongen" | "meisje",
    ouder_naam: "",
    telefoon: "",
    adres: "",
    email: "",
    toestemming_foto: false,
    akkoord_privacy: false,
    opmerkingen: "",
  });

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const data = result.data;
      const dbData = {
        achternaam: data.achternaam,
        voornamen: data.voornamen,
        geboortedatum: format(data.geboortedatum, "yyyy-MM-dd"),
        geslacht: data.geslacht,
        ouder_naam: data.ouder_naam,
        telefoon: data.telefoon,
        adres: data.adres,
        email: data.email,
        toestemming_foto: data.toestemming_foto,
        akkoord_privacy: data.akkoord_privacy,
        opmerkingen: data.opmerkingen || null,
      };

      const { error } = await supabase.from("education_registrations" as any).insert(dbData as any);
      if (error) throw error;

      // Send emails in parallel
      const emailData = {
        ...dbData,
        geboortedatum: format(data.geboortedatum, "d MMMM yyyy", { locale: nl }),
      };

      await Promise.allSettled([
        supabase.functions.invoke("send-email", {
          body: { type: "education_registration", data: emailData },
        }),
        supabase.functions.invoke("send-email", {
          body: { type: "education_registration_confirmation", data: emailData },
        }),
      ]);

      setSubmitted(true);
      toast({ title: "Inschrijving verzonden!", description: "U ontvangt een bevestiging per e-mail." });
    } catch (err) {
      console.error("Registration error:", err);
      toast({ title: "Er ging iets mis", description: "Probeer het later opnieuw.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key: keyof FormData) =>
    cn(
      "w-full px-4 py-3 rounded-xl bg-background border transition-colors outline-none text-foreground",
      errors[key]
        ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
        : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
    );

  const FieldError = ({ field }: { field: keyof FormData }) =>
    errors[field] ? <p className="text-destructive text-xs mt-1">{errors[field]}</p> : null;

  const Label = ({ nl: nlLabel, htmlFor, required }: { nl: string; htmlFor: string; required?: boolean }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
      {nlLabel} {required && <span className="text-destructive">*</span>}
    </label>
  );

  if (submitted) {
    return (
      <>
        <section className="bg-brown py-20">
          <div className="container text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
              Inschrijving Onderwijs
            </motion.h1>
            <p className="text-cream/70 mt-4">Inschrijfformulier</p>
          </div>
        </section>
        <section className="py-20 islamic-pattern">
          <div className="container max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-primary" size={32} />
              </div>
              <h2 className="font-heading text-2xl mb-2 text-foreground">Inschrijving Ontvangen</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Uw inschrijving voor het onderwijs bij Nahda Weert is succesvol verzonden.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Er is een bevestigingsmail verzonden naar <strong className="text-foreground">{form.email}</strong>.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    achternaam: "", voornamen: "", geboortedatum: undefined, geslacht: "",
                    ouder_naam: "", telefoon: "", adres: "", email: "",
                    toestemming_foto: false, akkoord_privacy: false, opmerkingen: "",
                  });
                }}
                className="text-sm text-primary hover:underline font-medium"
              >
                Nieuwe inschrijving
              </button>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-brown py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            Inschrijving Onderwijs
          </motion.h1>
          <p className="text-cream/70 mt-4">Inschrijfformulier</p>
        </div>
      </section>

      <section className="py-20 islamic-pattern">
        <div className="container max-w-3xl">
          {/* Intro */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-6 md:p-8 border border-border mb-10 text-center">
            <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-primary" size={28} />
            </div>
            <p className="text-foreground leading-relaxed">
              Schrijf uw kind in voor het onderwijs bij Nahda Weert. Wij bieden kwalitatief onderwijs in een veilige en inspirerende omgeving.
            </p>
            <p className="text-muted-foreground text-sm mt-2" dir="rtl">
              سجّل طفلك في التعليم بمسجد النهضة ويرت. نحن نقدم تعليمًا عالي الجودة في بيئة آمنة وملهمة.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Section: Gegevens leerling */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-foreground">Gegevens leerling</h2>
                <span className="text-muted-foreground text-sm" dir="rtl">معلومات التلميذ</span>
              </div>
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label nl="Achternaam" ar="الاسم العائلي" htmlFor="achternaam" required />
                    <input id="achternaam" type="text" maxLength={100} value={form.achternaam} onChange={(e) => set("achternaam", e.target.value)} className={inputClass("achternaam")} placeholder="Achternaam" />
                    <FieldError field="achternaam" />
                  </div>
                  <div>
                    <Label nl="Voornamen" ar="الاسم الشخصي" htmlFor="voornamen" required />
                    <input id="voornamen" type="text" maxLength={100} value={form.voornamen} onChange={(e) => set("voornamen", e.target.value)} className={inputClass("voornamen")} placeholder="Voornamen" />
                    <FieldError field="voornamen" />
                  </div>
                </div>

                <div>
                  <Label nl="Geboortedatum" ar="تاريخ الازدياد" htmlFor="geboortedatum" required />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="geboortedatum"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 rounded-xl",
                          !form.geboortedatum && "text-muted-foreground",
                          errors.geboortedatum && "border-destructive"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {form.geboortedatum ? format(form.geboortedatum, "d MMMM yyyy", { locale: nl }) : "Selecteer geboortedatum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.geboortedatum}
                        onSelect={(d) => set("geboortedatum", d)}
                        captionLayout="dropdown-buttons"
                        fromYear={2005}
                        toYear={2024}
                        disabled={(d) => d > new Date()}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError field="geboortedatum" />
                </div>

                <div>
                  <Label nl="Geslacht" ar="الجنس" htmlFor="geslacht" required />
                  <div className="flex gap-4 mt-1">
                    {[
                      { value: "jongen", nl: "Jongen", ar: "ذكر" },
                      { value: "meisje", nl: "Meisje", ar: "أنثى" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("geslacht", opt.value)}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                          form.geslacht === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary text-foreground"
                        )}
                      >
                        {opt.nl} / {opt.ar}
                      </button>
                    ))}
                  </div>
                  <FieldError field="geslacht" />
                </div>
              </div>
            </div>

            {/* Section: Gegevens ouder/verzorger */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-foreground">Gegevens ouder/verzorger</h2>
                <span className="text-muted-foreground text-sm" dir="rtl">معلومات ولي الأمر</span>
              </div>
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border space-y-5">
                <div>
                  <Label nl="Naam ouder/verzorger" ar="اسم ولي الأمر" htmlFor="ouder_naam" required />
                  <input id="ouder_naam" type="text" maxLength={100} value={form.ouder_naam} onChange={(e) => set("ouder_naam", e.target.value)} className={inputClass("ouder_naam")} placeholder="Volledige naam" />
                  <FieldError field="ouder_naam" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label nl="Telefoon" ar="الهاتف" htmlFor="telefoon" required />
                    <input id="telefoon" type="tel" maxLength={20} value={form.telefoon} onChange={(e) => set("telefoon", e.target.value)} className={inputClass("telefoon")} placeholder="+31 6 ..." />
                    <FieldError field="telefoon" />
                  </div>
                  <div>
                    <Label nl="E-mailadres" ar="البريد الإلكتروني" htmlFor="email" required />
                    <input id="email" type="email" maxLength={255} value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass("email")} placeholder="uw@email.nl" />
                    <FieldError field="email" />
                  </div>
                </div>
                <div>
                  <Label nl="Adres" ar="العنوان" htmlFor="adres" required />
                  <input id="adres" type="text" maxLength={200} value={form.adres} onChange={(e) => set("adres", e.target.value)} className={inputClass("adres")} placeholder="Straat, huisnummer, postcode, plaats" />
                  <FieldError field="adres" />
                </div>
              </div>
            </div>

            {/* Section: Extra */}
            <div className="mb-10">
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border space-y-5">
                <div>
                  <label htmlFor="opmerkingen" className="block text-sm font-medium text-foreground mb-1.5">
                    Opmerkingen <span className="text-muted-foreground font-normal">(optioneel)</span>
                  </label>
                  <textarea
                    id="opmerkingen"
                    maxLength={1000}
                    rows={3}
                    value={form.opmerkingen}
                    onChange={(e) => set("opmerkingen", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground resize-none"
                    placeholder="Eventuele opmerkingen of bijzonderheden..."
                  />
                </div>

                {/* Photo consent */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="toestemming_foto"
                      checked={form.toestemming_foto}
                      onCheckedChange={(c) => set("toestemming_foto", !!c)}
                      className="mt-0.5"
                    />
                    <div>
                      <label htmlFor="toestemming_foto" className="text-sm text-foreground cursor-pointer leading-relaxed">
                        Ik geef toestemming om mijn kind te laten deelnemen aan activiteiten en het maken van foto's.
                      </label>
                      <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                        أصرح بموافقتي على اشتراك المسجل بالنشاطات والتصوير.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy */}
                <div className={cn("border rounded-xl p-4", errors.akkoord_privacy ? "border-destructive bg-destructive/5" : "border-border")}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="akkoord_privacy"
                      checked={form.akkoord_privacy}
                      onCheckedChange={(c) => set("akkoord_privacy", !!c)}
                      className="mt-0.5"
                    />
                    <label htmlFor="akkoord_privacy" className="text-sm text-foreground cursor-pointer leading-relaxed">
                      Ik ga akkoord met de privacyverklaring <span className="text-destructive">*</span>
                    </label>
                  </div>
                  <FieldError field="akkoord_privacy" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-gold text-primary-foreground px-10 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2 text-lg"
              >
                <Send size={18} />
                {loading ? "Bezig met verzenden..." : "Aanmelden"}
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                Velden met <span className="text-destructive">*</span> zijn verplicht
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
