import {
  Article,
  ContentReport,
  DiyVideo,
  SearchKeywordAnalytics,
  UserRole,
  AuditLog,
  Workshop,
} from '../types/index.ts';

// ==========================================
// Types for SuperAdmin & Central Management
// ==========================================

export interface PlatformUser {
  id: string;
  full_name: string;
  email: string;
  cpf_cnpj: string;
  cpf_cnpj_masked: string;
  role: UserRole;
  plan: string;
  is_active: boolean;
  token_version: number;
  must_change_password?: boolean;
  created_at: string;
}

export interface TrashItem {
  id: string;
  item_type: 'Artigo CMS' | 'Post Fórum' | 'Comentário Fórum';
  type: 'ARTICLE' | 'POST' | 'COMMENT';
  title: string;
  deleted_by: string;
  deleted_at: string;
  original_data?: any;
}

export interface SystemHealthData {
  status: 'OPERACIONAL' | 'DEGRADADO' | 'MANUTENCAO';
  uptime_pct: number;
  system_version: string;
  kpis: {
    total_drivers: number;
    drivers_growth_pct: number;
    workshops_count: number;
    workshops_pending_analysis: number;
    connected_vehicles_iot: number;
    mrr_recurrent_brl: number;
    iot_gateway_latency_ms: number;
    iot_status: string;
    mariadb_active_connections: number;
    mariadb_max_pool: number;
    mariadb_status: string;
  };
  gateway_iot: {
    latency_ms: number;
    status: string;
    can_bus_frames_per_sec: number;
  };
  database: {
    engine: string;
    threads_connected: number;
    max_connections: number;
    ssl_cipher: string;
    status: string;
  };
  traffic: {
    requests_per_min: number;
    peak_load_pct: number;
  };
  fleet_growth_chart: {
    month: string;
    fleet_connected: number;
    predictive_alerts_resolved: number;
  }[];
}

// ==========================================
// [BLOCO 3.1 & 3.6] C1 — Editor & Notícias CMS
// ==========================================

export const INITIAL_ARTICLES_LIST: Article[] = [
  {
    id: 'art-cms-001',
    author_user_id: 'usr-admin-001',
    author_name: 'Roberto Dias (Admin CMS)',
    title: 'Novas Regras de Inspeção Veicular e Impacto no IPCA em 2026',
    slug: 'novas-regras-inspecao-veicular-impacto-ipca-2026',
    summary: 'Ajuste nas normas de emissão e diagnóstico eletrônico obrigatório reflete na composição de custos do IPCA e nas apólices de seguro.',
    content: `## Novas Diretrizes do Conselho Nacional de Trânsito para 2026
A partir de outubro de 2026, todos os veículos híbridos e a combustão passam por verificação periódica de parâmetros de telemetria OBD-II e calibração de sensores de segurança.

### 1. Impacto Financeiro e Correção de Custos
A projeção indica redução substancial de quebras inesperadas quando o motorista mantém o plano de inspeção em oficinas credenciadas. A bonificação das seguradoras parceiras atinge até 20% do prêmio anual para veículos monitorados.

### 2. O que o condutor deve apresentar
- Comprovante de calibração TPMS recente e laudo de emissões.
- Histórico digital de manutenção emitido por oficinas homologadas com o Selo Anti-Fraude CarCity.`,
    category: 'ECONOMIA_LEIS',
    status: 'PUBLISHED',
    views_count: 3450,
    audience: 'ALL',
    target_audience: ['DRIVER', 'WORKSHOP_OWNER'],
    cover_image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-10-06T10:00:00.000Z',
  },
  {
    id: 'art-cms-002',
    author_user_id: 'usr-admin-001',
    author_name: 'Engenharia Automotiva CarCity',
    title: 'Procedimento Padrão para Diagnóstico Preditivo em Baterias EV',
    slug: 'procedimento-padrao-diagnostico-preditivo-baterias-ev',
    summary: 'Protocolo de alta precisão para medição de impedância, balanceamento de módulos e segurança técnica na rede homologada B2B.',
    content: `## Protocolo Técnico de Oficina Especializada
Diretriz mandatória para oficinas credenciadas que atendem veículos elétricos e híbridos da frota CarCity.

### 1. Parâmetros de Tolerância e Resfriamento Térmico
- Temperatura do pack durante o escaneamento: 20°C a 26°C.
- Diferença máxima de tensão entre células: 15 mV.
- Resistência interna das células: tolerância inferior a 6 mΩ.

### 2. Validação do Selo Anti-Fraude
O técnico deve registrar a leitura do scanner dedicado com assinatura digital do Responsável Técnico (CFT/CREA).`,
    category: 'MANUTENCAO',
    status: 'PUBLISHED',
    views_count: 1280,
    audience: 'WORKSHOP_OWNER',
    target_audience: ['WORKSHOP_OWNER'],
    cover_image_url: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 'art-cms-003',
    author_user_id: 'usr-admin-001',
    author_name: 'Segurança & Proteção Veicular',
    title: 'Como o Sensor de Corte de Motor Previne Furtos em Áreas Urbanas',
    slug: 'como-sensor-corte-motor-previne-furtos-areas-urbanas',
    summary: 'Análise de telemetria comprova que a resposta imediata via relé eletrônico corta em 94% os riscos de transbordo e furto na cidade.',
    content: `## Eficácia Comprovada em Segurança Ativa
A imobilização telemétrica opera diretamente no circuito secundário da bomba de combustível ou gerenciamento do inversor elétrico.

### 1. Integração com o Modo Pânico 5KM
Ao disparar o comando pelo aplicativo ou detecção de invasão fora do horário configurado, a ECU recebe a ordem de desligamento gradual em caso de baixa velocidade (0 km/h) e bloqueia nova partida.

### 2. Dicas para o Condutor
- Nunca deixe o celular desbloqueado no veículo com o painel aberto.
- Cadastre contatos de emergência e utilize a discagem rápida 190 integrada no app.`,
    category: 'SEGURANCA',
    status: 'PUBLISHED',
    views_count: 5120,
    audience: 'DRIVER',
    target_audience: ['DRIVER'],
    cover_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-10-04T09:15:00.000Z',
  },
];

