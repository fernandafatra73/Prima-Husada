import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface LogbookPasienReportItem {
  readonly no: number;
  readonly nama: string;
  readonly usia: string;
  readonly alamat: string;
  readonly pemeriksaan: string;
  readonly pengirim: string;
  readonly tanggal: string;
  readonly kv: string;
  readonly sekon: string;
  readonly mAs: string;
  readonly beratBadan: string;
}

export interface LogbookPasienReportData {
  readonly logoSrc: string;
  readonly periodeLabel: string;
  readonly tanggalCetak: string;
  readonly items: readonly LogbookPasienReportItem[];
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
    fontSize: 7.5,
  },
  trRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
    paddingVertical: 3,
    fontSize: 7.5,
  },
  colNo: { width: '4%', textAlign: 'center' },
  colNama: { width: '15%', paddingLeft: 3 },
  colUsia: { width: '6%', textAlign: 'center' },
  colAlamat: { width: '14%', paddingLeft: 3 },
  colPemeriksaan: { width: '12%', paddingLeft: 3 },
  colPengirim: { width: '11%', paddingLeft: 3 },
  colTanggal: { width: '9%', textAlign: 'center' },
  colKv: { width: '6%', textAlign: 'center' },
  colSekon: { width: '6%', textAlign: 'center' },
  colMas: { width: '6%', textAlign: 'center' },
  colBeratBadan: { width: '11%', textAlign: 'center' },

  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  signatureBox: {
    alignItems: 'center',
    width: 170,
  },
  signatureDate: {
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
  signatureRole: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 2,
  },
});

export function LogbookPasienReportDocument({
  data,
}: {
  readonly data: LogbookPasienReportData;
}) {
  return (
    <Document title={`Logbook_Pasien_Radiologi.pdf`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
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
            <Text style={styles.reportTitle}>LOGBOOK PASIEN RADIOLOGI</Text>
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
              <Text style={styles.colNama}>Nama</Text>
              <Text style={styles.colUsia}>Usia</Text>
              <Text style={styles.colAlamat}>Alamat</Text>
              <Text style={styles.colPemeriksaan}>Pemeriksaan</Text>
              <Text style={styles.colPengirim}>Pengirim</Text>
              <Text style={styles.colTanggal}>Tanggal</Text>
              <Text style={styles.colKv}>KV</Text>
              <Text style={styles.colSekon}>Sekond</Text>
              <Text style={styles.colMas}>mAs</Text>
              <Text style={styles.colBeratBadan}>Berat Badan</Text>
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
                  Belum ada data logbook untuk kriteria ini.
                </Text>
              </View>
            ) : (
              data.items.map((row) => (
                <View key={row.no} style={styles.trRow}>
                  <Text style={styles.colNo}>{row.no}</Text>
                  <Text style={styles.colNama}>
                    {truncatePdfCell(row.nama, 22)}
                  </Text>
                  <Text style={styles.colUsia}>{row.usia || '—'}</Text>
                  <Text style={styles.colAlamat}>
                    {truncatePdfCell(row.alamat, 26)}
                  </Text>
                  <Text style={styles.colPemeriksaan}>
                    {truncatePdfCell(row.pemeriksaan, 20)}
                  </Text>
                  <Text style={styles.colPengirim}>
                    {truncatePdfCell(row.pengirim, 18)}
                  </Text>
                  <Text style={styles.colTanggal}>{row.tanggal}</Text>
                  <Text style={styles.colKv}>{row.kv}</Text>
                  <Text style={styles.colSekon}>{row.sekon}</Text>
                  <Text style={styles.colMas}>{row.mAs}</Text>
                  <Text style={styles.colBeratBadan}>{row.beratBadan}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureDate}>Sukabumi, {data.tanggalCetak}</Text>
              <Text style={styles.signatureName}>( ................................. )</Text>
              <Text style={styles.signatureRole}>Radiografer</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
