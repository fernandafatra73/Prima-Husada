import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface SuratKeteranganSehatData {
  readonly logoSrc: string;
  readonly namaKlinik: string;
  readonly alamatKlinik: string;
  readonly teleponKlinik: string;
  readonly nomorSurat: string;
  readonly namaPasien: string;
  readonly tempatTanggalLahir: string;
  readonly jenisKelamin: string;
  readonly pekerjaan: string;
  readonly alamatPasien: string;
  readonly hasilPemeriksaan: string;
  readonly keperluan: string;
  readonly tempatSurat: string;
  readonly tanggalSurat: string;
  readonly namaDokter: string;
  readonly jabatanDokter: string;
}

const BLUE = '#2b4c9b';
const BLACK = '#1a1a1a';

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: 'Helvetica', fontSize: 10.5, color: BLACK },
  frame: { height: '100%', flexDirection: 'column' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logo: { width: 48, height: 48, marginRight: 12 },
  headerText: { flex: 1 },
  clinicName: { fontSize: 16, fontWeight: 'bold', color: BLUE, marginBottom: 2 },
  clinicAddress: { fontSize: 9, color: BLACK, lineHeight: 1.35 },
  divider: { height: 2.5, backgroundColor: BLUE, marginVertical: 8 },
  titleSection: { textAlign: 'center', marginVertical: 8 },
  reportTitle: { fontSize: 13, fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' },
  nomorSurat: { fontSize: 10, marginTop: 2 },
  body: { marginTop: 12, lineHeight: 1.7, textAlign: 'justify' },
  dataTable: { marginTop: 10, marginBottom: 10, paddingLeft: 16 },
  dataRow: { flexDirection: 'row', marginBottom: 3 },
  dataLabel: { width: 130, fontSize: 10.5 },
  dataColon: { width: 12, fontSize: 10.5 },
  dataValue: { flex: 1, fontSize: 10.5, fontWeight: 'bold' },
  signatureSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 40, paddingHorizontal: 20 },
  signatureBox: { alignItems: 'center', width: 200 },
  signatureDate: { fontSize: 10, marginBottom: 45 },
  signatureName: { fontSize: 10, fontWeight: 'bold', textDecoration: 'underline' },
  signatureRole: { fontSize: 9, color: '#475569', marginTop: 2 },
});

export function SuratKeteranganSehatDocument({ data }: { readonly data: SuratKeteranganSehatData }) {
  return (
    <Document title={`Surat_Keterangan_Sehat_${data.namaPasien}.pdf`}>
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
            <Text style={styles.reportTitle}>Surat Keterangan Sehat</Text>
            <Text style={styles.nomorSurat}>Nomor: {data.nomorSurat || '-'}</Text>
          </View>

          <Text style={styles.body}>
            Yang bertanda tangan di bawah ini, dokter pemeriksa {data.namaKlinik}, menerangkan
            bahwa setelah dilakukan pemeriksaan kesehatan pada:
          </Text>

          <View style={styles.dataTable}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nama</Text>
              <Text style={styles.dataColon}>:</Text>
              <Text style={styles.dataValue}>{data.namaPasien}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Tempat/Tanggal Lahir</Text>
              <Text style={styles.dataColon}>:</Text>
              <Text style={styles.dataValue}>{data.tempatTanggalLahir}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Jenis Kelamin</Text>
              <Text style={styles.dataColon}>:</Text>
              <Text style={styles.dataValue}>{data.jenisKelamin}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Pekerjaan</Text>
              <Text style={styles.dataColon}>:</Text>
              <Text style={styles.dataValue}>{data.pekerjaan || '-'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Alamat</Text>
              <Text style={styles.dataColon}>:</Text>
              <Text style={styles.dataValue}>{data.alamatPasien || '-'}</Text>
            </View>
          </View>

          <Text style={styles.body}>
            Dari hasil pemeriksaan, yang bersangkutan dinyatakan: {data.hasilPemeriksaan}
          </Text>

          <Text style={styles.body}>
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk keperluan{' '}
            {data.keperluan || '-'}.
          </Text>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureDate}>
                {data.tempatSurat}, {data.tanggalSurat}
              </Text>
              <Text style={styles.signatureName}>
                {data.namaDokter || '( ................................. )'}
              </Text>
              <Text style={styles.signatureRole}>{data.jabatanDokter}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
