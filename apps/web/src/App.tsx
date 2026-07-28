import { ListRefreshProvider } from './context/ListRefreshContext.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { PdfPreviewHost } from './pdf/pdfPreviewHost.tsx';
import { DASHBOARD_NAV_ID, type AppViewId } from './config/navigation.ts';
import { useAppNavigation } from './hooks/useAppNavigation.ts';
import { clearStoredAuthUser, loadStoredAuthUser, storeAuthUser, type AuthUser } from './lib/auth.ts';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DokterPage } from './pages/DokterPage.tsx';
import { JenisPemeriksaanPage } from './pages/JenisPemeriksaanPage.tsx';
import { KesanPage } from './pages/KesanPage.tsx';
import { LaboratoriumPage } from './pages/LaboratoriumPage.tsx';
import { HargaPemeriksaanLabPage } from './pages/HargaPemeriksaanLabPage.tsx';
import { PaketLabMasterPage } from './pages/PaketLabMasterPage.tsx';
import { KlasifikasiPaketPage } from './pages/KlasifikasiPaketPage.tsx';
import { PendaftaranUmumPage } from './pages/PendaftaranUmumPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { PasienPage } from './pages/PasienPage.tsx';
import { PetugasLabPage } from './pages/PetugasLabPage.tsx';
import { RadiologMasterPage } from './pages/RadiologMasterPage.tsx';
import { RadiologDuplikatPage } from './pages/RadiologDuplikatPage.tsx';
import { RadiologWorkPage } from './pages/RadiologWorkPage.tsx';
import { RolePage } from './pages/RolePage.tsx';
import { SharingPage } from './pages/SharingPage.tsx';
import { LaporanTahunanPage } from './pages/LaporanTahunanPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { FarmasiBhpPage } from './pages/FarmasiBhpPage.tsx';
import { AbsensiPage } from './pages/AbsensiPage.tsx';
import { KeuanganPembukuanPage } from './pages/KeuanganPembukuanPage.tsx';
import { useState } from 'react';

function renderView(viewId: AppViewId) {
  switch (viewId) {
    case DASHBOARD_NAV_ID:
      return <DashboardPage />;
    case 'pasien':
      return <PasienPage />;
    case 'pendaftaran-umum':
      return <PendaftaranUmumPage />;
    case 'harga-pemeriksaan-lab':
      return <HargaPemeriksaanLabPage />;
    case 'lab':
      return <LaboratoriumPage />;
    case 'paket-lab-master':
      return <PaketLabMasterPage />;
    case 'petugas-lab-master':
      return <PetugasLabPage />;
    case 'klasifikasi-paket':
      return <KlasifikasiPaketPage />;
    case 'sharing':
      return <SharingPage />;
    case 'laporan-tahunan':
      return <LaporanTahunanPage />;
    case 'radiolog':
      return <RadiologWorkPage />;
    case 'radiolog-duplikat':
      return <RadiologDuplikatPage />;
    case 'dokter':
      return <DokterPage />;
    case 'jenis-pemeriksaan':
      return <JenisPemeriksaanPage />;
    case 'kesan':
      return <KesanPage />;
    case 'radiolog-master':
      return <RadiologMasterPage />;
    case 'role':
      return <RolePage />;
    case 'admin':
      return <AdminPage />;
    case 'farmasi-bhp':
      return <FarmasiBhpPage />;
    case 'absensi':
      return <AbsensiPage />;
    case 'keuangan-pembukuan':
      return <KeuanganPembukuanPage />;
    default:
      return <DashboardPage />;
  }
}

export function App() {
  const { activeView, navigate } = useAppNavigation();
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadStoredAuthUser());

  function handleLogin(user: AuthUser): void {
    storeAuthUser(user);
    setAuthUser(user);
  }

  function handleLogout(): void {
    clearStoredAuthUser();
    setAuthUser(null);
  }

  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <ListRefreshProvider>
      <PdfPreviewHost>
        <AppShell activeView={activeView} authUser={authUser} onNavigate={navigate} onLogout={handleLogout}>
          {renderView(activeView)}
        </AppShell>
      </PdfPreviewHost>
    </ListRefreshProvider>
  );
}
