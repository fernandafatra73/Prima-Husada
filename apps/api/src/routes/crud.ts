import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Decimal } from '../generated/prisma/internal/prismaNamespace.js';
import { prisma } from '../lib/prisma.js';
import { calcTotalSharing, sumHarga } from '../lib/pasienFinance.js';
import { hashPassword } from '../lib/password.js';
import { nextPendaftaranUmumCode, nextRegCode } from '../lib/regCode.js';
import { buildPaginationMeta, parsePagination } from '../lib/pagination.js';
import {
  dokterListWhere,
  hargaListWhere,
  jenisListWhere,
  kesanListWhere,
  pasienAntreanWhere,
  pasienListWhere,
  petugasLabListWhere,
  radiologListWhere,
  staffListWhere,
} from '../lib/searchWhere.js';
import { computeUmur, serializeDecimal } from '../lib/serialize.js';

type ListQuery = { page?: string; limit?: string; q?: string };
type StaffListQuery = ListQuery & { role?: string };
type StaffRoleInput = 'ADMIN' | 'KARYAWAN';
type PasienListQuery = ListQuery & {
  hasilStatus?: string;
  paymentStatus?: string;
  pengirimId?: string;
  startDate?: string;
  endDate?: string;
};

const pasienInclude = {
  pengirim: true,
  radiolog: true,
  pemeriksaan: { include: { jenisPemeriksaan: true } },
} as const;

const staffPublicSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
} as const;

function badRequest(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: message });
}

