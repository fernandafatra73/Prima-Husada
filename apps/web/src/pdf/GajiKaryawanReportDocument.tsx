import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface GajiKaryawanReportItem {
  readonly no: number;
  readonly namaKaryawan: string;
  readonly jabatan: string;
  readonly gajiPokokFormatted: string;
  readonly tunjanganFormatted: string;
  readonly potonganFormatted: string;
  readonly gajiBersihFormatted: string;
  readonly pph21Formatted: string;
  readonly takeHomeFormatted: string;
}

export interface GajiKaryawanReportData {
  readonly logoSrc: string;
  readonly bulanLabel: string;
  readonly tanggalCetak: string;
  readonly items: readonly GajiKaryawanReportItem[];
  readonly totalGajiBersihFormatted: string;
  readonly totalPph21Formatted: string;
  readonly totalTakeHomeFormatted: string;
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
  colNo: { width: '4%', textAlign: 'center' },
  colNama: { width: '16%', paddingLeft: 3 },
  colJabatan: { width: '12%', paddingLeft: 3 },
  colPokok: { width: '11%', textAlign: 'right', paddingRight: 3 },
  colTunjangan: { width: '10%', textAlign: 'right', paddingRight: 3 },
  colPotongan: { width: '10%', textAlign: 'right', paddingRight: 3 },
  colBersih: { width: '12%', textAlign: 'right', paddingRight: 3 },
  colPph21: { width: '12%', textAlign: 'right', paddingRight: 3 },
  colTakeHome: { width: '13%', textAlign: 'right', paddingRight: 3 },

  disclaimer: {
    fontSize: 6.5,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 3,
  },

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

export function GajiKaryawanReportDocument({
  data,
}: {
  readonly data: GajiKaryawanReportData;
}) {
  return (
    <Document title={`Daftar_Gaji_Karyawan_${data.bulanLabel}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? (
              <Image style={styles.logo} src={data.logoSrc} />
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>KLINIK PRIMA HUSADA</Text>
              <Text style={styles.clinicAddress}>
                Jl Siliwangi No 28 A Parung Kuda Telp. 0857-1932-5557
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>DAFTAR GAJI KARYAWAN</Text>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Periode: <Text style={styles.bold}>{data.bulanLabel}</Text>
            </Text>
            <Text style={styles.infoText}>
              Total Karyawan:{' '}
              <Text style={styles.bold}>{data.items.length}</Text>
            </Text>
            <Text style={styles.infoText}>
              Tgl Cetak: <Text style={styles.bold}>{data.tanggalCetak}</Text>
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colNama}>Nama Karyawan</Text>
              <Text style={styles.colJabatan}>Jabatan</Text>
              <Text style={styles.colPokok}>Gaji Pokok</Text>
              <Text style={styles.colTunjangan}>Tunjangan</Text>
              <Text style={styles.colPotongan}>Potongan</Text>
              <Text style={styles.colBersih}>Gaji Bersih</Text>
              <Text style={styles.colPph21}>PPh 21 (Est.)</Text>
              <Text style={styles.colTakeHome}>Take Home Pay</Text>
            </View>
            {data.items.length === 0 ? (
              <View style={styles.trRow}>
                <Text
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    paddingVertical: 4,
                  }}
                >
                  Belum ada data gaji karyawan untuk periode ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colNama}>
                    {truncatePdfCell(row.namaKaryawan, 26)}
                  </Text>
                  <Text style={styles.colJabatan}>
                    {truncatePdfCell(row.jabatan, 20)}
                  </Text>
                  <Text style={styles.colPokok}>{row.gajiPokokFormatted}</Text>
                  <Text style={styles.colTunjangan}>
                    {row.tunjanganFormatted}
                  </Text>
                  <Text style={styles.colPotongan}>
                    {row.potonganFormatted}
                  </Text>
                  <Text style={styles.colBersih}>
                    {row.gajiBersihFormatted}
                  </Text>
                  <Text style={styles.colPph21}>{row.pph21Formatted}</Text>
                  <Text style={styles.colTakeHome}>
                    {row.takeHomeFormatted}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.disclaimer}>
            * PPh 21 adalah estimasi kasar berbasis persentase per rentang gaji, bukan tabel TER resmi DJP. Wajib dicek ulang sebelum dipakai sebagai slip gaji resmi.
          </Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text>Total Gaji Bersih:</Text>
              <Text style={styles.bold}>{data.totalGajiBersihFormatted}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Total Estimasi PPh 21:</Text>
              <Text style={styles.bold}>{data.totalPph21Formatted}</Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text>Total Take Home Pay:</Text>
              <Text>{data.totalTakeHomeFormatted}</Text>
            </View>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Petugas Admin Klinik</Text>
              <Text style={styles.signatureName}>
                ( ................................. )
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
