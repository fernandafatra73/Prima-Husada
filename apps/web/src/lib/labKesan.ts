export interface LabTableRow {
  id: string;
  klasifikasi?: string;
  pemeriksaan: string;
  hasil: string;
  nilaiRujukan: string;
}

export interface ParsedLabData {
  rows: LabTableRow[];
  catatan: string;
  analisNama?: string;
  analisId?: string;
  klasifikasi?: string;
  dokterLabNama?: string;
  dokterLabId?: string;
  discount?: number;
  sharing?: number;
  hasilBayar?: string;
}

export const DEFAULT_LAB_TABLE_ROWS: readonly LabTableRow[] = [
  { id: '1', klasifikasi: 'Hematologi', pemeriksaan: 'Hemoglobin', hasil: '', nilaiRujukan: 'L: 13-18 P: 12-16 g/dl' },
  { id: '2', klasifikasi: 'Hematologi', pemeriksaan: 'Jumlah Sel Leukosit', hasil: '', nilaiRujukan: '5.000 - 10.000 /µl' },
  { id: '3', klasifikasi: 'Hematologi', pemeriksaan: 'Jumlah Sel Trombosit', hasil: '', nilaiRujukan: '150.000 - 450.000 /µl' },
  { id: '4', klasifikasi: 'Hematologi', pemeriksaan: 'Nilai Hematokrit', hasil: '', nilaiRujukan: 'L: 40-52 P: 36-48 %' },
  { id: '5', klasifikasi: 'Kimia Darah', pemeriksaan: 'Asam Urat', hasil: '', nilaiRujukan: 'L: 3,5-7 P: 2,6-6 mg/dl' },
  { id: '6', klasifikasi: 'Kimia Darah', pemeriksaan: 'Cholesterol Total', hasil: '', nilaiRujukan: '< 200 mg/dl' },
  { id: '7', klasifikasi: 'Kimia Darah', pemeriksaan: 'Trigliserida', hasil: '', nilaiRujukan: '< 200 mg/dl' },
  { id: '8', klasifikasi: 'Diabetes', pemeriksaan: 'GDS / GDP', hasil: '', nilaiRujukan: '70 - 126 mg/dl' },
];

export function parseLabKesan(raw: string | null | undefined): ParsedLabData {
  if (!raw) {
    return {
      rows: Array.from(DEFAULT_LAB_TABLE_ROWS),
      catatan: '',
      analisNama: '',
      analisId: '',
      klasifikasi: '',
      dokterLabNama: '',
      dokterLabId: '',
      discount: 0,
      sharing: 0,
      hasilBayar: '',
    };
  }
  try {
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw) as ParsedLabData;
      if (Array.isArray(parsed.rows)) {
        return {
          rows: parsed.rows.map((r, idx) => ({
            id: r.id || String(idx + 1),
            klasifikasi: r.klasifikasi || '',
            pemeriksaan: r.pemeriksaan || '',
            hasil: r.hasil || '',
            nilaiRujukan: r.nilaiRujukan || '',
          })),
          catatan: parsed.catatan || '',
          analisNama: parsed.analisNama || '',
          analisId: parsed.analisId || '',
          klasifikasi: parsed.klasifikasi || '',
          dokterLabNama: parsed.dokterLabNama || '',
          dokterLabId: parsed.dokterLabId || '',
          discount: Number(parsed.discount ?? 0),
          sharing: Number(parsed.sharing ?? 0),
          hasilBayar: parsed.hasilBayar || '',
        };
      }
    }
  } catch {
    // String biasa (non-JSON)
  }
  return {
    rows: Array.from(DEFAULT_LAB_TABLE_ROWS),
    catatan: raw || '',
    analisNama: '',
    analisId: '',
    klasifikasi: '',
    dokterLabNama: '',
    dokterLabId: '',
    discount: 0,
    sharing: 0,
    hasilBayar: '',
  };
}