export async function registerCrudRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ListQuery }>('/api/dokter', async (req) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = dokterListWhere(req.query.q);
    const [total, items] = await Promise.all([
      prisma.dokter.count({ where }),
      prisma.dokter.findMany({ where, orderBy: { nama: 'asc' }, skip, take: limit }),
    ]);
    return {
      items: items.map((d) => ({
        ...d,
        defaultSharingAmount: serializeDecimal(d.defaultSharingAmount),
      })),
      pagination: buildPaginationMeta(total, page, limit),
    };
  });

  app.post<{
    Body: { nama: string; spesialisasi?: string; noTelepon?: string; defaultSharingAmount?: number };
  }>('/api/dokter', async (req, reply) => {
    if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');
    const item = await prisma.dokter.create({
      data: {
        nama: req.body.nama.trim(),
        spesialisasi: req.body.spesialisasi?.trim() || null,
        noTelepon: req.body.noTelepon?.trim() || null,
        defaultSharingAmount: req.body.defaultSharingAmount ?? 0,
      },
    });
    return reply.status(201).send({
      item: { ...item, defaultSharingAmount: serializeDecimal(item.defaultSharingAmount) },
    });
  });

  app.delete<{ Params: { id: string } }>('/api/dokter/:id', async (req, reply) => {
    try {
      await prisma.dokter.delete({ where: { id: req.params.id } });
      return { ok: true };
    } catch {
      return reply.status(409).send({ error: 'Dokter masih dipakai pasien' });
    }
  });

  app.patch<{
    Params: { id: string };
    Body: { nama?: string; spesialisasi?: string; noTelepon?: string; defaultSharingAmount?: number };
  }>('/api/dokter/:id', async (req, reply) => {
    const existing = await prisma.dokter.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Dokter tidak ditemukan' });
    const item = await prisma.dokter.update({
      where: { id: req.params.id },
      data: {
        nama: req.body.nama?.trim() ?? existing.nama,
        spesialisasi: req.body.spesialisasi !== undefined ? req.body.spesialisasi?.trim() || null : existing.spesialisasi,
        noTelepon: req.body.noTelepon !== undefined ? req.body.noTelepon?.trim() || null : existing.noTelepon,
        defaultSharingAmount: req.body.defaultSharingAmount ?? existing.defaultSharingAmount,
      },
    });
    return {
      item: { ...item, defaultSharingAmount: serializeDecimal(item.defaultSharingAmount) },
    };
  });

  app.get<{ Querystring: ListQuery }>('/api/radiolog', async (req) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = radiologListWhere(req.query.q);
    const [total, items] = await Promise.all([
      prisma.radiolog.count({ where }),
      prisma.radiolog.findMany({ where, orderBy: { nama: 'asc' }, skip, take: limit }),
    ]);
    return { items, pagination: buildPaginationMeta(total, page, limit) };
  });

  app.post<{ Body: { nama: string; noTelepon?: string } }>(
    '/api/radiolog',
    async (req, reply) => {
      if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');
      const item = await prisma.radiolog.create({
        data: {
          nama: req.body.nama.trim(),
          noTelepon: req.body.noTelepon?.trim() || null,
        },
      });
      return reply.status(201).send({ item });
    },
  );

  app.delete<{ Params: { id: string } }>('/api/radiolog/:id', async (req) => {
    await prisma.radiolog.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: { nama?: string; noTelepon?: string } }>(
    '/api/radiolog/:id',
    async (req, reply) => {
      const existing = await prisma.radiolog.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Radiolog tidak ditemukan' });
      const item = await prisma.radiolog.update({
        where: { id: req.params.id },
        data: {
          nama: req.body.nama?.trim() ?? existing.nama,
          noTelepon: req.body.noTelepon !== undefined ? req.body.noTelepon?.trim() || null : existing.noTelepon,
        },
      });
      return { item };
    },
  );

  app.get<{ Querystring: ListQuery }>('/api/petugas-lab', async (req) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = petugasLabListWhere(req.query.q);
    const [total, items] = await Promise.all([
      prisma.petugasLab.count({ where }),
      prisma.petugasLab.findMany({
        where,
        orderBy: { nama: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return { items, pagination: buildPaginationMeta(total, page, limit) };
  });

  app.get<{ Params: { id: string } }>('/api/petugas-lab/:id', async (req, reply) => {
    const item = await prisma.petugasLab.findUnique({ where: { id: req.params.id } });
    if (!item) return reply.status(404).send({ error: 'Petugas lab tidak ditemukan' });
    return { item };
  });

  app.post<{ Body: { nama: string; nip?: string; noTelepon?: string } }>(
    '/api/petugas-lab',
    async (req, reply) => {
      if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');
      const item = await prisma.petugasLab.create({
        data: {
          nama: req.body.nama.trim(),
          nip: req.body.nip?.trim() || null,
          noTelepon: req.body.noTelepon?.trim() || null,
        },
      });
      return reply.status(201).send({ item });
    },
  );

  app.delete<{ Params: { id: string } }>('/api/petugas-lab/:id', async (req) => {
    await prisma.petugasLab.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: { nama?: string; nip?: string; noTelepon?: string } }>(
    '/api/petugas-lab/:id',
    async (req, reply) => {
      const existing = await prisma.petugasLab.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Petugas lab tidak ditemukan' });
      const item = await prisma.petugasLab.update({
        where: { id: req.params.id },
        data: {
          nama: req.body.nama?.trim() ?? existing.nama,
          nip: req.body.nip !== undefined ? req.body.nip?.trim() || null : existing.nip,
          noTelepon: req.body.noTelepon !== undefined ? req.body.noTelepon?.trim() || null : existing.noTelepon,
        },
      });
      return { item };
    },
  );

  app.get<{ Querystring: ListQuery }>(
    '/api/jenis-pemeriksaan',
    async (req) => {
      const { page, limit, skip } = parsePagination(req.query);
      const where = jenisListWhere(req.query.q);
      const [total, items] = await Promise.all([
        prisma.jenisPemeriksaan.count({ where }),
        prisma.jenisPemeriksaan.findMany({
          where,
          orderBy: { nama: 'asc' },
          include: { harga: true },
          skip,
          take: limit,
        }),
      ]);
      return {
        items: items.map((j) => ({
          id: j.id,
          nama: j.nama,
          harga: j.harga ? serializeDecimal(j.harga.harga) : null,
          detailLayanan: j.harga?.detailLayanan ?? null,
        })),
        pagination: buildPaginationMeta(total, page, limit),
      };
    },
  );

  app.post<{ Body: { nama: string; harga?: number; detailLayanan?: string } }>(
    '/api/jenis-pemeriksaan',
    async (req, reply) => {
      if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');
      const { harga, detailLayanan } = req.body;
      const item = await prisma.jenisPemeriksaan.create({
        data: {
          nama: req.body.nama.trim(),
          ...(harga !== undefined
            ? {
                harga: {
                  create: {
                    harga,
                    detailLayanan: detailLayanan?.trim() || null,
                  },
                },
              }
            : {}),
        },
        include: { harga: true },
      });
      return reply.status(201).send({
        item: {
          id: item.id,
          nama: item.nama,
          harga: item.harga ? serializeDecimal(item.harga.harga) : null,
          detailLayanan: item.harga?.detailLayanan ?? null,
        },
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/jenis-pemeriksaan/:id',
    async (req, reply) => {
      try {
        await prisma.jenisPemeriksaan.delete({ where: { id: req.params.id } });
        return { ok: true };
      } catch {
        return reply.status(409).send({ error: 'Jenis pemeriksaan masih dipakai pasien' });
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: { nama?: string; harga?: number; detailLayanan?: string } }>(
    '/api/jenis-pemeriksaan/:id',
    async (req, reply) => {
      const existing = await prisma.jenisPemeriksaan.findUnique({
        where: { id: req.params.id },
        include: { harga: true },
      });
      if (!existing) return reply.status(404).send({ error: 'Jenis tidak ditemukan' });
      if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');

      const item = await prisma.$transaction(async (tx) => {
        const jenis = await tx.jenisPemeriksaan.update({
          where: { id: req.params.id },
          data: { nama: req.body.nama!.trim() },
        });
        if (req.body.harga !== undefined) {
          await tx.hargaLayanan.upsert({
            where: { jenisPemeriksaanId: req.params.id },
            create: {
              jenisPemeriksaanId: req.params.id,
              harga: req.body.harga,
              detailLayanan: req.body.detailLayanan?.trim() || null,
            },
            update: {
              harga: req.body.harga,
              detailLayanan:
                req.body.detailLayanan !== undefined
                  ? req.body.detailLayanan?.trim() || null
                  : undefined,
            },
          });
        } else if (req.body.detailLayanan !== undefined && existing.harga) {
          await tx.hargaLayanan.update({
            where: { jenisPemeriksaanId: req.params.id },
            data: { detailLayanan: req.body.detailLayanan?.trim() || null },
          });
        }
        const withHarga = await tx.jenisPemeriksaan.findUnique({
          where: { id: jenis.id },
          include: { harga: true },
        });
        return withHarga!;
      });

      return {
        item: {
          id: item.id,
          nama: item.nama,
          harga: item.harga ? serializeDecimal(item.harga.harga) : null,
          detailLayanan: item.harga?.detailLayanan ?? null,
        },
      };
    },
  );

  app.get<{ Querystring: ListQuery }>(
    '/api/harga-layanan',
    async (req) => {
      const { page, limit, skip } = parsePagination(req.query);
      const where = hargaListWhere(req.query.q);
      const [total, items] = await Promise.all([
        prisma.hargaLayanan.count({ where }),
        prisma.hargaLayanan.findMany({
          where,
          include: { jenisPemeriksaan: true },
          orderBy: { jenisPemeriksaan: { nama: 'asc' } },
          skip,
          take: limit,
        }),
      ]);
      return {
        items: items.map((h) => ({
          id: h.id,
          jenisPemeriksaanId: h.jenisPemeriksaanId,
          jenisNama: h.jenisPemeriksaan.nama,
          harga: serializeDecimal(h.harga),
          detailLayanan: h.detailLayanan,
        })),
        pagination: buildPaginationMeta(total, page, limit),
      };
    },
  );

  app.post<{
    Body: { jenisPemeriksaanId: string; harga: number; detailLayanan?: string };
  }>('/api/harga-layanan', async (req, reply) => {
    const { jenisPemeriksaanId, harga, detailLayanan } = req.body;
    if (!jenisPemeriksaanId || harga === undefined) {
      return badRequest(reply, 'jenisPemeriksaanId dan harga wajib');
    }
    const item = await prisma.hargaLayanan.upsert({
      where: { jenisPemeriksaanId },
      create: {
        jenisPemeriksaanId,
        harga,
        detailLayanan: detailLayanan?.trim() || null,
      },
      update: {
        harga,
        detailLayanan: detailLayanan?.trim() || null,
      },
    });
    return reply.status(201).send({
      item: { ...item, harga: serializeDecimal(item.harga) },
    });
  });

  app.delete<{ Params: { id: string } }>('/api/harga-layanan/:id', async (req) => {
    await prisma.hargaLayanan.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: { harga?: number; detailLayanan?: string } }>(
    '/api/harga-layanan/:id',
    async (req, reply) => {
      const existing = await prisma.hargaLayanan.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Harga tidak ditemukan' });
      const item = await prisma.hargaLayanan.update({
        where: { id: req.params.id },
        data: {
          harga: req.body.harga ?? existing.harga,
          detailLayanan:
            req.body.detailLayanan !== undefined
              ? req.body.detailLayanan?.trim() || null
              : existing.detailLayanan,
        },
      });
      return { item: { ...item, harga: serializeDecimal(item.harga) } };
    },
  );

  app.get<{ Querystring: ListQuery }>(
    '/api/kesan-template',
    async (req) => {
      const { page, limit, skip } = parsePagination(req.query);
      const where = kesanListWhere(req.query.q);
      const [total, items] = await Promise.all([
        prisma.kesanTemplate.count({ where }),
        prisma.kesanTemplate.findMany({ where, orderBy: { judul: 'asc' }, skip, take: limit }),
      ]);
      return { items, pagination: buildPaginationMeta(total, page, limit) };
    },
  );

  app.post<{ Body: { judul: string; isi: string; gambar?: string } }>(
    '/api/kesan-template',
    async (req, reply) => {
      if (!req.body.judul?.trim() || !req.body.isi?.trim()) {
        return badRequest(reply, 'judul dan isi wajib');
      }
      const item = await prisma.kesanTemplate.create({
        data: {
          judul: req.body.judul.trim(),
          isi: req.body.isi.trim(),
          gambar: req.body.gambar || null,
        },
      });
      return reply.status(201).send({ item });
    },
  );

  app.delete<{ Params: { id: string } }>('/api/kesan-template/:id', async (req) => {
    await prisma.kesanTemplate.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.patch<{ Params: { id: string }; Body: { judul?: string; isi?: string; gambar?: string } }>(
    '/api/kesan-template/:id',
    async (req, reply) => {
      const existing = await prisma.kesanTemplate.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Template tidak ditemukan' });
      const item = await prisma.kesanTemplate.update({
        where: { id: req.params.id },
        data: {
          judul: req.body.judul?.trim() ?? existing.judul,
          isi: req.body.isi?.trim() ?? existing.isi,
          gambar: req.body.gambar !== undefined ? req.body.gambar || null : existing.gambar,
        },
      });
      return { item };
    },
  );

  // ─── Paket Laboratorium ─────────────────────────────────────────────────────

  app.get('/api/paket-lab', async () => {
    const items = await prisma.paketLab.findMany({
      orderBy: { urutan: 'asc' },
      include: { items: { orderBy: { urutan: 'asc' } } },
    });
    return {
      items: items.map((p) => ({
        ...p,
        harga: serializeDecimal(p.harga),
        items: p.items.map((it) => ({
          ...it,
          harga: serializeDecimal(it.harga),
        })),
      })),
    };
  });

  app.post('/api/paket-lab/init-defaults', async () => {
    const defaultSeed = [
      {
        nama: 'Pemeriksaan hematologi',
        urutan: 1,
        harga: 150000,
        items: [
          { pemeriksaan: 'Hemoglobin (Hb)', nilaiRujukan: '12 - 16 g/dL', satuan: 'g/dL', harga: 30000, urutan: 1 },
          { pemeriksaan: 'Leukosit (WBC)', nilaiRujukan: '4.000 - 10.000 /µL', satuan: '/µL', harga: 25000, urutan: 2 },
          { pemeriksaan: 'Trombosit (PLT)', nilaiRujukan: '150.000 - 400.000 /µL', satuan: '/µL', harga: 30000, urutan: 3 },
          { pemeriksaan: 'Erytrosit (RBC)', nilaiRujukan: '4,0 - 5,5 juta/µL', satuan: 'juta/µL', harga: 25000, urutan: 4 },
          { pemeriksaan: 'Hematokrit (Ht)', nilaiRujukan: '37 - 48 %', satuan: '%', harga: 25000, urutan: 5 },
          { pemeriksaan: 'MCV', nilaiRujukan: '80 - 100 fL', satuan: 'fL', harga: 20000, urutan: 6 },
          { pemeriksaan: 'MCH', nilaiRujukan: '27 - 34 pg', satuan: 'pg', harga: 20000, urutan: 7 },
          { pemeriksaan: 'MCHC', nilaiRujukan: '32 - 36 g/dL', satuan: 'g/dL', harga: 20000, urutan: 8 },
        ],
      },
      {
        nama: 'Kimia darah',
        urutan: 2,
        harga: 250000,
        items: [
          { pemeriksaan: 'SGOT (AST)', nilaiRujukan: '< 35 U/L', satuan: 'U/L', harga: 35000, urutan: 1 },
          { pemeriksaan: 'SGPT (ALT)', nilaiRujukan: '< 40 U/L', satuan: 'U/L', harga: 35000, urutan: 2 },
          { pemeriksaan: 'Ureum', nilaiRujukan: '15 - 45 mg/dL', satuan: 'mg/dL', harga: 35000, urutan: 3 },
          { pemeriksaan: 'Kreatinin', nilaiRujukan: '0,6 - 1,2 mg/dL', satuan: 'mg/dL', harga: 40000, urutan: 4 },
          { pemeriksaan: 'Asam Urat', nilaiRujukan: '2,4 - 7,0 mg/dL', satuan: 'mg/dL', harga: 35000, urutan: 5 },
          { pemeriksaan: 'Kolesterol Total', nilaiRujukan: '< 200 mg/dL', satuan: 'mg/dL', harga: 35000, urutan: 6 },
          { pemeriksaan: 'Trigliserida', nilaiRujukan: '< 150 mg/dL', satuan: 'mg/dL', harga: 35000, urutan: 7 },
          { pemeriksaan: 'HDL Kolesterol', nilaiRujukan: '> 40 mg/dL', satuan: 'mg/dL', harga: 40000, urutan: 8 },
          { pemeriksaan: 'LDL Kolesterol', nilaiRujukan: '< 100 mg/dL', satuan: 'mg/dL', harga: 40000, urutan: 9 },
          { pemeriksaan: 'Bilirubin Total', nilaiRujukan: '0,2 - 1,2 mg/dL', satuan: 'mg/dL', harga: 35000, urutan: 10 },
        ],
      },
      {
        nama: 'Diabetes',
        urutan: 3,
        harga: 120000,
        items: [
          { pemeriksaan: 'Gula Darah Sewaktu (GDS)', nilaiRujukan: '< 200 mg/dL', satuan: 'mg/dL', harga: 25000, urutan: 1 },
          { pemeriksaan: 'Gula Darah Puasa (GDP)', nilaiRujukan: '70 - 110 mg/dL', satuan: 'mg/dL', harga: 25000, urutan: 2 },
          { pemeriksaan: 'Gula Darah 2 Jam PP', nilaiRujukan: '< 140 mg/dL', satuan: 'mg/dL', harga: 25000, urutan: 3 },
          { pemeriksaan: 'HbA1c', nilaiRujukan: '< 5,7 %', satuan: '%', harga: 80000, urutan: 4 },
        ],
      },
      {
        nama: 'Urinalisa',
        urutan: 4,
        harga: 75000,
        items: [
          { pemeriksaan: 'Warna Urine', nilaiRujukan: 'Kuning Muda', satuan: '-', harga: 10000, urutan: 1 },
          { pemeriksaan: 'Kejernihan Urine', nilaiRujukan: 'Jernih', satuan: '-', harga: 10000, urutan: 2 },
          { pemeriksaan: 'pH Urine', nilaiRujukan: '4,6 - 8,0', satuan: '-', harga: 10000, urutan: 3 },
          { pemeriksaan: 'Berat Jenis (BJ)', nilaiRujukan: '1,010 - 1,025', satuan: '-', harga: 10000, urutan: 4 },
          { pemeriksaan: 'Protein / Albumin Urine', nilaiRujukan: 'Negatif', satuan: '-', harga: 15000, urutan: 5 },
          { pemeriksaan: 'Glukosa Urine', nilaiRujukan: 'Negatif', satuan: '-', harga: 15000, urutan: 6 },
          { pemeriksaan: 'Bilirubin Urine', nilaiRujukan: 'Negatif', satuan: '-', harga: 15000, urutan: 7 },
          { pemeriksaan: 'Urobilinogen Urine', nilaiRujukan: 'Normal', satuan: '-', harga: 15000, urutan: 8 },
          { pemeriksaan: 'Keton Urine', nilaiRujukan: 'Negatif', satuan: '-', harga: 15000, urutan: 9 },
          { pemeriksaan: 'Nitrit Urine', nilaiRujukan: 'Negatif', satuan: '-', harga: 15000, urutan: 10 },
        ],
      },
      {
        nama: 'Urin rutin',
        urutan: 5,
        harga: 65000,
        items: [
          { pemeriksaan: 'Makroskopis Urine (Warna/BJ/pH)', nilaiRujukan: 'Normal / Jernih', satuan: '-', harga: 25000, urutan: 1 },
          { pemeriksaan: 'Sedimen Eritrosit', nilaiRujukan: '0 - 2 /LPB', satuan: '/LPB', harga: 15000, urutan: 2 },
          { pemeriksaan: 'Sedimen Leukosit', nilaiRujukan: '0 - 5 /LPB', satuan: '/LPB', harga: 15000, urutan: 3 },
          { pemeriksaan: 'Sedimen Sel Epitel', nilaiRujukan: '1 - 5 /LPK', satuan: '/LPK', harga: 10000, urutan: 4 },
          { pemeriksaan: 'Sedimen Silinder & Kristal', nilaiRujukan: 'Negatif', satuan: '-', harga: 10000, urutan: 5 },
        ],
      },
      {
        nama: 'Imunologi',
        urutan: 6,
        harga: 200000,
        items: [
          { pemeriksaan: 'Widal S. Typhi O & H', nilaiRujukan: '< 1/80', satuan: 'Titer', harga: 50000, urutan: 1 },
          { pemeriksaan: 'HBsAg', nilaiRujukan: 'Non-Reaktif', satuan: '-', harga: 60000, urutan: 2 },
          { pemeriksaan: 'Anti-HBs', nilaiRujukan: '> 10 mIU/mL', satuan: 'mIU/mL', harga: 70000, urutan: 3 },
          { pemeriksaan: 'Dengue IgG / IgM', nilaiRujukan: 'Negatif', satuan: '-', harga: 120000, urutan: 4 },
          { pemeriksaan: 'Anti-HIV', nilaiRujukan: 'Non-Reaktif', satuan: '-', harga: 90000, urutan: 5 },
          { pemeriksaan: 'TPHA / VDRL', nilaiRujukan: 'Non-Reaktif', satuan: '-', harga: 70000, urutan: 6 },
        ],
      },
      {
        nama: 'Diffcount',
        urutan: 7,
        harga: 50000,
        items: [
          { pemeriksaan: 'Eosinofil', nilaiRujukan: '1 - 3 %', satuan: '%', harga: 10000, urutan: 1 },
          { pemeriksaan: 'Basofil', nilaiRujukan: '0 - 1 %', satuan: '%', harga: 10000, urutan: 2 },
          { pemeriksaan: 'Staff', nilaiRujukan: '2 - 6 %', satuan: '%', harga: 10000, urutan: 3 },
          { pemeriksaan: 'Netrofil Segmen', nilaiRujukan: '50 - 70 %', satuan: '%', harga: 10000, urutan: 4 },
          { pemeriksaan: 'Limposit', nilaiRujukan: '20 - 40 %', satuan: '%', harga: 10000, urutan: 5 },
          { pemeriksaan: 'Monosit', nilaiRujukan: '2 - 8 %', satuan: '%', harga: 10000, urutan: 6 },
        ],
      },
      {
        nama: 'Laju Endap Darah',
        urutan: 8,
        harga: 30000,
        items: [
          { pemeriksaan: 'LED', nilaiRujukan: '< 20 mm/jam', satuan: 'mm/jam', harga: 30000, urutan: 1 },
        ],
      },
    ];

    for (const pkg of defaultSeed) {
      let existing = await prisma.paketLab.findUnique({ where: { nama: pkg.nama } });
      if (!existing) {
        existing = await prisma.paketLab.create({
          data: {
            nama: pkg.nama,
            urutan: pkg.urutan,
            harga: new Decimal(pkg.harga),
          },
        });
      }
      const itemCount = await prisma.paketLabItem.count({ where: { paketId: existing.id } });
      if (itemCount === 0) {
        await prisma.paketLabItem.createMany({
          data: pkg.items.map((it) => ({
            paketId: existing.id,
            pemeriksaan: it.pemeriksaan,
            nilaiRujukan: it.nilaiRujukan,
            satuan: it.satuan,
            harga: new Decimal(it.harga),
            urutan: it.urutan,
          })),
        });
      }
    }
    return { ok: true };
  });

  app.post<{
    Body: { nama: string; urutan?: number; harga?: string | number };
  }>('/api/paket-lab', async (req, reply) => {
    if (!req.body.nama?.trim()) return badRequest(reply, 'nama wajib diisi');
    const existing = await prisma.paketLab.findUnique({ where: { nama: req.body.nama.trim() } });
    if (existing) return badRequest(reply, 'Nama paket sudah ada');
    const item = await prisma.paketLab.create({
      data: {
        nama: req.body.nama.trim(),
        urutan: req.body.urutan ?? 0,
        harga: req.body.harga ? new Decimal(req.body.harga) : new Decimal(0),
      },
      include: { items: true },
    });
    return reply.status(201).send({
      item: {
        ...item,
        harga: serializeDecimal(item.harga),
        items: item.items.map((it) => ({ ...it, harga: serializeDecimal(it.harga) })),
      },
    });
  });

  app.patch<{
    Params: { id: string };
    Body: { nama?: string; urutan?: number; harga?: string | number };
  }>('/api/paket-lab/:id', async (req, reply) => {
    const existing = await prisma.paketLab.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Paket tidak ditemukan' });
    const item = await prisma.paketLab.update({
      where: { id: req.params.id },
      data: {
        nama: req.body.nama?.trim() ?? existing.nama,
        urutan: req.body.urutan ?? existing.urutan,
        harga: req.body.harga !== undefined ? new Decimal(req.body.harga) : existing.harga,
      },
      include: { items: { orderBy: { urutan: 'asc' } } },
    });
    return {
      item: {
        ...item,
        harga: serializeDecimal(item.harga),
        items: item.items.map((it) => ({ ...it, harga: serializeDecimal(it.harga) })),
      },
    };
  });

  app.delete<{ Params: { id: string } }>('/api/paket-lab/:id', async (req, reply) => {
    try {
      await prisma.paketLab.delete({ where: { id: req.params.id } });
      return { ok: true };
    } catch {
      return reply.status(404).send({ error: 'Paket tidak ditemukan' });
    }
  });

  // Replace all items in a paket (PUT or PATCH = full replace)
  const replaceItemsHandler = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: {
        items: {
          grup?: string;
          pemeriksaan: string;
          nilaiRujukan?: string;
          satuan?: string;
          harga?: string | number;
          urutan?: number;
        }[];
      };
    }>,
    reply: FastifyReply,
  ) => {
    const existing = await prisma.paketLab.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Paket tidak ditemukan' });
    if (!Array.isArray(req.body.items)) return badRequest(reply, 'items harus berupa array');

    await prisma.$transaction(async (tx) => {
      await tx.paketLabItem.deleteMany({ where: { paketId: req.params.id } });
      if (req.body.items.length > 0) {
        await tx.paketLabItem.createMany({
          data: req.body.items.map((it, i) => ({
            paketId: req.params.id,
            grup: it.grup?.trim() || null,
            pemeriksaan: it.pemeriksaan.trim(),
            nilaiRujukan: it.nilaiRujukan?.trim() ?? '',
            satuan: it.satuan?.trim() ?? '',
            harga: it.harga ? new Decimal(it.harga) : new Decimal(0),
            urutan: it.urutan ?? i,
          })),
        });
      }
    });

    const item = await prisma.paketLab.findUnique({
      where: { id: req.params.id },
      include: { items: { orderBy: { urutan: 'asc' } } },
    });
    return {
      item: item
        ? {
            ...item,
            harga: serializeDecimal(item.harga),
            items: item.items.map((it) => ({ ...it, harga: serializeDecimal(it.harga) })),
          }
        : null,
    };
  };

  app.put('/api/paket-lab/:id/items', replaceItemsHandler);
  app.patch('/api/paket-lab/:id/items', replaceItemsHandler);

  // ────────────────────────────────────────────────────────────────────────────

  app.get<{ Querystring: StaffListQuery }>('/api/staff', async (req) => {

    const { page, limit, skip } = parsePagination(req.query);
    const where = staffListWhere(req.query.q, req.query.role);
    const [total, items] = await Promise.all([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        orderBy: { nama: 'asc' },
        skip,
        take: limit,
        select: staffPublicSelect,
      }),
    ]);
    return { items, pagination: buildPaginationMeta(total, page, limit) };
  });

  app.post<{ Body: { nama: string; email: string; password: string; role: StaffRoleInput } }>(
    '/api/staff',
    async (req, reply) => {
      const { nama, email, password, role } = req.body;
      if (!nama?.trim() || !email?.trim() || !role || !password?.trim()) {
        return badRequest(reply, 'nama, email, password, role wajib');
      }
      if (password.length < 6) {
        return badRequest(reply, 'password minimal 6 karakter');
      }
      const item = await prisma.staff.create({
        data: {
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: await hashPassword(password),
          role,
        },
        select: staffPublicSelect,
      });
      return reply.status(201).send({ item });
    },
  );

  app.delete<{ Params: { id: string } }>('/api/staff/:id', async (req) => {
    await prisma.staff.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.patch<{
    Params: { id: string };
    Body: { nama?: string; email?: string; password?: string; role?: StaffRoleInput };
  }>('/api/staff/:id', async (req, reply) => {
    const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Staff tidak ditemukan' });
    if (req.body.password !== undefined && req.body.password.length > 0 && req.body.password.length < 6) {
      return badRequest(reply, 'password minimal 6 karakter');
    }
    const item = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        nama: req.body.nama?.trim() ?? existing.nama,
        email: req.body.email?.trim().toLowerCase() ?? existing.email,
        ...(req.body.password?.trim()
          ? { passwordHash: await hashPassword(req.body.password) }
          : {}),
        role: req.body.role ?? existing.role,
      },
      select: staffPublicSelect,
    });
    return { item };
  });

  // ─── Pendaftaran Umum ─────────────────────────────────────────────────────

  app.get<{ Querystring: ListQuery }>('/api/pendaftaran-umum', async (req) => {
    const { page, limit, skip } = parsePagination(req.query);
    const q = req.query.q?.trim() || '';
    const where = q
      ? {
          OR: [
            { namaPasien: { contains: q } },
            { noRegistrasi: { contains: q } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      prisma.pendaftaranUmum.count({ where }),
      prisma.pendaftaranUmum.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { items, pagination: buildPaginationMeta(total, page, limit) };
  });

  app.post<{
    Body: {
      noRegistrasi?: string;
      namaPasien: string;
      umur?: string;
      alamat?: string;
      telpon?: string;
      tanggalMasuk: string;
      dokterPengirim?: string;
      klinis?: string;
      admin?: string;
    };
  }>('/api/pendaftaran-umum', async (req, reply) => {
    if (!req.body.namaPasien?.trim() || !req.body.tanggalMasuk) {
      return badRequest(reply, 'namaPasien dan tanggalMasuk wajib diisi');
    }
    const noRegistrasi = req.body.noRegistrasi?.trim() || await nextPendaftaranUmumCode(prisma);
    const item = await prisma.pendaftaranUmum.create({
      data: {
        noRegistrasi,
        namaPasien: req.body.namaPasien.trim(),
        umur: req.body.umur?.trim() || null,
        alamat: req.body.alamat?.trim() || null,
        telpon: req.body.telpon?.trim() || null,
        tanggalMasuk: new Date(req.body.tanggalMasuk),
        dokterPengirim: req.body.dokterPengirim?.trim() || null,
        klinis: req.body.klinis?.trim() || null,
        admin: req.body.admin?.trim() || null,
      },
    });
    return reply.status(201).send({ item });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      noRegistrasi?: string;
      namaPasien?: string;
      umur?: string;
      alamat?: string;
      telpon?: string;
      tanggalMasuk?: string;
      dokterPengirim?: string;
      klinis?: string;
      admin?: string;
    };
  }>('/api/pendaftaran-umum/:id', async (req, reply) => {
    const existing = await prisma.pendaftaranUmum.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Pendaftaran tidak ditemukan' });

    const item = await prisma.pendaftaranUmum.update({
      where: { id: req.params.id },
      data: {
        noRegistrasi: req.body.noRegistrasi?.trim() ?? existing.noRegistrasi,
        namaPasien: req.body.namaPasien?.trim() ?? existing.namaPasien,
        umur: req.body.umur !== undefined ? req.body.umur?.trim() || null : existing.umur,
        alamat: req.body.alamat !== undefined ? req.body.alamat?.trim() || null : existing.alamat,
        telpon: req.body.telpon !== undefined ? req.body.telpon?.trim() || null : existing.telpon,
        tanggalMasuk: req.body.tanggalMasuk ? new Date(req.body.tanggalMasuk) : existing.tanggalMasuk,
        dokterPengirim: req.body.dokterPengirim !== undefined ? req.body.dokterPengirim?.trim() || null : existing.dokterPengirim,
        klinis: req.body.klinis !== undefined ? req.body.klinis?.trim() || null : existing.klinis,
        admin: req.body.admin !== undefined ? req.body.admin?.trim() || null : existing.admin,
      },
    });
    return { item };
  });

  app.delete<{ Params: { id: string } }>('/api/pendaftaran-umum/:id', async (req) => {
    await prisma.pendaftaranUmum.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.get<{ Querystring: PasienListQuery }>('/api/pasien/summary', async (req) => {
    const where = pasienListWhere(req.query);
    const [totalPasien, menungguHasil, selesai, agg, groups, dokters] = await Promise.all([
      prisma.pasien.count({ where }),
      prisma.pasien.count({ where: { ...where, hasilStatus: 'MENUNGGU_HASIL' } }),
      prisma.pasien.count({ where: { ...where, hasilStatus: 'SELESAI' } }),
      prisma.pasien.aggregate({
        where,
        _sum: { totalHarga: true, totalSharing: true },
      }),
      prisma.pasien.groupBy({
        by: ['pengirimId'],
        where,
        _count: { _all: true },
        _sum: { totalHarga: true, totalSharing: true },
      }),
      prisma.dokter.findMany({ select: { id: true, nama: true } }),
    ]);

    const dokterMap = new Map(dokters.map((d) => [d.id, d.nama]));
    const byDokter = groups
      .map((g) => ({
        id: g.pengirimId,
        nama: dokterMap.get(g.pengirimId) ?? 'Dokter Tidak Dikenal',
        jumlahPasien: g._count._all,
        totalOmset: serializeDecimal(g._sum.totalHarga ?? new Decimal(0)),
        totalSharing: serializeDecimal(g._sum.totalSharing ?? new Decimal(0)),
      }))
      .sort((a, b) => b.jumlahPasien - a.jumlahPasien);

    return {
      totalPasien,
      menungguHasil,
      selesai,
      totalOmzet: serializeDecimal(agg._sum.totalHarga ?? new Decimal(0)),
      totalSharing: serializeDecimal(agg._sum.totalSharing ?? new Decimal(0)),
      byDokter,
    };
  });

  app.get<{ Querystring: PasienListQuery }>('/api/pasien', async (req) => {
    const { page, limit, skip } = parsePagination(req.query);
    const where = pasienListWhere(req.query);
    const [total, items] = await Promise.all([
      prisma.pasien.count({ where }),
      prisma.pasien.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: pasienInclude,
        skip,
        take: limit,
      }),
    ]);
    return {
      items: items.map(mapPasien),
      pagination: buildPaginationMeta(total, page, limit),
    };
  });

  app.get<{ Params: { id: string } }>('/api/pasien/:id', async (req, reply) => {
    const item = await prisma.pasien.findUnique({
      where: { id: req.params.id },
      include: {
        pengirim: true,
        radiolog: true,
        pemeriksaan: { include: { jenisPemeriksaan: true } },
      },
    });
    if (!item) return reply.status(404).send({ error: 'Pasien tidak ditemukan' });
    return { item: mapPasien(item) };
  });

  app.post<{
    Body: {
      nama: string;
      tanggalLahir: string;
      noTelepon?: string;
      alamat?: string;
      pengirimId: string;
      klinis?: string;
      jenisPemeriksaanIds: string[];
      sharingAmount?: number;
      radiologId?: string;
      admin?: string;
    };
  }>('/api/pasien', async (req, reply) => {
    const body = req.body;
    if (!body.nama?.trim() || !body.tanggalLahir || !body.pengirimId) {
      return badRequest(reply, 'nama, tanggalLahir, pengirimId wajib');
    }

    const dokter = await prisma.dokter.findUnique({ where: { id: body.pengirimId } });
    if (!dokter) return badRequest(reply, 'Dokter pengirim tidak valid');

    const hargaRows = body.jenisPemeriksaanIds?.length ? await prisma.hargaLayanan.findMany({
      where: { jenisPemeriksaanId: { in: body.jenisPemeriksaanIds } },
    }) : [];
    
    if (body.jenisPemeriksaanIds?.length && hargaRows.length !== body.jenisPemeriksaanIds.length) {
      return badRequest(reply, 'Beberapa jenis pemeriksaan belum punya harga');
    }

    const sharingAmount = new Decimal(body.sharingAmount ?? dokter.defaultSharingAmount);
    const pemeriksaanData = hargaRows.map((h) => ({
      jenisPemeriksaanId: h.jenisPemeriksaanId,
      hargaSnapshot: h.harga,
    }));
    const totalHarga = sumHarga(pemeriksaanData);
    const totalSharing = calcTotalSharing(totalHarga, 'FIXED', new Decimal(0), sharingAmount);

    const regCode = await nextRegCode(prisma);
    const item = await prisma.pasien.create({
      data: {
        regCode,
        nama: body.nama.trim(),
        tanggalLahir: new Date(body.tanggalLahir),
        noTelepon: body.noTelepon?.trim() || null,
        alamat: body.alamat?.trim() || null,
        pengirimId: body.pengirimId,
        klinis: body.klinis?.trim() || null,
        sharingType: 'FIXED',
        sharingPercent: new Decimal(0),
        totalHarga,
        totalSharing,
        radiologId: body.radiologId || null,
        admin: body.admin?.trim() || null,
        pemeriksaan: { create: pemeriksaanData },
      },
      include: {
        pengirim: true,
        radiolog: true,
        pemeriksaan: { include: { jenisPemeriksaan: true } },
      },
    });

    return reply.status(201).send({ item: mapPasien(item) });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      nama?: string;
      tanggalLahir?: string;
      noTelepon?: string;
      alamat?: string;
      pengirimId?: string;
      klinis?: string;
      hasilStatus?: 'MENUNGGU_HASIL' | 'SELESAI';
      paymentStatus?: 'BELUM_LUNAS' | 'LUNAS';
      radiologId?: string | null;
      sharingAmount?: number;
      jenisPemeriksaanIds?: string[];
      admin?: string;
      kesan?: string;
      sharingLocked?: boolean;
    };
  }>('/api/pasien/:id', async (req, reply) => {
    const existing = await prisma.pasien.findUnique({
      where: { id: req.params.id },
      include: { pemeriksaan: true },
    });
    if (!existing) return reply.status(404).send({ error: 'Pasien tidak ditemukan' });

    const hasilStatus = req.body.hasilStatus ?? existing.hasilStatus;
    const pengirimId = req.body.pengirimId ?? existing.pengirimId;

    const dokter = await prisma.dokter.findUnique({ where: { id: pengirimId } });
    if (!dokter) return badRequest(reply, 'Dokter pengirim tidak valid');

    let sharingAmount =
      existing.sharingAmount ?? existing.totalSharing;
    if (req.body.sharingAmount !== undefined) {
      sharingAmount = new Decimal(req.body.sharingAmount);
    } else if (req.body.pengirimId && req.body.pengirimId !== existing.pengirimId) {
      sharingAmount = dokter.defaultSharingAmount;
    }

    let totalHarga = existing.totalHarga;
    let newPemeriksaanRows: { jenisPemeriksaanId: string; hargaSnapshot: Decimal }[] | undefined;

    if (req.body.jenisPemeriksaanIds !== undefined) {
      if (!req.body.jenisPemeriksaanIds.length) {
        return badRequest(reply, 'Pilih minimal satu jenis pemeriksaan');
      }
      const hargaRows = await prisma.hargaLayanan.findMany({
        where: { jenisPemeriksaanId: { in: req.body.jenisPemeriksaanIds } },
      });
      if (hargaRows.length !== req.body.jenisPemeriksaanIds.length) {
        return badRequest(reply, 'Beberapa jenis pemeriksaan belum punya harga');
      }
      newPemeriksaanRows = hargaRows.map((h) => ({
        jenisPemeriksaanId: h.jenisPemeriksaanId,
        hargaSnapshot: h.harga,
      }));
      totalHarga = sumHarga(newPemeriksaanRows);
    }

    const totalSharing = calcTotalSharing(totalHarga, 'FIXED', new Decimal(0), sharingAmount);
    const sharingLocked = hasilStatus === 'SELESAI';

    const item = await prisma.$transaction(async (tx) => {
      if (newPemeriksaanRows) {
        await tx.pasienPemeriksaan.deleteMany({ where: { pasienId: existing.id } });
        await tx.pasienPemeriksaan.createMany({
          data: newPemeriksaanRows.map((row) => ({
            pasienId: existing.id,
            jenisPemeriksaanId: row.jenisPemeriksaanId,
            hargaSnapshot: row.hargaSnapshot,
          })),
        });
      }
      return tx.pasien.update({
        where: { id: req.params.id },
        data: {
          nama: req.body.nama?.trim() ?? existing.nama,
          tanggalLahir: req.body.tanggalLahir ? new Date(req.body.tanggalLahir) : existing.tanggalLahir,
          noTelepon:
            req.body.noTelepon !== undefined ? req.body.noTelepon?.trim() || null : existing.noTelepon,
          alamat: req.body.alamat !== undefined ? req.body.alamat?.trim() || null : existing.alamat,
          pengirimId,
          klinis: req.body.klinis !== undefined ? req.body.klinis?.trim() || null : existing.klinis,
          kesan: req.body.kesan !== undefined ? req.body.kesan?.trim() || null : existing.kesan,
          hasilStatus,
          paymentStatus: req.body.paymentStatus ?? existing.paymentStatus,
          radiologId:
            req.body.radiologId !== undefined ? req.body.radiologId || null : existing.radiologId,
          admin: req.body.admin !== undefined ? req.body.admin?.trim() || null : existing.admin,
          sharingLocked,
          sharingType: 'FIXED',
          sharingPercent: new Decimal(0),
          sharingAmount,
          totalHarga,
          totalSharing,
        },
        include: {
          pengirim: true,
          radiolog: true,
          pemeriksaan: { include: { jenisPemeriksaan: true } },
        },
      });
    });

    return { item: mapPasien(item) };
  });

  app.delete<{ Params: { id: string } }>('/api/pasien/:id', async (req, reply) => {
    try {
      await prisma.pasien.delete({ where: { id: req.params.id } });
      return { ok: true };
    } catch {
      return reply.status(404).send({ error: 'Pasien tidak ditemukan' });
    }
  });

  app.get<{ Querystring: ListQuery }>(
    '/api/radiolog/antrean',
    async (req) => {
      const { page, limit, skip } = parsePagination(req.query);
      const where = pasienAntreanWhere(req.query.q);
      const [total, items] = await Promise.all([
        prisma.pasien.count({ where }),
        prisma.pasien.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          include: pasienInclude,
          skip,
          take: limit,
        }),
      ]);
      return {
        items: items.map(mapPasien),
        pagination: buildPaginationMeta(total, page, limit),
      };
    },
  );
}

function mapPasien(
  p: {
    id: string;
    regCode: string;
    nama: string;
    tanggalLahir: Date;
    noTelepon: string | null;
    alamat: string | null;
    klinis: string | null;
    hasilStatus: string;
    paymentStatus: string;
    sharingAmount: Decimal | null;
    totalHarga: Decimal;
    totalSharing: Decimal;
    sharingLocked: boolean;
    kesan: string | null;
    admin: string | null;
    createdAt: Date;
    pengirim: { id: string; nama: string };
    radiolog?: { id: string; nama: string } | null;
    pemeriksaan: {
      id: string;
      jenisPemeriksaanId: string;
      hargaSnapshot: Decimal;
      jenisPemeriksaan: { nama: string };
    }[];
  },
) {
  return {
    id: p.id,
    regCode: p.regCode,
    nama: p.nama,
    umur: computeUmur(p.tanggalLahir),
    tanggalLahir: p.tanggalLahir.toISOString().slice(0, 10),
    noTelepon: p.noTelepon,
    alamat: p.alamat,
    pengirim: p.pengirim,
    klinis: p.klinis,
    hasilStatus: p.hasilStatus,
    paymentStatus: p.paymentStatus,
    sharingAmount: serializeDecimal(p.sharingAmount ?? p.totalSharing),
    totalHarga: serializeDecimal(p.totalHarga),
    totalSharing: serializeDecimal(p.totalSharing),
    sharingLocked: p.sharingLocked,
    kesan: p.kesan,
    admin: p.admin,
    radiolog: p.radiolog ?? null,
    pemeriksaan: p.pemeriksaan.map((x) => ({
      id: x.id,
      jenisPemeriksaanId: x.jenisPemeriksaanId,
      nama: x.jenisPemeriksaan.nama,
      harga: serializeDecimal(x.hargaSnapshot),
    })),
    createdAt: p.createdAt.toISOString(),
  };
}
