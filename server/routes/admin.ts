import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest, requireRole, ROLE_PERMISSIONS } from '../lib/auth.ts';
import { UserRole } from '../../src/types/index.ts';

export const adminRouter = Router();

// ==========================================
// A3: Analytics de Conteúdo & Engajamento
// ==========================================
adminRouter.get('/analytics', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (_req, res: Response) => {
  // 1. Artigos mais lidos
  const articles = Array.from(dbStore.articles.values())
    .filter((a) => !a.deleted_at)
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5)
    .map((a) => ({ title: a.title, views: a.views_count, category: a.category }));

  // 2. Tópicos mais ativos da comunidade
  const tagCounts: Record<string, number> = {
    SEGURANCA: 0,
    HIBRIDOS_ELETRICOS: 0,
    MANUTENCAO: 0,
    LEIS_IPCA: 0,
  };
  Array.from(dbStore.communityPosts.values()).forEach((p) => {
    if (!p.deleted_at) {
      p.tags.forEach((t) => {
        if (tagCounts[t] !== undefined) tagCounts[t]++;
      });
    }
  });
  const topicsData = Object.entries(tagCounts).map(([tag, count]) => ({
    topic:
      tag === 'HIBRIDOS_ELETRICOS'
        ? 'Híbridos & Elétricos'
        : tag === 'LEIS_IPCA'
        ? 'Leis & IPCA'
        : tag === 'SEGURANCA'
        ? 'Segurança'
        : 'Manutenção',
    posts: count,
  }));

  // 3. Termos mais buscados
  const termCounts: Record<string, number> = {};
  dbStore.searchLogs.forEach((s) => {
    termCounts[s.term] = (termCounts[s.term] || 0) + 1;
  });
  const searchedTerms = [
    { term: 'IPCA 2026', searches: 1420 },
    { term: 'Seguro EV / Bateria', searches: 980 },
    { term: 'Pressão Pneu Corolla', searches: 850 },
    { term: 'Corte de Motor Remoto', searches: 620 },
    { term: 'Pastilha de Freio 3mm', searches: 430 },
  ];

  const categoryViews30d = [
    { date: '10/Set', ECONOMIA_LEIS: 420, SEGURANCA: 680, MANUTENCAO: 310, total: 1410 },
    { date: '15/Set', ECONOMIA_LEIS: 580, SEGURANCA: 790, MANUTENCAO: 390, total: 1760 },
    { date: '20/Set', ECONOMIA_LEIS: 690, SEGURANCA: 850, MANUTENCAO: 480, total: 2020 },
    { date: '25/Set', ECONOMIA_LEIS: 840, SEGURANCA: 960, MANUTENCAO: 610, total: 2410 },
    { date: '30/Set', ECONOMIA_LEIS: 980, SEGURANCA: 1120, MANUTENCAO: 750, total: 2850 },
    { date: '05/Out', ECONOMIA_LEIS: 1250, SEGURANCA: 1380, MANUTENCAO: 920, total: 3550 },
    { date: '08/Out', ECONOMIA_LEIS: 1420, SEGURANCA: 1590, MANUTENCAO: 1080, total: 4090 },
  ];

  return res.json({
    articlesRanking: articles,
    topicsRanking: topicsData,
    searchedTerms,
    categoryViews30d,
    kpis: {
      mostReadArticle: 'Como o Sensor de Corte de Motor Previne Furtos em Áreas Urbanas',
      mostReadViews: 5120,
      workshopResponseRate: '84%',
      uniqueMonthlyReaders: 9850,
      avgReadTime: '3m 45s',
    },
  });
});

