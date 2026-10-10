import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Heart, ShieldCheck, Share2, Loader2, Mic, Speaker, Radio, Video, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CampaignContent, validDonation, donorLabel } from '@/lib/crowdfundingContent';
import { campaignImages } from '@/lib/campaignImages';
import CampaignSlideshow from './CampaignSlideshow';

interface CampaignProject {
  id: string; titel: string; beschrijving: string | null; doelbedrag: number;
  opgehaald_bedrag: number; afbeelding_url: string | null;
}
const money = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
const icons = [Mic, Speaker, Radio, Video, HandHeart];

export default function CampaignPage({ project, content, donations = [], paymentStatus }: { project: CampaignProject; content: CampaignContent; donations?: { id: string; naam: string | null; anoniem: boolean; bedrag: number }[]; paymentStatus?: string }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
  const images = campaignImages(project.id, content, project.afbeelding_url);
  const percentage = project.doelbedrag > 0 ? Math.min(100, Math.round(project.opgehaald_bedrag / project.doelbedrag * 100)) : 0;
  const completed = project.opgehaald_bedrag >= project.doelbedrag;
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

    <section className="max-w-2xl mx-auto px-5 py-7 sm:py-9">
      <div>
        <h2 className="font-body text-xl font-semibold mb-5 text-center">Kies jouw bijdrage</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {content.options.map((option, index) => {
            const Icon = icons[index % icons.length];
            return <Button key={`${option.amount}-${index}`} variant="outline" disabled={completed} onClick={() => donate(option.amount)} className="h-auto min-h-24 p-5 justify-start gap-4 whitespace-normal text-left border-gold/25 bg-card hover:bg-gold/10 hover:text-foreground">
              <Icon className="text-gold-dark !h-6 !w-6" />
              <span><span className="block text-xl font-semibold mb-1">{money(option.amount)}</span><span className="block text-sm font-normal text-muted-foreground">{option.label}</span></span>
            </Button>;
          })}
          <Button variant="outline" disabled={completed} onClick={() => donate()} className="h-auto min-h-24 p-5 justify-start gap-4 text-left border-gold/25 bg-card hover:bg-gold/10 hover:text-foreground"><Heart className="text-gold-dark !h-6 !w-6" /><span><span className="block text-xl font-semibold mb-1">Vrij bedrag</span><span className="block text-sm font-normal text-muted-foreground">Elke bijdrage is welkom</span></span></Button>
        </div>
        <div className="mt-5 py-5 border-y border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div><h3 className="font-semibold">Sponsor het hele pakket</h3><p className="text-sm text-muted-foreground">Apparatuur én installatie · {money(project.doelbedrag)}</p></div>
          <Button disabled={completed} onClick={() => donate(project.doelbedrag)} className="bg-gold text-brown hover:bg-gold/90 h-auto py-3 whitespace-normal"><HandHeart /> In één keer sponsoren</Button>
        </div>
      </div>
    </section>

    <section className="islamic-pattern px-5 py-7 border-t border-gold/30">
      <div className="max-w-2xl mx-auto space-y-5 text-center">
        {[
          { ar: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ", nl: "De gelijkenis van degenen die hun bezittingen op de weg van Allah besteden, is als een graankorrel die zeven aren voortbrengt, met in elke aar honderd korrels.", src: "Koran, Al-Baqarah 2:261" },
          { ar: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ", nl: "Wanneer de mens sterft, houden zijn daden op, behalve drie: een doorlopende liefdadigheid, kennis waar profijt uit wordt getrokken, of een vroom kind dat voor hem smeekt.", src: "Hadith, Sahih Muslim 1631" },
          { ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ", nl: "Liefdadigheid vermindert het bezit niet.", src: "Hadith, Sahih Muslim 2588" },
        ].map((q) => (
          <figure key={q.src} className="rounded-lg bg-card/80 border border-gold/30 p-5">
            <p dir="rtl" lang="ar" className="font-rabat text-2xl sm:text-3xl leading-loose text-brown">{q.ar}</p>
            <p className="mt-3 text-sm text-muted-foreground italic leading-6">“{q.nl}”</p>
            <figcaption className="mt-2 text-xs font-semibold text-gold">{q.src}</figcaption>
          </figure>
        ))}
      </div>
    </section>

    {!!content.budget?.length && <section className="px-5 py-6 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <details>
        <summary className="cursor-pointer font-medium">Kostenraming · {money(project.doelbedrag)}</summary>
        <p className="text-xs text-muted-foreground mt-3 mb-3">Voorlopige raming, geen offerte. Je sponsort; je koopt geen apparatuur.</p>
        <dl className="divide-y divide-border">{content.budget.map((item, index) => <div key={index} className="flex justify-between gap-4 py-4"><dt>{item.label}</dt><dd className="font-semibold whitespace-nowrap">{money(item.amount)}</dd></div>)}</dl>
        <div className="flex justify-between gap-4 border-t border-gold/40 pt-5 font-semibold text-lg"><span>Totaal geraamd</span><span>{money(content.budget.reduce((total, item) => total + item.amount, 0))}</span></div>
        </details>
        {project.beschrijving && <details className="mt-4"><summary className="cursor-pointer font-medium">Over dit project</summary><p className="text-sm text-muted-foreground leading-6 whitespace-pre-line mt-3">{project.beschrijving}</p></details>}
      </div>
    </section>}
    <section className="bg-secondary px-5 py-6">
      <div className="max-w-2xl mx-auto">
        <details><summary className="cursor-pointer font-medium mb-4">Bekijk alle foto’s</summary>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {images.map((image, index) => <figure key={index}>
            <Button variant="ghost" onClick={() => setPhoto(image)} className="block h-auto w-full p-0 overflow-hidden rounded-lg" aria-label={`Bekijk ${image.alt}`}><img src={image.src} alt={image.alt} loading="lazy" className="w-full aspect-[4/5] object-cover" /></Button>
            <figcaption className="text-xs text-muted-foreground mt-2">{image.alt}</figcaption>
          </figure>)}
        </div>
        </details>
      </div>
    </section>
    <section className="max-w-2xl mx-auto px-5 py-10">
      <h2 className="font-body text-2xl font-semibold text-center mb-5">Donateurs</h2>
      {donations.length ? <ul className="divide-y divide-border">{donations.map(donor => <li key={donor.id} className="flex justify-between gap-4 py-4"><span className="break-words min-w-0">{donorLabel(donor.naam, donor.anoniem)}</span><span className="font-semibold whitespace-nowrap">{money(donor.bedrag)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground text-center">Nog geen bevestigde donaties.</p>}
    </section>
    <section className="max-w-2xl mx-auto px-5 pb-8 text-center">
      <Button onClick={share} variant="outline"><Share2 /> Deel dit project</Button>
    </section>
    {!completed && <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 border-t border-border p-3 backdrop-blur md:hidden"><div className="flex items-center justify-between gap-3 max-w-2xl mx-auto"><span className="text-sm font-semibold">{money(project.opgehaald_bedrag)} <span className="text-muted-foreground font-normal">/ {money(project.doelbedrag)}</span></span><Button onClick={() => donate()} className="bg-gold text-brown hover:bg-gold/90"><Heart /> Doneer nu</Button></div></div>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Doneer aan {project.titel}</DialogTitle><DialogDescription>Jouw bijdrage gaat naar de hoofdzaal en opnameset.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="audio-amount" className="text-sm font-medium">Bedrag (€)</label><input id="audio-amount" type="number" min="5" step="0.01" required autoFocus value={amount} onChange={event => setAmount(event.target.value)} className="w-full mt-1 p-3 border border-input rounded-md bg-background" placeholder="Vrij bedrag" /><p className="text-xs text-muted-foreground mt-1">Minimaal €5</p></div>
          <div><label htmlFor="audio-name" className="text-sm font-medium">Naam (optioneel)</label><input id="audio-name" disabled={anonymous} maxLength={100} value={name} onChange={event => setName(event.target.value)} className="w-full mt-1 p-3 border border-input rounded-md bg-background disabled:opacity-50" /></div>
          <div><label htmlFor="audio-email" className="text-sm font-medium">E-mailadres (optioneel)</label><input id="audio-email" type="email" maxLength={255} value={email} onChange={event => setEmail(event.target.value)} className="w-full mt-1 p-3 border border-input rounded-md bg-background" /></div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /> Ik doneer anoniem</label>
          <p className="text-xs text-muted-foreground">Na betaling verschijnt {anonymous || !name.trim() ? 'Anoniem' : name.trim()} bij de donateurs, samen met het bedrag.</p>
          <Button type="submit" disabled={busy || !validDonation(Number(amount))} className="w-full h-12 bg-gold text-brown hover:bg-gold/90">{busy ? <Loader2 className="animate-spin" /> : <Heart />}{busy ? 'Betaling starten…' : `Doneer ${validDonation(Number(amount)) ? money(Number(amount)) : 'nu'}`}</Button>
          <p className="text-xs text-muted-foreground text-center">iDEAL · creditcard · beschikbare betaalmethoden via Mollie</p>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={!!photo} onOpenChange={value => { if (!value) setPhoto(null); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{photo?.alt}</DialogTitle></DialogHeader>{photo && <img src={photo.src} alt={photo.alt} className="w-full max-h-[75vh] object-contain" />}</DialogContent></Dialog>
  </div>;
}