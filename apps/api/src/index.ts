import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCrudRoutes } from './routes/crud.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerKlinikRoutes } from './routes/klinik.js';
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '0.0.0.0';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
});

app.get('/api/health', async () => ({ ok: true }));

await registerAuthRoutes(app);
await registerDashboardRoutes(app);
await registerCrudRoutes(app);
await registerKlinikRoutes(app);

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