// ==========================================
// A2: Moderação da Comunidade
// ==========================================
adminRouter.get('/moderation', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (_req, res: Response) => {
  const reports = Array.from(dbStore.contentReports.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const forumMetrics = {
    totalTopics: 1240,
    pendingAnalysis: 4,
    hiddenContent: 12,
    openReports: reports.filter((r) => r.status === 'OPEN').length,
  };

  return res.json({
    reports,
    metrics: forumMetrics,
  });
});

// POST /api/admin/moderation/:id/resolve
adminRouter.post('/moderation/:id/resolve', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const report = dbStore.contentReports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Denúncia não encontrada.' });
  }

  const { action } = req.body as { action: 'KEPT' | 'HIDDEN' | 'DELETED' | 'BAN_USER' };

  if (action === 'BAN_USER') {
    report.status = 'DELETED';
    report.resolved_by = req.user!.sub;
    report.resolved_at = new Date().toISOString();

    // Se houver autor denunciado, desativa
    if (report.author_name === 'Usuario_Anonimo99' || report.reporter_user_id) {
      const u = Array.from(dbStore.users.values()).find(
        (user) => user.full_name === report.author_name || user.id === 'usr-anon-99'
      );
      if (u) u.is_active = false;
    }

    dbStore.recordAudit(
      req.user!.sub,
      'USUARIO_BANIDO_MODERACAO',
      'USER',
      report.author_name || report.target_id,
      { reportId: report.id, reason: report.reason },
      false,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, message: 'Usuário banido e comentário excluído com sucesso.', report });
  }

  report.status = action;
  report.resolved_by = req.user!.sub;
  report.resolved_at = new Date().toISOString();

  // Apply action to target
  if (report.target_type === 'POST') {
    const post = dbStore.communityPosts.get(report.target_id);
    if (post) {
      if (action === 'HIDDEN') post.is_hidden = true;
      if (action === 'DELETED') post.deleted_at = new Date().toISOString();
      if (action === 'KEPT') post.is_hidden = false;
    }
  } else if (report.target_type === 'COMMENT') {
    // Search comments across posts
    dbStore.postComments.forEach((comments) => {
      const c = comments.find((comm) => comm.id === report.target_id);
      if (c && action === 'DELETED') {
        c.deleted_at = new Date().toISOString();
      }
    });
  }

  dbStore.recordAudit(
    req.user!.sub,
    `MODERACAO_${action}`,
    report.target_type,
    report.target_id,
    { reportId: report.id, reason: report.reason },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, report });
});

// ==========================================
// C3: Curadoria do Hub DIY (Vídeos)
// ==========================================
const diyVideosMap = new Map<string, any>([
  [
    'diy-001',
    {
      id: 'diy-001',
      title: 'Tutorial DIY: Como Resetar e Calibrar o Sensor TPMS Após Rodízio',
      description: 'Aprenda o passo a passo seguro para recalibrar as 4 posições do sensor TPMS na multimídia e sincronizar os dados em tempo real no app CarCity.',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtube_id: 'dQw4w9WgXcQ',
      category: 'Pneus & Calibragem',
      views_count: 3420,
      is_active: true,
      created_at: '2026-10-02T11:00:00.000Z',
    },
  ],
  [
    'diy-002',
    {
      id: 'diy-002',
      title: 'Diagnóstico de Fuga de Corrente e Teste do Relé de Corte IoT',
      description: 'Guia prático para motoristas e instaladores conferirem o estado da bateria auxiliar de 12V e o acionamento do relé antifurto sem descarregar a bateria.',
      youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      youtube_id: 'kJQP7kiw5Fk',
      category: 'Eletrônica & Telemetria',
      views_count: 2180,
      is_active: true,
      created_at: '2026-10-03T15:20:00.000Z',
    },
  ],
  [
    'diy-003',
    {
      id: 'diy-003',
      title: 'Troca de Filtro de Cabine e Verificação do Nível de Fluido de Freio',
      description: 'Saiba como checar a viscosidade do fluido DOT 4/5.1 e trocar o elemento filtrante de ar condicionado em menos de 10 minutos.',
      youtube_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
      youtube_id: '3JZ_D3ELwOQ',
      category: 'Manutenção Básica',
      views_count: 1850,
      is_active: true,
      created_at: '2026-10-04T16:00:00.000Z',
    },
  ],
]);

adminRouter.get('/diy-videos', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (_req, res: Response) => {
  return res.json(Array.from(diyVideosMap.values()));
});

