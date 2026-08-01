import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface AnalisaFotoRontgenReportData {
  readonly logoSrc: string;
  readonly namaKlinik: string;
  readonly alamatKlinik: string;
  readonly teleponKlinik: string;
  readonly namaPasien: string;
  readonly regCode: string;
  readonly jenisPemeriksaan: string;
  readonly tanggalLabel: string;
  readonly fotoDataUrl: string;
  readonly kesan: string;
  readonly diagnosa: string;
  readonly radiologNama: string;
  readonly tanggalCetak: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 9.5, color: BLACK },
  frame: { height: '100%', borderWidth: 1, borderColor: BLACK, padding: 12, flexDirection: 'column' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  logo: { width: 44, height: 44, marginRight: 10 },
  headerText: { flex: 1 },
  clinicName: { fontSize: 15, fontWeight: 'bold', color: BLUE, marginBottom: 2 },
  clinicAddress: { fontSize: 8, color: BLACK, lineHeight: 1.35 },
  divider: { height: 2, backgroundColor: BLUE, marginVertical: 6 },
  titleSection: { textAlign: 'center', marginVertical: 4 },
  reportTitle: { fontSize: 12, fontWeight: 'bold', color: BLUE, textTransform: 'uppercase' },

  infoGrid: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6,
    padding: 6, backgroundColor: '#f8fafc', borderWidth: 0.5, borderColor: '#cbd5e1',
  },
  infoText: { fontSize: 8.5 },
  bold: { fontWeight: 'bold' },

  photoContainer: {
    marginVertical: 8, alignItems: 'center', borderWidth: 0.8, borderColor: BLACK, padding: 8,
  },
  photo: { maxWidth: 320, maxHeight: 320, objectFit: 'contain' },

  section: { marginTop: 8 },
  sectionLabel: { fontSize: 9.5, fontWeight: 'bold', color: BLUE, marginBottom: 3 },
  sectionBody: {
    fontSize: 9.5, lineHeight: 1.5, padding: 6, borderWidth: 0.5, borderColor: '#cbd5e1', minHeight: 30,
  },

  disclaimer: { fontSize: 6.5, fontStyle: 'italic', color: '#64748b', marginTop: 8 },

  signatureSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, paddingHorizontal: 20 },
  signatureBox: { alignItems: 'center', width: 170 },
  signatureTitle: { fontSize: 8, marginBottom: 28 },
  signatureName: {
    fontSize: 8, fontWeight: 'bold', borderTopWidth: 0.8, borderColor: BLACK,
    paddingTop: 2, width: '100%', textAlign: 'center',
  },
});

export function AnalisaFotoRontgenReportDocument({
  data,
}: {
  readonly data: AnalisaFotoRontgenReportData;
}) {
  return (
    <Document title={`Analisa_Foto_Rontgen_${data.namaPasien}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            {data.logoSrc ? <Image style={styles.logo} src={data.logoSrc} /> : null}
            <View style={styles.headerText}>
              <Text style={styles.clinicName}>{data.namaKlinik}</Text>
              <Text style={styles.clinicAddress}>
                {data.alamatKlinik}
                {data.teleponKlinik ? ` Telp. ${data.teleponKlinik}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.titleSection}>
            <Text style={styles.reportTitle}>Analisa Foto Rontgen</Text>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.infoText}>
              Nama Pasien: <Text style={styles.bold}>{data.namaPasien}</Text>
            </Text>
            <Text style={styles.infoText}>
              No. Reg: <Text style={styles.bold}>{data.regCode || '-'}</Text>
            </Text>
            <Text style={styles.infoText}>
              Pemeriksaan: <Text style={styles.bold}>{data.jenisPemeriksaan || '-'}</Text>
            </Text>
            <Text style={styles.infoText}>
              Tanggal: <Text style={styles.bold}>{data.tanggalLabel}</Text>
            </Text>
          </View>

          {data.fotoDataUrl ? (
            <View style={styles.photoContainer}>
              <Image style={styles.photo} src={data.fotoDataUrl} />
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Kesan:</Text>
            <Text style={styles.sectionBody}>{data.kesan || '—'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Diagnosa:</Text>
            <Text style={styles.sectionBody}>{data.diagnosa || '—'}</Text>
          </View>

          <Text style={styles.disclaimer}>
            * Kesan dan diagnosa di atas diisi manual oleh radiolog/dokter berdasarkan pembacaan
            foto, bukan hasil deteksi otomatis / AI. Tgl Cetak: {data.tanggalCetak}.
          </Text>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Radiolog / Dokter Pemeriksa</Text>
              <Text style={styles.signatureName}>
                {data.radiologNama || '( ................................. )'}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
