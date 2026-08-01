import { useCallback, useEffect, useState } from 'react';
import { ListPageShell } from '../components/ui/ListPageShell.tsx';
import { SharingPdfPreviewModal } from '../components/ui/SharingPdfPreviewModal.tsx';
import { apiGet, apiPut } from '../lib/api.ts';
import {
  SuratKeteranganSehatDocument,
  type SuratKeteranganSehatData,
} from '../pdf/SuratKeteranganSehatDocument.tsx';
import {
  SuratKeteranganRujukanDocument,
  type SuratKeteranganRujukanData,
} from '../pdf/SuratKeteranganRujukanDocument.tsx';
import { loadLogoDataUrl } from '../pdf/loadLogoDataUrl.ts';
import { pdf } from '@react-pdf/renderer';
import '../components/ui/ui.css';

interface KopSuratData {
  readonly namaKlinik: string;
  readonly alamat: string;
  readonly telepon: string;
  readonly logoDataUrl: string | null;
}

const TABS = [
  { id: 'kop-surat', label: 'Kop Surat' },
  { id: 'sehat', label: 'Surat Keterangan Sehat' },
  { id: 'rujukan', label: 'Surat Keterangan Rujukan' },
] as const;

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

function formatTanggalLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

const emptyKopSuratForm = { namaKlinik: '', alamat: '', telepon: '', logoDataUrl: null as string | null };

const emptySehatForm = {
  nomorSurat: '',
  namaPasien: '',
  tempatTanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  pekerjaan: '',
  alamatPasien: '',
  hasilPemeriksaan: 'dalam keadaan SEHAT dan tidak menderita penyakit menular',
  keperluan: '',
  tempatSurat: 'Sukabumi',
  tanggalSurat: todayStr(),
  namaDokter: '',
  jabatanDokter: 'Dokter Pemeriksa',
};

const emptyRujukanForm = {
  nomorSurat: '',
  namaPasien: '',
  tempatTanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  alamatPasien: '',
  dirujukKe: '',
  diagnosaKeluhan: '',
  alasanRujukan: '',
  tempatSurat: 'Sukabumi',
  tanggalSurat: todayStr(),
  namaDokter: '',
  jabatanDokter: 'Dokter Pengirim',
};

