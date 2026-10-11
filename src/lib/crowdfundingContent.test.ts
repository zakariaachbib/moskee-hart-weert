import { describe, expect, it } from 'vitest';
import { AUDIO_OPTIONS, AUDIO_TARGET, AUDIO_BUDGET, QUICK_AMOUNTS, validDonation, donorLabel, sortedCampaignBudget } from './crowdfundingContent';

describe('Audiofundament contributions', () => {
  it('orders the cost overview from highest to lowest without changing the stored budget', () => {
    const original = AUDIO_BUDGET.map(item => item.amount);
    expect(sortedCampaignBudget(AUDIO_BUDGET).map(item => item.amount)).toEqual([12000, 6000, 5000, 2500, 1800, 1500, 700, 500]);
    expect(AUDIO_BUDGET.map(item => item.amount)).toEqual(original);
    expect(sortedCampaignBudget(undefined)).toEqual([]);
  });
  it('offers 10, 25, 50, 100, 250 and 500 as selectable donation amounts', () => {
    expect(QUICK_AMOUNTS).toEqual([10, 25, 50, 100, 250, 500]);
    QUICK_AMOUNTS.forEach(amount => expect(validDonation(amount)).toBe(true));
  });
  it('hides names for anonymous donors and displays names otherwise', () => {
    expect(donorLabel('Test Sponsor', true)).toBe('Anoniem');
    expect(donorLabel('Test Sponsor', false)).toBe('Test Sponsor');
    expect(donorLabel(null, false)).toBe('Anoniem');
  });
  it('sets the target to €30,000 with a matching equipment, installation and Ramadan appliance estimate', () => {
    expect(AUDIO_TARGET).toBe(30000);
    expect(AUDIO_BUDGET.reduce((total, item) => total + item.amount, 0)).toBe(30000);
  });
  it('offers a professional dishwasher among the contribution amounts', () => {
    const dishwasher = AUDIO_OPTIONS.find(option => option.label.toLowerCase().includes('vaatwasser'));
    expect(dishwasher).toEqual({ amount: 1800, label: 'Professionele vaatwasser (Ramadan)' });
    expect(AUDIO_OPTIONS.map(option => option.amount)).toEqual([1500, 2500, 5000, 6000, 12000, 1800, 700, 500]);
  });
  it('preserves the existing €5 minimum for custom donations', () => {
    expect(validDonation(5)).toBe(true);
    expect(validDonation(4.99)).toBe(false);
    expect(validDonation(NaN)).toBe(false);
  });
});