import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest } from '../lib/auth.ts';
import { AppointmentStatus } from '../../src/types/index.ts';

export const appointmentsRouter = Router();

// GET /api/appointments - List appointments filtered by role
appointmentsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.sub;
  const role = req.user!.role;

  let list = Array.from(dbStore.appointments.values());

  if (role === 'DRIVER') {
    list = list.filter((a) => a.driver_user_id === userId);
  } else if (role === 'WORKSHOP_OWNER') {
    // Find workshop belonging to this owner
    const workshop = Array.from(dbStore.workshops.values()).find((w) => w.owner_user_id === userId);
    if (workshop) {
      list = list.filter((a) => a.workshop_id === workshop.id);
    }
  }

  // Attach messages to each
  const enriched = list.map((a) => ({
    ...a,
    messages: dbStore.appointmentMessages.get(a.id) || [],
  }));

  // Sort by updated_at descending
  enriched.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return res.json(enriched);
});

// POST /api/appointments - Create new service booking (from driver or maintenance alert)
appointmentsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { workshop_id, vehicle_id, service_summary } = req.body;

  if (!workshop_id || !vehicle_id || !service_summary) {
    return res.status(400).json({ error: 'Dados do agendamento incompletos.' });
  }

  const workshop = dbStore.workshops.get(workshop_id);
  const vehicle = dbStore.vehicles.get(vehicle_id);

  if (!workshop || !vehicle) {
    return res.status(404).json({ error: 'Oficina ou veículo não localizado.' });
  }

  // Calculate discount based on driver plan
  let discountPercent = 0;
  if (req.user!.plan === 'ADVANCED') discountPercent = 20;
  else if (req.user!.plan === 'STANDARD') discountPercent = 10;

  const newApt = {
    id: `apt-${Date.now()}`,
    driver_user_id: req.user!.sub,
    driver_name: req.user!.name,
    driver_plan: req.user!.plan,
    workshop_id: workshop.id,
    workshop_name: workshop.nome_fantasia,
    vehicle_id: vehicle.id,
    vehicle_model: `${vehicle.brand} ${vehicle.model}`,
    vehicle_plate: vehicle.plate,
    service_summary,
    status: 'PENDING' as AppointmentStatus,
    discount_percent: discountPercent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbStore.appointments.set(newApt.id, newApt);

  // Initial message
  const initialMsg = {
    id: `msg-${Date.now()}`,
    appointment_id: newApt.id,
    sender_user_id: req.user!.sub,
    sender_name: req.user!.name,
    sender_role: req.user!.role,
    body: `Solicitação de agendamento aberta via telemetria: ${service_summary}`,
    created_at: new Date().toISOString(),
  };
  dbStore.appointmentMessages.set(newApt.id, [initialMsg]);

  dbStore.recordAudit(
    req.user!.sub,
    'AGENDAMENTO_CRIADO',
    'APPOINTMENT',
    newApt.id,
    { workshop: workshop.nome_fantasia, vehicle: vehicle.plate },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({
    success: true,
    appointment: {
      ...newApt,
      messages: [initialMsg],
    },
  });
});

// PATCH /api/appointments/:id/status - Update pipeline status
appointmentsRouter.patch('/:id/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const apt = dbStore.appointments.get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const { status } = req.body as { status: AppointmentStatus };
  const validStatuses: AppointmentStatus[] = [
    'PENDING',
    'IN_REVIEW',
    'APPROVED',
    'IN_MAINTENANCE',
    'COMPLETED',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status de agendamento inválido.' });
  }

  apt.status = status;
  apt.updated_at = new Date().toISOString();

  // If completed, increment stats
  if (status === 'COMPLETED') {
    const workshop = dbStore.workshops.get(apt.workshop_id);
    if (workshop) {
      workshop.drivers_served_count = (workshop.drivers_served_count || 0) + 1;
      workshop.benefits_revenue = (workshop.benefits_revenue || 0) + 450;
    }
  }

  return res.json({ success: true, appointment: apt });
});

// POST /api/appointments/:id/messages - Chat with quotes and parts breakdown
appointmentsRouter.post('/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const apt = dbStore.appointments.get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const { body, quote_amount } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Corpo da mensagem não pode ser vazio.' });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    appointment_id: apt.id,
    sender_user_id: req.user!.sub,
    sender_name: req.user!.name,
    sender_role: req.user!.role,
    body,
    quote_amount: quote_amount ? Number(quote_amount) : null,
    created_at: new Date().toISOString(),
  };

  const msgs = dbStore.appointmentMessages.get(apt.id) || [];
  msgs.push(newMsg);
  dbStore.appointmentMessages.set(apt.id, msgs);

  apt.updated_at = new Date().toISOString();

  return res.status(201).json({ success: true, message: newMsg });
});