export function serializeLabKesan(
  rows: LabTableRow[],
  catatan: string,
  analisNama = '',
  analisId = '',
  extra: Partial<ParsedLabData> = {},
): string {
  const formattedRows = rows.map((r) => ({
    ...r,
    hasil: formatAbnormalResult(r.hasil, r.nilaiRujukan),
  }));
  return JSON.stringify({
    rows: formattedRows,
    catatan: catatan.trim(),
    analisNama,
    analisId,
    ...extra,
  });
}

export interface LabPackageItem {
  readonly pemeriksaan: string;
  readonly nilaiRujukan: string;
}

export interface LabPackage {
  readonly id: string;
  readonly label: string;
  readonly items: readonly LabPackageItem[];
}

export const PAKET_PEMERIKSAAN_LAB: readonly LabPackage[] = [
  {
    id: 'hematologi',
    label: 'Hematologi',
    items: [
      { pemeriksaan: 'Hemoglobine', nilaiRujukan: 'L: 13-18 P: 12-16 g/dl' },
      { pemeriksaan: 'Leukosit', nilaiRujukan: '5.000 - 10.000 /µl' },
      { pemeriksaan: 'Eritrosit', nilaiRujukan: '4,0 - 5,5 juta/µl' },
      { pemeriksaan: 'Hematokrit', nilaiRujukan: 'L: 40-52 P: 36-48 %' },
      { pemeriksaan: 'Trombosit', nilaiRujukan: '150.000 - 450.000 /µl' },
    ],
  },
  {
    id: 'kimia_darah',
    label: 'Kimia Darah',
    items: [
      { pemeriksaan: 'SGOT', nilaiRujukan: '< 35 U/L' },
      { pemeriksaan: 'SGPT', nilaiRujukan: '< 41 U/L' },
      { pemeriksaan: 'Gamma GT', nilaiRujukan: '< 55 U/L' },
      { pemeriksaan: 'Alkali Fosfatase', nilaiRujukan: '44 - 147 U/L' },
      { pemeriksaan: 'Bilirubin Total', nilaiRujukan: '0,1 - 1,2 mg/dl' },
      { pemeriksaan: 'Bilirubin Direct', nilaiRujukan: '< 0,3 mg/dl' },
      { pemeriksaan: 'Bilirubin Indirect', nilaiRujukan: '< 0,9 mg/dl' },
      { pemeriksaan: 'Protein Total', nilaiRujukan: '6,0 - 8,3 g/dl' },
      { pemeriksaan: 'Albumin', nilaiRujukan: '3,5 - 5,2 g/dl' },
      { pemeriksaan: 'Globulin', nilaiRujukan: '2,3 - 3,5 g/dl' },
      { pemeriksaan: 'Cholesterol Total', nilaiRujukan: '< 200 mg/dl' },
      { pemeriksaan: 'HDL', nilaiRujukan: '> 40 mg/dl' },
      { pemeriksaan: 'LDL', nilaiRujukan: '< 100 mg/dl' },
      { pemeriksaan: 'Trigliserida', nilaiRujukan: '< 150 mg/dl' },
      { pemeriksaan: 'Ureum', nilaiRujukan: '15 - 40 mg/dl' },
      { pemeriksaan: 'Kreatinin', nilaiRujukan: '0,6 - 1,2 mg/dl' },
      { pemeriksaan: 'Asam Urat', nilaiRujukan: 'L: 3,5-7,0 P: 2,6-6,0 mg/dl' },
    ],
  },
  {
    id: 'diabetes',
    label: 'Diabetes',
    items: [
      { pemeriksaan: 'Glukosa Puasa', nilaiRujukan: '70 - 100 mg/dl' },
      { pemeriksaan: 'Glukosa 2 Jam PP', nilaiRujukan: '< 140 mg/dl' },
      { pemeriksaan: 'Glukosa Sewaktu', nilaiRujukan: '< 200 mg/dl' },
      { pemeriksaan: 'HbA1c', nilaiRujukan: '< 6.5 %' },
    ],
  },
  {
    id: 'urinalisa',
    label: 'Urinalisa',
    items: [
      { pemeriksaan: 'Warna Urin', nilaiRujukan: 'Kuning Muda - Kuning' },
      { pemeriksaan: 'Kejernihan', nilaiRujukan: 'Jernih' },
      { pemeriksaan: 'pH Urin', nilaiRujukan: '4,8 - 7,4' },
      { pemeriksaan: 'Berat Jenis', nilaiRujukan: '1,005 - 1,030' },
      { pemeriksaan: 'Protein / Albumin Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Glukosa Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Keton Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Bilirubin Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Urobilinogen', nilaiRujukan: 'Normal (< 1 mg/dl)' },
      { pemeriksaan: 'Darah / Eritrosit Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Sedimen - Leukosit', nilaiRujukan: '0 - 5 / LPB' },
      { pemeriksaan: 'Sedimen - Eritrosit', nilaiRujukan: '0 - 2 / LPB' },
      { pemeriksaan: 'Sedimen - Epitel', nilaiRujukan: 'Positif (+)' },
    ],
  },
  {
    id: 'urine_rutin',
    label: 'Urine Rutin',
    items: [
      { pemeriksaan: 'Warna Urin', nilaiRujukan: 'Kuning' },
      { pemeriksaan: 'Kejernihan', nilaiRujukan: 'Jernih' },
      { pemeriksaan: 'Protein Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Glukosa Urin', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Sedimen Leukosit', nilaiRujukan: '0 - 5 / LPB' },
      { pemeriksaan: 'Sedimen Eritrosit', nilaiRujukan: '0 - 2 / LPB' },
      { pemeriksaan: 'Sedimen Epitel', nilaiRujukan: 'Positif (+)' },
    ],
  },
  {
    id: 'imunologi',
    label: 'Imunologi',
    items: [
      { pemeriksaan: 'HBsAg', nilaiRujukan: 'Non-Reaktif' },
      { pemeriksaan: 'Anti-HBs', nilaiRujukan: 'Non-Reaktif' },
      { pemeriksaan: 'Anti-HCV', nilaiRujukan: 'Non-Reaktif' },
      { pemeriksaan: 'Anti-HIV', nilaiRujukan: 'Non-Reaktif' },
      { pemeriksaan: 'Widal - S. Typhi O', nilaiRujukan: 'Negatif (< 1/80)' },
      { pemeriksaan: 'Widal - S. Typhi H', nilaiRujukan: 'Negatif (< 1/80)' },
      { pemeriksaan: 'Widal - S. Paratyphi A', nilaiRujukan: 'Negatif (< 1/80)' },
      { pemeriksaan: 'Widal - S. Paratyphi B', nilaiRujukan: 'Negatif (< 1/80)' },
      { pemeriksaan: 'Dengue NS1 Antigen', nilaiRujukan: 'Negatif' },
      { pemeriksaan: 'Anti-Dengue IgG / IgM', nilaiRujukan: 'Negatif' },
    ],
  },
  {
    id: 'diffcount',
    label: 'Diffcount',
    items: [
      { pemeriksaan: 'Eosinofil', nilaiRujukan: '1 - 3 %' },
      { pemeriksaan: 'Basofil', nilaiRujukan: '0 - 1 %' },
      { pemeriksaan: 'Staff', nilaiRujukan: '2 - 6 %' },
      { pemeriksaan: 'Netrofil Segmen', nilaiRujukan: '50 - 70 %' },
      { pemeriksaan: 'Limposit', nilaiRujukan: '20 - 40 %' },
      { pemeriksaan: 'Monosit', nilaiRujukan: '2 - 8 %' },
    ],
  },
  {
    id: 'laju_endap_darah',
    label: 'Laju Endap Darah',
    items: [
      { pemeriksaan: 'LED', nilaiRujukan: '< 20 mm/jam' },
    ],
  },
];

export function isDefaultUntouchedRows(rows: readonly LabTableRow[]): boolean {
  if (rows.length !== DEFAULT_LAB_TABLE_ROWS.length) {
    return false;
  }
  return rows.every((row, idx) => {
    const def = DEFAULT_LAB_TABLE_ROWS[idx];
    return (
      def &&
      row.pemeriksaan === def.pemeriksaan &&
      row.hasil.trim() === '' &&
      row.nilaiRujukan === def.nilaiRujukan
    );
  });
}

export function applyLabPackage(
  currentRows: readonly LabTableRow[],
  packageId: string,
): LabTableRow[] {
  const pkg = PAKET_PEMERIKSAAN_LAB.find((p) => p.id === packageId);
  if (!pkg) {
    return Array.from(currentRows);
  }

  const rowsToAdd: LabTableRow[] = pkg.items.map((it, idx) => ({
    id: `pkg-${pkg.id}-${idx}-${Date.now()}`,
    klasifikasi: pkg.label,
    pemeriksaan: it.pemeriksaan,
    hasil: '',
    nilaiRujukan: it.nilaiRujukan,
  }));

  if (currentRows.length === 0 || isDefaultUntouchedRows(currentRows)) {
    return rowsToAdd;
  }

  const existingNames = new Set(
    currentRows.map((r) => r.pemeriksaan.trim().toLowerCase()),
  );
  const filteredRowsToAdd = rowsToAdd.filter(
    (r) => !existingNames.has(r.pemeriksaan.trim().toLowerCase()),
  );

  return [...currentRows, ...filteredRowsToAdd];
}

export function lookupLabReference(
  pemeriksaanName: string,
  dbPaketList: readonly { nama: string; items: readonly { pemeriksaan: string; nilaiRujukan: string }[] }[] = [],
): { klasifikasi: string; nilaiRujukan: string } | null {
  const q = pemeriksaanName.trim().toLowerCase();
  if (!q) return null;

  for (const pkg of dbPaketList) {
    for (const item of pkg.items) {
      const iName = item.pemeriksaan.trim().toLowerCase();
      if (iName === q || (q === 'eosinofil' && iName === 'eosinafil') || (q === 'eosinafil' && iName === 'eosinofil')) {
        return { klasifikasi: pkg.nama, nilaiRujukan: item.nilaiRujukan };
      }
    }
  }

  for (const pkg of PAKET_PEMERIKSAAN_LAB) {
    for (const item of pkg.items) {
      const iName = item.pemeriksaan.trim().toLowerCase();
      if (iName === q || (q === 'eosinofil' && iName === 'eosinafil') || (q === 'eosinafil' && iName === 'eosinofil')) {
        return { klasifikasi: pkg.label, nilaiRujukan: item.nilaiRujukan };
      }
    }
  }

  return null;
}

export function parseIndonesianNumber(str: string): number | null {
  if (!str || !str.trim()) return null;
  const clean = str.replace(/\*+$/g, '').trim();
  const m = clean.match(/^-?[0-9.,]+/);
  if (!m) return null;
  let normalized = m[0];
  if (/\d\.\d{3}(\.|$|,)/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }
  normalized = normalized.replace(/,/g, '.');
  const val = Number(normalized);
  return Number.isFinite(val) ? val : null;
}

export function parseReferenceRange(
  nilaiRujukan: string,
  jenisKelamin?: 'L' | 'P',
): { min?: number; max?: number } | null {
  if (!nilaiRujukan || !nilaiRujukan.trim()) return null;
  const ref = nilaiRujukan.trim();

  // 1. Check sex-specific range first
  if (jenisKelamin === 'P') {
    const pMatch = ref.match(/P\s*[:=]\s*([0-9.,]+)\s*(?:-|–|s\/d|to)\s*([0-9.,]+)/i);
    if (pMatch && pMatch[1] && pMatch[2]) {
      const min = parseIndonesianNumber(pMatch[1]);
      const max = parseIndonesianNumber(pMatch[2]);
      if (min !== null && max !== null) return { min, max };
    }
    const pLess = ref.match(/P\s*[:=]\s*(?:<|<=|kurang dari)\s*([0-9.,]+)/i);
    if (pLess && pLess[1]) {
      const max = parseIndonesianNumber(pLess[1]);
      if (max !== null) return { max };
    }
  }

  if (jenisKelamin === 'L' || !jenisKelamin) {
    const lMatch = ref.match(/L\s*[:=]\s*([0-9.,]+)\s*(?:-|–|s\/d|to)\s*([0-9.,]+)/i);
    if (lMatch && lMatch[1] && lMatch[2]) {
      const min = parseIndonesianNumber(lMatch[1]);
      const max = parseIndonesianNumber(lMatch[2]);
      if (min !== null && max !== null) return { min, max };
    }
    const lLess = ref.match(/L\s*[:=]\s*(?:<|<=|kurang dari)\s*([0-9.,]+)/i);
    if (lLess && lLess[1]) {
      const max = parseIndonesianNumber(lLess[1]);
      if (max !== null) return { max };
    }
  }

  // 2. Standard range min - max
  const rangeMatch = ref.match(/([0-9.,]+)\s*(?:-|–|s\/d|to)\s*([0-9.,]+)/);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    const min = parseIndonesianNumber(rangeMatch[1]);
    const max = parseIndonesianNumber(rangeMatch[2]);
    if (min !== null && max !== null) return { min, max };
  }

  // 3. Less than (< or <=)
  const lessMatch = ref.match(/(?:<|<=|kurang dari)\s*([0-9.,]+)/i);
  if (lessMatch && lessMatch[1]) {
    const max = parseIndonesianNumber(lessMatch[1]);
    if (max !== null) return { max };
  }

  // 4. Greater than (> or >=)
  const greaterMatch = ref.match(/(?:>|>=|lebih dari)\s*([0-9.,]+)/i);
  if (greaterMatch && greaterMatch[1]) {
    const min = parseIndonesianNumber(greaterMatch[1]);
    if (min !== null) return { min };
  }

  return null;
}

