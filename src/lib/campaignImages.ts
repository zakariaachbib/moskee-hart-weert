import hall from '@/assets/campaign/nahda-16-2.jpeg.asset.json';
import windowPhoto from '@/assets/campaign/nahda-1-3.jpeg.asset.json';
import ceiling from '@/assets/campaign/nahda-13-3.jpeg.asset.json';
import koranVenster from '@/assets/campaign/nahda-koran-venster.jpeg.asset.json';
import type { CampaignContent } from './crowdfundingContent';

export type CampaignImage = { src: string; alt: string };
// Photos of the imam are deliberately excluded from the campaign imagery.
const mosquePhotos: CampaignImage[] = [
  { src: hall.url, alt: 'Gebedszaal van Moskee Nahda' },
  { src: windowPhoto.url, alt: 'Het boograam van de moskee' },
  { src: ceiling.url, alt: 'De koepel van Moskee Nahda' },
  { src: koranVenster.url, alt: 'De Koran bij het raam' },
];

export function campaignImages(projectId: string, content: CampaignContent | null, fallback: string | null): CampaignImage[] {
  const gallery = content?.gallery ?? [];
  if (projectId === 'd79a80f8-71ff-4e0e-a4b4-1f5fdaeac497' && (!gallery.length || gallery.some(image => /audio_(hall|imam|window|calligraphy)\.jpg/.test(image.src)))) return mosquePhotos;
  return gallery.length ? gallery : fallback ? [{ src: fallback, alt: 'Projectfoto' }] : [];
}
