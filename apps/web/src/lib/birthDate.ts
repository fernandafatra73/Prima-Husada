const MIN_YEAR = 1900;

export function birthDateInputMin(): string {
  return `${MIN_YEAR}-01-01`;
}

export function birthDateInputMax(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Clamp manual date input to a sensible birth-date range. */
export function clampBirthDateInput(value: string): string {
  if (!value) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return '';
  }
  const year = Number(match[1]);
  const maxYear = new Date().getFullYear();
  if (!Number.isFinite(year) || year < MIN_YEAR || year > maxYear) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  if (parsed > new Date()) {
    return birthDateInputMax();
  }
  return value;
}

export function isValidBirthDate(value: string): boolean {
  return clampBirthDateInput(value) === value && value.length > 0;
}

/** Validasi hanya saat blur/submit — jangan dipakai di onChange (bisa reset MM/DD). */
export function normalizeBirthDateOnBlur(value: string): string {
  if (!value) {
    return '';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const clamped = clampBirthDateInput(value);
  if (clamped) {
    return clamped;
  }
  const maxYear = new Date().getFullYear();
  const y = Number(value.slice(0, 4));
  if (y > maxYear) {
    return `${maxYear}${value.slice(4)}`;
  }
  if (y < MIN_YEAR) {
    return `${MIN_YEAR}${value.slice(4)}`;
  }
  return value;
}
