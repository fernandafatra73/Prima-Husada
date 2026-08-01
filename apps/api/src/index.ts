import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCrudRoutes } from './routes/crud.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerKlinikRoutes } from './routes/klinik.js';
import { registerTransferRoutes } from './routes/transfer.js';
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

// Default 1MB is too small for base64-encoded logo/foto rontgen uploads.
const app = Fastify({ logger: true, bodyLimit: 16 * 1024 * 1024 });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
});

app.get('/api/health', async () => ({ ok: true }));

await registerAuthRoutes(app);
await registerDashboardRoutes(app);
await registerCrudRoutes(app);
await registerKlinikRoutes(app);
await registerTransferRoutes(app);

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
