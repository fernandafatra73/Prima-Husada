import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface BhpRadiologiReportItem {
  readonly no: number;
  readonly tanggal: string;
  readonly pemakaian: string;
  readonly hargaFormatted: string;
  readonly devFormatted: string;
  readonly fixerFormatted: string;
  readonly filmFormatted: string;
  readonly amplopKertasFormatted: string;
  readonly listrikFormatted: string;
  readonly gajiKaryawanFormatted: string;
  readonly kertasCetakFormatted: string;
  readonly amplopFormatted: string;
  readonly totalBiayaFormatted: string;
  readonly selisihFormatted: string;
}

export interface BhpRadiologiReportData {
  readonly logoSrc: string;
  readonly periodeLabel: string;
  readonly tanggalCetak: string;
  readonly items: readonly BhpRadiologiReportItem[];
  readonly totalHargaFormatted: string;
  readonly totalBiayaFormatted: string;
  readonly totalSelisihFormatted: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 8,
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
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 7.5,
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
    fontSize: 6.5,
  },
  trRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
    paddingVertical: 3,
    fontSize: 6.5,
  },
  colNo: { width: '3%', textAlign: 'center' },
  colTanggal: { width: '6%', textAlign: 'center' },
  colPemakaian: { width: '11%', paddingLeft: 3 },
  colHarga: { width: '7%', textAlign: 'right', paddingRight: 2 },
  colDev: { width: '6%', textAlign: 'right', paddingRight: 2 },
  colFixer: { width: '6%', textAlign: 'right', paddingRight: 2 },
  colFilm: { width: '6%', textAlign: 'right', paddingRight: 2 },
  colAmplopKertas: { width: '7%', textAlign: 'right', paddingRight: 2 },
  colListrik: { width: '6%', textAlign: 'right', paddingRight: 2 },
  colGajiKaryawan: { width: '7%', textAlign: 'right', paddingRight: 2 },
  colKertasCetak: { width: '7%', textAlign: 'right', paddingRight: 2 },
  colAmplop: { width: '6%', textAlign: 'right', paddingRight: 2 },
  colTotalBiaya: { width: '8%', textAlign: 'right', paddingRight: 2 },
  colSelisih: { width: '8%', textAlign: 'right', paddingRight: 3 },

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

export function BhpRadiologiReportDocument({
  data,
}: {
  readonly data: BhpRadiologiReportData;
}) {
  return (
    <Document title="Laporan_BHP_Radiologi.pdf">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? (
              <Image style={styles.logo} src={data.logoSrc} />
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>KLINIK PRIMA HUSADA</Text>
              <Text style={styles.clinicAddress}>
                Jl. Siliwangi Ruko Palapa No 2 Parung Kuda. Telp 0857-1932-5557
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>Laporan BHP Radiologi</Text>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Periode: <Text style={styles.bold}>{data.periodeLabel}</Text>
            </Text>
            <Text style={styles.infoText}>
              Total Data: <Text style={styles.bold}>{data.items.length}</Text>
            </Text>
            <Text style={styles.infoText}>
              Tgl Cetak: <Text style={styles.bold}>{data.tanggalCetak}</Text>
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colTanggal}>Tanggal</Text>
              <Text style={styles.colPemakaian}>Pemakaian</Text>
              <Text style={styles.colHarga}>Harga</Text>
              <Text style={styles.colDev}>Dev</Text>
              <Text style={styles.colFixer}>Fixer</Text>
              <Text style={styles.colFilm}>Film</Text>
              <Text style={styles.colAmplopKertas}>Amplop Kertas</Text>
              <Text style={styles.colListrik}>Listrik</Text>
              <Text style={styles.colGajiKaryawan}>Gaji Karyawan</Text>
              <Text style={styles.colKertasCetak}>Kertas Cetak</Text>
              <Text style={styles.colAmplop}>Amplop</Text>
              <Text style={styles.colTotalBiaya}>Total Biaya</Text>
              <Text style={styles.colSelisih}>Selisih</Text>
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
                  Belum ada data BHP radiologi untuk periode ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colTanggal}>{row.tanggal}</Text>
                  <Text style={styles.colPemakaian}>
                    {truncatePdfCell(row.pemakaian, 22)}
                  </Text>
                  <Text style={styles.colHarga}>{row.hargaFormatted}</Text>
                  <Text style={styles.colDev}>{row.devFormatted}</Text>
                  <Text style={styles.colFixer}>{row.fixerFormatted}</Text>
                  <Text style={styles.colFilm}>{row.filmFormatted}</Text>
                  <Text style={styles.colAmplopKertas}>
                    {row.amplopKertasFormatted}
                  </Text>
                  <Text style={styles.colListrik}>{row.listrikFormatted}</Text>
                  <Text style={styles.colGajiKaryawan}>
                    {row.gajiKaryawanFormatted}
                  </Text>
                  <Text style={styles.colKertasCetak}>
                    {row.kertasCetakFormatted}
                  </Text>
                  <Text style={styles.colAmplop}>{row.amplopFormatted}</Text>
                  <Text style={styles.colTotalBiaya}>
                    {row.totalBiayaFormatted}
                  </Text>
                  <Text style={styles.colSelisih}>{row.selisihFormatted}</Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.disclaimer}>
            * Total Biaya = Dev + Fixer + Film + Amplop Kertas + Listrik + Gaji Karyawan + Kertas
            Cetak + Amplop. Selisih = Harga - Total Biaya.
          </Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text>Total Harga:</Text>
              <Text style={styles.bold}>{data.totalHargaFormatted}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Total Biaya:</Text>
              <Text style={styles.bold}>{data.totalBiayaFormatted}</Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text>Total Selisih:</Text>
              <Text>{data.totalSelisihFormatted}</Text>
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
