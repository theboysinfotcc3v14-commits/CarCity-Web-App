import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest } from '../lib/auth.ts';
import { CommandType, Trip } from '../../src/types/index.ts';

export const vehiclesRouter = Router();

// GET /api/vehicles - List user's vehicles (or all for SUPER_ADMIN)
vehiclesRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.sub;
  const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';

  let list = Array.from(dbStore.vehicles.values());
  if (!isSuperAdmin) {
    list = list.filter((v) => v.user_id === userId);
  }

  // Attach latest reading and active alerts count to each vehicle
  const enriched = list.map((v) => {
    const readings = dbStore.vehicleReadings.get(v.id) || [];
    const latestReading = readings[readings.length - 1];
    const alerts = dbStore.evaluateVehicleAlerts(v.id);
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICO' && a.status === 'ACTIVE');

    return {
      ...v,
      latestReading,
      alertsCount: alerts.filter((a) => a.status === 'ACTIVE').length,
      criticalAlertsCount: criticalAlerts.length,
      hasCriticalAlert: criticalAlerts.length > 0,
    };
  });

  return res.json(enriched);
});

// GET /api/vehicles/:id - Vehicle details
vehiclesRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const vehicle = dbStore.vehicles.get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  const readings = dbStore.vehicleReadings.get(vehicle.id) || [];
  const latestReading = readings[readings.length - 1];
  const alerts = dbStore.evaluateVehicleAlerts(vehicle.id);
  const commands = dbStore.vehicleCommands.get(vehicle.id) || [];

  return res.json({
    ...vehicle,
    latestReading,
    alerts,
    recentCommands: commands.slice(-5),
  });
});

