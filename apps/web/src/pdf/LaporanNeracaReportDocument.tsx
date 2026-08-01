import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface LaporanNeracaReportData {
  readonly logoSrc: string;
  readonly namaPerusahaan: string;
  readonly year: number;
  readonly tanggalCetak: string;
  readonly kasFormatted: string;
  readonly bankFormatted: string;
  readonly piutangFormatted: string;
  readonly persediaanFormatted: string;
  readonly totalAktivaLancarFormatted: string;
  readonly tanahFormatted: string;
  readonly gedungFormatted: string;
  readonly peralatanFormatted: string;
  readonly kendaraanFormatted: string;
  readonly totalAktivaTetapFormatted: string;
  readonly totalAktivaFormatted: string;
  readonly utangUsahaFormatted: string;
  readonly utangPajakFormatted: string;
  readonly utangLainnyaFormatted: string;
  readonly totalUtangJangkaPendekFormatted: string;
  readonly utangJangkaPanjangFormatted: string;
  readonly modalUsahaFormatted: string;
  readonly labaRugiFormatted: string;
  readonly totalModalFormatted: string;
  readonly totalPasivaFormatted: string;
  readonly pendapatanFormatted: string;
  readonly biayaGajiFormatted: string;
  readonly biayaAtkBahanFormatted: string;
  readonly biayaListrikFormatted: string;
  readonly biayaTelponFormatted: string;
  readonly biayaTransportFormatted: string;
  readonly biayaSewaFormatted: string;
  readonly biayaLainLainFormatted: string;
  readonly totalBiayaFormatted: string;
  readonly tempatTandaTangan: string;
  readonly tanggalTandaTanganLabel: string;
  readonly namaPenandatangan: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';
const GREEN = '#15803d';

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
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
  logo: { width: 40, height: 40, marginRight: 10 },
  headerText: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: 'bold', color: BLUE, marginBottom: 2 },
  reportSub: { fontSize: 9, color: BLACK },
  divider: { height: 2, backgroundColor: BLUE, marginVertical: 5 },
  titleSection: { textAlign: 'center', marginVertical: 4 },
  reportTitle: { fontSize: 11, fontWeight: 'bold', color: BLUE, textTransform: 'uppercase' },

  columns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  col: { flex: 1, borderWidth: 0.8, borderColor: BLACK, padding: 8 },
  colTitle: { fontSize: 9.5, fontWeight: 'bold', color: BLUE, marginBottom: 6, textAlign: 'center' },
  sectionLabel: { fontSize: 8, fontWeight: 'bold', color: '#334155', marginTop: 6, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  rowLabel: { fontSize: 8 },
  rowValue: { fontSize: 8, textAlign: 'right' },
  subtotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 2, marginTop: 2, borderTopWidth: 0.5, borderColor: '#94a3b8',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3, marginTop: 4, borderTopWidth: 1, borderColor: BLACK,
    fontWeight: 'bold', fontSize: 9.5, color: BLUE,
  },
  labaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3, marginTop: 6, borderTopWidth: 1, borderColor: BLACK,
    fontWeight: 'bold', fontSize: 9.5,
  },

  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  signatureBox: { alignItems: 'center', width: 170 },
  signatureDate: { fontSize: 8, marginBottom: 28 },
  signatureName: {
    fontSize: 8, fontWeight: 'bold', borderTopWidth: 0.8, borderColor: BLACK,
    paddingTop: 2, width: '100%', textAlign: 'center',
  },
});

