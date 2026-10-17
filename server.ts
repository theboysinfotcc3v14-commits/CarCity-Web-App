import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth.ts';
import { vehiclesRouter } from './server/routes/vehicles.ts';
import { riskReportsRouter } from './server/routes/riskReports.ts';
import { workshopsRouter } from './server/routes/workshops.ts';
import { appointmentsRouter } from './server/routes/appointments.ts';
import { communityRouter } from './server/routes/community.ts';
import { articlesRouter } from './server/routes/articles.ts';
import { adminRouter } from './server/routes/admin.ts';
import { aiRouter } from './server/routes/ai.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/risk-reports', riskReportsRouter);
app.use('/api/workshops', workshopsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/community', communityRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CarCity Web Enterprise',
    version: '2.5.0-MariaDB-RBAC',
    uptime_sec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite in Dev or serve static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CarCity Web server active on port ${PORT}`);
  });
}

startServer();
