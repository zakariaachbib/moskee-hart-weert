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

export const AUDIO_TARGET = 30000;
export const AUDIO_BUDGET = [
  { amount: 12000, label: 'Column-speakers en geluidszones hoofdzaal' },
  { amount: 6000, label: 'Versterkers, audioprocessor en mengpaneel' },
  { amount: 1500, label: 'Microfoons en accessoires voor de imam' },
  { amount: 2500, label: 'Complete opnameset (camera, audio en accessoires) voor de opnamestudio: preken, lezingen en gebeden' },
  { amount: 5000, label: 'Bekabeling, montage, installatie en afstelling' },
  { amount: 1800, label: 'Professionele vaatwasser voor de Ramadan' },
  { amount: 700, label: 'Wasmachine voor de Ramadan' },
  { amount: 500, label: 'Droger voor de Ramadan' },
];

export const AUDIO_OPTIONS = [
  { amount: 1500, label: 'Microfoons voor de imam' },
  { amount: 2500, label: 'Complete opnameset (camera, audio en accessoires)' },
  { amount: 5000, label: 'Bekabeling, montage en installatie' },
  { amount: 6000, label: 'Versterkers en audioprocessor' },
  { amount: 12000, label: 'Column-speakers en geluidszones' },
  { amount: 1800, label: 'Professionele vaatwasser (Ramadan)' },
  { amount: 700, label: 'Wasmachine (Ramadan)' },
  { amount: 500, label: 'Droger (Ramadan)' },
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