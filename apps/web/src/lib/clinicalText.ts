export const CLINICAL_MAX_WORDS = 100;

/** Perkiraan panjang kata tanpa spasi (mis. teks uji). */
const MAX_RUN_CHARS = CLINICAL_MAX_WORDS * 8;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function limitToMaxWords(text: string, maxWords = CLINICAL_MAX_WORDS): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length > MAX_RUN_CHARS) {
    return `${words[0].slice(0, MAX_RUN_CHARS)}…`;
  }
  if (words.length <= maxWords) {
    return trimmed;
  }
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export function clampClinicalInput(text: string, maxWords = CLINICAL_MAX_WORDS): string {
  return limitToMaxWords(text, maxWords);
}
