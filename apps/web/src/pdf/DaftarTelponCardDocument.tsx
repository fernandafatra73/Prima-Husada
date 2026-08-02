import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface DaftarTelponCardData {
  readonly logoSrc: string;
  readonly tanggalCetak: string;
  readonly nama: string;
  readonly telpon: string;
  readonly admin: string;
  readonly password: string;
  readonly noKontrak: string;
  readonly namaInstansi: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BLACK,
  },
  frame: {
    borderWidth: 1,
    borderColor: BLACK,
    padding: 12,
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
  },
  clinicAddress: {
    fontSize: 8,
    color: BLACK,
  },
  divider: {
    height: 2,
    backgroundColor: BLUE,
    marginVertical: 6,
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BLUE,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 8,
    textAlign: 'right',
    marginBottom: 6,
  },
  table: {
    borderWidth: 0.8,
    borderColor: BLACK,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  rowLast: {
    flexDirection: 'row',
  },
  label: {
    width: '35%',
    padding: 6,
    fontWeight: 'bold',
    backgroundColor: '#f0f4f8',
    borderRightWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  value: {
    width: '65%',
    padding: 6,
  },
});

export function DaftarTelponCardDocument({ data }: { readonly data: DaftarTelponCardData }) {
  const rows: readonly [string, string][] = [
    ['Nama', data.nama || '—'],
    ['Telpon', data.telpon || '—'],
    ['Admin', data.admin || '—'],
    ['Password', data.password || '—'],
    ['No Kontrak', data.noKontrak || '—'],
    ['Nama Instansi', data.namaInstansi || '—'],
  ];

  return (
    <Document title={`Daftar_Telpon_${data.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}>
      <Page size="A5" style={styles.page}>
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
            <Text style={styles.reportTitle}>Kartu Daftar Telpon</Text>
          </View>

          <Text style={styles.infoText}>Tgl Cetak: {data.tanggalCetak}</Text>

          <View style={styles.table}>
            {rows.map(([label, value], idx) => (
              <View key={label} style={idx === rows.length - 1 ? styles.rowLast : styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