// ==========================================
// [BLOCO 3.2 & 3.6] C2 — Fórum & Moderação
// ==========================================

export const INITIAL_REPORTED_CONTENT: ContentReport[] = [
  {
    id: 'rep-cms-001',
    target_type: 'POST',
    target_id: 'post-corolla-freios',
    target_title_or_snippet: 'Barulho ao frear o Corolla Cross em dias chuvosos...',
    author_name: 'Carlos Eduardo',
    reporter_user_id: 'usr-mod-system',
    reporter_name: 'Auditoria Preventiva',
    reason: 'Auditoria Preventiva',
    reports_count: 0,
    status: 'OPEN',
    created_at: '2026-10-07T18:00:00.000Z',
  },
  {
    id: 'rep-cms-002',
    target_type: 'COMMENT',
    target_id: 'comm-spam-pecas',
    target_title_or_snippet: 'Vendo peças sem nota fiscal chame no zap 11-99999-0000...',
    author_name: 'Usuario_Anonimo99',
    reporter_user_id: 'usr-driver-001',
    reporter_name: 'Carlos Silveira',
    reason: 'Spam / Venda Irregular',
    reports_count: 5,
    status: 'OPEN',
    created_at: '2026-10-07T21:45:00.000Z',
  },
];

export const INITIAL_FORUM_METRICS = {
  totalTopics: 1240,
  pendingAnalysis: 4,
  hiddenContent: 12,
  openReports: 2,
};

// ==========================================
// [BLOCO 3.3 & 3.6] C3 — Curadoria Hub DIY
// ==========================================

export const INITIAL_DIY_VIDEOS: DiyVideo[] = [
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
];

// ==========================================
// [BLOCO 3.4 & 3.6] C4 — Analytics & Buscas
// ==========================================

export const INITIAL_SEARCH_KEYWORDS_ANALYTICS: SearchKeywordAnalytics[] = [
  { term: 'IPCA 2026', searches: 1420 },
  { term: 'Seguro EV / Bateria', searches: 980 },
  { term: 'Pressão Pneu Corolla', searches: 850 },
  { term: 'Corte de Motor Remoto', searches: 620 },
];

