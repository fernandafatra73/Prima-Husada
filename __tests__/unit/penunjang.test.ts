import { describe, expect, test } from 'vitest';
import {
  formatKlinisDisplay,
  parseKlinisData,
  serializeKlinisData,
} from '../../apps/web/src/lib/penunjang.ts';

describe('penunjang serialization and parsing', () => {
  test('returns plain text when no tambahan items exist', () => {
    const serialized = serializeKlinisData('Demam 3 hari', [], []);
    expect(serialized).toBe('Demam 3 hari');

    const parsed = parseKlinisData(serialized);
    expect(parsed.text).toBe('Demam 3 hari');
    expect(parsed.radTambahan).toEqual([]);
    expect(parsed.labTambahan).toEqual([]);
  });

  test('serializes as JSON when radTambahan or labTambahan exist', () => {
    const serialized = serializeKlinisData(
      'Nyeri dada',
      ['CT-Scan Thorax'],
      ['Hemoglobin', 'GDS']
    );
    expect(serialized).toContain('CT-Scan Thorax');

    const parsed = parseKlinisData(serialized);
    expect(parsed.text).toBe('Nyeri dada');
    expect(parsed.radTambahan).toEqual(['CT-Scan Thorax']);
    expect(parsed.labTambahan).toEqual(['Hemoglobin', 'GDS']);
  });

  test('formats display string correctly', () => {
    const serialized = serializeKlinisData(
      'Batuk kering',
      ['X-Ray Tambahan'],
      ['Darah Lengkap']
    );
    const display = formatKlinisDisplay(serialized);
    expect(display).toBe('Batuk kering | Rad Tambahan: X-Ray Tambahan | Lab Tambahan: Darah Lengkap');
  });

  test('handles null input gracefully', () => {
    const parsed = parseKlinisData(null);
    expect(parsed.text).toBe('');
    expect(parsed.radTambahan).toEqual([]);
    expect(parsed.labTambahan).toEqual([]);
  });
});