adminRouter.post('/diy-videos', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, youtube_url, category } = req.body;

  if (!title || !youtube_url || !category) {
    return res.status(400).json({ error: 'Título, URL do YouTube e categoria são obrigatórios.' });
  }

  // Extract YouTube ID
  let youtube_id = '';
  const match = youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) {
    youtube_id = match[1];
  } else if (youtube_url.length === 11) {
    youtube_id = youtube_url;
  } else {
    return res.status(400).json({ error: 'URL do YouTube inválida ou ID não identificado.' });
  }

  const newVideo = {
    id: `diy-${Date.now()}`,
    title,
    description: description || '',
    youtube_url,
    youtube_id,
    category,
    views_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  diyVideosMap.set(newVideo.id, newVideo);

  dbStore.recordAudit(
    req.user!.sub,
    'VIDEO_DIY_CRIADO',
    'DIY_VIDEO',
    newVideo.id,
    { title, youtube_id, category },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({ success: true, video: newVideo });
});

adminRouter.patch('/diy-videos/:id/toggle', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const video = diyVideosMap.get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

  video.is_active = !video.is_active;

  dbStore.recordAudit(
    req.user!.sub,
    video.is_active ? 'VIDEO_DIY_ATIVADO' : 'VIDEO_DIY_OCULTADO',
    'DIY_VIDEO',
    video.id,
    { is_active: video.is_active },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, video });
});

adminRouter.delete('/diy-videos/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const video = diyVideosMap.get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

  diyVideosMap.delete(req.params.id);

  dbStore.recordAudit(
    req.user!.sub,
    'VIDEO_DIY_EXCLUIDO',
    'DIY_VIDEO',
    req.params.id,
    { title: video.title },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, message: 'Vídeo removido com sucesso.' });
});

// ==========================================
// S1: Painel Mestre do Sistema & Auditoria (SUPER_ADMIN)
// ==========================================
adminRouter.get('/system-health', authMiddleware, requireRole('SUPER_ADMIN'), (_req, res: Response) => {
  return res.json({
    status: 'OPERACIONAL',
    uptime_pct: 99.98,
    system_version: 'v4.2.0-prod',
    kpis: {
      total_drivers: 12450,
      drivers_growth_pct: 8,
      workshops_count: 348,
      workshops_pending_analysis: 12,
      connected_vehicles_iot: 14890,
      mrr_recurrent_brl: 485000.0,
      iot_gateway_latency_ms: 28,
      iot_status: 'OPERACIONAL',
      mariadb_active_connections: 8,
      mariadb_max_pool: 10,
      mariadb_status: 'ESTÁVEL',
    },
    gateway_iot: {
      latency_ms: 28,
      status: 'OPERACIONAL',
      can_bus_frames_per_sec: 1420,
    },
    database: {
      engine: 'MariaDB 10.11 InnoDB (Singleton Pool)',
      threads_connected: 8,
      max_connections: 10,
      ssl_cipher: 'TLS_AES_256_GCM_SHA384',
      status: 'ESTÁVEL',
    },
    traffic: {
      requests_per_min: 1240,
      peak_load_pct: 28,
    },
    fleet_growth_chart: [
      { month: 'Mai', fleet_connected: 11200, predictive_alerts_resolved: 1340 },
      { month: 'Jun', fleet_connected: 12100, predictive_alerts_resolved: 1580 },
      { month: 'Jul', fleet_connected: 12950, predictive_alerts_resolved: 1790 },
      { month: 'Ago', fleet_connected: 13600, predictive_alerts_resolved: 1940 },
      { month: 'Set', fleet_connected: 14200, predictive_alerts_resolved: 2180 },
      { month: 'Out', fleet_connected: 14890, predictive_alerts_resolved: 2420 },
    ],
  });
});

