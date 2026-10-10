import { describe, expect, it } from 'vitest';
import { AUDIO_OPTIONS, validDonation } from './crowdfundingContent';

describe('Audiofundament contributions', () => {
  it('offers the five requested contribution amounts', () => {
    expect(AUDIO_OPTIONS.map(option => option.amount)).toEqual([150, 350, 750, 1500, 2500]);
  });
  it('preserves the existing €5 minimum for custom donations', () => {
    expect(validDonation(5)).toBe(true);
    expect(validDonation(4.99)).toBe(false);
    expect(validDonation(NaN)).toBe(false);
  });
});