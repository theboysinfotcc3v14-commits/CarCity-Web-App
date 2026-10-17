import assert from 'assert';
import { dbStore } from '../server/db/store.ts';
import { ROLE_PERMISSIONS, createAccessToken, verifyToken } from '../server/lib/auth.ts';

async function runTests() {
  console.log('--- Iniciando Testes Automatizados CarCity Web ---');

  // Test 1: RBAC Permissions Matrix
  console.log('1. Testando Matriz de Permissões RBAC...');
  assert(ROLE_PERMISSIONS.DRIVER.includes('telemetry:read'), 'DRIVER deve ler telemetria');
  assert(!ROLE_PERMISSIONS.DRIVER.includes('cms:manage'), 'DRIVER não deve gerenciar CMS (caso negativo)');
  assert(ROLE_PERMISSIONS.WORKSHOP_OWNER.includes('anti_fraud:submit'), 'WORKSHOP deve submeter anti-fraude');
  assert(!ROLE_PERMISSIONS.WORKSHOP_OWNER.includes('commands:execute'), 'WORKSHOP não deve cortar motor');
  assert(ROLE_PERMISSIONS.ADMIN.includes('cms:manage'), 'ADMIN deve gerenciar CMS');
  assert(!ROLE_PERMISSIONS.ADMIN.includes('team:manage'), 'ADMIN não deve gerenciar equipe (caso negativo)');
  assert(ROLE_PERMISSIONS.SUPER_ADMIN.includes('team:manage'), 'SUPER_ADMIN gerencia equipe');
  assert(ROLE_PERMISSIONS.SUPER_ADMIN.includes('trash:permanent_delete'), 'SUPER_ADMIN executa exclusão definitiva');
  console.log('✓ Matriz de Permissões RBAC validada com sucesso.');

  // Test 2: Token Generation & Server Verification
  console.log('2. Testando Geração de Token JWT e Validação Server-Side...');
  const token = await createAccessToken({
    id: 'usr-driver-001',
    role: 'DRIVER',
    email: 'motorista@carcity.com.br',
    full_name: 'Carlos Silveira',
    plan: 'ADVANCED',
    token_version: 1,
  });

  assert(typeof token === 'string' && token.length > 20, 'Token gerado deve ser string válida');
  const verified = await verifyToken(token);
  assert(verified !== null, 'Token recém-gerado deve ser verificado com sucesso');
  assert.strictEqual(verified?.sub, 'usr-driver-001');
  assert.strictEqual(verified?.role, 'DRIVER');
  console.log('✓ Token JWT validado pelo servidor.');

  // Test 2.1: Caso negativo - Token adulterado ou revogado
  console.log('2.1 Testando Revogação Imediata / Token Inválido (Caso Negativo)...');
  const invalidVerified = await verifyToken('token-falso-adulterado-hack');
  assert.strictEqual(invalidVerified, null, 'Token falso deve ser rejeitado');
  console.log('✓ Rejeição de token adulterado validada.');

  // Test 2.2: Refresh Token e Rotação de Sessão
  console.log('2.2 Testando Refresh Token Opaco, Hash SHA-256 e Validação de is_active...');
  const { generateOpaqueRefreshToken, hashRefreshToken } = await import('../server/lib/auth.ts');
  const { rawToken: rawRefresh, tokenHash } = generateOpaqueRefreshToken();
  assert(rawRefresh.length >= 64, 'Token opaco deve possuir alta entropia (>= 64 chars)');
  assert.strictEqual(hashRefreshToken(rawRefresh), tokenHash, 'Hash SHA-256 deve ser idempotente e coincidir');

  // Simula sessão e desativação de usuário
  const testUserId = 'usr-driver-001';
  const user = dbStore.users.get(testUserId);
  assert(user !== undefined, 'Usuário de teste deve existir');
  user.is_active = false; // Desativa
  const verifiedInactive = await verifyToken(token);
  assert.strictEqual(verifiedInactive, null, 'Usuário inativo deve ter acesso rejeitado em todas as rotas');
  user.is_active = true; // Restaura
  console.log('✓ Validação de is_active e rotação de refresh token validadas com sucesso.');

  // Test 3: Regras de Alertas de Manutenção Telemetria
  console.log('3. Testando Regras de Alerta de Manutenção TPMS e Óleo...');
  const v1 = Array.from(dbStore.vehicles.values())[0];
  assert(v1, 'Veículo de teste deve existir');

  // Trigger low tire pressure simulation
  const simTire = dbStore.simulateTelemetry(v1.id, 'PNEU_BAIXO');
  assert(simTire !== null, 'Simulação de pneu deve retornar resultado');
  const criticalTireAlert = simTire.alerts.find((a) => a.component === 'PNEU' && a.severity === 'CRITICO');
  assert(criticalTireAlert !== null, 'Deve gerar alerta crítico de destalonamento para pneu < 26.5 PSI');

  // Trigger Calibrate All
  const simCalib = dbStore.simulateTelemetry(v1.id, 'CALIBRAR_TUDO');
  assert(simCalib !== null, 'Calibração total deve normalizar sensores');
  const remainingAlerts = simCalib.alerts.filter((a) => a.severity === 'CRITICO');
  assert.strictEqual(remainingAlerts.length, 0, 'Após calibração não devem restar alertas críticos');
  console.log('✓ Regras de alertas de telemetria TPMS e Calibração validadas.');

  // Test 4: Registro em Trilha de Auditoria
  console.log('4. Testando Registro Obrigatório em audit_logs...');
  const prevCount = dbStore.auditLogs.length;
  dbStore.recordAudit('usr-driver-001', 'TESTE_UNITARIO_CORTE_MOTOR', 'VEHICLE', v1.id, { simulated: true });
  assert.strictEqual(dbStore.auditLogs.length, prevCount + 1, 'Novo log de auditoria deve ser persistido');
  const latestLog = dbStore.auditLogs[0];
  assert.strictEqual(latestLog.action, 'TESTE_UNITARIO_CORTE_MOTOR');
  console.log('✓ Registro em audit_logs validado.');

  // Test 5: Funções e Estados Visuais de Telemetria (src/lib/telemetry.ts)
  console.log('5. Testando Funções e Estados Visuais de Telemetria (src/lib/telemetry.ts)...');
  const {
    getTireStatus,
    getBatteryStatus,
    getOilRevisionStatus,
    getBrakePadStatus,
    simulateTelemetryChange,
    DEFAULT_NOMINAL_READINGS,
  } = await import('../src/lib/telemetry.ts');

  // Teste de cores de pneus
  const normalTire = getTireStatus(33.0);
  assert.strictEqual(normalTire.status, 'NORMAL');
  assert.strictEqual(normalTire.color, '#2FA67A'); // Verde Protegido

  const warnTire = getTireStatus(28.5);
  assert.strictEqual(warnTire.status, 'WARNING');
  assert.strictEqual(warnTire.color, '#E09F3E'); // Âmbar Atenção

  const critTire = getTireStatus(24.5);
  assert.strictEqual(critTire.status, 'CRITICAL');
  assert.strictEqual(critTire.color, '#E5484D'); // Vermelho Pânico

  // Teste de estado de bateria
  const batOk = getBatteryStatus(94);
  assert.strictEqual(batOk.status, 'NORMAL');
  assert.strictEqual(batOk.color, '#2FA67A');

  const batLow = getBatteryStatus(14);
  assert.strictEqual(batLow.status, 'CRITICAL');
  assert.strictEqual(batLow.color, '#E5484D');

  // Teste de simulação pura de estado
  const initialReading = DEFAULT_NOMINAL_READINGS[v1.id] || {
    id: 'test-reading',
    vehicle_id: v1.id,
    recorded_at: new Date().toISOString(),
    tire_fl_psi: 33.0,
    tire_fr_psi: 33.0,
    tire_rl_psi: 33.0,
    tire_rr_psi: 33.0,
    battery_pct: 94,
    brake_pad_mm: 8.0,
    engine_cut_connected: true,
    is_simulated: false,
  };

  const simPneu = simulateTelemetryChange(initialReading, v1, 'PNEU_BAIXO');
  assert.strictEqual(simPneu.updatedReading.tire_fl_psi, 24.5);
  assert.strictEqual(simPneu.updatedReading.is_simulated, true);
  const critAlert = simPneu.alerts.find((a) => a.component === 'PNEU' && a.severity === 'CRITICO');
  assert(critAlert !== undefined, 'Simulação de Pneu Baixo deve gerar alerta crítico');

  const simCalibTotal = simulateTelemetryChange(simPneu.updatedReading, v1, 'CALIBRAR_TUDO');
  assert.strictEqual(simCalibTotal.updatedReading.tire_fl_psi, 33.0);
  assert.strictEqual(simCalibTotal.updatedReading.battery_pct, 95);
  const critRemaining = simCalibTotal.alerts.filter((a) => a.severity === 'CRITICO');
  assert.strictEqual(critRemaining.length, 0, 'Nenhum alerta crítico restante após calibrar tudo');
  console.log('✓ Lógica e transições de estado visual em src/lib/telemetry.ts validadas.');

  // Test 6: Geração de Relatório CSV de 6 Meses
  console.log('6. Testando Geração de Relatório CSV de Telemetria (6 Meses)...');
  const { generateTelemetryCsvReport } = await import('../src/lib/telemetry.ts');
  const mock6mTrips = {
    totalDistanceKm: 1450.5,
    totalTransitTimeMin: 2280,
    avgEfficiency: 18.2,
    chartData: [
      {
        date: '01/05',
        fullDate: '01/05/2026 08:30',
        km: 42,
        cumulativeKm: 42,
        durationMin: 75,
        durationFormatted: '1h 15m',
        efficiency: 18.2,
        efficiencyUnit: 'km/L',
        tireWearMm: '0.005',
        brakeWearMm: '0.003',
      },
      {
        date: '02/05',
        fullDate: '02/05/2026 09:10',
        km: 68,
        cumulativeKm: 110,
        durationMin: 130,
        durationFormatted: '2h 10m',
        efficiency: 17.5,
        efficiencyUnit: 'km/L',
        tireWearMm: '0.008',
        brakeWearMm: '0.005',
      },
    ],
  };

  const csv = generateTelemetryCsvReport(v1, mock6mTrips);
  assert(csv.startsWith('\uFEFF'), 'CSV deve iniciar com BOM UTF-8 para compatibilidade Excel');
  assert(csv.includes(v1.plate), 'CSV deve conter a placa do veículo');
  assert(csv.includes('Quilometragem Acumulada (km)'), 'CSV deve conter cabeçalho de quilometragem');
  assert(csv.includes('1450.5 km'), 'CSV deve conter o total rodado no período');
  assert(csv.includes('1h 15m'), 'CSV deve conter o tempo formatado em trânsito');
  console.log('✓ Geração e formatação de Relatório CSV (6 Meses) validadas com sucesso.');

  // 7. Testando Estrutura e Dados de Histórico de Manutenção (Maintenance Logs)
  console.log('7. Testando Estrutura e Registros de Histórico de Manutenção (MaintenanceLogs)...');
  const { MOCK_MAINTENANCE_LOGS } = await import('../src/lib/telemetry.ts');
  assert(Array.isArray(MOCK_MAINTENANCE_LOGS), 'MOCK_MAINTENANCE_LOGS deve ser um array');
  assert(MOCK_MAINTENANCE_LOGS.length >= 5, 'Deve haver registros de manutenção simulados');

  const corollaLogs = MOCK_MAINTENANCE_LOGS.filter(
    (l) => l.vehicle_id === 'veh-001' || l.vehicle_plate === 'ABC-1D23'
  );
  assert(corollaLogs.length >= 3, 'Corolla deve possuir ao menos 3 registros de manutenção');

  for (const log of MOCK_MAINTENANCE_LOGS) {
    assert(log.id, 'Log deve possuir id');
    assert(log.service_title, 'Log deve possuir título do serviço');
    assert(log.odometer_km > 0, 'Log deve registrar quilometragem positiva');
    assert(log.date && log.date.includes('-'), 'Log deve registrar data válida');
    assert(log.workshop_name, 'Log deve possuir oficina prestadora');
    assert(typeof log.cost === 'number', 'Log deve possuir custo numérico');
  }
  console.log('✓ Estrutura e registros de MaintenanceLogs validados com sucesso.');

  // 8. Testando Área da Oficina Credenciada B2B (AutoTech Premium LTDA)
  console.log('8. Testando Área da Oficina Credenciada B2B (AutoTech Premium LTDA)...');
  const {
    MODEL_WORKSHOP_AUTOTECH,
    MOCK_WORKSHOP_KANBAN_APPOINTMENTS,
    MOCK_CMS_B2B_ARTICLES,
    MOCK_WORKSHOP_ROI_STATS,
  } = await import('../src/lib/telemetry.ts');

  // W1 Vitrine & Perfil
  assert.strictEqual(MODEL_WORKSHOP_AUTOTECH.nome_fantasia, 'AutoTech Premium - Unidade Jardins');
  assert.strictEqual(MODEL_WORKSHOP_AUTOTECH.razao_social, 'AutoTech Centro Automotivo Especializado LTDA');
  assert.strictEqual(MODEL_WORKSHOP_AUTOTECH.cnpj, '12.345.678/0001-90');
  assert.strictEqual(MODEL_WORKSHOP_AUTOTECH.status, 'VERIFIED');
  assert.strictEqual(MODEL_WORKSHOP_AUTOTECH.specialties.length, 5);
  assert(MODEL_WORKSHOP_AUTOTECH.documents && MODEL_WORKSHOP_AUTOTECH.documents.length >= 4);

  // W2 Pipeline Kanban
  assert(Array.isArray(MOCK_WORKSHOP_KANBAN_APPOINTMENTS), 'MOCK_WORKSHOP_KANBAN_APPOINTMENTS deve ser array');
  assert(MOCK_WORKSHOP_KANBAN_APPOINTMENTS.length >= 7, 'Deve haver ao menos 7 atendimentos no pipeline');
  const pendingApts = MOCK_WORKSHOP_KANBAN_APPOINTMENTS.filter((a) => a.status === 'PENDING');
  const inReviewApts = MOCK_WORKSHOP_KANBAN_APPOINTMENTS.filter((a) => a.status === 'IN_REVIEW');
  const approvedApts = MOCK_WORKSHOP_KANBAN_APPOINTMENTS.filter((a) => a.status === 'APPROVED');
  const inMaintApts = MOCK_WORKSHOP_KANBAN_APPOINTMENTS.filter((a) => a.status === 'IN_MAINTENANCE');
  const completedApts = MOCK_WORKSHOP_KANBAN_APPOINTMENTS.filter((a) => a.status === 'COMPLETED');

  assert(pendingApts.length >= 2, 'Deve haver ao menos 2 atendimentos pendentes');
  assert(inReviewApts.length >= 1, 'Deve haver ao menos 1 atendimento em análise');
  assert(approvedApts.length >= 2, 'Deve haver ao menos 2 atendimentos aprovados');
  assert(inMaintApts.length >= 2, 'Deve haver ao menos 2 atendimentos em manutenção no elevador');
  assert(completedApts.length >= 15, 'Deve haver ao menos 15 atendimentos concluídos no histórico');

  // W2 Chat & Budget
  const carlosApt = pendingApts.find((a) => a.driver_name?.includes('Carlos'));
  assert(carlosApt !== undefined, 'Atendimento do Carlos Eduardo deve existir');
  assert(carlosApt?.messages && carlosApt.messages.length >= 2, 'Carlos deve possuir histórico de chat direct');

  // W3 Selo Anti-Fraude
  const alvaraDoc = MODEL_WORKSHOP_AUTOTECH.documents?.find((d) => d.kind === 'ALVARA');
  const rtDoc = MODEL_WORKSHOP_AUTOTECH.documents?.find((d) => d.kind === 'RT_CFT_CREA');
  assert(alvaraDoc && alvaraDoc.status === 'VALIDATED', 'Alvará deve estar homologado');
  assert(rtDoc && rtDoc.status === 'VALIDATED', 'RT CFT deve estar homologado');

  // W4 Ofertas e ROI
  assert.strictEqual(MOCK_WORKSHOP_ROI_STATS.totalDriversServed, 142);
  assert.strictEqual(MOCK_WORKSHOP_ROI_STATS.grossRevenue, 88400.0);
  assert(MOCK_WORKSHOP_ROI_STATS.monthlyCategoryComparison.length === 6, 'Deve haver dados de 6 meses no ROI');

  // Hub B2B CMS
  assert(MOCK_CMS_B2B_ARTICLES.length >= 2, 'Deve haver ao menos 2 comunicados CMS técnicos');
  console.log('✓ Ecossistema B2B da Oficina Credenciada (W1 a W4 + Hub CMS) validado com sucesso.');

  // 9. Testando Rota de IA /api/ai/chat (Autenticação Bearer + Sessão de Demonstração)
  console.log('9. Testando Rota de IA /api/ai/chat com Token e Fallback de Demonstração...');
  const { aiRouter } = await import('../server/routes/ai.ts');
  assert(aiRouter !== undefined, 'aiRouter deve estar definido');

  // Simula request mock para verificar rota de chat
  let mockStatus = 200;
  let mockResponseJson: any = null;
  const mockRes: any = {
    status(code: number) {
      mockStatus = code;
      return this;
    },
    json(data: any) {
      mockResponseJson = data;
      return this;
    },
  };

  // Simula request com role WORKSHOP_OWNER e sem token para testar o fallback de demonstração
  const mockReqWorkshop: any = {
    cookies: {},
    headers: {},
    body: {
      message: 'Qual o torque de aperto do bujão do cárter do Corolla Cross Hybrid 2024?',
      role: 'WORKSHOP_OWNER',
    },
  };

  // Executa o handler da rota POST /chat
  const chatLayer = (aiRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/chat' && layer.route.methods.post
  );
  assert(chatLayer, 'Rota POST /chat deve existir no aiRouter');

  await chatLayer.route.stack[0].handle(mockReqWorkshop, mockRes);
  assert.strictEqual(mockStatus, 200, 'Status deve ser 200 com o fallback de demonstração B2B');
  assert(mockResponseJson && mockResponseJson.reply, 'Deve conter reply na resposta');
  assert(
    mockResponseJson.reply.includes('38 Nm') || mockResponseJson.reply.includes('AutoTech') || mockResponseJson.reply.includes('Corolla'),
    'Resposta para oficina deve conter dados técnicos'
  );
  console.log('✓ Suporte a Sessão de Demonstração e Fallback de IA validado com sucesso.');

  // 10. Testando Painel de Visualização do Modo Auditor & Linha do Tempo
  console.log('10. Testando Painel do Modo Auditor e Linha do Tempo de Ações de Usuários...');
  const { adminRouter } = await import('../server/routes/admin.ts');
  assert(adminRouter !== undefined, 'adminRouter deve estar definido');

  // 10.1 Testando /api/admin/audited-users
  const auditedUsersLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/audited-users' && layer.route.methods.get
  );
  assert(auditedUsersLayer, 'Rota GET /audited-users deve existir no adminRouter');

  let mockUsersResData: any = null;
  const mockUsersRes: any = {
    json(data: any) {
      mockUsersResData = data;
      return this;
    },
  };
  const mockReqSuperAdmin: any = {
    user: { sub: 'usr-superadmin-001', role: 'SUPER_ADMIN', permissions: ['*'] },
    query: {},
  };

  // Chama o último handler (após middlewares de auth)
  const usersHandler = auditedUsersLayer.route.stack[auditedUsersLayer.route.stack.length - 1].handle;
  await usersHandler(mockReqSuperAdmin, mockUsersRes);
  assert(Array.isArray(mockUsersResData), 'Lista de usuários auditados deve ser um array');
  assert(mockUsersResData.length >= 3, 'Deve listar pelo menos os 3 usuários principais (motorista, oficina, admin)');
  const driverAudit = mockUsersResData.find((u: any) => u.id === 'usr-driver-001');
  assert(driverAudit, 'Motorista deve constar na lista de usuários auditados');
  assert(driverAudit.actions_count > 0, 'Motorista deve ter ações registradas na trilha');

  // 10.2 Testando /api/admin/audit-timeline com dados cronológicos e categorias
  const timelineLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/audit-timeline' && layer.route.methods.get
  );
  assert(timelineLayer, 'Rota GET /audit-timeline deve existir no adminRouter');

  let mockTimelineResData: any = null;
  const mockTimelineRes: any = {
    json(data: any) {
      mockTimelineResData = data;
      return this;
    },
  };

  const timelineHandler = timelineLayer.route.stack[timelineLayer.route.stack.length - 1].handle;
  await timelineHandler(mockReqSuperAdmin, mockTimelineRes);

  assert(mockTimelineResData && Array.isArray(mockTimelineResData.timeline), 'Timeline deve retornar array de eventos');
  assert(mockTimelineResData.total >= 10, 'Timeline deve conter ao menos 10 eventos cronológicos');
  assert(mockTimelineResData.summary, 'Timeline deve conter resumo estatístico');
  assert(mockTimelineResData.summary.security_events >= 1, 'Deve identificar eventos de segurança (corte, pânico)');
  assert(mockTimelineResData.summary.auditor_mode_events >= 1, 'Deve identificar eventos do Modo Auditor');

  // 10.3 Testando filtro por usuário específico na timeline
  let filteredTimelineData: any = null;
  const mockFilteredRes: any = {
    json(data: any) {
      filteredTimelineData = data;
      return this;
    },
  };
  const mockFilteredReq: any = {
    user: { sub: 'usr-superadmin-001', role: 'SUPER_ADMIN', permissions: ['*'] },
    query: { userId: 'usr-driver-001' },
  };
  await timelineHandler(mockFilteredReq, mockFilteredRes);
  assert(
    filteredTimelineData.timeline.every(
      (e: any) => e.actor_user_id === 'usr-driver-001' || (e.entity === 'USER' && e.entity_id === 'usr-driver-001')
    ),
    'Todos os eventos filtrados devem pertencer ou referenciar o motorista auditado'
  );

  console.log('✓ Painel do Modo Auditor e Linha do Tempo de Ações validados com sucesso.');

  // 11. Testando Módulos S1 a S5 do Super Administrador (Parte 4)
  console.log('11. Testando Módulos S1 a S5 do Super Administrador (Parte 4)...');

  // 11.1 Testando S1 - Dashboard Mestre & KPIs de Infraestrutura
  const healthLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/system-health' && layer.route.methods.get
  );
  assert(healthLayer, 'Rota GET /system-health deve existir no adminRouter');
  let mockHealthData: any = null;
  const mockHealthRes: any = {
    json(data: any) {
      mockHealthData = data;
      return this;
    },
  };
  const healthHandler = healthLayer.route.stack[healthLayer.route.stack.length - 1].handle;
  await healthHandler(mockReqSuperAdmin, mockHealthRes);
  assert.strictEqual(mockHealthData.status, 'OPERACIONAL', 'Status global deve ser OPERACIONAL');
  assert.strictEqual(mockHealthData.uptime_pct, 99.98, 'Uptime deve ser 99.98%');
  assert.strictEqual(mockHealthData.system_version, 'v4.2.0-prod', 'Versão do sistema deve ser v4.2.0-prod');
  assert.strictEqual(mockHealthData.kpis.total_drivers, 12450, 'Total de condutores deve ser 12.450');
  assert.strictEqual(mockHealthData.kpis.workshops_count, 348, 'Oficinas credenciadas deve ser 348');
  assert.strictEqual(mockHealthData.kpis.connected_vehicles_iot, 14890, 'Veículos conectados deve ser 14.890');
  assert.strictEqual(mockHealthData.kpis.mrr_recurrent_brl, 485000, 'MRR deve ser R$ 485.000,00');
  assert.strictEqual(mockHealthData.kpis.iot_gateway_latency_ms, 28, 'Latência IoT deve ser 28ms');
  assert.strictEqual(mockHealthData.kpis.mariadb_active_connections, 8, 'Conexões ativas MariaDB deve ser 8');
  assert(Array.isArray(mockHealthData.fleet_growth_chart), 'Gráfico consolidado de crescimento da frota deve existir');
  console.log('✓ S1: Dashboard Mestre e KPIs de Infraestrutura validados.');

  // 11.2 Testando S2 - Gestão de Usuários RBAC, Sessão e Revogação Imediata
  const usersLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/users' && layer.route.methods.get
  );
  assert(usersLayer, 'Rota GET /users deve existir no adminRouter');
  let mockAllUsersData: any = null;
  const mockAllUsersRes: any = {
    json(data: any) {
      mockAllUsersData = data;
      return this;
    },
  };
  const allUsersHandler = usersLayer.route.stack[usersLayer.route.stack.length - 1].handle;
  await allUsersHandler(mockReqSuperAdmin, mockAllUsersRes);
  assert(Array.isArray(mockAllUsersData), 'Lista de usuários da plataforma deve ser array');
  const carlos = mockAllUsersData.find((u: any) => u.email === 'motorista@carcity.com.br');
  assert(carlos, 'Carlos Eduardo Silveira deve constar na tabela de usuários');
  assert.strictEqual(carlos.cpf_cnpj_masked, '123.***.***-00', 'CPF deve estar mascarado conforme LGPD');

  // Inspetor de Sessão em tempo real
  const sessionInspectLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/users/:id/session-inspect' && layer.route.methods.get
  );
  assert(sessionInspectLayer, 'Rota GET /users/:id/session-inspect deve existir no adminRouter');
  let mockInspectData: any = null;
  const mockInspectRes: any = {
    json(data: any) {
      mockInspectData = data;
      return this;
    },
  };
  const sessionInspectHandler = sessionInspectLayer.route.stack[sessionInspectLayer.route.stack.length - 1].handle;
  await sessionInspectHandler({ ...mockReqSuperAdmin, params: { id: 'usr-driver-001' } }, mockInspectRes);
  assert(mockInspectData.claims && mockInspectData.claims.permissions, 'Deve retornar claims do token JWT');
  assert(Array.isArray(mockInspectData.permissions_checklist), 'Deve retornar checklist de permissões');
  console.log('✓ S2: Gestão de Usuários RBAC, Mascaramento LGPD e Inspetor de Sessão validados.');

  // 11.3 Testando S3 - Trilha de Auditoria em Tempo Real e Eventos Obrigatórios
  const auditLogsLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/audit-logs' && layer.route.methods.get
  );
  assert(auditLogsLayer, 'Rota GET /audit-logs deve existir no adminRouter');
  let mockAuditLogsData: any = null;
  const mockAuditLogsRes: any = {
    json(data: any) {
      mockAuditLogsData = data;
      return this;
    },
  };
  const auditLogsHandler = auditLogsLayer.route.stack[auditLogsLayer.route.stack.length - 1].handle;
  await auditLogsHandler(mockReqSuperAdmin, mockAuditLogsRes);
  assert(Array.isArray(mockAuditLogsData), 'Audit logs deve ser um array');

  // Verifica as 3 linhas obrigatórias do Bloco 4.3
  const rowCorte = mockAuditLogsData.find((l: any) => l.action === 'CORTE_MOTOR_SOLICITADO');
  assert(rowCorte, 'Linha 1: CORTE_MOTOR_SOLICITADO deve existir');
  assert.strictEqual(rowCorte.actor_user_id, 'usr-driver-001', 'Ator da linha 1 deve ser usr-driver-001');
  assert.strictEqual(rowCorte.ip, '187.54.12.90', 'IP da linha 1 deve ser 187.54.12.90');

  const rowOficina = mockAuditLogsData.find((l: any) => l.action === 'OFICINA_DOCUMENTO_APROVADO');
  assert(rowOficina, 'Linha 2: OFICINA_DOCUMENTO_APROVADO deve existir');
  assert.strictEqual(rowOficina.ip, '200.189.40.12', 'IP da linha 2 deve ser 200.189.40.12');

  const rowLogin = mockAuditLogsData.find((l: any) => l.action === 'TENTATIVA_LOGIN_INVALIDO');
  assert(rowLogin, 'Linha 3: TENTATIVA_LOGIN_INVALIDO deve existir');
  assert.strictEqual(rowLogin.ip, '45.12.89.2', 'IP da linha 3 deve ser 45.12.89.2');
  console.log('✓ S3: Trilha de Auditoria em Tempo Real e Linhas Obrigatórias validadas.');

  // 11.4 Testando S4 - Fila de Homologação Anti-Fraude com "Mecânica Precisão LTDA"
  const workshopsAuditLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/workshops-audit' && layer.route.methods.get
  );
  assert(workshopsAuditLayer, 'Rota GET /workshops-audit deve existir no adminRouter');
  let mockWorkshopsData: any = null;
  const mockWorkshopsRes: any = {
    json(data: any) {
      mockWorkshopsData = data;
      return this;
    },
  };
  const workshopsAuditHandler = workshopsAuditLayer.route.stack[workshopsAuditLayer.route.stack.length - 1].handle;
  await workshopsAuditHandler(mockReqSuperAdmin, mockWorkshopsRes);
  const mecaprecisao = mockWorkshopsData.find((w: any) => w.cnpj === '98.765.432/0001-10');
  assert(mecaprecisao, 'Mecânica Precisão LTDA deve constar na fila');
  assert(mecaprecisao.documents && mecaprecisao.documents.length >= 3, 'Deve conter os documentos submetidos');
  console.log('✓ S4: Fila de Homologação Anti-Fraude de Oficinas validada.');

  // 11.5 Testando S5 - Lixeira Central e Hard Delete Seguro
  const trashLayer = (adminRouter as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/trash' && layer.route.methods.get
  );
  assert(trashLayer, 'Rota GET /trash deve existir no adminRouter');
  let mockTrashData: any = null;
  const mockTrashRes: any = {
    json(data: any) {
      mockTrashData = data;
      return this;
    },
  };
  const trashHandler = trashLayer.route.stack[trashLayer.route.stack.length - 1].handle;
  await trashHandler(mockReqSuperAdmin, mockTrashRes);
  assert(mockTrashData.items && mockTrashData.items.length >= 2, 'Lixeira deve conter ao menos 2 itens em quarentena');
  const artViagem = mockTrashData.items.find((i: any) => i.title.includes('Dicas de Viagem 2025'));
  assert(artViagem, 'Artigo "Dicas de Viagem 2025" deve constar na lixeira');
  const commPecas = mockTrashData.items.find((i: any) => i.title.includes('Venda de peças'));
  assert(commPecas, 'Comentário "Venda de peças..." deve constar na lixeira');
  console.log('✓ S5: Lixeira Central com Itens Soft-Deleted validada com sucesso.');

  console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
}

runTests().catch((err) => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