// GET /api/vehicles/:id/trips - Telemetry trips with ranges 24h, 7d, 4s, 6m and predictive analytics
vehiclesRouter.get('/:id/trips', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const vehicle = dbStore.vehicles.get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  const range = (req.query.range as string) || '7d';
  const allTrips = dbStore.trips.get(vehicle.id) || [];

  const now = Date.now();
  let timeWindowMs = 7 * 86400000; // default 7d

  switch (range) {
    case '24h':
      timeWindowMs = 24 * 3600000;
      break;
    case '7d':
      timeWindowMs = 7 * 86400000;
      break;
    case '4s':
      timeWindowMs = 28 * 86400000; // 4 weeks
      break;
    case '6m':
      timeWindowMs = 180 * 86400000; // 6 months
      break;
  }

  // Filter trips in the window
  const filteredTrips = allTrips.filter((t) => {
    const tripTime = new Date(t.started_at).getTime();
    return now - tripTime <= timeWindowMs;
  });

  // Calculate indicators
  const totalKm = filteredTrips.reduce((acc, t) => acc + t.distance_km, 0);
  const avgKm = filteredTrips.length > 0 ? totalKm / filteredTrips.length : 0;
  const peakKm = filteredTrips.length > 0 ? Math.max(...filteredTrips.map((t) => t.distance_km)) : 0;
  const totalDurationMin = filteredTrips.reduce((acc, t) => acc + t.duration_min, 0);
  const avgEfficiency =
    filteredTrips.length > 0
      ? filteredTrips.reduce((acc, t) => acc + t.efficiency, 0) / filteredTrips.length
      : 0;

  // Accumulated curve data formatting for Recharts AreaChart
  let runningKm = 0;
  const chartData = filteredTrips.map((t) => {
    runningKm += t.distance_km;
    const dateObj = new Date(t.started_at);
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formattedDayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    let dateLabel = formattedDayMonth;
    if (range === '24h') {
      dateLabel = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7d') {
      const cleanWd = weekday.replace('.', '');
      const capWd = cleanWd.charAt(0).toUpperCase() + cleanWd.slice(1);
      dateLabel = `${capWd} (${formattedDayMonth})`;
    }

    const h = Math.floor(t.duration_min / 60);
    const m = t.duration_min % 60;
    const durationFormatted = h > 0 ? `${h}h ${m}m` : `${m}m`;

    return {
      date: dateLabel,
      fullDate: `${dateLabel} - ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      km: t.distance_km,
      cumulativeKm: Math.round(runningKm * 10) / 10,
      durationMin: t.duration_min,
      durationFormatted,
      efficiency: t.efficiency,
      efficiencyUnit: vehicle.propulsion === 'ELETRICO' ? 'kWh/100 km' : 'km/L',
      tireWearMm: ((t.distance_km / 1000) * 0.12).toFixed(3),
      brakeWearMm: ((t.distance_km / 1000) * 0.08).toFixed(3),
      tripsCount: 1,
    };
  });

  // Predictive diagnostics calculations
  const tireWearEstimatedMm = (totalKm / 1000) * 0.12; // 0.12mm per 1000km
  const brakeWearEstimatedMm = (totalKm / 1000) * 0.08;
  const consumptionEstimated =
    vehicle.propulsion === 'ELETRICO'
      ? `${((totalKm * avgEfficiency) / 100).toFixed(1)} kWh consumidos`
      : `${((totalKm * avgEfficiency) / 100).toFixed(1)} Litros consumidos`;

  return res.json({
    range,
    vehiclePropulsion: vehicle.propulsion,
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    avgDistancePerTrip: Math.round(avgKm * 10) / 10,
    peakDistanceKm: Math.round(peakKm * 10) / 10,
    totalTransitTimeMin: totalDurationMin,
    avgEfficiency: Math.round(avgEfficiency * 10) / 10,
    variationVsPreviousPeriod: '+4.2%',
    predictiveDiagnostics: {
      tireWearMm: Math.round(tireWearEstimatedMm * 100) / 100,
      brakeWearMm: Math.round(brakeWearEstimatedMm * 100) / 100,
      consumptionSummary: consumptionEstimated,
      status: 'OTIMIZADO',
    },
    chartData,
  });
});

// POST /api/vehicles/:id/commands - Execute IoT command
vehiclesRouter.post('/:id/commands', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const vehicle = dbStore.vehicles.get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  // RBAC check: DRIVER can control own vehicle, SUPER_ADMIN can control any
  if (req.user!.role !== 'SUPER_ADMIN' && vehicle.user_id !== req.user!.sub) {
    return res.status(403).json({ error: 'Você não tem permissão para comandar este veículo.' });
  }

  const { command } = req.body as { command: CommandType };
  const validCommands: CommandType[] = [
    'CORTE_MOTOR',
    'TRANCAR_PORTAS',
    'MODO_PANICO_5KM',
    'ACIONAR_POLICIA_BLOQUEIO_TOTAL',
  ];

  if (!validCommands.includes(command)) {
    return res.status(400).json({ error: 'Comando IoT inválido.' });
  }

  // Sensor offline check
  if (!vehicle.engine_cut_connected && (command === 'CORTE_MOTOR' || command === 'ACIONAR_POLICIA_BLOQUEIO_TOTAL')) {
    return res.status(400).json({
      error: 'Sensor de corte de motor desconectado ou offline na ECU. Comando bloqueado por segurança.',
    });
  }

  // Execute command state mutation
  let gatewayResp = 'OK - Comando executado via barramento CAN/OBD-II';
  if (command === 'CORTE_MOTOR') {
    vehicle.engine_cut_connected = true;
    gatewayResp = 'Relé de corte de injeção ativado. Motor desativado em segurança.';
  } else if (command === 'TRANCAR_PORTAS') {
    vehicle.doors_locked = true;
    gatewayResp = 'Travamento central de portas e fechamento automático de vidros concluídos.';
  } else if (command === 'MODO_PANICO_5KM') {
    vehicle.panic_mode_active = true;
    gatewayResp = 'Cerca virtual de 5 km ancorada nas coordenadas atuais. Alerta de desvio ativado.';
  } else if (command === 'ACIONAR_POLICIA_BLOQUEIO_TOTAL') {
    vehicle.doors_locked = true;
    vehicle.panic_mode_active = true;
    gatewayResp = 'Simulação CarCity: Bloqueio total emitido. Em caso real, contate imediatamente 190.';
  }

  const newCommand = {
    id: `cmd-${Date.now()}`,
    vehicle_id: vehicle.id,
    requested_by: req.user!.sub,
    command,
    status: 'EXECUTED' as const,
    gateway_response: gatewayResp,
    created_at: new Date().toISOString(),
    executed_at: new Date().toISOString(),
  };

  const list = dbStore.vehicleCommands.get(vehicle.id) || [];
  list.push(newCommand);
  dbStore.vehicleCommands.set(vehicle.id, list);

  // Critical action recorded in audit log
  dbStore.recordAudit(
    req.user!.sub,
    `COMANDO_VEICULAR_${command}`,
    'VEHICLE',
    vehicle.id,
    {
      plate: vehicle.plate,
      model: vehicle.model,
      gatewayResponse: gatewayResp,
    },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    command: newCommand,
    vehicle,
  });
});

// POST /api/vehicles/:id/simulate - Telemetry simulator trigger
vehiclesRouter.post('/:id/simulate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const vehicle = dbStore.vehicles.get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  const { action } = req.body as {
    action: 'PNEU_BAIXO' | 'OLEO_PROXIMO' | 'BATERIA_FRACA' | 'CALIBRAR_TUDO';
  };

  const validActions = ['PNEU_BAIXO', 'OLEO_PROXIMO', 'BATERIA_FRACA', 'CALIBRAR_TUDO'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Ação de simulação inválida.' });
  }

  const result = dbStore.simulateTelemetry(vehicle.id, action);
  if (!result) {
    return res.status(500).json({ error: 'Erro ao processar simulação.' });
  }

  dbStore.recordAudit(
    req.user!.sub,
    `SIMULACAO_TELEMETRIA_${action}`,
    'VEHICLE',
    vehicle.id,
    { action, is_simulated: true },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    message: `Simulação [${action}] aplicada com sucesso na telemetria IoT.`,
    ...result,
  });
});

// POST /api/vehicles/:id/alerts/:alertId/snooze - Dismiss / Snooze alert
vehiclesRouter.post('/:id/alerts/:alertId/snooze', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const alerts = dbStore.maintenanceAlerts.get(req.params.id) || [];
  const alert = alerts.find((a) => a.id === req.params.alertId);
  if (!alert) {
    return res.status(404).json({ error: 'Alerta não encontrado.' });
  }

  alert.status = 'SNOOZED';
  alert.snoozed_until = new Date(Date.now() + 48 * 3600000).toISOString(); // 48h snooze

  return res.json({ success: true, alert });
});
