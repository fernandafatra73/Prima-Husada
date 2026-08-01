import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface JenisPemeriksaanReportData {
  readonly logoSrc: string;
  readonly nama: string;
  readonly hargaFormatted: string;
  readonly sharingAmountText: string;
  readonly sharingNote: string;
  readonly tanggalCetak: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BLACK,
  },
  frame: {
    borderWidth: 1,
    borderColor: BLACK,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BLUE,
  },
  clinicAddress: {
    fontSize: 8,
    color: BLACK,
    lineHeight: 1.35,
  },
  divider: {
    height: 2,
    backgroundColor: BLUE,
    marginVertical: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BLUE,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  label: {
    color: '#64748b',
  },
  value: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 14,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right',
  },
});

export function JenisPemeriksaanReportDocument({ data }: { readonly data: JenisPemeriksaanReportData }) {
  return (
    <Document title={`Info_Harga_${data.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}>
      <Page size="A5" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View>
              <Text style={styles.clinicName}>KLINIK PRABUMULIH PRIMA</Text>
              <Text style={styles.clinicAddress}>
                Jl. Padat Karya Kel. Gunung Ibul Kec. Prabumulih Timur Kota Prabumulih
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <Text style={styles.title}>Informasi Harga Pemeriksaan</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Jenis Pemeriksaan</Text>
            <Text style={styles.value}>{data.nama}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Harga</Text>
            <Text style={styles.value}>{data.hargaFormatted}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sharing Dokter</Text>
            <Text style={styles.value}>{data.sharingAmountText}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ketentuan</Text>
            <Text style={styles.value}>{data.sharingNote}</Text>
          </View>

          <Text style={styles.footer}>Dicetak: {data.tanggalCetak}</Text>
        </View>
      </Page>
    </Document>
  );
}
