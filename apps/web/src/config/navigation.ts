export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly shortLabel?: string;
  readonly isPlaceholder?: boolean;
}

export interface NavCategory {
  readonly id: string;
  readonly label: string;
  readonly iconName: string;
  readonly items: readonly NavItem[];
}

export const MAIN_NAV_CATEGORIES: readonly NavCategory[] = [
  {
    id: 'pendaftaran',
    label: 'Pendaftaran',
    iconName: 'clipboard',
    items: [
      { id: 'pendaftaran-umum', label: 'Pendaftaran Umum', shortLabel: 'Pendaftaran Umum' },
    ],
  },
  {
    id: 'radiologi',
    label: 'Radiologi',
    iconName: 'stethoscope',
    items: [
      { id: 'pasien', label: 'Data & Registrasi Pasien', shortLabel: 'Registrasi Pasien' },
      { id: 'radiolog', label: 'Pekerjaan Radiolog', shortLabel: 'Pekerjaan Radiolog' },
      { id: 'radiolog-duplikat', label: 'Duplikat Radiologi', shortLabel: 'Duplikat Radiologi' },
      { id: 'cetak-al', label: 'Cetak A+L (Amplop & Label)', shortLabel: 'Cetak A+L' },
      { id: 'jenis-pemeriksaan', label: 'Jenis Pemeriksaan, Harga & Sharing', shortLabel: 'Jenis Pemeriksaan' },
      { id: 'kesan', label: 'Master Kesan (Expertise)', shortLabel: 'Master Kesan' },
      { id: 'radiolog-master', label: 'Master Radiolog', shortLabel: 'Master Radiolog' },
    ],
  },
  {
    id: 'laboratorium',
    label: 'Laboratorium',
    iconName: 'flask',
    items: [
      { id: 'lab', label: 'Registrasi Lab', shortLabel: 'Registrasi Lab' },
      { id: 'harga-pemeriksaan-lab', label: 'Harga Pemeriksaan Lab', shortLabel: 'Harga Pemeriksaan Lab' },
      { id: 'paket-lab-master', label: 'Jenis Pemeriksaan Lab', shortLabel: 'Jenis Pemeriksaan Lab' },
      { id: 'petugas-lab-master', label: 'Master Petugas Laboratorium', shortLabel: 'Petugas Lab' },
      { id: 'klasifikasi-paket', label: 'Klasifikasi Paket', shortLabel: 'Klasifikasi Paket' },
    ],
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    iconName: 'currency',
    items: [
      { id: 'keuangan-pembukuan', label: 'Sistem Keuangan & Pembukuan', shortLabel: 'Buku Kas & Keuangan' },
      { id: 'sharing', label: 'Manajemen Sharing Dokter', shortLabel: 'Sharing Dokter' },
      { id: 'laporan-tahunan', label: 'Laporan Tahunan', shortLabel: 'Laporan Tahunan' },
    ],
  },
  {
    id: 'master-sistem',
    label: 'Dokter & System',
    iconName: 'shield',
    items: [
      { id: 'dokter', label: 'Manajemen Dokter Pengirim', shortLabel: 'Dokter Pengirim' },
      { id: 'role', label: 'Manajemen Role & Staff', shortLabel: 'Role & Staff' },
      { id: 'admin', label: 'Manajemen Admin', shortLabel: 'Admin' },
    ],
  },
  {
    id: 'klinik-umum',
    label: 'Klinik Umum',
    iconName: 'hospital',
    items: [
      { id: 'pendaftaran-umum', label: 'Pendaftaran Umum', shortLabel: 'Pendaftaran Umum' },
      { id: 'absensi', label: 'Daftar Hadir Karyawan', shortLabel: 'Presensi Staff' },
      { id: 'rekam-medis-umum', label: 'Rekam Medis Umum', shortLabel: 'Rekam Medis' },
    ],
  },
  {
    id: 'farmasi',
    label: 'Farmasi & BHP',
    iconName: 'pill',
    items: [
      { id: 'farmasi-bhp', label: 'Manajemen Farmasi & BHP', shortLabel: 'Stok Obat & BHP' },
    ],
  },
];

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { id: 'pasien', label: 'Data & Registrasi Pasien', shortLabel: 'Registrasi Pasien' },
  { id: 'pendaftaran-umum', label: 'Pendaftaran Umum', shortLabel: 'Pendaftaran Umum' },
  { id: 'absensi', label: 'Daftar Hadir Karyawan', shortLabel: 'Presensi Staff' },
  { id: 'farmasi-bhp', label: 'Manajemen Farmasi & BHP', shortLabel: 'Stok Obat & BHP' },
  { id: 'keuangan-pembukuan', label: 'Sistem Keuangan & Pembukuan', shortLabel: 'Buku Kas & Keuangan' },
  { id: 'lab', label: 'Registrasi Lab', shortLabel: 'Registrasi Lab' },
  { id: 'harga-pemeriksaan-lab', label: 'Harga Pemeriksaan Lab', shortLabel: 'Harga Pemeriksaan Lab' },
  { id: 'paket-lab-master', label: 'Jenis Pemeriksaan Lab', shortLabel: 'Jenis Pemeriksaan Lab' },
  { id: 'petugas-lab-master', label: 'Master Petugas Laboratorium', shortLabel: 'Petugas Lab' },
  { id: 'klasifikasi-paket', label: 'Klasifikasi Paket', shortLabel: 'Klasifikasi Paket' },
  { id: 'sharing', label: 'Manajemen Sharing Dokter', shortLabel: 'Sharing Dokter' },
  { id: 'laporan-tahunan', label: 'Laporan Tahunan', shortLabel: 'Laporan Tahunan' },
  { id: 'radiolog', label: 'Pekerjaan Radiolog', shortLabel: 'Pekerjaan Radiolog' },
  { id: 'radiolog-duplikat', label: 'Duplikat Radiologi', shortLabel: 'Duplikat Radiologi' },
  { id: 'cetak-al', label: 'Cetak A+L (Amplop & Label)', shortLabel: 'Cetak A+L' },
  { id: 'dokter', label: 'Manajemen Dokter', shortLabel: 'Dokter' },
  { id: 'jenis-pemeriksaan', label: 'Manajemen Jenis Pemeriksaan', shortLabel: 'Jenis Pemeriksaan' },
  { id: 'kesan', label: 'Manajemen Kesan', shortLabel: 'Kesan' },
  { id: 'radiolog-master', label: 'Manajemen Radiolog', shortLabel: 'Radiolog (Master)' },
  { id: 'role', label: 'Manajemen Role', shortLabel: 'Role' },
  { id: 'admin', label: 'Manajemen Admin', shortLabel: 'Admin' },
] as const;

export type MainNavId = (typeof MAIN_NAV_ITEMS)[number]['id'];

export const DASHBOARD_NAV_ID = 'dashboard' as const;

export type AppViewId = typeof DASHBOARD_NAV_ID | MainNavId;

const ALL_VIEW_IDS: readonly AppViewId[] = [
  DASHBOARD_NAV_ID,
  ...MAIN_NAV_ITEMS.map((item) => item.id),
];

export function isAppViewId(value: string): value is AppViewId {
  return (ALL_VIEW_IDS as readonly string[]).includes(value);
}

export function pathnameForView(id: AppViewId): string {
  return id === DASHBOARD_NAV_ID ? '/' : `/${id}`;
}

export function viewIdFromPathname(pathname: string): AppViewId {
  const segment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0] ?? '';
  if (segment === '' || segment === DASHBOARD_NAV_ID) {
    return DASHBOARD_NAV_ID;
  }
  return isAppViewId(segment) ? segment : DASHBOARD_NAV_ID;
}

export function getNavLabel(id: AppViewId): string {
  if (id === DASHBOARD_NAV_ID) {
    return 'Dashboard';
  }
  const item = MAIN_NAV_ITEMS.find((n) => n.id === id);
  return item?.label ?? id;
}
