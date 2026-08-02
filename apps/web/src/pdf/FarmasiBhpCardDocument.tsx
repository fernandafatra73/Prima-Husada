import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface FarmasiBhpCardData {
  readonly logoSrc: string;
  readonly tanggalCetak: string;
  readonly kode: string;
  readonly nama: string;
  readonly kategori: string;
  readonly satuan: string;
  readonly stok: string;
  readonly hargaBeliFormatted: string;
  readonly hargaJualFormatted: string;
  readonly tanggalBeli: string;
  readonly tanggalExpire: string;
  readonly penyedia: string;
  readonly telponPenyedia: string;
  readonly keterangan: string;
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

export function FarmasiBhpCardDocument({ data }: { readonly data: FarmasiBhpCardData }) {
  const rows: readonly [string, string][] = [
    ['Kode', data.kode || '—'],
    ['Nama Barang', data.nama || '—'],
    ['Kategori', data.kategori || '—'],
    ['Stok', `${data.stok} ${data.satuan}`],
    ['Harga Beli', data.hargaBeliFormatted],
    ['Harga Jual / Tarif', data.hargaJualFormatted],
    ['Tanggal Beli', data.tanggalBeli || '—'],
    ['Tanggal Expire', data.tanggalExpire || '—'],
    ['Penyedia', data.penyedia || '—'],
    ['Telpon Penyedia', data.telponPenyedia || '—'],
    ['Keterangan', data.keterangan || '—'],
  ];

  return (
    <Document title={`Farmasi_BHP_${data.kode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}>
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
            <Text style={styles.reportTitle}>Kartu Stok Farmasi &amp; BHP</Text>
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
