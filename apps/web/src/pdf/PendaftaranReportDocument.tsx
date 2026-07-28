import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { truncatePdfCell } from './pdfText.ts';

export interface PendaftaranReportData {
  readonly logoSrc: string;
  readonly noRegistrasi: string;
  readonly namaPasien: string;
  readonly umur: string;
  readonly alamat: string;
  readonly telpon: string;
  readonly tanggalMasuk: string;
  readonly dokterPengirim: string;
  readonly klinis: string;
  readonly admin: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: BLACK,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  headerText: {
    flex: 1,
  },
  clinicSmall: {
    fontSize: 5,
    color: BLACK,
    marginBottom: 0.5,
  },
  clinicName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 1,
  },
  clinicAddress: {
    fontSize: 5,
    color: BLACK,
  },
  divider: {
    height: 1.5,
    backgroundColor: BLUE,
    marginTop: 2,
    marginBottom: 6,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    backgroundColor: BLUE,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    minHeight: 10,
  },
  label: {
    width: 50,
    fontWeight: 'bold',
  },
  colon: {
    width: 8,
  },
  value: {
    flex: 1,
    color: BLUE,
    fontWeight: 'bold',
  },
  footerText: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    fontSize: 5,
    color: '#666',
  },
  regBox: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    border: `1pt solid ${BLUE}`,
    borderRadius: 2,
    padding: '2 4',
    alignItems: 'center',
  },
  regLabel: {
    fontSize: 4,
    color: BLACK,
    marginBottom: 1,
  },
  regValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: BLUE,
  }
});

export function PendaftaranReportDocument({ data }: { readonly data: PendaftaranReportData }) {
  return (
    <Document>
      {/* 242.64 pt x 153.12 pt is standard ID-1 (CR80) KTP Size */}
      <Page size={[242.64, 153.12]} style={styles.page}>
        <View style={styles.headerRow}>
          <Image style={styles.logo} src={data.logoSrc} />
          <View style={styles.headerText}>
            <Text style={styles.clinicSmall}>KLINIK ROENTGEN DAN USG</Text>
            <Text style={styles.clinicName}>PRIMA HUSADA</Text>
            <Text style={styles.clinicAddress}>
              Jl Siliwangi No 28 A Parung Kuda Telp. 0857-1932-5557
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>KARTU IDENTITAS PASIEN</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{truncatePdfCell(data.namaPasien, 30)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Umur</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.umur || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>No. Telepon</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.telpon || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{truncatePdfCell(data.alamat || '-', 40)}</Text>
        </View>

        <Text style={styles.footerText}>Harap dibawa setiap kali berkunjung</Text>

        <View style={styles.regBox}>
          <Text style={styles.regLabel}>No. Registrasi</Text>
          <Text style={styles.regValue}>{data.noRegistrasi}</Text>
        </View>
      </Page>
    </Document>
  );
}