export const INITIAL_CATEGORY_VIEWS_30D = [
  { date: '10/Set', ECONOMIA_LEIS: 420, SEGURANCA: 680, MANUTENCAO: 310, total: 1410 },
  { date: '15/Set', ECONOMIA_LEIS: 580, SEGURANCA: 790, MANUTENCAO: 390, total: 1760 },
  { date: '20/Set', ECONOMIA_LEIS: 690, SEGURANCA: 850, MANUTENCAO: 480, total: 2020 },
  { date: '25/Set', ECONOMIA_LEIS: 840, SEGURANCA: 960, MANUTENCAO: 610, total: 2410 },
  { date: '30/Set', ECONOMIA_LEIS: 980, SEGURANCA: 1120, MANUTENCAO: 750, total: 2850 },
  { date: '05/Out', ECONOMIA_LEIS: 1250, SEGURANCA: 1380, MANUTENCAO: 920, total: 3550 },
  { date: '08/Out', ECONOMIA_LEIS: 1420, SEGURANCA: 1590, MANUTENCAO: 1080, total: 4090 },
];

// ==========================================
// [BLOCO 4.1 & 4.7] S1 — Infraestrutura IoT & Saúde do Sistema
// ==========================================

export const INITIAL_SYSTEM_HEALTH: SystemHealthData = {
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
};

// ==========================================
// [BLOCO 4.2 & 4.7] S2 — Gestão da Equipe & RBAC
// ==========================================

export const INITIAL_USERS: PlatformUser[] = [
  {
    id: 'usr-driver-001',
    full_name: 'Carlos Eduardo Silveira',
    email: 'motorista@carcity.com.br',
    cpf_cnpj: '123.456.789-00',
    cpf_cnpj_masked: '123.***.***-00',
    role: 'DRIVER',
    plan: 'ADVANCED',
    is_active: true,
    token_version: 1,
    must_change_password: false,
    created_at: '2026-08-09T08:00:00.000Z',
  },
  {
    id: 'usr-workshop-001',
    full_name: 'AutoTech Premium',
    email: 'contato@autotech.com.br',
    cpf_cnpj: '12.345.678/0001-90',
    cpf_cnpj_masked: '12.***.***/0001-90',
    role: 'WORKSHOP_OWNER',
    plan: 'STANDARD',
    is_active: true,
    token_version: 1,
    must_change_password: false,
    created_at: '2026-07-10T11:30:00.000Z',
  },
  {
    id: 'usr-admin-001',
    full_name: 'Ana Souza (Admin CMS)',
    email: 'ana.souza@carcity.com.br',
    cpf_cnpj: '456.789.012-11',
    cpf_cnpj_masked: '456.***.***-11',
    role: 'ADMIN',
    plan: 'BASIC',
    is_active: true,
    token_version: 1,
    must_change_password: false,
    created_at: '2026-06-10T09:15:00.000Z',
  },
  {
    id: 'usr-admin-002',
    full_name: 'Roberto Dias',
    email: 'roberto.dias@carcity.com.br',
    cpf_cnpj: '789.012.345-22',
    cpf_cnpj_masked: '789.***.***-22',
    role: 'ADMIN',
    plan: 'BASIC',
    is_active: true,
    token_version: 1,
    must_change_password: false,
    created_at: '2026-08-24T14:00:00.000Z',
  },
  {
    id: 'usr-superadmin-001',
    full_name: 'SuperAdmin Master',
    email: 'master@carcity.com.br',
    cpf_cnpj: '000.111.222-99',
    cpf_cnpj_masked: '000.***.***-99',
    role: 'SUPER_ADMIN',
    plan: 'ADVANCED',
    is_active: true,
    token_version: 1,
    must_change_password: false,
    created_at: '2026-04-11T10:00:00.000Z',
  },
];