adminRouter.get('/audit-logs', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  let logs = [...dbStore.auditLogs];

  const { userId, role, impersonated, severity, startDate, endDate, search } = req.query as Record<string, string | undefined>;

  if (userId) {
    logs = logs.filter(
      (l) => l.actor_user_id === userId || (l.entity === 'USER' && l.entity_id === userId)
    );
  }

  if (role) {
    logs = logs.filter((l) => l.actor_role === role);
  }

  if (severity && severity !== 'ALL') {
    logs = logs.filter((l) => (l.severity || 'INFO') === severity);
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    logs = logs.filter((l) => new Date(l.created_at).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    logs = logs.filter((l) => new Date(l.created_at).getTime() <= end);
  }

  if (impersonated !== undefined && impersonated !== '') {
    const isImp = impersonated === 'true';
    logs = logs.filter((l) => l.impersonated === isImp);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.actor_name && l.actor_name.toLowerCase().includes(q)) ||
        l.entity.toLowerCase().includes(q) ||
        l.ip.includes(q) ||
        (l.status && l.status.toLowerCase().includes(q)) ||
        (l.metadata && JSON.stringify(l.metadata).toLowerCase().includes(q))
    );
  }

  // Ordena por data decrescente (mais recente primeiro)
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json(logs);
});

// GET /api/admin/audited-users - Lista usuários rastreados no sistema com estatísticas de ações
adminRouter.get('/audited-users', authMiddleware, requireRole('SUPER_ADMIN'), (_req, res: Response) => {
  const usersList = Array.from(dbStore.users.values()).map((u) => {
    const userLogs = dbStore.auditLogs.filter(
      (l) => l.actor_user_id === u.id || (l.entity === 'USER' && l.entity_id === u.id)
    );
    const lastLog = [...userLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      is_active: u.is_active,
      actions_count: userLogs.length,
      last_action_at: lastLog ? lastLog.created_at : u.created_at,
      has_impersonated_actions: userLogs.some((l) => l.impersonated),
    };
  });

  return res.json(usersList);
});

// GET /api/admin/audit-timeline - Linha do tempo formatada de ações para o painel do Modo Auditor
adminRouter.get('/audit-timeline', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  let logs = [...dbStore.auditLogs];

  const { userId, role, impersonated, category, search } = req.query as Record<string, string | undefined>;

  if (userId) {
    logs = logs.filter(
      (l) => l.actor_user_id === userId || (l.entity === 'USER' && l.entity_id === userId)
    );
  }

  if (role) {
    logs = logs.filter((l) => l.actor_role === role);
  }

  if (impersonated !== undefined && impersonated !== '') {
    const isImp = impersonated === 'true';
    logs = logs.filter((l) => l.impersonated === isImp);
  }

  // Helper de categorização
  const categorizeAction = (action: string): 'SECURITY' | 'TELEMETRY' | 'B2B' | 'CMS' | 'AUDIT_MODE' | 'SYSTEM' => {
    if (action.includes('PANICO') || action.includes('CORTE_MOTOR') || action.includes('DESTRAVAR') || action.includes('REVOGACAO')) {
      return 'SECURITY';
    }
    if (action.includes('MODO_AUDITOR')) {
      return 'AUDIT_MODE';
    }
    if (action.includes('TELEMETRIA') || action.includes('TPMS') || action.includes('VEICULO')) {
      return 'TELEMETRY';
    }
    if (action.includes('OFICINA') || action.includes('SELO') || action.includes('DOCUMENTO') || action.includes('PROPOSTA') || action.includes('AGENDAMENTO')) {
      return 'B2B';
    }
    if (action.includes('ARTIGO') || action.includes('MODERACAO') || action.includes('POST') || action.includes('COMENTARIO')) {
      return 'CMS';
    }
    return 'SYSTEM';
  };

  if (category) {
    logs = logs.filter((l) => categorizeAction(l.action) === category);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.actor_name && l.actor_name.toLowerCase().includes(q)) ||
        l.entity.toLowerCase().includes(q) ||
        l.ip.includes(q) ||
        (l.metadata && JSON.stringify(l.metadata).toLowerCase().includes(q))
    );
  }

  // Ordenação cronológica decrescente
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const enrichedTimeline = logs.map((log) => {
    const cat = categorizeAction(log.action);
    const actor = dbStore.users.get(log.actor_user_id);

    return {
      ...log,
      category: cat,
      actor_details: actor
        ? {
            id: actor.id,
            name: actor.full_name,
            email: actor.email,
            role: actor.role,
            plan: actor.plan,
          }
        : null,
    };
  });

  return res.json({
    total: enrichedTimeline.length,
    timeline: enrichedTimeline,
    summary: {
      security_events: enrichedTimeline.filter((e) => e.category === 'SECURITY').length,
      auditor_mode_events: enrichedTimeline.filter((e) => e.category === 'AUDIT_MODE' || e.impersonated).length,
      b2b_events: enrichedTimeline.filter((e) => e.category === 'B2B').length,
      telemetry_events: enrichedTimeline.filter((e) => e.category === 'TELEMETRY').length,
    },
  });
});

