import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface TransferReportItem {
  readonly no: number;
  readonly tanggal: string;
  readonly namaBank: string;
  readonly noRekening: string;
  readonly namaTransferan: string;
  readonly jumlahFormatted: string;
}

export interface TransferReportData {
  readonly logoSrc: string;
  readonly tanggalCetak: string;
  readonly items: readonly TransferReportItem[];
  readonly totalTransfer: number;
  readonly totalJumlahFormatted: string;
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
    justifyContent: 'flex-end',
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
  colNo: { width: '6%', textAlign: 'center' },
  colTanggal: { width: '12%', textAlign: 'center' },
  colBank: { width: '18%', paddingLeft: 3 },
  colRekening: { width: '18%', paddingLeft: 3 },
  colTransferan: { width: '28%', paddingLeft: 3 },
  colJumlah: { width: '18%', textAlign: 'right', paddingRight: 3 },

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

export function TransferReportDocument({ data }: { readonly data: TransferReportData }) {
  return (
    <Document title="Laporan_Transfer.pdf">
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
            <Text style={styles.reportTitle}>LAPORAN TRANSFER</Text>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Tgl Cetak: <Text style={styles.bold}>{data.tanggalCetak}</Text>
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colTanggal}>Tanggal</Text>
              <Text style={styles.colBank}>Nama Bank</Text>
              <Text style={styles.colRekening}>No Rekening</Text>
              <Text style={styles.colTransferan}>Nama Transferan</Text>
              <Text style={styles.colJumlah}>Jumlah</Text>
            </View>
            {data.items.length === 0 ? (
              <View style={styles.trRow}>
                <Text style={{ width: '100%', textAlign: 'center', paddingVertical: 4 }}>
                  Belum ada data transfer untuk kriteria ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colTanggal}>{row.tanggal}</Text>
                  <Text style={styles.colBank}>{truncatePdfCell(row.namaBank, 18)}</Text>
                  <Text style={styles.colRekening}>{truncatePdfCell(row.noRekening, 18)}</Text>
                  <Text style={styles.colTransferan}>{truncatePdfCell(row.namaTransferan, 28)}</Text>
                  <Text style={styles.colJumlah}>{row.jumlahFormatted}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text>Total Transfer:</Text>
              <Text style={styles.bold}>{data.totalTransfer} Transaksi</Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text>Total Jumlah:</Text>
              <Text>{data.totalJumlahFormatted}</Text>
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