export function isLabResultAbnormal(
  hasil: string,
  nilaiRujukan: string,
  jenisKelamin?: 'L' | 'P',
): boolean {
  const hStr = hasil.trim();
  if (!hStr || hStr === '-' || !nilaiRujukan || !nilaiRujukan.trim()) return false;

  const cleanResult = hStr.replace(/\*+$/g, '').trim();
  if (!cleanResult) return false;

  // Qualitative check
  const refLower = nilaiRujukan.trim().toLowerCase();
  const resLower = cleanResult.toLowerCase();
  if (refLower.includes('negatif')) {
    if (resLower.includes('positif') || resLower.includes('reaktif')) return true;
  }
  if (refLower.includes('non-reaktif') || refLower.includes('non reaktif')) {
    if (resLower.includes('reaktif') || resLower.includes('positif')) return true;
  }

  // Quantitative check
  const val = parseIndonesianNumber(cleanResult);
  if (val === null) return false;

  const range = parseReferenceRange(nilaiRujukan, jenisKelamin);
  if (!range) return false;

  if (range.min !== undefined && val < range.min) return true;
  if (range.max !== undefined && val > range.max) return true;

  return false;
}

export function formatAbnormalResult(
  hasil: string,
  nilaiRujukan: string,
  jenisKelamin?: 'L' | 'P',
): string {
  const trimmed = hasil.trim();
  if (!trimmed || trimmed === '-') return trimmed;

  const clean = trimmed.replace(/\*+$/g, '').trim();
  const isAbnormal = isLabResultAbnormal(clean, nilaiRujukan, jenisKelamin);

  if (isAbnormal) {
    return `${clean}*`;
  } else {
    return clean;
  }
}

export function groupLabRowsForPdf(
  rows: readonly LabTableRow[],
  jenisKelamin?: 'L' | 'P',
): { name: string; result: string; reference: string; isHeader?: boolean }[] {
  const output: { name: string; result: string; reference: string; isHeader?: boolean }[] = [];
  let currentKlas = '';
  for (const row of rows) {
    if (row.klasifikasi && row.klasifikasi.trim() && row.klasifikasi.trim().toLowerCase() !== currentKlas) {
      currentKlas = row.klasifikasi.trim().toLowerCase();
      output.push({
        name: row.klasifikasi.trim().toUpperCase(),
        result: '',
        reference: '',
        isHeader: true,
      });
    }
    output.push({
      name: row.pemeriksaan,
      result: formatAbnormalResult(row.hasil, row.nilaiRujukan, jenisKelamin),
      reference: row.nilaiRujukan,
    });
  }
  return output;
}

