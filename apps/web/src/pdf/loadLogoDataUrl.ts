import logoLabprima from '@src/image/logo-labprima.png';

let cachedLogo: string | null = null;

export async function loadLogoDataUrl(): Promise<string> {
  if (cachedLogo) {
    return cachedLogo;
  }
  const res = await fetch(logoLabprima);
  if (!res.ok) {
    throw new Error('Logo tidak ditemukan');
  }
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca logo'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca logo'));
    reader.readAsDataURL(blob);
  });
  cachedLogo = dataUrl;
  return dataUrl;
}