export function TempletPage() {
  const [activeTab, setActiveTab] = useState<string>('kop-surat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kopSuratForm, setKopSuratForm] = useState(emptyKopSuratForm);
  const [savingKopSurat, setSavingKopSurat] = useState(false);

  const [sehatForm, setSehatForm] = useState(emptySehatForm);
  const [rujukanForm, setRujukanForm] = useState(emptyRujukanForm);

  const [printingPdf, setPrintingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = useState('Surat.pdf');

  const fetchKopSurat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ item: KopSuratData }>('/api/kop-surat');
      setKopSuratForm({
        namaKlinik: res.item.namaKlinik,
        alamat: res.item.alamat,
        telepon: res.item.telepon,
        logoDataUrl: res.item.logoDataUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kop surat');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKopSurat();
  }, [fetchKopSurat]);

  async function resolveLogoSrc(): Promise<string> {
    if (kopSuratForm.logoDataUrl) return kopSuratForm.logoDataUrl;
    return loadLogoDataUrl().catch(() => '');
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setKopSuratForm((f) => ({ ...f, logoDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveKopSurat(e: React.FormEvent) {
    e.preventDefault();
    setSavingKopSurat(true);
    setError(null);
    try {
      await apiPut('/api/kop-surat', kopSuratForm);
      await fetchKopSurat();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kop surat');
    } finally {
      setSavingKopSurat(false);
    }
  }

  async function buildSehatData(): Promise<SuratKeteranganSehatData> {
    const logoSrc = await resolveLogoSrc();
    return {
      logoSrc,
      namaKlinik: kopSuratForm.namaKlinik,
      alamatKlinik: kopSuratForm.alamat,
      teleponKlinik: kopSuratForm.telepon,
      nomorSurat: sehatForm.nomorSurat,
      namaPasien: sehatForm.namaPasien,
      tempatTanggalLahir: sehatForm.tempatTanggalLahir,
      jenisKelamin: sehatForm.jenisKelamin,
      pekerjaan: sehatForm.pekerjaan,
      alamatPasien: sehatForm.alamatPasien,
      hasilPemeriksaan: sehatForm.hasilPemeriksaan,
      keperluan: sehatForm.keperluan,
      tempatSurat: sehatForm.tempatSurat,
      tanggalSurat: formatTanggalLabel(sehatForm.tanggalSurat),
      namaDokter: sehatForm.namaDokter,
      jabatanDokter: sehatForm.jabatanDokter,
    };
  }

  async function buildRujukanData(): Promise<SuratKeteranganRujukanData> {
    const logoSrc = await resolveLogoSrc();
    return {
      logoSrc,
      namaKlinik: kopSuratForm.namaKlinik,
      alamatKlinik: kopSuratForm.alamat,
      teleponKlinik: kopSuratForm.telepon,
      nomorSurat: rujukanForm.nomorSurat,
      namaPasien: rujukanForm.namaPasien,
      tempatTanggalLahir: rujukanForm.tempatTanggalLahir,
      jenisKelamin: rujukanForm.jenisKelamin,
      alamatPasien: rujukanForm.alamatPasien,
      dirujukKe: rujukanForm.dirujukKe,
      diagnosaKeluhan: rujukanForm.diagnosaKeluhan,
      alasanRujukan: rujukanForm.alasanRujukan,
      tempatSurat: rujukanForm.tempatSurat,
      tanggalSurat: formatTanggalLabel(rujukanForm.tanggalSurat),
      namaDokter: rujukanForm.namaDokter,
      jabatanDokter: rujukanForm.jabatanDokter,
    };
  }

  async function handleCetak() {
    setPrintingPdf(true);
    try {
      const blob =
        activeTab === 'sehat'
          ? await pdf(<SuratKeteranganSehatDocument data={await buildSehatData()} />).toBlob()
          : await pdf(<SuratKeteranganRujukanDocument data={await buildRujukanData()} />).toBlob();
      const namaPasien = activeTab === 'sehat' ? sehatForm.namaPasien : rujukanForm.namaPasien;
      const filename = `Surat_Keterangan_${activeTab === 'sehat' ? 'Sehat' : 'Rujukan'}_${namaPasien || 'Pasien'}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setPrintingPdf(false);
    }
  }

  async function handlePreview() {
    setPreviewingPdf(true);
    try {
      const blob =
        activeTab === 'sehat'
          ? await pdf(<SuratKeteranganSehatDocument data={await buildSehatData()} />).toBlob()
          : await pdf(<SuratKeteranganRujukanDocument data={await buildRujukanData()} />).toBlob();
      const namaPasien = activeTab === 'sehat' ? sehatForm.namaPasien : rujukanForm.namaPasien;
      setPreviewFilename(
        `Surat_Keterangan_${activeTab === 'sehat' ? 'Sehat' : 'Rujukan'}_${namaPasien || 'Pasien'}.pdf`,
      );
      setPreviewBlob(blob);
      setPreviewModalOpen(true);
    } finally {
      setPreviewingPdf(false);
    }
  }

  return (
    <>
      <ListPageShell
        title="Templet"
        subtitle="Kop surat dan template surat siap cetak (Surat Keterangan Sehat, Surat Keterangan Rujukan)"
        tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        error={error}
        loading={loading}
        filterExtra={
          activeTab !== 'kop-surat' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => void handleCetak()}
                disabled={printingPdf || previewingPdf}
              >
                🖨️ {printingPdf ? 'Membuat PDF...' : 'Cetak PDF'}
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => void handlePreview()}
                disabled={previewingPdf || printingPdf}
                style={{ border: '1px solid var(--color-border)' }}
              >
                👁️ {previewingPdf ? 'Memuat...' : 'Preview PDF'}
              </button>
            </div>
          ) : null
        }
      >
        {activeTab === 'kop-surat' && (
          <form onSubmit={(e) => void handleSaveKopSurat(e)} className="form-grid" style={{ maxWidth: '640px' }}>
            <div className="form-field form-field--full">
              <label htmlFor="kop-nama-klinik">Nama Klinik</label>
              <input
                id="kop-nama-klinik"
                required
                value={kopSuratForm.namaKlinik}
                onChange={(e) => setKopSuratForm((f) => ({ ...f, namaKlinik: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="kop-alamat">Alamat</label>
              <input
                id="kop-alamat"
                value={kopSuratForm.alamat}
                onChange={(e) => setKopSuratForm((f) => ({ ...f, alamat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="kop-telepon">Telepon</label>
              <input
                id="kop-telepon"
                value={kopSuratForm.telepon}
                onChange={(e) => setKopSuratForm((f) => ({ ...f, telepon: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="kop-logo">Logo</label>
              <input id="kop-logo" type="file" accept="image/*" onChange={handleLogoFileChange} />
              {kopSuratForm.logoDataUrl && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={kopSuratForm.logoDataUrl}
                    alt="Preview logo"
                    style={{ width: 64, height: 64, objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                  />
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setKopSuratForm((f) => ({ ...f, logoDataUrl: null }))}
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    Hapus Logo (Pakai Default)
                  </button>
                </div>
              )}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn--primary" disabled={savingKopSurat}>
                {savingKopSurat ? 'Menyimpan...' : 'Simpan Kop Surat'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'sehat' && (
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <label htmlFor="sehat-nomor">Nomor Surat</label>
              <input
                id="sehat-nomor"
                value={sehatForm.nomorSurat}
                onChange={(e) => setSehatForm((f) => ({ ...f, nomorSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-nama">Nama Pasien *</label>
              <input
                id="sehat-nama"
                required
                value={sehatForm.namaPasien}
                onChange={(e) => setSehatForm((f) => ({ ...f, namaPasien: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-ttl">Tempat/Tanggal Lahir</label>
              <input
                id="sehat-ttl"
                placeholder="Sukabumi, 01 Januari 1990"
                value={sehatForm.tempatTanggalLahir}
                onChange={(e) => setSehatForm((f) => ({ ...f, tempatTanggalLahir: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-jk">Jenis Kelamin</label>
              <select
                id="sehat-jk"
                value={sehatForm.jenisKelamin}
                onChange={(e) => setSehatForm((f) => ({ ...f, jenisKelamin: e.target.value }))}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="sehat-pekerjaan">Pekerjaan</label>
              <input
                id="sehat-pekerjaan"
                value={sehatForm.pekerjaan}
                onChange={(e) => setSehatForm((f) => ({ ...f, pekerjaan: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="sehat-alamat">Alamat Pasien</label>
              <input
                id="sehat-alamat"
                value={sehatForm.alamatPasien}
                onChange={(e) => setSehatForm((f) => ({ ...f, alamatPasien: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="sehat-hasil">Hasil Pemeriksaan</label>
              <input
                id="sehat-hasil"
                value={sehatForm.hasilPemeriksaan}
                onChange={(e) => setSehatForm((f) => ({ ...f, hasilPemeriksaan: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="sehat-keperluan">Keperluan</label>
              <input
                id="sehat-keperluan"
                placeholder="Contoh: melamar pekerjaan"
                value={sehatForm.keperluan}
                onChange={(e) => setSehatForm((f) => ({ ...f, keperluan: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-tempat-ttd">Tempat Surat</label>
              <input
                id="sehat-tempat-ttd"
                value={sehatForm.tempatSurat}
                onChange={(e) => setSehatForm((f) => ({ ...f, tempatSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-tanggal-ttd">Tanggal Surat</label>
              <input
                id="sehat-tanggal-ttd"
                type="date"
                value={sehatForm.tanggalSurat}
                onChange={(e) => setSehatForm((f) => ({ ...f, tanggalSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-nama-dokter">Nama Dokter</label>
              <input
                id="sehat-nama-dokter"
                value={sehatForm.namaDokter}
                onChange={(e) => setSehatForm((f) => ({ ...f, namaDokter: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sehat-jabatan-dokter">Jabatan</label>
              <input
                id="sehat-jabatan-dokter"
                value={sehatForm.jabatanDokter}
                onChange={(e) => setSehatForm((f) => ({ ...f, jabatanDokter: e.target.value }))}
              />
            </div>
          </form>
        )}

        {activeTab === 'rujukan' && (
          <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <label htmlFor="rujukan-nomor">Nomor Surat</label>
              <input
                id="rujukan-nomor"
                value={rujukanForm.nomorSurat}
                onChange={(e) => setRujukanForm((f) => ({ ...f, nomorSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-nama">Nama Pasien *</label>
              <input
                id="rujukan-nama"
                required
                value={rujukanForm.namaPasien}
                onChange={(e) => setRujukanForm((f) => ({ ...f, namaPasien: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-ttl">Tempat/Tanggal Lahir</label>
              <input
                id="rujukan-ttl"
                placeholder="Sukabumi, 01 Januari 1990"
                value={rujukanForm.tempatTanggalLahir}
                onChange={(e) => setRujukanForm((f) => ({ ...f, tempatTanggalLahir: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-jk">Jenis Kelamin</label>
              <select
                id="rujukan-jk"
                value={rujukanForm.jenisKelamin}
                onChange={(e) => setRujukanForm((f) => ({ ...f, jenisKelamin: e.target.value }))}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="rujukan-alamat">Alamat Pasien</label>
              <input
                id="rujukan-alamat"
                value={rujukanForm.alamatPasien}
                onChange={(e) => setRujukanForm((f) => ({ ...f, alamatPasien: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="rujukan-dirujuk">Dirujuk Ke *</label>
              <input
                id="rujukan-dirujuk"
                required
                placeholder="Contoh: RSUD Sekarwangi / dr. Spesialis X"
                value={rujukanForm.dirujukKe}
                onChange={(e) => setRujukanForm((f) => ({ ...f, dirujukKe: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="rujukan-diagnosa">Diagnosa / Keluhan</label>
              <textarea
                id="rujukan-diagnosa"
                rows={2}
                value={rujukanForm.diagnosaKeluhan}
                onChange={(e) => setRujukanForm((f) => ({ ...f, diagnosaKeluhan: e.target.value }))}
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="rujukan-alasan">Alasan Rujukan</label>
              <textarea
                id="rujukan-alasan"
                rows={2}
                value={rujukanForm.alasanRujukan}
                onChange={(e) => setRujukanForm((f) => ({ ...f, alasanRujukan: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-tempat-ttd">Tempat Surat</label>
              <input
                id="rujukan-tempat-ttd"
                value={rujukanForm.tempatSurat}
                onChange={(e) => setRujukanForm((f) => ({ ...f, tempatSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-tanggal-ttd">Tanggal Surat</label>
              <input
                id="rujukan-tanggal-ttd"
                type="date"
                value={rujukanForm.tanggalSurat}
                onChange={(e) => setRujukanForm((f) => ({ ...f, tanggalSurat: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-nama-dokter">Nama Dokter</label>
              <input
                id="rujukan-nama-dokter"
                value={rujukanForm.namaDokter}
                onChange={(e) => setRujukanForm((f) => ({ ...f, namaDokter: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="rujukan-jabatan-dokter">Jabatan</label>
              <input
                id="rujukan-jabatan-dokter"
                value={rujukanForm.jabatanDokter}
                onChange={(e) => setRujukanForm((f) => ({ ...f, jabatanDokter: e.target.value }))}
              />
            </div>
          </form>
        )}
      </ListPageShell>

      <SharingPdfPreviewModal
        open={previewModalOpen}
        blob={previewBlob}
        filename={previewFilename}
        onClose={() => setPreviewModalOpen(false)}
        title="Pratinjau Surat"
      />
    </>
  );
}
