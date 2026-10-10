import type { CampaignContent } from '@/lib/crowdfundingContent';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CampaignContentEditor({ value, onChange }: { value: CampaignContent; onChange: (value: CampaignContent) => void }) {
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();
  const upload = async (file: File | undefined, index: number) => {
    if (!file) return;
    setUploading(index);
    try {
      const path = `campaign/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('crowdfunding').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('crowdfunding').getPublicUrl(path);
      onChange({ ...value, gallery: value.gallery.map((image, i) => i === index ? { ...image, src: data.publicUrl } : image) });
    } catch { toast({ title: 'Foto uploaden mislukt', variant: 'destructive' }); }
    finally { setUploading(null); }
  };
  const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground';
  return <div className="border-t border-border pt-5 space-y-4">
    <h4 className="font-semibold">Campagnepagina</h4>
    {(['heroTitle', 'heroSubtitle', 'deadline'] as const).map((field, index) => <label className="block text-sm space-y-1" key={field}><span>{['Grote titel', 'Ondertitel', 'Periode'][index]}</span><input value={value[field]} onChange={event => onChange({ ...value, [field]: event.target.value })} className={inputClass} /></label>)}
    <h4 className="font-semibold">Donatie-opties</h4>
    {value.options.map((option, index) => <div className="grid grid-cols-[110px_1fr] gap-2" key={index}><input aria-label={`Bedrag ${index + 1}`} type="number" min="5" value={option.amount} onChange={event => onChange({ ...value, options: value.options.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item) })} className={inputClass} /><input aria-label={`Omschrijving ${index + 1}`} value={option.label} onChange={event => onChange({ ...value, options: value.options.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} className={inputClass} /></div>)}
    {!!value.budget?.length && <><h4 className="font-semibold">Kostenraming producten en installatie</h4>
    {value.budget.map((item, index) => <div className="grid grid-cols-[110px_1fr] gap-2" key={index}><input aria-label={`Kostenbedrag ${index + 1}`} type="number" min="0" value={item.amount} onChange={event => onChange({ ...value, budget: value.budget?.map((row, i) => i === index ? { ...row, amount: Number(event.target.value) } : row) })} className={inputClass} /><input aria-label={`Kostenomschrijving ${index + 1}`} value={item.label} onChange={event => onChange({ ...value, budget: value.budget?.map((row, i) => i === index ? { ...row, label: event.target.value } : row) })} className={inputClass} /></div>)}
    <p className="text-sm text-muted-foreground">Totaal raming: €{value.budget.reduce((sum, item) => sum + item.amount, 0).toLocaleString('nl-NL')}</p></>}
    <h4 className="font-semibold">Foto’s</h4>
    <div className="grid sm:grid-cols-2 gap-4">{value.gallery.map((image, index) => <div className="space-y-2" key={index}>
      <img src={image.src} alt={image.alt} className="w-full h-36 object-cover rounded-md" />
      <input aria-label={`Fotobijschrift ${index + 1}`} value={image.alt} onChange={event => onChange({ ...value, gallery: value.gallery.map((item, i) => i === index ? { ...item, alt: event.target.value } : item) })} className={inputClass} />
      <Button variant="outline" asChild disabled={uploading !== null}><label className="cursor-pointer">{uploading === index ? <Loader2 className="animate-spin" /> : <Upload />} Foto vervangen<input type="file" accept="image/*" className="hidden" disabled={uploading !== null} onChange={event => upload(event.target.files?.[0], index)} /></label></Button>
    </div>)}</div>
  </div>;
}