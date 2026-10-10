import hall from '@/assets/campaign/nahda-16-2.jpeg.asset.json';
import prayer from '@/assets/campaign/nahda-3-3.jpeg.asset.json';
import minbar from '@/assets/campaign/nahda-14-2.jpeg.asset.json';
import imam from '@/assets/campaign/nahda-2-2.jpeg.asset.json';
import windowPhoto from '@/assets/campaign/nahda-1-3.jpeg.asset.json';
import reading from '@/assets/campaign/nahda-15-5.jpeg.asset.json';
import ceiling from '@/assets/campaign/nahda-13-3.jpeg.asset.json';
import type { CampaignContent } from './crowdfundingContent';

export type CampaignImage = { src: string; alt: string };
const mosquePhotos: CampaignImage[] = [
  { src: hall.url, alt: 'Gebedszaal van Moskee Nahda' },
  { src: prayer.url, alt: 'Gebed in de hoofdzaal' },
  { src: minbar.url, alt: 'De minbar en microfoon' },
  { src: imam.url, alt: 'De imam in de moskee' },
  { src: windowPhoto.url, alt: 'Het boograam van de moskee' },
  { src: reading.url, alt: 'Koranlezing' },
  { src: ceiling.url, alt: 'De koepel van Moskee Nahda' },
];

export function campaignImages(projectId: string, content: CampaignContent | null, fallback: string | null): CampaignImage[] {
  const gallery = content?.gallery ?? [];
  if (projectId === 'd79a80f8-71ff-4e0e-a4b4-1f5fdaeac497' && (!gallery.length || gallery.some(image => /audio_(hall|imam|window|calligraphy)\.jpg/.test(image.src)))) return mosquePhotos;
  return gallery.length ? gallery : fallback ? [{ src: fallback, alt: 'Projectfoto' }] : [];
}