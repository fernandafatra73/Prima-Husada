import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface SharingArsipReportItem {
  readonly no: number;
  readonly nama: string;
  readonly regCode: string;
  readonly tanggal: string;
  readonly alamat: string;
  readonly pemeriksaan: string;
  readonly totalHargaFormatted: string;
}

export interface SharingArsipReportData {
  readonly logoSrc: string;
  readonly moduleLabel: string;
  readonly dokterNama: string;
  readonly periodeLabel: string;
  readonly tanggalCetak: string;
  readonly items: readonly SharingArsipReportItem[];
  readonly totalPasien: number;
  readonly totalPendapatanFormatted: string;
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
  colNama: { width: '20%', paddingLeft: 3 },
  colReg: { width: '13%', paddingLeft: 3 },
  colTanggal: { width: '10%', textAlign: 'center' },
  colAlamat: { width: '22%', paddingLeft: 3 },
  colPemeriksaan: { width: '17%', paddingLeft: 3 },
  colHarga: { width: '13%', textAlign: 'right', paddingRight: 3 },

  summaryContainer: {
    marginTop: 8,
    alignSelf: 'flex-end',
    width: 220,
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
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    fontWeight: 'bold',
    color: BLUE,
    paddingTop: 3,
    borderTopWidth: 0.8,
    borderColor: BLACK,
    marginTop: 2,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  signatureBox: {
    alignItems: 'center',
    width: 150,
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

export function SharingArsipReportDocument({ data }: { readonly data: SharingArsipReportData }) {
  return (
    <Document title={`Laporan_Sharing_${data.moduleLabel}_${data.dokterNama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>KLINIK PRIMA HUSADA</Text>
              <Text style={styles.clinicAddress}>
                Jl Siliwangi No 28 A Parung Kuda Telp. 0857-1932-5557
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>
              LAPORAN SHARING {data.moduleLabel} — ARSIP DUPLIKAT
            </Text>
          </View>

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

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colNama}>Nama Pasien</Text>
              <Text style={styles.colReg}>No. Reg</Text>
              <Text style={styles.colTanggal}>Tanggal</Text>
              <Text style={styles.colAlamat}>Alamat</Text>
              <Text style={styles.colPemeriksaan}>Pemeriksaan</Text>
              <Text style={styles.colHarga}>Total Harga</Text>
            </View>
            {data.items.length === 0 ? (
              <View style={styles.trRow}>
                <Text style={{ width: '100%', textAlign: 'center', paddingVertical: 4 }}>
                  Belum ada data pasien untuk kriteria ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colNama}>{truncatePdfCell(row.nama, 24)}</Text>
                  <Text style={styles.colReg}>{row.regCode}</Text>
                  <Text style={styles.colTanggal}>{row.tanggal}</Text>
                  <Text style={styles.colAlamat}>{truncatePdfCell(row.alamat, 26)}</Text>
                  <Text style={styles.colPemeriksaan}>{truncatePdfCell(row.pemeriksaan, 20)}</Text>
                  <Text style={styles.colHarga}>{row.totalHargaFormatted}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text>Total Pasien:</Text>
              <Text style={styles.bold}>{data.totalPasien} Pasien</Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text>Total Pendapatan:</Text>
              <Text>{data.totalPendapatanFormatted}</Text>
            </View>
          </View>

          <View style={styles.signatureSection}>
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
