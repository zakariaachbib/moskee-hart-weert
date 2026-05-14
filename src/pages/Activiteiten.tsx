import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import coordinatorMounirPhoto from "@/assets/mounir-marzouk.jpg";
import ActiviteitenAgenda from "@/components/ActiviteitenAgenda";

interface Activity {
  id: string;
  titel: string;
  omschrijving: string | null;
  dag: string | null;
  tijd: string | null;
  locatie: string | null;
}

const fallbackActivities: Activity[] = [
  { id: "1", titel: "Vrijdaggebed", omschrijving: "Wekelijks vrijdaggebed met khutbah", dag: "Elke vrijdag", tijd: "12:30 - 13:30", locatie: "Gebedshal" },
  { id: "2", titel: "Arabische Les - Kinderen", omschrijving: "Arabische taal en Quran lessen voor kinderen", dag: "Za & Zo", tijd: "10:00 - 13:00", locatie: "Klaslokalen" },
  { id: "3", titel: "Islamitische Les - Volwassenen", omschrijving: "Wekelijkse les over islamitische onderwerpen", dag: "Elke zaterdag", tijd: "20:00 - 21:30", locatie: "Gebedshal" },
  { id: "4", titel: "Quran Recitatie", omschrijving: "Leer de juiste uitspraak en recitatie van de Quran", dag: "Elke zondag", tijd: "14:00 - 16:00", locatie: "Klaslokaal 1" },
  { id: "5", titel: "Iftar (Ramadan)", omschrijving: "Gezamenlijke iftar tijdens de maand Ramadan", dag: "Tijdens Ramadan", tijd: "Bij zonsondergang", locatie: "Eetzaal" },
  { id: "6", titel: "Eid Gebed", omschrijving: "Feestgebed ter ere van Eid al-Fitr en Eid al-Adha", dag: "Op Eid dagen", tijd: "08:00", locatie: "Gebedshal" },
];

const WERKGROEPEN = [
  "Werkgroep Activiteiten",
  "Werkgroep Onderwijs",
  "Werkgroep Dames",
  "Werkgroep Jeugd",
  "Werkgroep Fondsenwerving",
  "Bestuur",
  "Anders",
];

const DOELGROEPEN = ["Vrouwen", "Mannen", "Gemengd", "Kinderen", "Jongeren", "Ouderen", "Iedereen", "Anders"];

const CATEGORIEEN = [
  "Gebed & Eredienst",
  "Onderwijs & Lessen",
  "Geldinzameling",
  "Vrouwenactiviteiten",
  "Jeugdactiviteiten",
  "Gemeenschapsactiviteiten",
  "Anders",
];

const LOCATIES = ["Gebedshal", "Vergaderruimte", "Lesruimte", "Buitenruimte", "Meerdere ruimtes", "Externe locatie"];

const VRIJWILLIGERS_STATUS = [
  "Al volledig geworven",
  "Gedeeltelijk geworven",
  "Nog niet geworven – hulp nodig",
  "Geen vrijwilligers nodig",
];

const COORDINATOR_PHOTO_URL = coordinatorMounirPhoto;

const initialForm = {
  naam: "",
  werkgroep: "",
  telefoon: "",
  email: "",
  doel: "",
  doelgroep: "",
  grondslag: "",
  verwacht_resultaat: "",
  activiteit_naam: "",
  categorie: "",
  omschrijving: "",
  gewenste_datum: "",
  tijdstip: "",
  aantal_personen: "",
  locatie: "",
  vrijwilligers_aantal: "",
  vrijwilligers_status: "",
  vrijwilligers_taken: "",
  budget: "",
  opmerkingen: "",
};

