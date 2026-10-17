import bcrypt from 'bcryptjs';
import {
  User,
  Vehicle,
  VehicleReading,
  Trip,
  MaintenanceAlert,
  VehicleCommand,
  RiskReport,
  Workshop,
  WorkshopDoc,
  WorkshopOffer,
  Appointment,
  AppointmentMessage,
  Article,
  CommunityPost,
  PostComment,
  ContentReport,
  AuditLog,
  SearchLog,
  UserRole,
} from '../../src/types/index.ts';

// In-Memory Database store with complete MariaDB relational modeling
class CarCityStore {
  users: Map<string, User & { password_hash: string; totp_secret?: string }> = new Map();
  sessions: Map<string, { id: string; user_id: string; refresh_token_hash: string; expires_at: string; revoked_at?: string }> = new Map();
  workshops: Map<string, Workshop> = new Map();
  workshopDocs: Map<string, WorkshopDoc> = new Map();
  workshopOffers: Map<string, WorkshopOffer> = new Map();
  vehicles: Map<string, Vehicle> = new Map();
  vehicleReadings: Map<string, VehicleReading[]> = new Map();
  trips: Map<string, Trip[]> = new Map();
  maintenanceAlerts: Map<string, MaintenanceAlert[]> = new Map();
  vehicleCommands: Map<string, VehicleCommand[]> = new Map();
  riskReports: Map<string, RiskReport> = new Map();
  appointments: Map<string, Appointment> = new Map();
  appointmentMessages: Map<string, AppointmentMessage[]> = new Map();
  articles: Map<string, Article> = new Map();
  communityPosts: Map<string, CommunityPost> = new Map();
  postComments: Map<string, PostComment[]> = new Map();
  postLikes: Set<string> = new Set(); // "postId:userId"
  contentReports: Map<string, ContentReport> = new Map();
  auditLogs: AuditLog[] = [];
  searchLogs: SearchLog[] = [];

  constructor() {
    this.seedDatabase();
  }

