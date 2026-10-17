import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest } from '../lib/auth.ts';
import { RiskType } from '../../src/types/index.ts';

export const riskReportsRouter = Router();

// GET /api/risk-reports - List collaborative risk reports for GPS heatmap
riskReportsRouter.get('/', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const reports = Array.from(dbStore.riskReports.values());
  return res.json(reports);
});

// POST /api/risk-reports - Submit new report with LGPD consent
riskReportsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { risk_type, latitude, longitude, description, lgpd_consent } = req.body;

  if (!lgpd_consent) {
    return res.status(400).json({
      error: 'Consentimento LGPD obrigatório para coleta e compartilhamento colaborativo de localização.',
    });
  }

  if (!risk_type || latitude === undefined || longitude === undefined || !description) {
    return res.status(400).json({ error: 'Dados da ocorrência incompletos.' });
  }

  const validTypes: RiskType[] = ['FURTO', 'ROUBO', 'OUTRO'];
  if (!validTypes.includes(risk_type)) {
    return res.status(400).json({ error: 'Tipo de risco inválido.' });
  }

  const newReport = {
    id: `risk-${Date.now()}`,
    reporter_user_id: req.user!.sub,
    reporter_name: req.user!.name,
    reporter_plan: req.user!.plan,
    risk_type,
    latitude: Number(latitude),
    longitude: Number(longitude),
    description: String(description).slice(0, 500),
    created_at: new Date().toISOString(),
  };

  dbStore.riskReports.set(newReport.id, newReport);

  dbStore.recordAudit(
    req.user!.sub,
    'RELATO_RISCO_ENVIADO',
    'RISK_REPORT',
    newReport.id,
    { risk_type, latitude, longitude },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({ success: true, report: newReport });
});