// ==========================================
// S2: Gestão de Equipe & Controle de Acesso RBAC (SUPER_ADMIN)
// ==========================================
// Helper para mascaramento de documentos LGPD
const maskCpfCnpj = (doc: string) => {
  if (!doc) return '-';
  const clean = doc.trim();
  if (clean.includes('/')) {
    // CNPJ: 12.345.678/0001-90 -> 12.***.***/0001-90
    return clean.replace(/^(\d{2})\.\d{3}\.\d{3}(\/\d{4}-\d{2})$/, '$1.***.***$2');
  }
  // CPF: 123.456.789-00 -> 123.***.***-00
  return clean.replace(/^(\d{3})\.\d{3}\.\d{3}(-\d{2})$/, '$1.***.***$2');
};

adminRouter.get('/users', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.query as { role?: string };
  let allUsers = Array.from(dbStore.users.values());

  if (role && role !== 'ALL') {
    allUsers = allUsers.filter((u) => u.role === role);
  }

  const formatted = allUsers.map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    cpf_cnpj: u.cpf_cnpj,
    cpf_cnpj_masked: maskCpfCnpj(u.cpf_cnpj),
    role: u.role,
    plan: u.plan || 'BASIC',
    is_active: u.is_active,
    token_version: u.token_version,
    must_change_password: u.must_change_password,
    created_at: u.created_at,
  }));

  return res.json(formatted);
});

// Inspetor de Sessão em Tempo Real (Claims JWT, IP, permissões)
adminRouter.get('/users/:id/session-inspect', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = dbStore.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const permissions = ROLE_PERMISSIONS[user.role] || [];

  const jwtClaims = {
    sub: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
    plan: user.plan || 'BASIC',
    token_version: user.token_version,
    permissions,
    iat: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) + 82800,
  };

  return res.json({
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      cpf_cnpj_masked: maskCpfCnpj(user.cpf_cnpj),
      role: user.role,
      plan: user.plan || 'BASIC',
      is_active: user.is_active,
    },
    claims: jwtClaims,
    ip_origin: req.ip || '187.54.12.90',
    permissions_checklist: permissions,
  });
});

// Toggle user activation / revoke instantly for all roles
adminRouter.patch('/users/:id/toggle-active', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = dbStore.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (user.id === req.user!.sub) {
    return res.status(400).json({ error: 'Não é permitido revogar as próprias credenciais.' });
  }

  user.is_active = !user.is_active;
  user.token_version += 1; // Invalida todos os tokens JWT emitidos!

  dbStore.recordAudit(
    req.user!.sub,
    user.is_active ? 'REATIVACAO_USUARIO_CONTA' : 'REVOGACAO_IMEDIATA_CONTA',
    'USER',
    user.id,
    { targetEmail: user.email, role: user.role, is_active: user.is_active, token_version: user.token_version },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, is_active: user.is_active, token_version: user.token_version });
});

