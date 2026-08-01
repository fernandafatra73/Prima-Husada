import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface AdvantageReportData {
  readonly logoSrc: string;
  readonly periodeLabel: string;
  readonly tanggalCetak: string;
  readonly penerimaanFormatted: string;
  readonly bhpFormatted: string;
  readonly gajiKaryawanFormatted: string;
  readonly pajakFormatted: string;
  readonly pengeluaranFormatted: string;
  readonly advantageFormatted: string;
  readonly catatan: string;
  readonly adminNama: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';
const GREEN = '#15803d';
const RED = '#b91c1c';

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BLACK,
  },
  frame: {
    height: '100%',
    borderWidth: 1,
    borderColor: BLACK,
    padding: 12,
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
    marginVertical: 6,
  },
  titleSection: {
    textAlign: 'center',
    marginVertical: 4,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BLUE,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    padding: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  infoText: {
    fontSize: 8.5,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 6,
    borderWidth: 0.8,
    borderColor: BLACK,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 10,
  },
  rowValue: {
    width: 160,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rincianHeader: {
    fontSize: 8,
    color: '#64748b',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  rincianRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    paddingLeft: 18,
  },
  rincianLabel: {
    flex: 1,
    fontSize: 8.5,
    color: '#334155',
  },
  rincianValue: {
    width: 160,
    textAlign: 'right',
    fontSize: 8.5,
    color: '#334155',
  },
  rowNetto: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f0f9ff',
    borderTopWidth: 1.2,
    borderColor: BLACK,
  },
  rowNettoLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: BLUE,
  },
  rowNettoValue: {
    width: 160,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: BLACK,
    padding: 8,
    minHeight: 55,
  },
  notesTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 3,
  },
  notesBody: {
    fontSize: 8,
    lineHeight: 1.35,
  },
  disclaimer: {
    fontSize: 6.5,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 6,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  signatureBox: {
    alignItems: 'center',
    width: 160,
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

export function AdvantageReportDocument({ data }: { readonly data: AdvantageReportData }) {
  const isPositive = !data.advantageFormatted.trim().startsWith('-');

  return (
    <Document title="Laporan_Advantage_Radiologi.pdf">
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>KLINIK PRIMA HUSADA</Text>
              <Text style={styles.clinicAddress}>
                Jl. Siliwangi Ruko Palapa No 2 Parung Kuda. Telp 0857-1932-5557
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>Laporan Advantage Radiologi</Text>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Periode: <Text style={styles.bold}>{data.periodeLabel}</Text>
            </Text>
            <Text style={styles.infoText}>
              Tgl Cetak: <Text style={styles.bold}>{data.tanggalCetak}</Text>
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Jumlah Penerimaan (Total Harga Pemeriksaan)</Text>
              <Text style={styles.rowValue}>{data.penerimaanFormatted}</Text>
            </View>
            <Text style={styles.rincianHeader}>Rincian Pengeluaran:</Text>
            <View style={styles.rincianRow}>
              <Text style={styles.rincianLabel}>BHP (Reagen &amp; BHP Medis)</Text>
              <Text style={styles.rincianValue}>{data.bhpFormatted}</Text>
            </View>
            <View style={styles.rincianRow}>
              <Text style={styles.rincianLabel}>Gaji Karyawan</Text>
              <Text style={styles.rincianValue}>{data.gajiKaryawanFormatted}</Text>
            </View>
            <View style={styles.rincianRow}>
              <Text style={styles.rincianLabel}>Pajak (Estimasi PPh 21)</Text>
              <Text style={styles.rincianValue}>{data.pajakFormatted}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Jumlah Pengeluaran</Text>
              <Text style={[styles.rowValue, { color: RED }]}>{data.pengeluaranFormatted}</Text>
            </View>
            <View style={styles.rowNetto}>
              <Text style={styles.rowNettoLabel}>ADVANTAGE (PENDAPATAN NET)</Text>
              <Text style={[styles.rowNettoValue, { color: isPositive ? GREEN : RED }]}>
                {data.advantageFormatted}
              </Text>
            </View>
          </View>

          <Text style={styles.disclaimer}>
            * BHP diambil dari transaksi Buku Kas (pengeluaran klinik secara umum, bukan khusus
            Radiologi). Pajak adalah estimasi kasar berbasis bracket gaji, bukan tabel TER resmi DJP.
          </Text>

          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Catatan:</Text>
            <Text style={styles.notesBody}>{data.catatan || '—'}</Text>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Petugas Admin Klinik</Text>
              <Text style={styles.signatureName}>
                {data.adminNama ? data.adminNama : '( ................................. )'}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