export function LaporanNeracaReportDocument({ data }: { readonly data: LaporanNeracaReportData }) {
  const isPositive = !data.labaRugiFormatted.trim().startsWith('-');

  return (
    <Document title={`Laporan_Neraca_${data.year}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.companyName}>{data.namaPerusahaan}</Text>
              <Text style={styles.reportSub}>Tgl Cetak: {data.tanggalCetak}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>Neraca & Laporan Rugi Laba — Per 31 Desember {data.year}</Text>
          </View>

          <View style={styles.columns}>
            {/* NERACA */}
            <View style={styles.col}>
              <Text style={styles.colTitle}>NERACA</Text>

              <Text style={styles.sectionLabel}>Aktiva Lancar</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Kas</Text><Text style={styles.rowValue}>{data.kasFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Bank</Text><Text style={styles.rowValue}>{data.bankFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Piutang</Text><Text style={styles.rowValue}>{data.piutangFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Persediaan</Text><Text style={styles.rowValue}>{data.persediaanFormatted}</Text></View>
              <View style={styles.subtotalRow}><Text>Total Aktiva Lancar</Text><Text>{data.totalAktivaLancarFormatted}</Text></View>

              <Text style={styles.sectionLabel}>Aktiva Tetap</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Tanah</Text><Text style={styles.rowValue}>{data.tanahFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Gedung</Text><Text style={styles.rowValue}>{data.gedungFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Peralatan</Text><Text style={styles.rowValue}>{data.peralatanFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Kendaraan</Text><Text style={styles.rowValue}>{data.kendaraanFormatted}</Text></View>
              <View style={styles.subtotalRow}><Text>Total Aktiva Tetap</Text><Text>{data.totalAktivaTetapFormatted}</Text></View>

              <View style={styles.totalRow}><Text>TOTAL AKTIVA</Text><Text>{data.totalAktivaFormatted}</Text></View>

              <Text style={styles.sectionLabel}>Utang Jangka Pendek</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Utang Usaha</Text><Text style={styles.rowValue}>{data.utangUsahaFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Utang Pajak</Text><Text style={styles.rowValue}>{data.utangPajakFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Utang Lainnya</Text><Text style={styles.rowValue}>{data.utangLainnyaFormatted}</Text></View>
              <View style={styles.subtotalRow}><Text>Total Utang Jangka Pendek</Text><Text>{data.totalUtangJangkaPendekFormatted}</Text></View>

              <Text style={styles.sectionLabel}>Utang Jangka Panjang</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Utang Jangka Panjang</Text><Text style={styles.rowValue}>{data.utangJangkaPanjangFormatted}</Text></View>

              <Text style={styles.sectionLabel}>Modal</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Modal Usaha</Text><Text style={styles.rowValue}>{data.modalUsahaFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Laba Berjalan</Text><Text style={styles.rowValue}>{data.labaRugiFormatted}</Text></View>
              <View style={styles.subtotalRow}><Text>Total Modal</Text><Text>{data.totalModalFormatted}</Text></View>

              <View style={styles.totalRow}><Text>TOTAL PASIVA</Text><Text>{data.totalPasivaFormatted}</Text></View>
            </View>

            {/* LAPORAN RUGI LABA */}
            <View style={styles.col}>
              <Text style={styles.colTitle}>LAPORAN RUGI LABA</Text>

              <View style={styles.row}><Text style={styles.rowLabel}>Pendapatan</Text><Text style={styles.rowValue}>{data.pendapatanFormatted}</Text></View>

              <Text style={styles.sectionLabel}>Biaya-Biaya</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya Gaji</Text><Text style={styles.rowValue}>{data.biayaGajiFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya ATK (Bahan)</Text><Text style={styles.rowValue}>{data.biayaAtkBahanFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya Listrik</Text><Text style={styles.rowValue}>{data.biayaListrikFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya Telpon</Text><Text style={styles.rowValue}>{data.biayaTelponFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya Transport</Text><Text style={styles.rowValue}>{data.biayaTransportFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya Sewa</Text><Text style={styles.rowValue}>{data.biayaSewaFormatted}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Biaya dan Lain-lain</Text><Text style={styles.rowValue}>{data.biayaLainLainFormatted}</Text></View>
              <View style={styles.subtotalRow}><Text>Total Biaya</Text><Text>{data.totalBiayaFormatted}</Text></View>

              <View style={[styles.labaRow, { color: isPositive ? GREEN : '#b91c1c' }]}>
                <Text>LABA (RUGI)</Text>
                <Text>{data.labaRugiFormatted}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureDate}>
                {data.tempatTandaTangan}, {data.tanggalTandaTanganLabel}
              </Text>
              <Text style={styles.signatureName}>
                {data.namaPenandatangan ? data.namaPenandatangan : '( ................................. )'}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
