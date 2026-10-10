import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Heart, ShieldCheck, Share2, Loader2, Mic, Speaker, Radio, Video, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CampaignContent, validDonation } from '@/lib/crowdfundingContent';

interface CampaignProject {
  id: string; titel: string; beschrijving: string | null; doelbedrag: number;
  opgehaald_bedrag: number; afbeelding_url: string | null;
}
const money = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
const icons = [Mic, Speaker, Radio, Video, HandHeart];

export default function CampaignPage({ project, content }: { project: CampaignProject; content: CampaignContent }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
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
    <section className="relative isolate overflow-hidden bg-brown text-cream">
      {project.afbeelding_url && <img src={project.afbeelding_url} alt="Hoofdzaal van Moskee Nahda" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />}
      <div className="absolute inset-0 bg-brown/65" />
      <div className="relative mx-auto max-w-2xl px-5 py-12 sm:py-16 text-center">
        <Link to="/crowdfunding" className="inline-flex items-center gap-2 text-xs text-cream/80 mb-6 hover:text-cream"><ArrowLeft size={14} /> Alle projecten</Link>
        <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-4">{content.deadline}</p>
        <h1 className="font-body font-semibold text-3xl sm:text-4xl leading-tight max-w-xl mx-auto">{content.heroTitle}</h1>
        <p className="text-cream/90 text-base leading-relaxed mt-5 max-w-md mx-auto">{content.heroSubtitle}</p>
        <Button onClick={() => donate()} disabled={completed} size="lg" className="mt-7 h-12 text-base bg-gold text-brown hover:bg-gold/90 px-8"><Heart /> {completed ? 'Doel bereikt' : 'Doneer nu'} <ArrowUpRight /></Button>
      </div>
    </section>

    <section className="islamic-pattern px-5 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto bg-card border border-gold/25 rounded-lg p-6 sm:p-9">
        <div className="flex items-center justify-center gap-2 text-gold-dark text-xs mb-3"><Mic size={15} /> Hoofdzaal + opnameset</div>
        <h2 className="font-body text-2xl font-semibold text-center">{project.titel}</h2>
        <div className="flex items-end justify-between gap-3 mt-7 mb-4">
          <div><p className="font-semibold text-3xl">{money(project.opgehaald_bedrag)}</p><p className="text-sm text-muted-foreground mt-1">opgehaald van {money(project.doelbedrag)}</p></div>
          <span className="text-gold-dark font-semibold">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" aria-label={`${percentage}% van het doelbedrag opgehaald`} />
        <Button onClick={() => donate()} disabled={completed} className="w-full h-12 mt-6 bg-gold text-brown hover:bg-gold/90 text-base"><Heart /> {completed ? 'Alhamdulillah — doel bereikt' : 'Doneer nu'}</Button>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4"><ShieldCheck size={15} /> Veilig doneren via Mollie</p>
      </div>
    </section>

    <section className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <p className="text-xs uppercase tracking-widest text-gold-dark font-semibold text-center">Samen maken we het mogelijk</p>
      <h2 className="font-body text-2xl font-semibold text-center mt-3 mb-7">Een bijdrage die doorklinkt</h2>
      <p className="text-muted-foreground leading-7 whitespace-pre-line">{project.beschrijving}</p>
      <div className="border-t border-gold/25 mt-9 pt-9">
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
      </div>
    </section>

    <section className="bg-secondary px-5 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-gold-dark font-semibold text-center">Onze moskee</p>
        <h2 className="font-body text-2xl font-semibold text-center mt-3 mb-7">De plek waar we samenkomen</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {content.gallery.map((image, index) => <figure key={index}>
            <Button variant="ghost" onClick={() => setPhoto(image)} className="block h-auto w-full p-0 overflow-hidden rounded-lg" aria-label={`Bekijk ${image.alt}`}><img src={image.src} alt={image.alt} loading="lazy" className="w-full aspect-[4/5] object-cover" /></Button>
            <figcaption className="text-xs text-muted-foreground mt-2">{image.alt}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>
    <section className="max-w-2xl mx-auto px-5 py-12 text-center">
      <h2 className="font-body text-2xl font-semibold">Help Moskee Nahda klaar voor Ramadan</h2>
      <p className="text-muted-foreground mt-3 mb-6">Samen bouwen we aan een helder geluid voor onze gemeenschap.</p>
      <div className="flex flex-wrap justify-center gap-3"><Button onClick={() => donate()} disabled={completed} className="h-12 px-8 bg-gold text-brown hover:bg-gold/90"><Heart /> Doneer nu</Button><Button onClick={share} variant="outline" className="h-12"><Share2 /> Deel dit project</Button></div>
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
          <Button type="submit" disabled={busy || !validDonation(Number(amount))} className="w-full h-12 bg-gold text-brown hover:bg-gold/90">{busy ? <Loader2 className="animate-spin" /> : <Heart />}{busy ? 'Betaling starten…' : `Doneer ${validDonation(Number(amount)) ? money(Number(amount)) : 'nu'}`}</Button>
          <p className="text-xs text-muted-foreground text-center">iDEAL · creditcard · beschikbare betaalmethoden via Mollie</p>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={!!photo} onOpenChange={value => { if (!value) setPhoto(null); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{photo?.alt}</DialogTitle></DialogHeader>{photo && <img src={photo.src} alt={photo.alt} className="w-full max-h-[75vh] object-contain" />}</DialogContent></Dialog>
  </div>;
}