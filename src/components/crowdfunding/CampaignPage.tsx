import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShieldCheck, Share2, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CampaignContent, validDonation, donorLabel, QUICK_AMOUNTS, sortedCampaignBudget } from '@/lib/crowdfundingContent';
import { campaignImages } from '@/lib/campaignImages';
import CampaignSlideshow from './CampaignSlideshow';

interface CampaignProject {
  id: string; titel: string; beschrijving: string | null; doelbedrag: number;
  opgehaald_bedrag: number; afbeelding_url: string | null;
}
const money = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

const quotes = [
  { ar: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ", nl: "De gelijkenis van degenen die hun bezittingen op de weg van Allah besteden, is als een graankorrel die zeven aren voortbrengt, met in elke aar honderd korrels.", src: "Koran, Al-Baqarah 2:261" },
  { ar: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ", nl: "Wanneer de mens sterft, houden zijn daden op, behalve drie: een doorlopende liefdadigheid, kennis waar profijt uit wordt getrokken, of een vroom kind dat voor hem smeekt.", src: "Hadith, Sahih Muslim 1631" },
  { ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ", nl: "Liefdadigheid vermindert het bezit niet.", src: "Hadith, Sahih Muslim 2588" },
];

const QuoteCarousel = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % quotes.length), 6000);
    return () => window.clearInterval(timer);
  }, []);
  return <figure className="max-w-2xl mx-auto rounded-xl bg-card border border-gold/30 shadow-sm px-4 py-4 sm:p-6 text-center">
    <div className="grid">
      {quotes.map((quote, quoteIndex) => (
        <div key={quote.src} aria-hidden={quoteIndex !== index} className={`[grid-area:1/1] flex flex-col justify-center transition-opacity duration-700 ${quoteIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <p dir="rtl" lang="ar" className="font-rabat text-xl sm:text-2xl leading-relaxed text-brown">{quote.ar}</p>
          <p className="mt-2 text-[13px] sm:text-sm text-muted-foreground italic leading-snug">“{quote.nl}”</p>
          <p className="mt-1.5 text-[11px] sm:text-xs font-semibold text-gold">{quote.src}</p>
        </div>
      ))}
    </div>
    <div className="mt-3 flex justify-center gap-1.5">
      {quotes.map((quote, quoteIndex) => (
        <button key={quote.src} type="button" onClick={() => setIndex(quoteIndex)} aria-label={`Toon tekst ${quoteIndex + 1}: ${quote.src}`} className={`h-2 rounded-full transition-all duration-300 ${quoteIndex === index ? 'w-6 bg-gold' : 'w-2 bg-gold/30 hover:bg-gold/50'}`} />
      ))}
    </div>
  </figure>;
};

interface Donor { id: string; naam: string | null; anoniem: boolean; bedrag: number }

// Doorlopende marquee-balk zoals moskeeweb.nl: kaarten scrollen automatisch door,
// inhoud is gedupliceerd voor een naadloze lus, pauzeert bij aanraken/hover.
const DonorsCarousel = ({ donations }: { donations: Donor[] }) => {
  if (!donations.length) return null;
  const repeats = donations.length < 4 ? 4 : 2;
  const loop = Array.from({ length: repeats }, () => donations).flat();
  const duration = Math.max(12, loop.length * 4);
  return <div className="donor-marquee group overflow-hidden" role="marquee" aria-label="Recente donateurs">
    <div className="donor-marquee-track flex w-max gap-3 py-1" style={{ animationDuration: `${duration}s` }}>
      {loop.map((donor, index) => (
        <div key={`${donor.id}-${index}`} aria-hidden={index >= donations.length} className="shrink-0 rounded-xl bg-card border border-gold/25 shadow-sm px-5 py-4 text-center min-w-[180px]">
          <p className="font-semibold break-words text-sm">{donorLabel(donor.naam, donor.anoniem)}</p>
          <p className="text-gold-dark font-semibold tabular-nums mt-0.5">{money(donor.bedrag)}</p>
        </div>
      ))}
    </div>
  </div>;
};

export default function CampaignPage({ project, content, donations = [], paymentStatus }: { project: CampaignProject; content: CampaignContent; donations?: Donor[]; paymentStatus?: string }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const images = campaignImages(project.id, content, project.afbeelding_url);
  const budget = sortedCampaignBudget(content.budget);
  const percentage = project.doelbedrag > 0 ? Math.min(100, Math.round(project.opgehaald_bedrag / project.doelbedrag * 100)) : 0;
  const completed = project.opgehaald_bedrag >= project.doelbedrag;
  // Laat de vaste doneerbalk onderaan de footer niet bedekken op mobiel.
  useEffect(() => {
    document.body.classList.add('has-donate-bar');
    return () => document.body.classList.remove('has-donate-bar');
  }, []);
  const donate = (value?: number) => { setAmount(value ? String(value) : ''); setOpen(true); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!validDonation(value) || completed || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-crowdfunding-payment', {
        body: { amount: value, naam: anonymous ? null : name.trim() || null, email: email.trim() || null, anoniem: anonymous, project_id: project.id },
      });
      if (error || !data?.checkoutUrl) throw new Error('payment');
      window.location.assign(data.checkoutUrl);
    } catch {
      toast({ title: 'Betaling kon niet worden gestart', description: 'Probeer het opnieuw. Er is nog niets afgeschreven.', variant: 'destructive' });
      setBusy(false);
    }
  };
  const share = async () => {
    try {
      const url = window.location.href.split('?')[0];
      if (navigator.share) await navigator.share({ title: project.titel, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Projectlink gekopieerd' }); }
    } catch { /* Dismissing sharing is not an error. */ }
  };
  return <div className="bg-cream text-foreground pb-20 md:pb-0" dir="ltr">
    <section className="bg-brown text-cream px-5 py-5">
      <div className="mx-auto max-w-2xl">
        <Link to="/crowdfunding" className="inline-flex items-center gap-2 text-xs text-cream/80 hover:text-cream"><ArrowLeft size={14} /> Alle projecten</Link>
      </div>
    </section>

    <section className="islamic-pattern px-5 py-6 sm:py-8">
      {paymentStatus && <p role="status" className="max-w-2xl mx-auto mb-5 text-center text-sm">{paymentStatus === 'paid' ? 'Bedankt! Je betaling is bevestigd.' : ['canceled', 'failed', 'expired'].includes(paymentStatus) ? 'De betaling is niet voltooid. Je kunt opnieuw doneren.' : 'Je betaling wordt gecontroleerd. Alleen bevestigde donaties verschijnen hieronder.'}</p>}
      <div className="max-w-2xl mx-auto overflow-hidden bg-card border border-gold/25 rounded-lg">
        <CampaignSlideshow images={images} className="aspect-[4/3] sm:aspect-[16/9]" />
        <div className="p-5 sm:p-7">
        <p className="text-gold-dark text-xs font-medium text-center mb-2">{content.deadline}</p>
        <h1 className="font-body text-xl sm:text-2xl font-semibold text-center">{project.titel}</h1>
        <p className="text-sm text-muted-foreground text-center mt-3">{content.heroSubtitle}</p>
        <div className="flex items-end justify-between gap-3 mt-5 mb-4">
          <div><p className="font-semibold text-3xl">{money(project.opgehaald_bedrag)}</p><p className="text-sm text-muted-foreground mt-1">opgehaald van {money(project.doelbedrag)}</p></div>
          <span className="text-gold-dark font-semibold">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" aria-label={`${percentage}% van het doelbedrag opgehaald`} />
        <Button onClick={() => donate()} disabled={completed} className="w-full h-12 mt-6 bg-gold text-brown hover:bg-gold/90 text-base"><Heart /> {completed ? 'Alhamdulillah — doel bereikt' : 'Doneer nu'}</Button>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4"><ShieldCheck size={15} /> Veilig doneren via Mollie</p>
        </div>
      </div>
    </section>

    <div className="islamic-pattern px-5 pt-4 pb-2 sm:pt-8"><QuoteCarousel /></div>

    {budget.length > 0 && <section className="px-5 py-5 sm:py-7" aria-labelledby="campaign-costs">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 id="campaign-costs" className="font-body text-sm sm:text-base font-semibold">Kostenoverzicht</h2>
          <span className="text-[11px] sm:text-xs text-muted-foreground">Voorlopige raming</span>
        </div>
        <dl className="divide-y divide-gold/15 border-y border-gold/30">
          {budget.map((item, index) => <div key={`${item.label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 sm:py-2.5 even:bg-gold/5 px-2">
            <dt className="text-xs sm:text-sm leading-snug text-muted-foreground">{item.label}</dt>
            <dd className="text-xs sm:text-sm font-semibold text-brown tabular-nums whitespace-nowrap">{money(item.amount)}</dd>
          </div>)}
        </dl>
        <div className="flex justify-between gap-4 px-2 pt-2 text-xs sm:text-sm font-semibold">
          <span>Totaal geraamd</span><span className="text-gold-dark tabular-nums">{money(budget.reduce((sum, item) => sum + item.amount, 0))}</span>
        </div>
      </div>
    </section>}


    {project.beschrijving && <section className="px-5 py-6 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <details><summary className="cursor-pointer font-medium">Over dit project</summary><p className="text-sm text-muted-foreground leading-6 whitespace-pre-line mt-3">{project.beschrijving}</p></details>
      </div>
    </section>}
    <section className="max-w-2xl mx-auto px-5 py-10">
      <h2 className="font-body text-2xl font-semibold text-center mb-5">Donateurs</h2>
      {donations.length ? <DonorsCarousel donations={donations} /> : <p className="text-sm text-muted-foreground text-center">Nog geen bevestigde donaties.</p>}
    </section>
    <section className="max-w-2xl mx-auto px-5 pb-8 text-center">
      <Button onClick={share} variant="outline"><Share2 /> Deel dit project</Button>
    </section>
    {!completed && <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 border-t border-border p-3 backdrop-blur md:hidden"><div className="flex items-center justify-between gap-3 max-w-2xl mx-auto"><span className="text-sm font-semibold">{money(project.opgehaald_bedrag)} <span className="text-muted-foreground font-normal">/ {money(project.doelbedrag)}</span></span><Button onClick={() => donate()} className="bg-gold text-brown hover:bg-gold/90"><Heart /> Doneer nu</Button></div></div>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Doneer aan {project.titel}</DialogTitle><DialogDescription>Jouw bijdrage gaat naar de hoofdzaal en opnameset.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><p className="text-sm font-medium">Kies een bedrag</p><div className="mt-2 grid grid-cols-3 gap-2">{QUICK_AMOUNTS.map(value => <Button key={value} type="button" variant="outline" aria-pressed={Number(amount) === value && !showCustom} onClick={() => { setAmount(String(value)); setShowCustom(false); }} className={`h-12 text-base font-semibold rounded-xl border-2 transition-all duration-200 active:scale-95 ${Number(amount) === value && !showCustom ? 'border-gold bg-gradient-to-br from-gold to-gold/80 text-brown shadow-[0_4px_14px_hsl(var(--gold)/0.45)] scale-[1.03]' : 'border-gold/40 bg-gradient-to-br from-gold/15 to-gold/5 text-foreground hover:border-gold hover:from-gold/25 hover:to-gold/10 hover:scale-[1.02]'}`}>€{value}</Button>)}</div>
          <Button type="button" variant="outline" aria-pressed={showCustom} onClick={() => setShowCustom(value => !value)} className={`mt-2 w-full h-12 rounded-xl border-2 text-base font-semibold transition-all duration-200 active:scale-95 ${showCustom ? 'border-gold bg-gradient-to-br from-gold to-gold/80 text-brown shadow-[0_4px_14px_hsl(var(--gold)/0.45)]' : 'border-dashed border-gold/50 bg-gold/5 text-foreground hover:border-gold hover:bg-gold/15'}`}><Pencil className={`transition-transform duration-300 ${showCustom ? 'rotate-180' : ''}`} /> Eigen bedrag invoeren</Button></div>
          {showCustom && <div className="animate-in fade-in slide-in-from-top-2 duration-200"><label htmlFor="audio-amount" className="text-sm font-medium">Bedrag (€)</label><input id="audio-amount" type="number" min="5" step="0.01" required autoFocus value={amount} onChange={event => setAmount(event.target.value)} className="w-full mt-1 p-3 border-2 border-gold/50 rounded-xl bg-background focus:border-gold outline-none" placeholder="Bijvoorbeeld 75" /><p className="text-xs text-muted-foreground mt-1">Minimaal €5</p></div>}
          <div><label htmlFor="audio-name" className="text-sm font-medium">Naam (optioneel)</label><input id="audio-name" disabled={anonymous} maxLength={100} value={name} onChange={event => setName(event.target.value)} className="w-full mt-1 p-3 border border-input rounded-md bg-background disabled:opacity-50" /></div>
          <div><label htmlFor="audio-email" className="text-sm font-medium">E-mailadres (optioneel)</label><input id="audio-email" type="email" maxLength={255} value={email} onChange={event => setEmail(event.target.value)} className="w-full mt-1 p-3 border border-input rounded-md bg-background" /></div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /> Ik doneer anoniem</label>
          <p className="text-xs text-muted-foreground">Na betaling verschijnt {anonymous || !name.trim() ? 'Anoniem' : name.trim()} bij de donateurs, samen met het bedrag.</p>
          <Button type="submit" disabled={busy || !validDonation(Number(amount))} className="w-full h-12 bg-gold text-brown hover:bg-gold/90">{busy ? <Loader2 className="animate-spin" /> : <Heart />}{busy ? 'Betaling starten…' : `Doneer ${validDonation(Number(amount)) ? money(Number(amount)) : 'nu'}`}</Button>
          <p className="text-xs text-muted-foreground text-center">iDEAL · creditcard · beschikbare betaalmethoden via Mollie</p>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}