  seedDatabase() {
    // Hashes for default password 'password123'
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    // 1. Users
    const driverUser: User & { password_hash: string; totp_secret?: string } = {
      id: 'usr-driver-001',
      role: 'DRIVER',
      full_name: 'Carlos Eduardo Silveira',
      email: 'motorista@carcity.com.br',
      cpf_cnpj: '123.456.789-00',
      password_hash: defaultPasswordHash,
      must_change_password: false,
      theme_preference: 'DARK',
      plan: 'ADVANCED',
      is_active: true,
      token_version: 1,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    };

    const workshopUser: User & { password_hash: string; totp_secret?: string } = {
      id: 'usr-workshop-001',
      role: 'WORKSHOP_OWNER',
      full_name: 'AutoTech Premium',
      email: 'contato@autotech.com.br',
      cpf_cnpj: '12.345.678/0001-90',
      password_hash: defaultPasswordHash,
      must_change_password: false,
      theme_preference: 'DARK',
      plan: 'STANDARD',
      is_active: true,
      token_version: 1,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    };

    const adminUser: User & { password_hash: string; totp_secret?: string } = {
      id: 'usr-admin-001',
      role: 'ADMIN',
      full_name: 'Ana Souza (Admin CMS)',
      email: 'ana.souza@carcity.com.br',
      cpf_cnpj: '456.789.012-11',
      password_hash: defaultPasswordHash,
      totp_secret: 'CARCITY2FASECRETKEY123',
      must_change_password: false,
      theme_preference: 'DARK',
      plan: 'BASIC',
      is_active: true,
      token_version: 1,
      totp_enabled: true,
      created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    };

    const adminUser2: User & { password_hash: string; totp_secret?: string } = {
      id: 'usr-admin-002',
      role: 'ADMIN',
      full_name: 'Roberto Dias',
      email: 'roberto.dias@carcity.com.br',
      cpf_cnpj: '789.012.345-22',
      password_hash: defaultPasswordHash,
      totp_secret: 'CARCITY2FASECRETKEY456',
      must_change_password: false,
      theme_preference: 'DARK',
      plan: 'BASIC',
      is_active: true,
      token_version: 1,
      totp_enabled: true,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    };

    const superAdminUser: User & { password_hash: string; totp_secret?: string } = {
      id: 'usr-superadmin-001',
      role: 'SUPER_ADMIN',
      full_name: 'SuperAdmin Master',
      email: 'master@carcity.com.br',
      cpf_cnpj: '000.111.222-99',
      password_hash: defaultPasswordHash,
      totp_secret: 'CARCITYMASTERKEY999',
      must_change_password: false,
      theme_preference: 'DARK',
      plan: 'ADVANCED',
      is_active: true,
      token_version: 1,
      totp_enabled: true,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    };

    this.users.set(driverUser.id, driverUser);
    this.users.set(workshopUser.id, workshopUser);
    this.users.set(adminUser.id, adminUser);
    this.users.set(adminUser2.id, adminUser2);
    this.users.set(superAdminUser.id, superAdminUser);

    // 2. Demonstration Vehicles for Driver
    const v1: Vehicle = {
      id: 'veh-001',
      user_id: driverUser.id,
      brand: 'Toyota',
      model: 'Corolla Cross Hybrid',
      model_year: 2024,
      plate: 'ABC-1D23',
      propulsion: 'HIBRIDO',
      odometer_km: 28800,
      next_revision_km: 30000,
      parked_latitude: -12.9777,
      parked_longitude: -38.5016,
      engine_cut_connected: true,
      doors_locked: true,
      panic_mode_active: false,
    };

    const v2: Vehicle = {
      id: 'veh-byd-002',
      user_id: driverUser.id,
      brand: 'BYD',
      model: 'Dolphin EV',
      model_year: 2024,
      plate: 'EV-9876',
      propulsion: 'ELETRICO',
      odometer_km: 14200,
      next_revision_km: 20000,
      parked_latitude: -12.9860,
      parked_longitude: -38.4550,
      engine_cut_connected: true,
      doors_locked: true,
      panic_mode_active: false,
    };

    const v3: Vehicle = {
      id: 'veh-bmw-003',
      user_id: driverUser.id,
      brand: 'BMW',
      model: '320i M Sport',
      model_year: 2023,
      plate: 'CAR-2024',
      propulsion: 'COMBUSTAO',
      odometer_km: 41800,
      next_revision_km: 42000,
      parked_latitude: -12.9920,
      parked_longitude: -38.4610,
      engine_cut_connected: true,
      doors_locked: false,
      panic_mode_active: false,
    };

    this.vehicles.set(v1.id, v1);
    this.vehicles.set('veh-corolla-001', v1);
    this.vehicles.set(v2.id, v2);
    this.vehicles.set(v3.id, v3);

    // Initial Telemetry Readings
    const v1Readings = [
      {
        id: 'read-v1-now',
        vehicle_id: v1.id,
        recorded_at: new Date().toISOString(),
        tire_fl_psi: 32.5,
        tire_fr_psi: 32.8,
        tire_rl_psi: 33.0,
        tire_rr_psi: 32.2,
        battery_pct: 94,
        brake_pad_mm: 7.2,
        engine_cut_connected: true,
        is_simulated: false,
      },
    ];
    this.vehicleReadings.set(v1.id, v1Readings);
    this.vehicleReadings.set('veh-corolla-001', v1Readings);

    this.vehicleReadings.set(v2.id, [
      {
        id: 'read-v2-now',
        vehicle_id: v2.id,
        recorded_at: new Date().toISOString(),
        tire_fl_psi: 34.0,
        tire_fr_psi: 34.2,
        tire_rl_psi: 34.1,
        tire_rr_psi: 33.9,
        battery_pct: 88,
        brake_pad_mm: 8.5,
        engine_cut_connected: true,
        is_simulated: false,
      },
    ]);

    this.vehicleReadings.set(v3.id, [
      {
        id: 'read-v3-now',
        vehicle_id: v3.id,
        recorded_at: new Date().toISOString(),
        tire_fl_psi: 26.5, // Critical alert trigger!
        tire_fr_psi: 31.8,
        tire_rl_psi: 32.0,
        tire_rr_psi: 31.5,
        battery_pct: 76,
        brake_pad_mm: 3.4, // Warning!
        engine_cut_connected: true,
        is_simulated: false,
      },
    ]);

    // Initial Historical Trips for Telemetry AreaChart
    this.seedTrips(v1.id, 'HIBRIDO');
    this.seedTrips(v2.id, 'ELETRICO');
    this.seedTrips(v3.id, 'COMBUSTAO');

    // Initial Maintenance Alerts
    this.evaluateVehicleAlerts(v1.id);
    this.evaluateVehicleAlerts(v2.id);
    this.evaluateVehicleAlerts(v3.id);

    // 3. Workshops & Verification
    const workshop1: Workshop = {
      id: 'ws-autotech-001',
      owner_user_id: workshopUser.id,
      razao_social: 'AutoTech Centro Automotivo Especializado LTDA',
      nome_fantasia: 'AutoTech Premium - Unidade Pituba',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Manoel Dias da Silva, 1850 - Pituba, Salvador - BA',
      latitude: -12.9900,
      longitude: -38.4600,
      rating: 4.9,
      reviews_count: 142,
      phone: '(71) 3345-6789',
      email: 'contato@autotechpremium.com.br',
      specialties: [
        'Mecânica Geral & Injeção Eletrônica',
        'Elétrica, Telemetria & Sensores IoT',
        'Híbridos & Veículos Elétricos (EV)',
        'Alinhamento 3D, Pneus & Calibragem TPMS',
        'Diagnóstico Preditivo de Freios',
      ],
      status: 'VERIFIED',
      review_feedback:
        'Documentação vistoriada pelo departamento técnico. Alvará de funcionamento e registro CREA/CFT regulares.',
      drivers_served_count: 142,
      benefits_revenue: 88400,
      documents: [
        {
          id: 'doc-01',
          workshop_id: 'ws-autotech-001',
          kind: 'ALVARA',
          file_name: 'alvara_2026_autotech.pdf',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          uploaded_at: '2026-01-15T10:00:00.000Z',
          status: 'VALIDATED',
        },
        {
          id: 'doc-02',
          workshop_id: 'ws-autotech-001',
          kind: 'RT_CFT_CREA',
          file_name: 'cft_eng_mecanico.pdf',
          file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
          uploaded_at: '2026-01-15T11:30:00.000Z',
          status: 'VALIDATED',
        },
        {
          id: 'doc-03',
          workshop_id: 'ws-autotech-001',
          kind: 'FOTO_FACHADA',
          file_name: 'fachada_v2.jpg',
          file_url: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=800&q=80',
          uploaded_at: '2026-01-16T09:15:00.000Z',
          status: 'VALIDATED',
        },
        {
          id: 'doc-04',
          workshop_id: 'ws-autotech-001',
          kind: 'FOTO_INSTALACOES',
          file_name: 'box_atendimento.jpg',
          file_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
          uploaded_at: '2026-01-16T14:40:00.000Z',
          status: 'VALIDATED',
        },
      ],
      offers: [
        {
          workshop_id: 'ws-autotech-001',
          tier: 'STANDARD',
          discount_percent: 10,
          is_active: true,
        },
        {
          workshop_id: 'ws-autotech-001',
          tier: 'ADVANCED',
          discount_percent: 20,
          is_active: true,
        },
      ],
    };

    const workshop2: Workshop = {
      id: 'ws-eletrocar-002',
      owner_user_id: 'usr-workshop-002',
      razao_social: 'EletroCar Soluções em Mobilidade Sustentável',
      nome_fantasia: 'EletroCar Híbridos & EV - Unidade Comércio',
      cnpj: '34.567.890/0001-12',
      address: 'Av. da França, 400 - Comércio, Salvador - BA',
      latitude: -12.9680,
      longitude: -38.5120,
      rating: 4.8,
      reviews_count: 98,
      phone: '(71) 3241-9900',
      email: 'comercio@eletrocar.com.br',
      specialties: ['Híbridos & EV', 'Elétrica & IoT', 'Pneus', 'Baterias Alta Voltagem'],
      status: 'VERIFIED',
      review_feedback: 'Homologada para baterias de alta voltagem e diagnósticos OBD-II de frotas.',
      drivers_served_count: 89,
      benefits_revenue: 24300,
      documents: [
        {
          id: 'doc-04',
          workshop_id: 'ws-eletrocar-002',
          kind: 'ALVARA',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          uploaded_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          status: 'VALIDATED',
        },
      ],
      offers: [
        {
          workshop_id: 'ws-eletrocar-002',
          tier: 'STANDARD',
          discount_percent: 10,
          is_active: true,
        },
        {
          workshop_id: 'ws-eletrocar-002',
          tier: 'ADVANCED',
          discount_percent: 20,
          is_active: true,
        },
      ],
    };

    const workshop3Salvador: Workshop = {
      id: 'ws-salvador-004',
      owner_user_id: 'usr-workshop-003',
      razao_social: 'Salvador Centro Automotivo Preditivo LTDA',
      nome_fantasia: 'Salvador Oficina Preditiva - Unidade Stiep / Caminho das Árvores',
      cnpj: '45.890.123/0001-44',
      address: 'Alameda Salvador, 1057 - Caminho das Árvores, Salvador - BA',
      latitude: -12.9810,
      longitude: -38.4520,
      rating: 4.9,
      reviews_count: 115,
      phone: '(71) 3450-8080',
      email: 'stiep@salvadorpreditiva.com.br',
      specialties: ['Diagnóstico Preditivo CAN', 'Freios ABS & Cerâmica', 'Telemetria & Corte IoT', 'Suspensão & Alinhamento 3D'],
      status: 'VERIFIED',
      review_feedback: 'Certificação CFT/CREA regular e scanners oficiais homologados pela CarCity.',
      drivers_served_count: 120,
      benefits_revenue: 62000,
      documents: [
        {
          id: 'doc-ssa-01',
          workshop_id: 'ws-salvador-004',
          kind: 'ALVARA',
          file_name: 'alvara_ssa_2026.pdf',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          uploaded_at: '2026-02-10T10:00:00.000Z',
          status: 'VALIDATED',
        },
      ],
      offers: [
        {
          workshop_id: 'ws-salvador-004',
          tier: 'STANDARD',
          discount_percent: 10,
          is_active: true,
        },
        {
          workshop_id: 'ws-salvador-004',
          tier: 'ADVANCED',
          discount_percent: 20,
          is_active: true,
        },
      ],
    };

    const workshopPending: Workshop = {
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
    };

    this.workshops.set(workshop1.id, workshop1);
    this.workshops.set('ws-autopro-001', workshop1);
    this.workshops.set(workshop2.id, workshop2);
    this.workshops.set(workshop3Salvador.id, workshop3Salvador);
    this.workshops.set(workshopPending.id, workshopPending);

    // 4. Collaborative Risk Reports (GPS Heatmap Salvador)
    const risks: RiskReport[] = [
      {
        id: 'risk-ssa-01',
        reporter_user_id: driverUser.id,
        reporter_name: 'Carlos Silveira',
        reporter_plan: 'ADVANCED',
        risk_type: 'FURTO',
        latitude: -12.9640,
        longitude: -38.4410,
        description: 'Tentativa de quebra de vidro traseiro e furto de módulo em veículo estacionado próximo à Paralela / Narandiba.',
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'risk-ssa-02',
        reporter_user_id: driverUser.id,
        reporter_name: 'Marcos Vinicius',
        reporter_plan: 'STANDARD',
        risk_type: 'ROUBO',
        latitude: -12.9730,
        longitude: -38.4890,
        description: 'Abordagem armada no semáforo da Av. Bonocô sentido Centro no período noturno.',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'risk-ssa-03',
        reporter_user_id: driverUser.id,
        reporter_name: 'Renata Lins',
        reporter_plan: 'ADVANCED',
        risk_type: 'FURTO',
        latitude: -12.9390,
        longitude: -38.4680,
        description: 'Furto de rodas e estepe em estacionamento de via pública no Largo do Retiro.',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'risk-ssa-04',
        reporter_user_id: driverUser.id,
        reporter_name: 'Diego Sales',
        reporter_plan: 'BASIC',
        risk_type: 'ROUBO',
        latitude: -12.9860,
        longitude: -38.5010,
        description: 'Assalto com moto na subida da Vasco da Gama / Garibaldi após as 21h.',
        created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'risk-ssa-05',
        reporter_user_id: driverUser.id,
        reporter_name: 'Carla Bahia',
        reporter_plan: 'ADVANCED',
        risk_type: 'OUTRO',
        latitude: -12.9780,
        longitude: -38.5020,
        description: 'Tentativa de golpe com falso mecânico apontando fumaça falsa no capô.',
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
    ];
    risks.forEach((r) => this.riskReports.set(r.id, r));

    // 5. Appointments & Messages
    const apt1: Appointment = {
      id: 'apt-001',
      driver_user_id: driverUser.id,
      driver_name: driverUser.full_name,
      driver_plan: driverUser.plan,
      workshop_id: workshop1.id,
      workshop_name: workshop1.nome_fantasia,
      vehicle_id: v1.id,
      vehicle_model: `${v1.brand} ${v1.model}`,
      vehicle_plate: v1.plate,
      service_summary: 'Revisão periódica dos 30.000 km: Óleo sintético 0W-20 homologado, filtro de óleo, calibração TPMS e diagnóstico CAN.',
      status: 'IN_MAINTENANCE',
      discount_percent: 20, // Advanced plan benefit
      created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    };

    const apt2: Appointment = {
      id: 'apt-002',
      driver_user_id: driverUser.id,
      driver_name: driverUser.full_name,
      driver_plan: driverUser.plan,
      workshop_id: workshop2.id,
      workshop_name: workshop2.nome_fantasia,
      vehicle_id: v1.id,
      vehicle_model: `${v1.brand} ${v1.model}`,
      vehicle_plate: v1.plate,
      service_summary: 'Alinhamento 3D, balanceamento de rodas e checagem de destalonamento no sensor TPMS.',
      status: 'COMPLETED',
      discount_percent: 20,
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    };

    this.appointments.set(apt1.id, apt1);
    this.appointments.set(apt2.id, apt2);

    this.appointmentMessages.set(apt1.id, [
      {
        id: 'msg-01',
        appointment_id: apt1.id,
        sender_user_id: driverUser.id,
        sender_name: driverUser.full_name,
        sender_role: 'DRIVER',
        body: 'Olá! A telemetria acusou proximidade da revisão de 30.000 km. Já dei entrada do veículo hoje cedo.',
        created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        id: 'msg-02',
        appointment_id: apt1.id,
        sender_user_id: workshopUser.id,
        sender_name: 'Roberto Miranda (AutoPro)',
        sender_role: 'WORKSHOP_OWNER',
        body: 'Perfeito, Carlos! O veículo está em atendimento. Óleo e filtros substituídos e pastilhas revisadas. Liberamos em 45 minutos!',
        quote_amount: 464.0,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ]);

    this.appointmentMessages.set(apt2.id, [
      {
        id: 'msg-03',
        appointment_id: apt2.id,
        sender_user_id: driverUser.id,
        sender_name: driverUser.full_name,
        sender_role: 'DRIVER',
        body: 'Gostaria de agendar o alinhamento técnico e checagem dos 4 pneus.',
        created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
      {
        id: 'msg-04',
        appointment_id: apt2.id,
        sender_user_id: workshop2.owner_user_id,
        sender_name: 'EletroCar Atendimento',
        sender_role: 'WORKSHOP_OWNER',
        body: 'Serviço concluído com sucesso! Geometria 3D aferida e sensores de pressão calibrados para 33 PSI nominais. Selo Anti-Fraude emitido.',
        quote_amount: 180.0,
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ]);

    // 6. Articles (CMS News Portal - Bloco 3.1 & 3.6)
    const art1: Article = {
      id: 'art-001',
      author_user_id: adminUser.id,
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
    };

    const art2: Article = {
      id: 'art-002',
      author_user_id: adminUser.id,
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
    };

    const art3: Article = {
      id: 'art-003',
      author_user_id: adminUser.id,
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
    };

    this.articles.set(art1.id, art1);
    this.articles.set(art2.id, art2);
    this.articles.set(art3.id, art3);

    // 7. Community Posts & DIY Tutorials
    const post1: CommunityPost = {
      id: 'post-001',
      user_id: driverUser.id,
      user_name: 'Carlos Eduardo',
      user_plan: 'ADVANCED',
      type: 'FORUM',
      title: 'Barulho ao frear o Corolla Cross em dias chuvosos...',
      content: 'Notei um ruído metálico suave nas pastilhas dianteiras após transitar em pista molhada. O sensor de pastilhas marca 4.2 mm, mas gostaria de verificar se alguém mais notou essa sensibilidade.',
      tags: ['MANUTENCAO', 'SEGURANCA'],
      likes_count: 14,
      is_hidden: false,
      created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    };

    const post2DIY: CommunityPost = {
      id: 'post-002',
      user_id: adminUser.id,
      user_name: 'Engenharia CarCity',
      user_plan: 'ADVANCED',
      type: 'DIY',
      title: 'Tutorial DIY: Como Resetar e Calibrar o Sensor TPMS Após Rodízio de Pneus',
      content: 'Aprenda o passo a passo seguro para recalibrar as 4 posições do TPMS diretamente na central multimídia e sincronizar com o app CarCity.',
      tags: ['MANUTENCAO', 'HIBRIDOS_ELETRICOS'],
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      likes_count: 42,
      is_hidden: false,
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    };

    const post3DIY: CommunityPost = {
      id: 'post-003',
      user_id: adminUser.id,
      user_name: 'Equipe de Segurança',
      user_plan: 'ADVANCED',
      type: 'DIY',
      title: 'Procedimento Rápido: O que fazer ao acionar o Modo Pânico em Caso de Suspeita',
      content: 'Checklist de segurança: como conferir o status do relé de corte, manter a calma e acionar o 190 ou assistência 24h sem sair do abrigo.',
      tags: ['SEGURANCA'],
      youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      likes_count: 38,
      is_hidden: false,
      created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    };

    this.communityPosts.set(post1.id, post1);
    this.communityPosts.set(post2DIY.id, post2DIY);
    this.communityPosts.set(post3DIY.id, post3DIY);

    // Soft-deleted Article in Central Trash (Bloco 4.5)
    const artTrash: Article = {
      id: 'art-trash-001',
      author_user_id: adminUser.id,
      author_name: 'Admin_Ana',
      title: 'Dicas de Viagem 2025',
      slug: 'dicas-de-viagem-2025',
      summary: 'Recomendações e cuidados preventivos para viagens rodoviárias de longa distância.',
      content: 'Conteúdo arquivado de dicas para a temporada de férias 2025.',
      category: 'SEGURANCA',
      status: 'DRAFT',
      views_count: 840,
      audience: 'DRIVER',
      target_audience: ['DRIVER'],
      created_at: '2025-12-10T10:00:00.000Z',
      deleted_at: '2026-10-02T14:30:00.000Z',
    };
    this.articles.set(artTrash.id, artTrash);

    // Soft-deleted Comment in Central Trash (Bloco 4.5)
    const commTrash: PostComment = {
      id: 'comm-trash-002',
      post_id: post1.id,
      user_id: 'usr-spammer-88',
      user_name: 'SuperAdmin_Master',
      user_plan: 'BASIC',
      content: 'Venda de peças sem nota fiscal chame no zap 11-99999-0000 entrega motoboy rápido...',
      created_at: '2026-10-05T09:00:00.000Z',
      deleted_at: '2026-10-05T11:15:00.000Z',
    };

    this.postComments.set(post1.id, [
      {
        id: 'comm-01',
        post_id: post1.id,
        user_id: workshopUser.id,
        user_name: 'AutoTech Premium',
        user_plan: 'STANDARD',
        content: 'No Corolla Cross, esse ruído leve em pista molhada pode decorrer da limpeza do disco pelas pastilhas cerâmicas. Se persistir por mais de 50 km, agende uma inspeção conosco com 20% de desconto.',
        created_at: new Date(Date.now() - 40 * 3600000).toISOString(),
      },
      commTrash,
    ]);

    // 8. Content Reports for Moderation (Bloco 3.2)
    const rep1: ContentReport = {
      id: 'rep-001',
      target_type: 'POST',
      target_id: post1.id,
      target_title_or_snippet: 'Barulho ao frear o Corolla Cross em dias chuvosos...',
      author_name: 'Carlos Eduardo',
      reporter_user_id: 'usr-mod-system',
      reporter_name: 'Auditoria de Qualidade',
      reason: 'Auditoria Preventiva',
      reports_count: 0,
      status: 'OPEN',
      created_at: '2026-10-07T18:00:00.000Z',
    };

    const rep2: ContentReport = {
      id: 'rep-002',
      target_type: 'COMMENT',
      target_id: 'comm-trash-002',
      target_title_or_snippet: 'Venda de peças sem nota fiscal chame no zap 11-99999-0000...',
      author_name: 'SuperAdmin_Master',
      reporter_user_id: driverUser.id,
      reporter_name: 'Carlos Silveira',
      reason: 'Spam / Venda Irregular',
      reports_count: 5,
      status: 'OPEN',
      created_at: '2026-10-07T21:45:00.000Z',
    };

    this.contentReports.set(rep1.id, rep1);
    this.contentReports.set(rep2.id, rep2);

    // 9. Initial Audit Logs & Auditor Mode Timeline History (Bloco 4.3 & 4.7)
    this.auditLogs = [
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
        actor_user_id: superAdminUser.id,
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
        actor_user_id: superAdminUser.id,
        actor_name: superAdminUser.full_name,
        actor_role: 'SUPER_ADMIN',
        impersonated: false,
        action: 'SISTEMA_INICIALIZADO',
        entity: 'SISTEMA',
        entity_id: 'SYSTEM-ROOT',
        metadata: { version: '2.5.0-MariaDB-InnoDB', ssl: 'Obrigatório TLS 1.3', cluster_nodes: 3 },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
      {
        id: 'aud-002',
        actor_user_id: superAdminUser.id,
        actor_name: superAdminUser.full_name,
        actor_role: 'SUPER_ADMIN',
        impersonated: false,
        action: 'OFICINA_HOMOLOGADA_SELO',
        entity: 'WORKSHOP',
        entity_id: workshop1.id,
        metadata: { cnpj: workshop1.cnpj, status: 'VERIFIED', alvara_valido: true, rt_cft: 'CFT-SP-883492' },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
      {
        id: 'aud-003',
        actor_user_id: adminUser.id,
        actor_name: adminUser.full_name,
        actor_role: 'ADMIN',
        impersonated: false,
        action: 'ARTIGO_PUBLICADO',
        entity: 'ARTICLE',
        entity_id: art2.id,
        metadata: { title: art2.title, slug: art2.slug, category: 'MANUTENCAO' },
        ip: '179.98.112.5',
        created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'aud-004',
        actor_user_id: driverUser.id,
        actor_name: driverUser.full_name,
        actor_role: 'DRIVER',
        impersonated: false,
        action: 'LOGIN_MFA_SUCESSO',
        entity: 'AUTH_SESSION',
        entity_id: 'ses-driver-001',
        metadata: { client: 'Mobile App / Chrome 124', mfa_method: 'TOTP_RFC6238' },
        ip: '201.86.14.92',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'aud-005',
        actor_user_id: driverUser.id,
        actor_name: driverUser.full_name,
        actor_role: 'DRIVER',
        impersonated: false,
        action: 'TELEMETRIA_TPMS_ALERTA_DETECTADO',
        entity: 'VEICULO',
        entity_id: 'veh-001',
        metadata: { tire_fl_psi: 26.2, nominal_psi: 33, critical_threshold: 26.5, status: 'DESTALONAMENTO_RISCO' },
        ip: '201.86.14.92',
        created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        id: 'aud-006',
        actor_user_id: driverUser.id,
        actor_name: driverUser.full_name,
        actor_role: 'DRIVER',
        impersonated: false,
        action: 'AGENDAMENTO_CRIADO',
        entity: 'APPOINTMENT',
        entity_id: 'app-001',
        metadata: { workshop: 'AutoTech Premium', service: 'Troca Preditiva de Pastilhas de Freio', discount_pct: 20 },
        ip: '201.86.14.92',
        created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
      },
      {
        id: 'aud-007',
        actor_user_id: workshopUser.id,
        actor_name: workshopUser.full_name,
        actor_role: 'WORKSHOP_OWNER',
        impersonated: false,
        action: 'DOCUMENTO_SUBMETIDO_SELO',
        entity: 'WORKSHOP_DOC',
        entity_id: 'doc-alvara-01',
        metadata: { kind: 'ALVARA', fileName: 'Alvara_Prefeitura_SP_2026.pdf', orgao: 'Prefeitura de São Paulo' },
        ip: '189.40.72.11',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'aud-008',
        actor_user_id: superAdminUser.id,
        actor_name: superAdminUser.full_name,
        actor_role: 'SUPER_ADMIN',
        impersonated: true,
        action: 'MODO_AUDITOR_INICIADO_DRIVER',
        entity: 'USER',
        entity_id: driverUser.id,
        metadata: { targetRole: 'DRIVER', audited_user: driverUser.full_name, motivo: 'Inspeção de telemetria TPMS e conformidade de comandos de segurança' },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
      {
        id: 'aud-009',
        actor_user_id: superAdminUser.id,
        actor_name: `${superAdminUser.full_name} (auditando ${driverUser.full_name})`,
        actor_role: 'SUPER_ADMIN',
        impersonated: true,
        action: 'TELEMETRIA_CONSULTADA_AUDITOR',
        entity: 'VEICULO',
        entity_id: 'veh-001',
        metadata: { action_type: 'READ_ONLY_INSPECTION', telemetry_stream: 'CAN_BUS_FRAMES_LIVE', vehicle_model: 'Toyota Corolla Cross Hybrid' },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
      },
      {
        id: 'aud-010',
        actor_user_id: driverUser.id,
        actor_name: driverUser.full_name,
        actor_role: 'DRIVER',
        impersonated: false,
        action: 'CORTE_MOTOR_EXECUTADO',
        entity: 'VEICULO',
        entity_id: 'veh-001',
        metadata: { relay_status: 'DISCONNECTED', speed_at_cut_kmh: 0, reason: 'Teste Preventivo de Segurança Anti-Furto' },
        ip: '201.86.14.92',
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        id: 'aud-011',
        actor_user_id: driverUser.id,
        actor_name: driverUser.full_name,
        actor_role: 'DRIVER',
        impersonated: false,
        action: 'MODO_PANICO_ATIVADO',
        entity: 'VEICULO',
        entity_id: 'veh-001',
        metadata: { geofence_radius_km: 5.0, alert_authorities: true, latitude: -23.5874, longitude: -46.6821 },
        ip: '201.86.14.92',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'aud-012',
        actor_user_id: workshopUser.id,
        actor_name: workshopUser.full_name,
        actor_role: 'WORKSHOP_OWNER',
        impersonated: false,
        action: 'PROPOSTA_CRIADA_OFICINA',
        entity: 'APPOINTMENT',
        entity_id: 'app-001',
        metadata: { client: 'Carlos Silveira', service: 'Pastilhas Cerâmicas + Fluido DOT 5.1', budget_brl: 450.0, discount_applied: '20% ADVANCED' },
        ip: '189.40.72.11',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'aud-013',
        actor_user_id: superAdminUser.id,
        actor_name: superAdminUser.full_name,
        actor_role: 'SUPER_ADMIN',
        impersonated: true,
        action: 'MODO_AUDITOR_INICIADO_WORKSHOP_OWNER',
        entity: 'USER',
        entity_id: workshopUser.id,
        metadata: { targetRole: 'WORKSHOP_OWNER', audited_user: workshopUser.full_name, motivo: 'Validação técnica de conformidade do Selo Anti-Fraude e propostas B2B' },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      },
      {
        id: 'aud-014',
        actor_user_id: superAdminUser.id,
        actor_name: superAdminUser.full_name,
        actor_role: 'SUPER_ADMIN',
        impersonated: false,
        action: 'MODO_AUDITOR_ENCERRADO',
        entity: 'USER',
        entity_id: superAdminUser.id,
        metadata: { targetRole: null, session_duration_min: 42, result: 'Sem anomalias detectadas no fluxo B2B' },
        ip: '187.12.34.56',
        created_at: new Date(Date.now() - 48 * 60000).toISOString(),
      },
      {
        id: 'aud-015',
        actor_user_id: adminUser.id,
        actor_name: adminUser.full_name,
        actor_role: 'ADMIN',
        impersonated: false,
        action: 'MODERACAO_CONTEUDO_RESOLVIDA',
        entity: 'COMMUNITY_REPORT',
        entity_id: 'rep-001',
        metadata: { decision: 'KEPT', report_target: 'POST #post-001', motivo: 'Conteúdo validado tecnicamente de acordo com manual' },
        ip: '179.98.112.5',
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      },
    ];

    // 10. Search Logs
    this.searchLogs = [
      { id: 'sl-01', term: 'IPCA', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'sl-02', term: 'Seguro EV', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 'sl-03', term: 'Fio do Fusível', created_at: new Date(Date.now() - 10 * 3600000).toISOString() },
      { id: 'sl-04', term: 'Pastilha de Freio', created_at: new Date(Date.now() - 14 * 3600000).toISOString() },
      { id: 'sl-05', term: 'Corte de Motor', created_at: new Date(Date.now() - 20 * 3600000).toISOString() },
    ];
  }

  // Seed rich trip data across 6 months, 4 weeks, 7 days and 24 hours
  private seedTrips(vehicleId: string, propulsion: 'COMBUSTAO' | 'HIBRIDO' | 'ELETRICO') {
    const list: Trip[] = [];
    const now = Date.now();
    const baseEfficiency = propulsion === 'ELETRICO' ? 14.8 : propulsion === 'HIBRIDO' ? 17.5 : 9.8;

    if (vehicleId === 'veh-corolla-001' || vehicleId === 'veh-001') {
      // Prompt 7D exact dataset (Seg 01/10 to Dom 07/10):
      // Seg: 42 km | 1h 15m | 18.2 km/L
      // Ter: 68 km | 2h 10m | 17.5 km/L
      // Qua: 15 km | 0h 35m | 19.1 km/L
      // Qui: 94 km | 2h 45m | 16.8 km/L
      // Sex: 112 km | 3h 20m | 15.9 km/L
      // Sab: 35 km | 0h 50m | 18.8 km/L
      // Dom: 22 km | 0h 40m | 19.5 km/L
      // Total: 388 km
      const sevenDays = [
        { dayOffset: 6, km: 42, min: 75, eff: 18.2, label: 'Seg (01/10)' },
        { dayOffset: 5, km: 68, min: 130, eff: 17.5, label: 'Ter (02/10)' },
        { dayOffset: 4, km: 15, min: 35, eff: 19.1, label: 'Qua (03/10)' },
        { dayOffset: 3, km: 94, min: 165, eff: 16.8, label: 'Qui (04/10)' },
        { dayOffset: 2, km: 112, min: 200, eff: 15.9, label: 'Sex (05/10)' },
        { dayOffset: 1, km: 35, min: 50, eff: 18.8, label: 'Sáb (06/10)' },
        { dayOffset: 0, km: 22, min: 40, eff: 19.5, label: 'Dom (07/10)' },
      ];

      sevenDays.forEach((item, idx) => {
        const tripDate = new Date(now - item.dayOffset * 86400000 - 4 * 3600000);
        list.push({
          id: `trip-${vehicleId}-7d-${idx}`,
          vehicle_id: vehicleId,
          started_at: tripDate.toISOString(),
          distance_km: item.km,
          duration_min: item.min,
          efficiency: item.eff,
        });
      });

      // Additional trips distributed over previous 180 days for 4S and 6M horizons
      for (let i = 7; i < 40; i++) {
        const daysAgo = 7 + Math.floor(Math.pow((i - 7) / 33, 1.6) * 170);
        const tripDate = new Date(now - daysAgo * 86400000);
        const distance = Math.round((20 + (i % 6) * 12 + (i * 2.7) % 25) * 10) / 10;
        const duration = Math.round(distance * 1.8);
        list.push({
          id: `trip-${vehicleId}-${i}`,
          vehicle_id: vehicleId,
          started_at: tripDate.toISOString(),
          distance_km: distance,
          duration_min: duration,
          efficiency: 17.8,
        });
      }
    } else {
      // 35 trips distributed back over 180 days
      for (let i = 0; i < 35; i++) {
        const daysAgo = Math.floor(Math.pow(i / 35, 1.8) * 180);
        const tripDate = new Date(now - daysAgo * 86400000 - (i % 5) * 3600000);
        const distance = Math.round((12 + (i % 7) * 8.5 + (i * 3.1) % 15) * 10) / 10;
        const duration = Math.round(distance * (2.2 + ((i % 3) * 0.4)));
        const efficiency = Math.round((baseEfficiency + (Math.sin(i) * 1.2)) * 10) / 10;

        list.push({
          id: `trip-${vehicleId}-${i}`,
          vehicle_id: vehicleId,
          started_at: tripDate.toISOString(),
          distance_km: distance,
          duration_min: duration,
          efficiency: Math.max(2, efficiency),
        });
      }
    }

    // Sort by date ascending
    list.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    this.trips.set(vehicleId, list);
    if (vehicleId === 'veh-001') this.trips.set('veh-corolla-001', list);
    if (vehicleId === 'veh-corolla-001') this.trips.set('veh-001', list);
  }

  // Evaluates telemetry maintenance alerts against model-specific thresholds
  evaluateVehicleAlerts(vehicleId: string): MaintenanceAlert[] {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return [];

    const readings = this.vehicleReadings.get(vehicleId) || [];
    const latestReading = readings[readings.length - 1];
    if (!latestReading) return [];

    const alerts: MaintenanceAlert[] = [];

    // 1. TPMS Tires FL, FR, RL, RR
    const tires = [
      { name: 'FL (Diant. Esq.)', psi: latestReading.tire_fl_psi },
      { name: 'FR (Diant. Dir.)', psi: latestReading.tire_fr_psi },
      { name: 'RL (Tras. Esq.)', psi: latestReading.tire_rl_psi },
      { name: 'RR (Tras. Dir.)', psi: latestReading.tire_rr_psi },
    ];

    const criticalTireLimit = vehicle.propulsion === 'ELETRICO' ? 28.0 : 26.5;
    const warningTireLimit = 29.5;
    const overpressureLimit = 38.0;

    for (const t of tires) {
      if (t.psi <= criticalTireLimit) {
        alerts.push({
          id: `alt-tire-crit-${t.name}-${vehicleId}`,
          vehicle_id: vehicleId,
          component: 'PNEU',
          severity: 'CRITICO',
          message: `Risco Crítico de Destalonamento em ${t.name}: ${t.psi.toFixed(1)} PSI (abaixo do limiar de segurança de ${criticalTireLimit} PSI).`,
          status: 'ACTIVE',
          sensor_reading: `${t.psi.toFixed(1)} PSI`,
          nominal_value: '33.0 PSI',
          tolerance: '±2.0 PSI',
        });
      } else if (t.psi <= warningTireLimit) {
        alerts.push({
          id: `alt-tire-warn-${t.name}-${vehicleId}`,
          vehicle_id: vehicleId,
          component: 'PNEU',
          severity: 'PREVENTIVO',
          message: `Pressão baixa detectada em ${t.name}: ${t.psi.toFixed(1)} PSI. Recomenda-se calibração preventiva.`,
          status: 'ACTIVE',
          sensor_reading: `${t.psi.toFixed(1)} PSI`,
          nominal_value: '33.0 PSI',
          tolerance: '±2.0 PSI',
        });
      } else if (t.psi >= overpressureLimit) {
        alerts.push({
          id: `alt-tire-over-${t.name}-${vehicleId}`,
          vehicle_id: vehicleId,
          component: 'PNEU',
          severity: 'PREVENTIVO',
          message: `Sobrepressão detectada em ${t.name}: ${t.psi.toFixed(1)} PSI. Risco de desgaste central e perda de aderência.`,
          status: 'ACTIVE',
          sensor_reading: `${t.psi.toFixed(1)} PSI`,
          nominal_value: '33.0 PSI',
          tolerance: '±2.0 PSI',
        });
      }
    }

    // 2. Óleo e Filtro (Combustão e Híbridos)
    if (vehicle.propulsion !== 'ELETRICO') {
      const remainingKm = vehicle.next_revision_km - vehicle.odometer_km;
      const oilSpec = vehicle.propulsion === 'HIBRIDO' ? 'Sintético 0W-20' : 'Sintético 5W-30';
      if (remainingKm <= 200) {
        alerts.push({
          id: `alt-oil-crit-${vehicleId}`,
          vehicle_id: vehicleId,
          component: 'OLEO',
          severity: 'CRITICO',
          message: `Revisão do Motor Vencendo em ${remainingKm} km! Troca de óleo ${oilSpec} e substituição do elemento filtrante obrigatória.`,
          status: 'ACTIVE',
          sensor_reading: `${vehicle.odometer_km} km`,
          nominal_value: `${vehicle.next_revision_km} km`,
          tolerance: '0 km',
        });
      } else if (remainingKm <= 1500) {
        alerts.push({
          id: `alt-oil-warn-${vehicleId}`,
          vehicle_id: vehicleId,
          component: 'OLEO',
          severity: 'PREVENTIVO',
          message: `Próxima revisão em ${remainingKm} km. Agende a substituição preventiva de óleo (${oilSpec}) e filtro de óleo na rede credenciada.`,
          status: 'ACTIVE',
          sensor_reading: `${vehicle.odometer_km} km`,
          nominal_value: `${vehicle.next_revision_km} km`,
          tolerance: '±500 km',
        });
      }
    }

    // 3. Pastilhas de Freio
    if (latestReading.brake_pad_mm <= 3.0) {
      alerts.push({
        id: `alt-brake-crit-${vehicleId}`,
        vehicle_id: vehicleId,
        component: 'FREIO',
        severity: 'CRITICO',
        message: `Espessura das pastilhas de freio crítica: ${latestReading.brake_pad_mm.toFixed(1)} mm. Risco iminente de dano aos discos e perda de frenagem.`,
        status: 'ACTIVE',
        sensor_reading: `${latestReading.brake_pad_mm.toFixed(1)} mm`,
        nominal_value: '10.0 mm',
        tolerance: '> 3.0 mm',
      });
    } else if (latestReading.brake_pad_mm <= 4.5) {
      alerts.push({
        id: `alt-brake-warn-${vehicleId}`,
        vehicle_id: vehicleId,
        component: 'FREIO',
        severity: 'PREVENTIVO',
        message: `Desgaste acentuado das pastilhas: ${latestReading.brake_pad_mm.toFixed(1)} mm. Programe a substituição na próxima revisão.`,
        status: 'ACTIVE',
        sensor_reading: `${latestReading.brake_pad_mm.toFixed(1)} mm`,
        nominal_value: '10.0 mm',
        tolerance: '> 4.5 mm',
      });
    }

    // 4. Bateria (EV / 12V)
    if (latestReading.battery_pct <= 20) {
      alerts.push({
        id: `alt-bat-crit-${vehicleId}`,
        vehicle_id: vehicleId,
        component: 'BATERIA',
        severity: 'CRITICO',
        message: `Nível crítico de carga residual da bateria: ${latestReading.battery_pct}%. Conecte a um ponto de recarga imediato para evitar descarga profunda.`,
        status: 'ACTIVE',
        sensor_reading: `${latestReading.battery_pct}%`,
        nominal_value: '> 80%',
        tolerance: '> 20%',
      });
    } else if (latestReading.battery_pct <= 35) {
      alerts.push({
        id: `alt-bat-warn-${vehicleId}`,
        vehicle_id: vehicleId,
        component: 'BATERIA',
        severity: 'PREVENTIVO',
        message: `Carga residual da bateria baixa: ${latestReading.battery_pct}%. Estabilidade térmica verificada.`,
        status: 'ACTIVE',
        sensor_reading: `${latestReading.battery_pct}%`,
        nominal_value: '> 80%',
        tolerance: '> 35%',
      });
    }

    this.maintenanceAlerts.set(vehicleId, alerts);
    return alerts;
  }

  // Simulation engine that updates sensor readings and persists with is_simulated: true
  simulateTelemetry(vehicleId: string, action: 'PNEU_BAIXO' | 'OLEO_PROXIMO' | 'BATERIA_FRACA' | 'CALIBRAR_TUDO') {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return null;

    const readings = this.vehicleReadings.get(vehicleId) || [];
    const prev = readings[readings.length - 1] || {
      tire_fl_psi: 33.0,
      tire_fr_psi: 33.0,
      tire_rl_psi: 33.0,
      tire_rr_psi: 33.0,
      battery_pct: 90,
      brake_pad_mm: 7.0,
      engine_cut_connected: true,
    };

    let newReading: VehicleReading = {
      id: `read-sim-${Date.now()}`,
      vehicle_id: vehicleId,
      recorded_at: new Date().toISOString(),
      tire_fl_psi: prev.tire_fl_psi,
      tire_fr_psi: prev.tire_fr_psi,
      tire_rl_psi: prev.tire_rl_psi,
      tire_rr_psi: prev.tire_rr_psi,
      battery_pct: prev.battery_pct,
      brake_pad_mm: prev.brake_pad_mm,
      engine_cut_connected: vehicle.engine_cut_connected,
      is_simulated: true,
    };

    switch (action) {
      case 'PNEU_BAIXO':
        newReading.tire_fl_psi = 24.8; // Triggers critical blowout hazard
        break;
      case 'OLEO_PROXIMO':
        vehicle.odometer_km = vehicle.next_revision_km - 80; // 80 km remaining
        break;
      case 'BATERIA_FRACA':
        newReading.battery_pct = 14; // Critical residual charge
        break;
      case 'CALIBRAR_TUDO':
        newReading.tire_fl_psi = 33.0;
        newReading.tire_fr_psi = 33.0;
        newReading.tire_rl_psi = 33.0;
        newReading.tire_rr_psi = 33.0;
        newReading.battery_pct = 95;
        newReading.brake_pad_mm = 8.0;
        vehicle.next_revision_km = vehicle.odometer_km + 10000;
        break;
    }

    readings.push(newReading);
    this.vehicleReadings.set(vehicleId, readings);
    const updatedAlerts = this.evaluateVehicleAlerts(vehicleId);

    return {
      reading: newReading,
      alerts: updatedAlerts,
      vehicle,
    };
  }

  // Logs critical system and RBAC actions into audit_logs
  recordAudit(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>,
    impersonated: boolean = false,
    ip: string = '127.0.0.1',
    severity?: 'INFO' | 'WARNING' | 'CRITICAL',
    status?: 'EXECUTADO' | 'SUCESSO' | 'ALERTA' | 'FALHA' | 'INFO'
  ) {
    const actor = this.users.get(actorId);
    let autoSeverity: 'INFO' | 'WARNING' | 'CRITICAL' = severity || 'INFO';
    if (!severity) {
      if (
        action.includes('CORTE_MOTOR') ||
        action.includes('PANICO') ||
        action.includes('REVOGACAO') ||
        action.includes('HARD_DELETE')
      ) {
        autoSeverity = 'CRITICAL';
      } else if (
        action.includes('ALERTA') ||
        action.includes('INVALIDO') ||
        action.includes('REJEICAO')
      ) {
        autoSeverity = 'WARNING';
      }
    }

    let autoStatus: 'EXECUTADO' | 'SUCESSO' | 'ALERTA' | 'FALHA' | 'INFO' = status || 'EXECUTADO';
    if (!status) {
      if (action.includes('INVALIDO') || action.includes('FALHA')) autoStatus = 'ALERTA';
      else if (action.includes('APROVADO') || action.includes('SUCESSO') || action.includes('RESTAURADO'))
        autoStatus = 'SUCESSO';
    }

    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor_user_id: actorId,
      actor_name: actor ? actor.full_name : 'desconhecido',
      actor_role: actor ? actor.role : undefined,
      impersonated,
      action,
      entity,
      entity_id: entityId,
      metadata,
      ip,
      created_at: new Date().toISOString(),
      severity: autoSeverity,
      status: autoStatus,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    return log;
  }
}

export const dbStore = new CarCityStore();
