import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface SharingReportItem {
  readonly no: number;
  readonly nama: string;
  readonly regCode: string;
  readonly umurLabel: string;
  readonly tanggal: string;
  readonly alamat: string;
  readonly pemeriksaan: string;
  readonly sharingFormatted: string;
}

export interface SharingReportData {
  readonly logoSrc: string;
  readonly dokterNama: string;
  readonly periodeLabel: string;
  readonly tanggalCetak: string;
  readonly items: readonly SharingReportItem[];
  readonly totalPasien: number;
  readonly totalSharingFormatted: string;
  readonly adminFeeFormatted: string;
  readonly netSharingFormatted: string;
  readonly catatan: string;
  readonly adminNama: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: BLACK,
  },
  frame: {
    height: '100%',
    borderWidth: 1,
    borderColor: BLACK,
    padding: 10,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 8,
    color: BLACK,
    lineHeight: 1.35,
  },
  divider: {
    height: 2,
    backgroundColor: BLUE,
    marginVertical: 5,
  },
  titleSection: {
    textAlign: 'center',
    marginVertical: 4,
  },
  reportTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BLUE,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    padding: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  infoText: {
    fontSize: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 4,
    borderWidth: 0.8,
    borderColor: BLACK,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderBottomWidth: 0.8,
    borderColor: BLACK,
    paddingVertical: 4,
    fontWeight: 'bold',
    fontSize: 8,
  },
  trRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
    paddingVertical: 3,
    fontSize: 8,
  },
  colNo: { width: '5%', textAlign: 'center' },
  colNama: { width: '23%', paddingLeft: 3 },
  colUmur: { width: '9%', textAlign: 'center' },
  colTanggal: { width: '12%', textAlign: 'center' },
  colAlamat: { width: '22%', paddingLeft: 3 },
  colPemeriksaan: { width: '16%', paddingLeft: 3 },
  colSharing: { width: '13%', textAlign: 'right', paddingRight: 3 },

  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  notesContainer: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: BLACK,
    padding: 6,
    minHeight: 55,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 3,
  },
  notesBody: {
    fontSize: 7.5,
    lineHeight: 1.3,
  },
  summaryContainer: {
    width: 190,
    borderWidth: 0.8,
    borderColor: BLACK,
    padding: 6,
    flexDirection: 'column',
    gap: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
  },
  summaryRowNet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    fontWeight: 'bold',
    color: BLUE,
    paddingTop: 3,
    borderTopWidth: 0.8,
    borderColor: BLACK,
    marginTop: 2,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  signatureBox: {
    alignItems: 'center',
    width: 130,
  },
  signatureTitle: {
    fontSize: 8,
    marginBottom: 28,
  },
  signatureName: {
    fontSize: 8,
    fontWeight: 'bold',
    borderTopWidth: 0.8,
    borderColor: BLACK,
    paddingTop: 2,
    width: '100%',
    textAlign: 'center',
  },
});

export function SharingReportDocument({ data }: { readonly data: SharingReportData }) {
  return (
    <Document title={`Laporan_Sharing_${data.dokterNama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          {/* Header */}
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>KLINIK PRABUMULIH PRIMA</Text>
              <Text style={styles.clinicAddress}>
                Jl. Padat Karya Kel. Gunung Ibul Kec. Prabumulih Timur Kota Prabumulih{'\n'}
                Telp: 0812-7800-800 • Email: labprima.prabumulih@gmail.com
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>LAPORAN REKAPITULASI SHARING DOKTER PENGIRIM</Text>
          </View>

          {/* Meta Info */}
          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Dokter Pengirim: <Text style={styles.bold}>{data.dokterNama}</Text>
            </Text>
            <Text style={styles.infoText}>
              Periode: <Text style={styles.bold}>{data.periodeLabel}</Text>
            </Text>
            <Text style={styles.infoText}>
              Tgl Cetak: <Text style={styles.bold}>{data.tanggalCetak}</Text>
            </Text>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colNama}>Nama Pasien</Text>
              <Text style={styles.colUmur}>Umur</Text>
              <Text style={styles.colTanggal}>Tanggal</Text>
              <Text style={styles.colAlamat}>Alamat</Text>
              <Text style={styles.colPemeriksaan}>Pemeriksaan</Text>
              <Text style={styles.colSharing}>Sharing</Text>
            </View>
            {data.items.length === 0 ? (
              <View style={styles.trRow}>
                <Text style={{ width: '100%', textAlign: 'center', paddingVertical: 4 }}>
                  Belum ada data pasien sharing untuk kriteria ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colNama}>
                    {truncatePdfCell(row.nama, 28)}
                  </Text>
                  <Text style={styles.colUmur}>{row.umurLabel}</Text>
                  <Text style={styles.colTanggal}>{row.tanggal}</Text>
                  <Text style={styles.colAlamat}>{truncatePdfCell(row.alamat, 28)}</Text>
                  <Text style={styles.colPemeriksaan}>{truncatePdfCell(row.pemeriksaan, 20)}</Text>
                  <Text style={styles.colSharing}>{row.sharingFormatted}</Text>
                </View>
              ))
            )}
          </View>

          {/* Bottom Layout */}
          <View style={styles.bottomSection}>
            {/* Notes Left */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Catatan Pembayaran Sharing:</Text>
              <Text style={styles.notesBody}>{data.catatan || '—'}</Text>
            </View>

            {/* Summary Right */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text>Total Pasien:</Text>
                <Text style={styles.bold}>{data.totalPasien} Pasien</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Total Sharing:</Text>
                <Text style={styles.bold}>{data.totalSharingFormatted}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Biaya/Potongan Admin:</Text>
                <Text style={styles.bold}>{data.adminFeeFormatted}</Text>
              </View>
              <View style={styles.summaryRowNet}>
                <Text>Total Net Sharing:</Text>
                <Text>{data.netSharingFormatted}</Text>
              </View>
            </View>
          </View>

          {/* Signature Section */}
          <View style={styles.signatureSection}>
            <View style={{ flex: 1 }} />
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Petugas Admin Klinik</Text>
              <Text style={styles.signatureName}>
                {data.adminNama ? data.adminNama : '( Petugas Admin Klinik )'}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