export default function Activiteiten() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>(fallbackActivities);
  const [tab, setTab] = useState<"agenda" | "aanvraag">("agenda");

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("id, titel, omschrijving, dag, tijd, locatie")
        .eq("actief", true)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) setActivities(data);
    };
    fetchActivities();
  }, []);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  return (
    <>
      <section className="bg-brown py-16 md:py-20">
        <div className="container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-4xl md:text-5xl text-cream">
            {t.activities.title}
          </motion.h1>
          <p className="text-cream/70 mt-4">{t.activities.subtitle}</p>
        </div>
      </section>

      <section className="py-12 md:py-20 islamic-pattern">
        <div className="container max-w-5xl">
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-card border border-border rounded-full p-1 shadow-sm">
              <button
                onClick={() => setTab("agenda")}
                className={`px-5 sm:px-7 py-2.5 rounded-full text-sm font-medium transition-all ${
                  tab === "agenda" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Agenda
              </button>
              <button
                onClick={() => setTab("aanvraag")}
                className={`px-5 sm:px-7 py-2.5 rounded-full text-sm font-medium transition-all ${
                  tab === "aanvraag" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Activiteit aanvragen
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "agenda" ? (
              <motion.div key="agenda" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <ActiviteitenAgenda />
                <div className="max-w-3xl mx-auto">
                  <CoordinatorCard />
                </div>
              </motion.div>
            ) : (
              <motion.div key="aanvraag" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <ActivityRequestForm minDate={minDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}

function ActivityRequestForm({ minDate }: { minDate: string }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const update = (k: keyof typeof initialForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validate required
    const required: (keyof typeof initialForm)[] = [
      "naam", "telefoon", "email",
      "doel", "doelgroep",
      "activiteit_naam", "categorie", "omschrijving", "gewenste_datum", "aantal_personen",
      "vrijwilligers_aantal", "vrijwilligers_status",
    ];
    for (const k of required) {
      if (!String(form[k]).trim()) {
        toast.error("Vul alle verplichte velden in.");
        return;
      }
    }

    if (form.gewenste_datum < minDate) {
      toast.error("De gewenste datum moet minimaal 1 maand in de toekomst liggen.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Voer een geldig e-mailadres in.");
      return;
    }

    setSubmitting(true);

    const payload = {
      naam: form.naam,
      werkgroep: "",
      telefoon: form.telefoon,
      email: form.email,
      doel: form.doel,
      doelgroep: form.doelgroep,
      grondslag: form.grondslag || null,
      verwacht_resultaat: form.verwacht_resultaat || null,
      activiteit_naam: form.activiteit_naam,
      categorie: form.categorie,
      omschrijving: form.omschrijving,
      gewenste_datum: form.gewenste_datum,
      tijdstip: form.tijdstip || null,
      aantal_personen: parseInt(form.aantal_personen) || 0,
      locatie: form.locatie || null,
      vrijwilligers_aantal: parseInt(form.vrijwilligers_aantal) || 0,
      vrijwilligers_status: form.vrijwilligers_status,
      vrijwilligers_taken: form.vrijwilligers_taken || null,
      budget: form.budget || null,
      opmerkingen: form.opmerkingen || null,
    };

    const { error } = await supabase.from("activity_requests").insert(payload);

    if (error) {
      console.error(error);
      toast.error("Er ging iets mis bij het versturen.");
      setSubmitting(false);
      return;
    }

    // Send emails (non-blocking)
    supabase.functions.invoke("send-email", { body: { type: "activity_request", data: payload } }).catch(console.error);
    supabase.functions.invoke("send-email", { body: { type: "activity_request_confirmation", data: payload } }).catch(console.error);

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-primary" size={36} />
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl text-foreground mb-3">Aanvraag verzonden</h2>
        <p className="text-muted-foreground mb-2">JazākAllāhu khayran voor uw aanvraag.</p>
        <p className="text-muted-foreground text-sm mb-8">
          U ontvangt een bevestiging per e-mail. Onze coördinator neemt zo spoedig mogelijk contact met u op.
        </p>
        <button
          onClick={() => { setSuccess(false); setForm(initialForm); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Nieuwe aanvraag
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={20} />
        <p className="text-sm sm:text-base text-amber-900 dark:text-amber-200 font-medium">
          Activiteiten moeten minimaal 1 maand van tevoren worden aangevraagd.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 */}
        <FormSection title="1. Contactgegevens">
          <Grid2>
            <Field label="Naam" required>
              <input required value={form.naam} onChange={(e) => update("naam", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Telefoonnummer" required>
              <input required type="tel" value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)} className={inputCls} />
            </Field>
            <Field label="E-mailadres" required>
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
            </Field>
          </Grid2>
        </FormSection>

        {/* Section 2 */}
        <FormSection title="2. Uitgangspunt">
          <Field label="Doel van de activiteit" required>
            <textarea required rows={3} value={form.doel} onChange={(e) => update("doel", e.target.value)} placeholder="Bijv. bewustwording, fondsenwerving, educatie, ontspanning, gemeenschapsvorming..." className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Doelgroep" required>
            <select required value={form.doelgroep} onChange={(e) => update("doelgroep", e.target.value)} className={inputCls}>
              <option value="">Selecteer...</option>
              {DOELGROEPEN.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Islamitische of morele grondslag">
            <textarea rows={2} value={form.grondslag} onChange={(e) => update("grondslag", e.target.value)} placeholder="Wat is de religieuze of morele motivatie?" className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Verwacht resultaat">
            <textarea rows={2} value={form.verwacht_resultaat} onChange={(e) => update("verwacht_resultaat", e.target.value)} placeholder="Wat moet er na afloop bereikt zijn?" className={`${inputCls} resize-none`} />
          </Field>
        </FormSection>

        {/* Section 3 */}
        <FormSection title="3. Activiteitsgegevens">
          <Grid2>
            <Field label="Naam activiteit" required>
              <input required value={form.activiteit_naam} onChange={(e) => update("activiteit_naam", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Categorie" required>
              <select required value={form.categorie} onChange={(e) => update("categorie", e.target.value)} className={inputCls}>
                <option value="">Selecteer...</option>
                {CATEGORIEEN.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Grid2>
          <Field label="Omschrijving" required>
            <textarea required rows={3} value={form.omschrijving} onChange={(e) => update("omschrijving", e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
          <Grid2>
            <Field label="Gewenste datum" required>
              <input required type="date" min={minDate} value={form.gewenste_datum} onChange={(e) => update("gewenste_datum", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tijdstip">
              <input type="time" value={form.tijdstip} onChange={(e) => update("tijdstip", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Aantal personen" required>
              <input required type="number" min={1} value={form.aantal_personen} onChange={(e) => update("aantal_personen", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Locatie">
              <select value={form.locatie} onChange={(e) => update("locatie", e.target.value)} className={inputCls}>
                <option value="">Selecteer...</option>
                {LOCATIES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </Grid2>
        </FormSection>

        {/* Section 4 */}
        <FormSection title="4. Vrijwilligers">
          <Grid2>
            <Field label="Aantal benodigde vrijwilligers" required>
              <input required type="number" min={0} value={form.vrijwilligers_aantal} onChange={(e) => update("vrijwilligers_aantal", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Status" required>
              <select required value={form.vrijwilligers_status} onChange={(e) => update("vrijwilligers_status", e.target.value)} className={inputCls}>
                <option value="">Selecteer...</option>
                {VRIJWILLIGERS_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </Grid2>
          <Field label="Taken voor vrijwilligers">
            <textarea rows={2} value={form.vrijwilligers_taken} onChange={(e) => update("vrijwilligers_taken", e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
        </FormSection>

        {/* Section 5 */}
        <FormSection title="5. Aanvullend">
          <Field label="Budget / Kosten">
            <input value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="Bijv. €500" className={inputCls} />
          </Field>
          <Field label="Overige opmerkingen">
            <textarea rows={3} value={form.opmerkingen} onChange={(e) => update("opmerkingen", e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
        </FormSection>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-full font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? (<><Loader2 className="animate-spin" size={18} /> Versturen...</>) : "Aanvraag versturen"}
        </button>
      </form>

      {/* Coordinator card */}
      <CoordinatorCard />
    </div>
  );
}

function CoordinatorCard() {
  const [photoError, setPhotoError] = useState(false);
  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h4 className="text-sm font-semibold text-foreground mb-4">Coördinator Activiteiten</h4>
      <div className="bg-muted/40 rounded-xl border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          {!photoError ? (
            <img
              src={COORDINATOR_PHOTO_URL}
              alt="Mounir Marzouk"
              onError={() => setPhotoError(true)}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#7B4F2E" }}>
              <span className="text-white font-heading text-sm font-bold">MM</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">Mounir Marzouk</p>
            <p className="text-xs text-muted-foreground">Coördinator Activiteiten</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="https://wa.me/31652142557"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-xl px-4 py-3 text-sm font-medium transition-all hover:shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>WhatsApp</span>
          </a>
          <a
            href="mailto:zakariaachbib@live.nl"
            className="flex items-center justify-center gap-2.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl px-4 py-3 text-sm font-medium transition-all hover:shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>E-mail</span>
          </a>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-colors";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-4">
      <h3 className="font-heading text-lg text-foreground border-b border-border pb-3">{title}</h3>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
