import type { FastifyInstance } from 'fastify';
import { Decimal } from '../generated/prisma/internal/prismaNamespace.js';
import { prisma } from '../lib/prisma.js';
import { toNumber } from '../lib/serialize.js';

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard', async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      pasienHariIni,
      menungguHasil,
      selesaiHariIni,
      totalPemeriksaan,
      dokterCount,
      radiologCount,
      omzetAgg,
      sharingAgg,
      lunasCount,
      totalPasien,
    ] = await Promise.all([
      prisma.pasien.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.pasien.count({ where: { hasilStatus: 'MENUNGGU_HASIL' } }),
      prisma.pasien.count({
        where: { hasilStatus: 'SELESAI', updatedAt: { gte: startOfDay } },
      }),
      prisma.pasienPemeriksaan.count(),
      prisma.dokter.count(),
      prisma.radiolog.count(),
      prisma.pasien.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { totalHarga: true },
      }),
      prisma.pasien.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { totalSharing: true },
      }),
      prisma.pasien.count({ where: { paymentStatus: 'LUNAS' } }),
      prisma.pasien.count(),
    ]);

    const lunasPercent = totalPasien === 0 ? 0 : Math.round((lunasCount / totalPasien) * 100);
    const hasilSelesai = totalPasien - menungguHasil;
    const hasilPercent =
      totalPasien === 0 ? 0 : Math.round((hasilSelesai / totalPasien) * 100);

    return {
      metrics: {
        pasienHariIni,
        menungguHasil,
        selesaiHariIni,
        totalPemeriksaan,
        omzetHariIni: toNumber(omzetAgg._sum.totalHarga ?? new Decimal(0)),
        totalSharingHariIni: toNumber(sharingAgg._sum.totalSharing ?? new Decimal(0)),
        dokterPengirim: dokterCount,
        radiologAktif: radiologCount,
      },
      charts: {
        statusHasil: { menunggu: menungguHasil, selesai: hasilSelesai, percent: hasilPercent },
        statusBayar: { lunas: lunasCount, belum: totalPasien - lunasCount, percent: lunasPercent },
      },
    };
  });

  app.get<{ Querystring: { year?: string } }>('/api/laporan/tahunan', async (req) => {
    const yearStr = req.query.year || new Date().getFullYear().toString();
    const year = parseInt(yearStr, 10);
    
    if (isNaN(year)) {
      return { error: 'Tahun tidak valid' };
    }

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const [aggPendapatan, pasienCount, pasienRecords] = await Promise.all([
      prisma.pasien.aggregate({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } },
        _sum: { totalHarga: true }
      }),
      prisma.pasien.count({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } }
      }),
      prisma.pasien.findMany({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } },
        select: {
          pengirim: { select: { nama: true } },
          pemeriksaan: {
            select: { jenisPemeriksaan: { select: { nama: true } } }
          }
        }
      })
    ]);

    const totalPendapatan = toNumber(aggPendapatan._sum.totalHarga ?? new Decimal(0));
    
    const countPemeriksaan = new Map<string, number>();
    const countDokter = new Map<string, number>();

    for (const p of pasienRecords) {
      const dName = p.pengirim?.nama || 'Tanpa Dokter';
      countDokter.set(dName, (countDokter.get(dName) || 0) + 1);

      for (const pem of p.pemeriksaan) {
        const pName = pem.jenisPemeriksaan?.nama || 'Unknown';
        countPemeriksaan.set(pName, (countPemeriksaan.get(pName) || 0) + 1);
      }
    }

    const pemeriksaanArr = Array.from(countPemeriksaan.entries()).map(([nama, count]) => ({ nama, count })).sort((a, b) => b.count - a.count);
    
    const dokterArr = Array.from(countDokter.entries()).map(([nama, count]) => ({
      nama,
      count,
      percentage: pasienCount > 0 ? (count / pasienCount) * 100 : 0
    })).sort((a, b) => b.count - a.count);

    return {
      year,
      totalPendapatan,
      totalPasien: pasienCount,
      pemeriksaan: pemeriksaanArr,
      dokterPengirim: dokterArr
    };
  });
}

