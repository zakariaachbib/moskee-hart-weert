import { describe, expect, it } from 'vitest';
import { AUDIO_OPTIONS, AUDIO_TARGET, AUDIO_BUDGET, validDonation, donorLabel } from './crowdfundingContent';

describe('Audiofundament contributions', () => {
  it('hides names for anonymous donors and displays names otherwise', () => {
    expect(donorLabel('Test Sponsor', true)).toBe('Anoniem');
    expect(donorLabel('Test Sponsor', false)).toBe('Test Sponsor');
    expect(donorLabel(null, false)).toBe('Anoniem');
  });
  it('sets the revised target to €27,000 with a matching equipment and installation estimate', () => {
    expect(AUDIO_TARGET).toBe(27000);
    expect(AUDIO_BUDGET.reduce((total, item) => total + item.amount, 0)).toBe(27000);
  });
  it('offers the five requested contribution amounts', () => {
    expect(AUDIO_OPTIONS.map(option => option.amount)).toEqual([150, 350, 750, 1500, 2500]);
  });
  it('preserves the existing €5 minimum for custom donations', () => {
    expect(validDonation(5)).toBe(true);
    expect(validDonation(4.99)).toBe(false);
    expect(validDonation(NaN)).toBe(false);
  });
});