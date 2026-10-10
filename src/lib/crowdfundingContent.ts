import type { Json } from '@/integrations/supabase/types';

export interface CampaignContent {
  layout: 'campaign';
  heroTitle: string;
  heroSubtitle: string;
  deadline: string;
  options: { amount: number; label: string }[];
  gallery: { src: string; alt: string }[];
  budget?: { amount: number; label: string }[];
}

export const AUDIO_TARGET = 27000;
export const AUDIO_BUDGET = [
  { amount: 12000, label: 'Column-speakers en geluidszones hoofdzaal' },
  { amount: 6000, label: 'Versterkers, audioprocessor en mengpaneel' },
  { amount: 1500, label: 'Microfoons en accessoires voor de imam' },
  { amount: 2500, label: 'Complete opnameset voor de 33 lessen' },
  { amount: 5000, label: 'Bekabeling, montage, installatie en afstelling' },
];

export const AUDIO_OPTIONS = [
  { amount: 150, label: 'Microfoon voor de imam' },
  { amount: 350, label: 'Deel van een column-speaker' },
  { amount: 750, label: 'Een zone in het systeem' },
  { amount: 1500, label: 'Complete opnameset' },
  { amount: 2500, label: 'Hoofdsponsor hoofdzaal' },
];

export function campaignContent(value: Json | undefined): CampaignContent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.layout !== 'campaign') return null;
  return value as unknown as CampaignContent;
}

export function validDonation(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 5;
}

export function donorLabel(name: string | null, anonymous: boolean): string {
  return anonymous ? 'Anoniem' : name?.trim() || 'Anoniem';
}