export interface AuthUser {
  readonly id: string;
  readonly nama: string;
  readonly email: string;
  readonly role: 'ADMIN' | 'KARYAWAN';
}

const AUTH_STORAGE_KEY = 'labprima.authUser';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nama === 'string' &&
    typeof value.email === 'string' &&
    (value.role === 'ADMIN' || value.role === 'KARYAWAN')
  );
}

export function loadStoredAuthUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeAuthUser(user: AuthUser): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuthUser(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
