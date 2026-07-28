import tandaTangan from '@src/image/tanda-tangan.png';

let cachedSignature: string | null = null;

export async function loadSignatureDataUrl(): Promise<string> {
  if (cachedSignature) {
    return cachedSignature;
  }
  const res = await fetch(tandaTangan);
  if (!res.ok) {
    throw new Error('Gambar tanda tangan tidak ditemukan');
  }
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca tanda tangan'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca tanda tangan'));
    reader.readAsDataURL(blob);
  });
  cachedSignature = dataUrl;
  return dataUrl;
}