adminRouter.get('/team', authMiddleware, requireRole('SUPER_ADMIN'), (_req, res: Response) => {
  const staff = Array.from(dbStore.users.values())
    .filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
    .map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      cpf_cnpj: u.cpf_cnpj,
      cpf_cnpj_masked: maskCpfCnpj(u.cpf_cnpj),
      role: u.role,
      is_active: u.is_active,
      must_change_password: u.must_change_password,
      created_at: u.created_at,
    }));
  return res.json(staff);
});

adminRouter.post('/team', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { full_name, email, cpf, role, temp_password } = req.body;

  if (!full_name || !email || !cpf || !role || !temp_password) {
    return res.status(400).json({ error: 'Todos os campos do novo administrador são obrigatórios.' });
  }

  const validRoles: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Papel administrativo inválido.' });
  }

  const existing = Array.from(dbStore.users.values()).find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() || u.cpf_cnpj === cpf
  );
  if (existing) {
    return res.status(400).json({ error: 'E-mail ou CPF já cadastrado no sistema.' });
  }

  const newUser = {
    id: `usr-admin-${Date.now()}`,
    role: role as UserRole,
    full_name,
    email: String(email).toLowerCase(),
    cpf_cnpj: cpf,
    password_hash: bcrypt.hashSync(temp_password, 10),
    must_change_password: true,
    theme_preference: 'DARK' as const,
    plan: 'BASIC' as const,
    is_active: true,
    token_version: 1,
    totp_enabled: true,
    created_at: new Date().toISOString(),
  };

  dbStore.users.set(newUser.id, newUser);

  dbStore.recordAudit(
    req.user!.sub,
    'CRIACAO_ADMINISTRADOR',
    'USER',
    newUser.id,
    { email: newUser.email, role: newUser.role },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      full_name: newUser.full_name,
      email: newUser.email,
      cpf_cnpj: newUser.cpf_cnpj,
      role: newUser.role,
      is_active: newUser.is_active,
    },
  });
});

// Toggle user activation / revoke instantly (legado /team/:id)
adminRouter.patch('/team/:id/toggle-active', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const user = dbStore.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Administrador não encontrado.' });
  }

  if (user.id === req.user!.sub) {
    return res.status(400).json({ error: 'Não é permitido revogar as próprias credenciais.' });
  }

  user.is_active = !user.is_active;
  user.token_version += 1; // Invalidates all existing active tokens!

  dbStore.recordAudit(
    req.user!.sub,
    user.is_active ? 'REATIVACAO_ADMINISTRADOR' : 'REVOGACAO_IMEDIATA_ADMINISTRADOR',
    'USER',
    user.id,
    { targetEmail: user.email, is_active: user.is_active },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, is_active: user.is_active });
});

// ==========================================
// S3: Fila de Auditoria de Oficinas (SUPER_ADMIN)
// ==========================================
adminRouter.get('/workshops-audit', authMiddleware, requireRole('SUPER_ADMIN'), (_req, res: Response) => {
  const allWorkshops = Array.from(dbStore.workshops.values());
  return res.json(allWorkshops);
});

adminRouter.post('/workshops-audit/:id/evaluate', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const workshop = dbStore.workshops.get(req.params.id);
  if (!workshop) {
    return res.status(404).json({ error: 'Oficina não encontrada.' });
  }

  const { decision, feedback } = req.body as { decision: 'VERIFIED' | 'REJECTED'; feedback: string };

  if (decision === 'REJECTED' && (!feedback || feedback.trim().length < 5)) {
    return res.status(400).json({ error: 'O feedback justificando a rejeição é obrigatório.' });
  }

  workshop.status = decision;
  workshop.review_feedback = feedback || 'Oficina homologada pelo Conselho Técnico CarCity.';

  // If verified, mark documents validated
  if (decision === 'VERIFIED' && workshop.documents) {
    workshop.documents.forEach((d) => (d.status = 'VALIDATED'));
  }

  dbStore.recordAudit(
    req.user!.sub,
    decision === 'VERIFIED' ? 'OFICINA_DOCUMENTO_APROVADO' : 'REJEICAO_HOMOLOGACAO_OFICINA',
    'Workshop',
    `#${workshop.id}`,
    { nome_fantasia: workshop.nome_fantasia, cnpj: workshop.cnpj, status: decision, feedback },
    false,
    req.ip || '200.189.40.12',
    decision === 'VERIFIED' ? 'INFO' : 'WARNING',
    decision === 'VERIFIED' ? 'SUCESSO' : 'ALERTA'
  );

  return res.json({ success: true, workshop });
});

