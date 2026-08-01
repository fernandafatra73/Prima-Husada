import type { FastifyInstance, FastifyReply } from 'fastify';
import { Decimal } from '../generated/prisma/internal/prismaNamespace.js';
import { buildPaginationMeta, parsePagination } from '../lib/pagination.js';
import { prisma } from '../lib/prisma.js';
import { serializeDecimal } from '../lib/serialize.js';

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ error: message });
}

function serializeTransfer(t: {
  id: string;
  namaBank: string;
  noRekening: string;
  jumlah: Decimal;
  namaTransferan: string;
  tanggal: Date;
}) {
  return {
    id: t.id,
    namaBank: t.namaBank,
    noRekening: t.noRekening,
    jumlah: serializeDecimal(t.jumlah),
    namaTransferan: t.namaTransferan,
    tanggal: t.tanggal.toISOString(),
  };
}

async function sumBetween(start: Date, end: Date): Promise<string> {
  const agg = await prisma.transfer.aggregate({
    where: { tanggal: { gte: start, lt: end } },
    _sum: { jumlah: true },
  });
  return (agg._sum.jumlah ?? new Decimal(0)).toString();
}

export async function registerTransferRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { page?: string; limit?: string; q?: string } }>(
    '/api/transfer',
    async (req) => {
      const { page, limit, skip } = parsePagination(req.query);
      const q = req.query.q?.trim();
      const where = q
        ? {
            OR: [
              { namaBank: { contains: q } },
              { noRekening: { contains: q } },
              { namaTransferan: { contains: q } },
            ],
          }
        : {};
      const [total, items] = await Promise.all([
        prisma.transfer.count({ where }),
        prisma.transfer.findMany({
          where,
          orderBy: { tanggal: 'desc' },
          skip,
          take: limit,
        }),
      ]);
      return {
        items: items.map(serializeTransfer),
        pagination: buildPaginationMeta(total, page, limit),
      };
    },
  );

  app.get('/api/transfer/summary', async () => {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    const [harian, mingguan, bulanan, tahunan] = await Promise.all([
      sumBetween(startOfDay, endOfDay),
      sumBetween(startOfWeek, endOfWeek),
      sumBetween(startOfMonth, endOfMonth),
      sumBetween(startOfYear, endOfYear),
    ]);

    return { harian, mingguan, bulanan, tahunan };
  });

  app.post<{
    Body: {
      namaBank: string;
      noRekening: string;
      jumlah: number;
      namaTransferan: string;
      tanggal?: string;
    };
  }>('/api/transfer', async (req, reply) => {
    const b = req.body;
    if (!b.namaBank?.trim() || !b.noRekening?.trim() || !b.namaTransferan?.trim() || b.jumlah === undefined) {
      return badRequest(reply, 'namaBank, noRekening, jumlah, namaTransferan wajib diisi');
    }
    const item = await prisma.transfer.create({
      data: {
        namaBank: b.namaBank.trim(),
        noRekening: b.noRekening.trim(),
        jumlah: b.jumlah,
        namaTransferan: b.namaTransferan.trim(),
        tanggal: b.tanggal ? new Date(b.tanggal) : new Date(),
      },
    });
    return reply.status(201).send({ item: serializeTransfer(item) });
  });

  app.patch<{
    Params: { id: string };
    Body: {
      namaBank?: string;
      noRekening?: string;
      jumlah?: number;
      namaTransferan?: string;
      tanggal?: string;
    };
  }>('/api/transfer/:id', async (req, reply) => {
    const existing = await prisma.transfer.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Data transfer tidak ditemukan' });

    const item = await prisma.transfer.update({
      where: { id: req.params.id },
      data: {
        namaBank: req.body.namaBank?.trim() ?? existing.namaBank,
        noRekening: req.body.noRekening?.trim() ?? existing.noRekening,
        jumlah: req.body.jumlah !== undefined ? req.body.jumlah : existing.jumlah,
        namaTransferan: req.body.namaTransferan?.trim() ?? existing.namaTransferan,
        tanggal: req.body.tanggal ? new Date(req.body.tanggal) : existing.tanggal,
      },
    });
    return { item: serializeTransfer(item) };
  });

  app.delete<{ Params: { id: string } }>('/api/transfer/:id', async (req, reply) => {
    try {
      await prisma.transfer.delete({ where: { id: req.params.id } });
      return { ok: true };
    } catch {
      return reply.status(404).send({ error: 'Data transfer tidak ditemukan' });
    }
  });
}