// ==========================================
// [BLOCO 4.3 & 4.7] S3 — Trilha de Auditoria em Tempo Real
// ==========================================

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-req-001',
    actor_user_id: 'usr-driver-001',
    actor_name: 'usr-driver-001',
    actor_role: 'DRIVER',
    impersonated: false,
    action: 'CORTE_MOTOR_SOLICITADO',
    entity: 'Vehicle',
    entity_id: '#veh-001',
    metadata: {
      command: 'CORTE_MOTOR',
      protocol: 'CAN_BUS_ISO15765',
      relay_id: 'RELAY-04',
      vehicle_plate: 'ABC-1D23',
      speed_kmh: 0,
      status: 'EXECUTADO',
    },
    ip: '187.54.12.90',
    created_at: '2026-10-08T10:14:22.000Z',
    severity: 'CRITICAL',
    status: 'EXECUTADO',
  },
  {
    id: 'aud-req-002',
    actor_user_id: 'usr-superadmin-001',
    actor_name: 'SuperAdmin_Master',
    actor_role: 'SUPER_ADMIN',
    impersonated: false,
    action: 'OFICINA_DOCUMENTO_APROVADO',
    entity: 'Workshop',
    entity_id: '#wrk-001',
    metadata: {
      workshop_name: 'AutoTech Premium',
      cnpj: '12.345.678/0001-90',
      seal: 'SELO_ANTI_FRAUDE_VERIFIED',
      technician_cft: 'CFT-SP-883492',
      status: 'SUCESSO',
    },
    ip: '200.189.40.12',
    created_at: '2026-10-08T09:30:00.000Z',
    severity: 'INFO',
    status: 'SUCESSO',
  },
  {
    id: 'aud-req-003',
    actor_user_id: 'usr-unknown',
    actor_name: 'desconhecido',
    impersonated: false,
    action: 'TENTATIVA_LOGIN_INVALIDO',
    entity: 'User login',
    entity_id: 'auth-failed',
    metadata: {
      attempted_email: 'financeiro.corp@carcity.com.br',
      reason: 'Credenciais inválidas / Bloqueio preventivo por rate-limiting',
      risk_score: 92,
    },
    ip: '45.12.89.2',
    created_at: '2026-10-08T08:12:05.000Z',
    severity: 'WARNING',
    status: 'ALERTA',
  },
  {
    id: 'aud-001',
    actor_user_id: 'usr-superadmin-001',
    actor_name: 'SuperAdmin Master',
    actor_role: 'SUPER_ADMIN',
    impersonated: false,
    action: 'SISTEMA_INICIALIZADO',
    entity: 'SISTEMA',
    entity_id: 'SYSTEM-ROOT',
    metadata: { version: 'v4.2.0-prod', ssl: 'Obrigatório TLS 1.3', cluster_nodes: 3 },
    ip: '187.12.34.56',
    created_at: '2026-10-05T08:00:00.000Z',
    severity: 'INFO',
    status: 'SUCESSO',
  },
  {
    id: 'aud-002',
    actor_user_id: 'usr-superadmin-001',
    actor_name: 'SuperAdmin Master',
    actor_role: 'SUPER_ADMIN',
    impersonated: false,
    action: 'OFICINA_HOMOLOGADA_SELO',
    entity: 'WORKSHOP',
    entity_id: 'ws-autotech-001',
    metadata: { cnpj: '12.345.678/0001-90', status: 'VERIFIED', alvara_valido: true, rt_cft: 'CFT-SP-883492' },
    ip: '187.12.34.56',
    created_at: '2026-10-06T11:20:00.000Z',
    severity: 'INFO',
    status: 'SUCESSO',
  },
  {
    id: 'aud-003',
    actor_user_id: 'usr-admin-001',
    actor_name: 'Ana Souza (Admin CMS)',
    actor_role: 'ADMIN',
    impersonated: false,
    action: 'ARTIGO_PUBLICADO',
    entity: 'ARTICLE',
    entity_id: 'art-cms-002',
    metadata: { title: 'Procedimento Padrão para Diagnóstico Preditivo em Baterias EV', slug: 'procedimento-padrao-diagnostico-preditivo-baterias-ev', category: 'MANUTENCAO' },
    ip: '179.98.112.5',
    created_at: '2026-10-06T15:00:00.000Z',
    severity: 'INFO',
    status: 'SUCESSO',
  },
  {
    id: 'aud-008',
    actor_user_id: 'usr-superadmin-001',
    actor_name: 'SuperAdmin Master',
    actor_role: 'SUPER_ADMIN',
    impersonated: true,
    action: 'MODO_AUDITOR_INICIADO_DRIVER',
    entity: 'USER',
    entity_id: 'usr-driver-001',
    metadata: { targetRole: 'DRIVER', audited_user: 'Carlos Eduardo Silveira', motivo: 'Inspeção de telemetria TPMS e conformidade de comandos de segurança' },
    ip: '187.12.34.56',
    created_at: '2026-10-07T14:00:00.000Z',
    severity: 'INFO',
    status: 'EXECUTADO',
  },
  {
    id: 'aud-009',
    actor_user_id: 'usr-superadmin-001',
    actor_name: 'SuperAdmin Master (auditando Carlos Eduardo Silveira)',
    actor_role: 'SUPER_ADMIN',
    impersonated: true,
    action: 'TELEMETRIA_CONSULTADA_AUDITOR',
    entity: 'VEICULO',
    entity_id: 'veh-001',
    metadata: { action_type: 'READ_ONLY_INSPECTION', telemetry_stream: 'CAN_BUS_FRAMES_LIVE', vehicle_model: 'Toyota Corolla Cross Hybrid' },
    ip: '187.12.34.56',
    created_at: '2026-10-07T15:30:00.000Z',
    severity: 'INFO',
    status: 'EXECUTADO',
  },
];

