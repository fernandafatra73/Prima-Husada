import { describe, expect, it } from 'vitest';
import { computeAutoSharingAmount } from '../../apps/web/src/lib/format.ts';

describe('computeAutoSharingAmount', () => {
  it('returns correct sharing for Thorax with dr Eva Christiani (under and over 10 years)', () => {
    expect(computeAutoSharingAmount('dr. Eva Christiani', ['Rontgen Thorax PA'], 5, '0')).toBe('33000');
    expect(computeAutoSharingAmount('dr. Eva Christiani', ['Thorak'], 9, '0')).toBe('33000');
    expect(computeAutoSharingAmount('dr. Eva Christiani', ['Rontgen Thorax PA'], 10, '0')).toBe('35000');
    expect(computeAutoSharingAmount('dr. Eva Christiani', ['Thorak PA'], 25, '0')).toBe('35000');
  });

  it('returns correct sharing for Thorax with dr Iman Purnawan (under and over 10 years)', () => {
    expect(computeAutoSharingAmount('dr. Iman Purnawan', ['Thorax'], 8, '0')).toBe('33000');
    expect(computeAutoSharingAmount('dr Iman Purnawan', ['Thorax'], 15, '0')).toBe('35000');
  });

  it('returns correct sharing for Thorax with dr Anna Diah (under and over 10 years)', () => {
    expect(computeAutoSharingAmount('dr. Anna Diah', ['Thorax PA'], 7, '0')).toBe('18000');
    expect(computeAutoSharingAmount('dr. Anna Diah', ['Thorak'], 10, '0')).toBe('20000');
    expect(computeAutoSharingAmount('dr. Anna Diah', ['Thorax'], 40, '0')).toBe('20000');
  });

  it('returns 88000 for Lumbosacral examination', () => {
    expect(computeAutoSharingAmount('dr. Budi', ['Rontgen Lumbosacral'], 30, '0')).toBe('88000');
  });

  it('returns 58000 for Shoulder Joint examination', () => {
    expect(computeAutoSharingAmount('dr. Budi', ['Shoulder Joint Right'], 30, '0')).toBe('58000');
  });

  it('returns default amount when no special rule matches', () => {
    expect(computeAutoSharingAmount('dr. Budi', ['USG Abdomen'], 30, '45000')).toBe('45000');
  });
});
