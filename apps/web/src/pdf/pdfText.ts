import { CLINICAL_MAX_WORDS, limitToMaxWords } from '../lib/clinicalText.ts';

const CELL_MAX_CHARS = 48;
const PDF_LINE_CHUNK = 52;

export function truncatePdfCell(text: string, maxChars = CELL_MAX_CHARS): string {
  const normalized = text.trim() || '—';
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars - 1)}…`;
}

/** Pecah string panjang supaya react-pdf wrap; klinis/kesan dibatasi ~100 kata. */
export function formatPdfClinicalText(text: string): string {
  const limited = limitToMaxWords(text, CLINICAL_MAX_WORDS) || '—';
  return formatPdfMultiline(limited, PDF_LINE_CHUNK);
}

function formatPdfMultiline(text: string, chunkSize: number): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.length <= chunkSize) {
        return line;
      }
      const parts: string[] = [];
      for (let i = 0; i < line.length; i += chunkSize) {
        parts.push(line.slice(i, i + chunkSize));
      }
      return parts.join('\n');
    })
    .join('\n');
}
