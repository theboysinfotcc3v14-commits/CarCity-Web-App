import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest } from '../lib/auth.ts';
import { Workshop, WorkshopDocKind } from '../../src/types/index.ts';

export const workshopsRouter = Router();

// GET /api/workshops - List workshops
workshopsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const statusFilter = req.query.status as string;
  let list = Array.from(dbStore.workshops.values()).filter((w) => !w.deleted_at);

  if (statusFilter) {
    list = list.filter((w) => w.status === statusFilter);
  }

  return res.json(list);
});

// GET /api/workshops/my or /api/workshops/me - Current workshop owner's profile
const getMyWorkshop = (req: AuthenticatedRequest, res: Response) => {
  let workshop = Array.from(dbStore.workshops.values()).find(
    (w) => w.owner_user_id === req.user!.sub && !w.deleted_at
  );

  // Fallback for demo or when user role is WORKSHOP_OWNER/SUPER_ADMIN
  if (!workshop) {
    workshop =
      dbStore.workshops.get('ws-autotech-001') ||
      dbStore.workshops.get('ws-autopro-001') ||
      Array.from(dbStore.workshops.values())[0];
  }

  if (!workshop) {
    return res.status(404).json({ error: 'Nenhuma oficina vinculada a este usuário.' });
  }

  return res.json(workshop);
};

workshopsRouter.get('/my', authMiddleware, getMyWorkshop);
workshopsRouter.get('/me', authMiddleware, getMyWorkshop);

// GET /api/workshops/documents - List documents of current or demo workshop
workshopsRouter.get('/documents', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  let workshop = Array.from(dbStore.workshops.values()).find(
    (w) => w.owner_user_id === req.user!.sub && !w.deleted_at
  );
  if (!workshop) {
    workshop =
      dbStore.workshops.get('ws-autotech-001') ||
      dbStore.workshops.get('ws-autopro-001') ||
      Array.from(dbStore.workshops.values())[0];
  }
  return res.json(workshop?.documents || []);
});

// PUT /api/workshops/:id - Update workshop details (W1)
workshopsRouter.put('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const workshop = dbStore.workshops.get(req.params.id);
  if (!workshop) {
    return res.status(404).json({ error: 'Oficina não encontrada.' });
  }

  if (req.user!.role !== 'SUPER_ADMIN' && workshop.owner_user_id !== req.user!.sub) {
    return res.status(403).json({ error: 'Sem permissão para alterar esta oficina.' });
  }

  const { razao_social, nome_fantasia, address, latitude, longitude, specialties } = req.body;
  if (razao_social) workshop.razao_social = razao_social;
  if (nome_fantasia) workshop.nome_fantasia = nome_fantasia;
  if (address) workshop.address = address;
  if (latitude !== undefined) workshop.latitude = Number(latitude);
  if (longitude !== undefined) workshop.longitude = Number(longitude);
  if (Array.isArray(specialties)) workshop.specialties = specialties;

  return res.json({ success: true, workshop });
});

// POST /api/workshops/:id/documents - Upload anti-fraud verification document (W3)
workshopsRouter.post('/:id/documents', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const workshop = dbStore.workshops.get(req.params.id);
  if (!workshop) {
    return res.status(404).json({ error: 'Oficina não encontrada.' });
  }

  const { kind, file_url } = req.body as { kind: WorkshopDocKind; file_url: string };
  if (!kind || !file_url) {
    return res.status(400).json({ error: 'Tipo de documento e URL do arquivo são obrigatórios.' });
  }

  const doc = {
    id: `doc-${Date.now()}`,
    workshop_id: workshop.id,
    kind,
    file_url,
    uploaded_at: new Date().toISOString(),
    status: 'PENDING' as const,
  };

  workshop.documents = workshop.documents || [];
  workshop.documents.push(doc);
  workshop.status = 'PENDING_APPROVAL'; // Send back to verification queue

  dbStore.recordAudit(
    req.user!.sub,
    'DOCUMENTO_OFICINA_ENVIADO',
    'WORKSHOP',
    workshop.id,
    { kind, file_url },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({ success: true, document: doc, workshop });
});

// PUT /api/workshops/:id/offers - Update member discount tiers (W4)
workshopsRouter.put('/:id/offers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const workshop = dbStore.workshops.get(req.params.id);
  if (!workshop) {
    return res.status(404).json({ error: 'Oficina não encontrada.' });
  }

  const { standard_discount, advanced_discount } = req.body;
  workshop.offers = [
    {
      workshop_id: workshop.id,
      tier: 'STANDARD',
      discount_percent: Number(standard_discount) || 10,
      is_active: true,
    },
    {
      workshop_id: workshop.id,
      tier: 'ADVANCED',
      discount_percent: Number(advanced_discount) || 20,
      is_active: true,
    },
  ];

  return res.json({ success: true, offers: workshop.offers });
});
