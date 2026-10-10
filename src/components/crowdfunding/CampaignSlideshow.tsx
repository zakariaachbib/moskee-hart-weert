import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampaignImage } from '@/lib/campaignImages';

export default function CampaignSlideshow({ images, className = '' }: { images: CampaignImage[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (paused || images.length < 2) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, images.length]);
  if (!images.length) return null;
  return <div className={`relative overflow-hidden bg-secondary ${className}`} aria-label="Foto’s van de moskee" aria-roledescription="carrousel">
    {images.map((image, position) => <img key={image.src} src={image.src} alt={image.alt} aria-hidden={position !== index} loading={position > 1 ? 'lazy' : 'eager'} className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 motion-reduce:transition-none ${position === index ? 'opacity-100' : 'opacity-0'}`} />)}
    {images.length > 1 && <div className="absolute bottom-3 inset-x-3 flex justify-between items-center gap-2">
      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 bg-card/90" aria-label="Vorige foto" onClick={() => setIndex(current => (current + images.length - 1) % images.length)}><ChevronLeft size={16} /></Button>
      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 bg-card/90" aria-label={paused ? 'Foto’s laten wisselen' : 'Fotowisseling pauzeren'} onClick={() => setPaused(current => !current)}>{paused ? <Play size={14} /> : <Pause size={14} />}</Button>
      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 bg-card/90" aria-label="Volgende foto" onClick={() => setIndex(current => (current + 1) % images.length)}><ChevronRight size={16} /></Button>
    </div>}
  </div>;
}