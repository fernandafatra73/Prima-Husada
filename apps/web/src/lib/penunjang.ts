export interface ParsedKlinisData {
  text: string;
  radTambahan: string[];
  labTambahan: string[];
}

export const COMMON_RAD_PRESETS: readonly string[] = [
  'Thorax Tambahan',
  'CT-Scan Kepala',
  'USG Abdomen',
  'USG Kehamilan',
  'MRI',
  'Panoramic',
  'Mammografi',
  'X-Ray Ekstremitas',
];

export const COMMON_LAB_PRESETS: readonly string[] = [
  'Darah Lengkap',
  'Hemoglobin',
  'Gula Darah Sewaktu (GDS)',
  'Gula Darah Puasa (GDP)',
  'Asam Urat',
  'Kolesterol Total',
  'Trigliserida',
  'Urine Lengkap',
  'Widal',
];

export function parseKlinisData(raw: string | null | undefined): ParsedKlinisData {
  if (!raw) {
    return { text: '', radTambahan: [], labTambahan: [] };
  }
  try {
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw) as Partial<ParsedKlinisData>;
      if (
        typeof parsed.text === 'string' ||
        Array.isArray(parsed.radTambahan) ||
        Array.isArray(parsed.labTambahan)
      ) {
        return {
          text: typeof parsed.text === 'string' ? parsed.text : '',
          radTambahan: Array.isArray(parsed.radTambahan)
            ? parsed.radTambahan.filter((s): s is string => typeof s === 'string')
            : [],
          labTambahan: Array.isArray(parsed.labTambahan)
            ? parsed.labTambahan.filter((s): s is string => typeof s === 'string')
            : [],
        };
      }
    }
  } catch {
    // Bukan format JSON, anggap string biasa
  }
  return { text: raw, radTambahan: [], labTambahan: [] };
}

export function serializeKlinisData(
  text: string,
  radTambahan: string[],
  labTambahan: string[],
): string {
  const trimmedText = text.trim();
  const cleanRad = radTambahan.map((s) => s.trim()).filter(Boolean);
  const cleanLab = labTambahan.map((s) => s.trim()).filter(Boolean);

  if (cleanRad.length === 0 && cleanLab.length === 0) {
    return trimmedText;
  }

  return JSON.stringify({
    text: trimmedText,
    radTambahan: cleanRad,
    labTambahan: cleanLab,
  });
}

export function formatKlinisDisplay(raw: string | null | undefined): string {
  const { text, radTambahan, labTambahan } = parseKlinisData(raw);
  const parts: string[] = [];
  if (text) parts.push(text);
  if (radTambahan.length > 0) parts.push(`Rad Tambahan: ${radTambahan.join(', ')}`);
  if (labTambahan.length > 0) parts.push(`Lab Tambahan: ${labTambahan.join(', ')}`);
  return parts.join(' | ');
}
