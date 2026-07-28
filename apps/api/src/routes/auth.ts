import type { FastifyInstance, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getLegacySeedPassword, hashPassword, verifyPassword } from '../lib/password.js';

interface LoginBody {
  readonly email: string;
  readonly password: string;
}

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send({ error: 'Email atau password salah' });
}

function isPasswordHashColumnError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('passwordHash');
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LoginBody }>('/api/auth/login', async (req, reply) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return unauthorized(reply);
    }

    const staff = await prisma.staff.findUnique({
      where: { email },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
      },
    });

    if (!staff) {
      return unauthorized(reply);
    }

    try {
      const staffCredential = await prisma.staff.findUnique({
        where: { id: staff.id },
        select: { passwordHash: true },
      });

      if (staffCredential?.passwordHash) {
        if (!(await verifyPassword(password, staffCredential.passwordHash))) {
          return unauthorized(reply);
        }

        return {
          user: staff,
        };
      }
    } catch (err: unknown) {
      if (!isPasswordHashColumnError(err)) {
        throw err;
      }

      app.log.warn('Kolom passwordHash belum tersedia; fallback login akun seed lama dipakai');
    }

    const legacyPassword = getLegacySeedPassword(staff.email);
    if (legacyPassword !== password) {
      return unauthorized(reply);
    }

    try {
      await prisma.staff.update({
        where: { id: staff.id },
        data: { passwordHash: await hashPassword(password) },
      });
    } catch (err: unknown) {
      if (!isPasswordHashColumnError(err)) {
        throw err;
      }
    }

    return {
      user: staff,
    };
  });
}