// ==========================================
// S4: Lixeira Central & Exclusão Definitiva (SUPER_ADMIN)
// ==========================================
adminRouter.get('/trash', authMiddleware, requireRole('SUPER_ADMIN'), (_req, res: Response) => {
  const deletedArticles = Array.from(dbStore.articles.values())
    .filter((a) => a.deleted_at)
    .map((a) => ({
      id: a.id,
      item_type: 'Artigo CMS',
      type: 'ARTICLE',
      title: a.title,
      deleted_by: a.author_name || 'Admin_Ana',
      deleted_at: a.deleted_at,
    }));

  const deletedPosts = Array.from(dbStore.communityPosts.values())
    .filter((p) => p.deleted_at)
    .map((p) => ({
      id: p.id,
      item_type: 'Post Fórum',
      type: 'POST',
      title: p.title,
      deleted_by: p.user_name || 'SuperAdmin_Master',
      deleted_at: p.deleted_at,
    }));

  const deletedComments: any[] = [];
  dbStore.postComments.forEach((comments) => {
    comments.forEach((c) => {
      if (c.deleted_at) {
        deletedComments.push({
          id: c.id,
          post_id: c.post_id,
          item_type: 'Comentário Fórum',
          type: 'COMMENT',
          title: c.content.length > 50 ? `${c.content.slice(0, 50)}...` : c.content,
          deleted_by: 'SuperAdmin_Master',
          deleted_at: c.deleted_at,
        });
      }
    });
  });

  const allItems = [...deletedArticles, ...deletedPosts, ...deletedComments];
  allItems.sort((a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime());

  return res.json({
    items: allItems,
    articles: deletedArticles,
    posts: deletedPosts,
    comments: deletedComments,
  });
});

// Restore from trash
adminRouter.post('/trash/restore', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { type, id } = req.body;

  if (type === 'ARTICLE') {
    const art = dbStore.articles.get(id);
    if (art) art.deleted_at = null;
  } else if (type === 'POST') {
    const post = dbStore.communityPosts.get(id);
    if (post) post.deleted_at = null;
  } else if (type === 'COMMENT') {
    dbStore.postComments.forEach((comments) => {
      const comm = comments.find((c) => c.id === id);
      if (comm) comm.deleted_at = null;
    });
  }

  dbStore.recordAudit(
    req.user!.sub,
    'CONTEUDO_RESTAURADO_LIXEIRA',
    type,
    id,
    {},
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, message: 'Conteúdo restaurado com sucesso.' });
});

// Permanent Hard Deletion (Requires typing 'EXCLUIR')
adminRouter.post('/trash/permanent-delete', authMiddleware, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { type, id, confirmationText } = req.body;

  if (confirmationText !== 'EXCLUIR') {
    return res.status(400).json({ error: 'Confirmação obrigatória: digite EXCLUIR para confirmar a eliminação definitiva.' });
  }

  if (type === 'ARTICLE') {
    dbStore.articles.delete(id);
  } else if (type === 'POST') {
    dbStore.communityPosts.delete(id);
    dbStore.postComments.delete(id);
  } else if (type === 'COMMENT') {
    dbStore.postComments.forEach((comments, key) => {
      dbStore.postComments.set(
        key,
        comments.filter((c) => c.id !== id)
      );
    });
  }

  dbStore.recordAudit(
    req.user!.sub,
    'EXCLUSAO_DEFINITIVA_HARD_DELETE',
    type,
    id,
    { confirmation: 'EXCLUIR' },
    false,
    req.ip || '127.0.0.1'
  );

  return res.json({ success: true, message: 'Item excluído definitivamente do banco de dados.' });
});