// ==========================================
// [BLOCO 4.4 & 4.7] S4 — Fila de Homologação Anti-Fraude
// ==========================================

export const INITIAL_WORKSHOP_APPROVAL_QUEUE: Workshop[] = [
  {
    id: 'ws-precisao-003',
    owner_user_id: 'usr-admin-002',
    razao_social: 'Mecânica Precisão LTDA',
    nome_fantasia: 'Mecânica Precisão - Centro Automotivo',
    cnpj: '98.765.432/0001-10',
    address: 'Rua Bela Cintra, 890 - Consolação, São Paulo - SP',
    latitude: -23.5539,
    longitude: -46.6601,
    rating: 4.8,
    reviews_count: 56,
    phone: '(11) 97123-4567',
    email: 'contato@mecanicaprecisao.com.br',
    specialties: ['Mecânica Geral & Injeção Eletrônica', 'Freios & Suspensão', 'Alinhamento 3D'],
    status: 'PENDING_APPROVAL',
    review_feedback: null,
    drivers_served_count: 0,
    benefits_revenue: 0,
    documents: [
      {
        id: 'doc-prec-01',
        workshop_id: 'ws-precisao-003',
        kind: 'ALVARA',
        file_name: 'alvara_funcionamento_2026.pdf',
        file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        uploaded_at: '2026-10-06T14:20:00.000Z',
        status: 'PENDING',
      },
      {
        id: 'doc-prec-02',
        workshop_id: 'ws-precisao-003',
        kind: 'RT_CFT_CREA',
        file_name: 'certificacao_cft_crea_sp.pdf',
        file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        uploaded_at: '2026-10-06T15:00:00.000Z',
        status: 'PENDING',
      },
      {
        id: 'doc-prec-03',
        workshop_id: 'ws-precisao-003',
        kind: 'FOTO_FACHADA',
        file_name: 'foto_fachada_precisao.jpg',
        file_url: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=800&q=80',
        uploaded_at: '2026-10-06T15:30:00.000Z',
        status: 'PENDING',
      },
      {
        id: 'doc-prec-04',
        workshop_id: 'ws-precisao-003',
        kind: 'FOTO_INSTALACOES',
        file_name: 'box_elevadores_instalacoes.jpg',
        file_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
        uploaded_at: '2026-10-06T15:45:00.000Z',
        status: 'PENDING',
      },
    ],
    offers: [
      {
        workshop_id: 'ws-precisao-003',
        tier: 'STANDARD',
        discount_percent: 10,
        is_active: true,
      },
      {
        workshop_id: 'ws-precisao-003',
        tier: 'ADVANCED',
        discount_percent: 15,
        is_active: true,
      },
    ],
  },
];

// ==========================================
// [BLOCO 4.5 & 4.7] S5 — Lixeira Central (Quarentena & Expurgo)
// ==========================================

export const INITIAL_TRASH_REPOSITORY: TrashItem[] = [
  {
    id: 'art-trash-001',
    item_type: 'Artigo CMS',
    type: 'ARTICLE',
    title: 'Dicas de Viagem 2025',
    deleted_by: 'Admin_Ana',
    deleted_at: '2026-10-02T14:30:00.000Z',
    original_data: {
      category: 'SEGURANCA',
      summary: 'Recomendações e cuidados preventivos para viagens rodoviárias de longa distância.',
      views_count: 840,
    },
  },
  {
    id: 'comm-trash-002',
    item_type: 'Comentário Fórum',
    type: 'COMMENT',
    title: 'Venda de peças sem nota fiscal chame no zap 11-99999-0000...',
    deleted_by: 'SuperAdmin_Master',
    deleted_at: '2026-10-05T11:15:00.000Z',
    original_data: {
      author: 'Usuario_Anonimo99',
      post_title: 'Barulho ao frear o Corolla Cross em dias chuvosos...',
      reports_count: 5,
    },
  },
];
