import {
  Vehicle,
  VehicleReading,
  MaintenanceAlert,
  PropulsionType,
  MaintenanceLog,
  Workshop,
  Appointment,
  Article,
  ContentReport,
  DiyVideo,
  SearchKeywordAnalytics,
} from '../types/index.ts';

export type TelemetrySimulationAction =
  | 'PNEU_BAIXO'
  | 'OLEO_PROXIMO'
  | 'BATERIA_FRACA'
  | 'CALIBRAR_TUDO';

export interface TireHealthStatus {
  psi: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  color: string;
  bg: string;
  border: string;
  label: string;
}

export interface BatteryHealthStatus {
  pct: number;
  voltage: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  color: string;
  bg: string;
  label: string;
}

export interface OilRevisionHealthStatus {
  remainingKm: number;
  progressPct: number;
  spec: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  color: string;
  label: string;
}

export interface BrakePadHealthStatus {
  mm: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  color: string;
  label: string;
}

export interface EngineStatus {
  connected: boolean;
  locked: boolean;
  panic: boolean;
  color: string;
  label: string;
}

// Telemetry thresholds from CarCity architecture specifications
export const TELEMETRY_CONSTANTS = {
  NOMINAL_TIRE_PSI: 33.0,
  WARNING_TIRE_PSI: 29.5,
  CRITICAL_TIRE_PSI: 26.5,
  CRITICAL_TIRE_EV_PSI: 28.0,
  OVERPRESSURE_TIRE_PSI: 38.0,

  NOMINAL_BATTERY_PCT: 94,
  NOMINAL_BATTERY_VOLTS: 12.8,
  WARNING_BATTERY_PCT: 35,
  CRITICAL_BATTERY_PCT: 20,

  BRAKE_PAD_NOMINAL_MM: 10.0,
  BRAKE_PAD_WARNING_MM: 4.5,
  BRAKE_PAD_CRITICAL_MM: 3.0,

  OIL_WARNING_KM: 1500,
  OIL_CRITICAL_KM: 200,
};

// Default nominal vehicles with veh-001 as default
export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001',
    user_id: 'usr-driver-001',
    brand: 'Toyota',
    model: 'Corolla Cross Hybrid',
    model_year: 2024,
    plate: 'ABC-1D23',
    propulsion: 'HIBRIDO',
    odometer_km: 28800,
    next_revision_km: 30000,
    parked_latitude: -12.9135,
    parked_longitude: -38.3892,
    engine_cut_connected: true,
    doors_locked: true,
    panic_mode_active: false,
  },
  {
    id: 'veh-002',
    user_id: 'usr-driver-001',
    brand: 'BYD',
    model: 'Dolphin EV',
    model_year: 2024,
    plate: 'EV-9876',
    propulsion: 'ELETRICO',
    odometer_km: 14200,
    next_revision_km: 20000,
    parked_latitude: -23.5829,
    parked_longitude: -46.6802,
    engine_cut_connected: true,
    doors_locked: true,
    panic_mode_active: false,
  },
  {
    id: 'veh-003',
    user_id: 'usr-driver-001',
    brand: 'BMW',
    model: '320i M Sport',
    model_year: 2023,
    plate: 'CAR-2024',
    propulsion: 'COMBUSTAO',
    odometer_km: 41800,
    next_revision_km: 42000,
    parked_latitude: -23.5505,
    parked_longitude: -46.6333,
    engine_cut_connected: true,
    doors_locked: false,
    panic_mode_active: false,
  },
];

// Default nominal readings for initial mock or fallback state
export const DEFAULT_NOMINAL_READINGS: Record<string, VehicleReading> = {
  'veh-001': {
    id: 'read-v1-init',
    vehicle_id: 'veh-001',
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
  'veh-corolla-001': {
    id: 'read-v1-init',
    vehicle_id: 'veh-corolla-001',
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
  'veh-002': {
    id: 'read-v2-init',
    vehicle_id: 'veh-002',
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
  'veh-byd-002': {
    id: 'read-v2-init',
    vehicle_id: 'veh-byd-002',
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
  'veh-003': {
    id: 'read-v3-init',
    vehicle_id: 'veh-003',
    recorded_at: new Date().toISOString(),
    tire_fl_psi: 32.0,
    tire_fr_psi: 32.5,
    tire_rl_psi: 32.2,
    tire_rr_psi: 32.4,
    battery_pct: 92,
    brake_pad_mm: 6.8,
    engine_cut_connected: true,
    is_simulated: false,
  },
  'veh-bmw-003': {
    id: 'read-v3-init',
    vehicle_id: 'veh-bmw-003',
    recorded_at: new Date().toISOString(),
    tire_fl_psi: 32.0,
    tire_fr_psi: 32.5,
    tire_rl_psi: 32.2,
    tire_rr_psi: 32.4,
    battery_pct: 92,
    brake_pad_mm: 6.8,
    engine_cut_connected: true,
    is_simulated: false,
  },
};

// Rich mock data for Driver Appointments
export const MOCK_APPOINTMENTS = [
  {
    id: 'apt-001',
    driver_user_id: 'usr-driver-001',
    driver_name: 'Carlos Eduardo Silveira',
    driver_plan: 'ADVANCED' as const,
    workshop_id: 'ws-autopro-001',
    workshop_name: 'AutoPro Centro Especializado Jardins',
    vehicle_id: 'veh-001',
    vehicle_model: 'Toyota Corolla Cross Hybrid',
    vehicle_plate: 'ABC-1D23',
    service_summary:
      'Revisão periódica dos 30.000 km: Óleo sintético 0W-20 homologado, filtro de óleo, calibração TPMS e diagnóstico CAN.',
    status: 'IN_MAINTENANCE' as const,
    discount_percent: 20,
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    messages: [
      {
        id: 'msg-01',
        appointment_id: 'apt-001',
        sender_user_id: 'usr-driver-001',
        sender_name: 'Carlos Eduardo Silveira',
        sender_role: 'DRIVER' as const,
        body: 'Olá! Meu painel IoT acusou proximidade da revisão preventiva de 30.000 km. Já dei entrada do veículo hoje cedo.',
        created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        id: 'msg-02',
        appointment_id: 'apt-001',
        sender_user_id: 'usr-workshop-001',
        sender_name: 'Roberto Miranda (AutoPro)',
        sender_role: 'WORKSHOP_OWNER' as const,
        body: 'Boa tarde Carlos! Veículo em elevador técnico. O lubrificante 0W-20 sintético e filtros foram trocados e a pastilha dianteira foi calibrada. Em cerca de 45 minutos liberamos o carro!',
        quote_amount: 464,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'apt-002',
    driver_user_id: 'usr-driver-001',
    driver_name: 'Carlos Eduardo Silveira',
    driver_plan: 'ADVANCED' as const,
    workshop_id: 'ws-eletrocar-002',
    workshop_name: 'EletroCar Pinheiros Especialista EV',
    vehicle_id: 'veh-001',
    vehicle_model: 'Toyota Corolla Cross Hybrid',
    vehicle_plate: 'ABC-1D23',
    service_summary:
      'Alinhamento 3D, balanceamento de rodas e checagem de destalonamento no sensor TPMS.',
    status: 'COMPLETED' as const,
    discount_percent: 20,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    messages: [
      {
        id: 'msg-03',
        appointment_id: 'apt-002',
        sender_user_id: 'usr-driver-001',
        sender_name: 'Carlos Eduardo Silveira',
        sender_role: 'DRIVER' as const,
        body: 'Gostaria de agendar o alinhamento técnico e checagem dos 4 pneus.',
        created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
      {
        id: 'msg-04',
        appointment_id: 'apt-002',
        sender_user_id: 'usr-workshop-002',
        sender_name: 'EletroCar Atendimento',
        sender_role: 'WORKSHOP_OWNER' as const,
        body: 'Serviço concluído com sucesso! Geometria 3D aferida e sensores de pressão calibrados para 33 PSI nominais. Selo Anti-Fraude emitido.',
        quote_amount: 180,
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'apt-003',
    driver_user_id: 'usr-driver-001',
    driver_name: 'Carlos Eduardo Silveira',
    driver_plan: 'ADVANCED' as const,
    workshop_id: 'ws-autopro-001',
    workshop_name: 'AutoPro Centro Especializado Jardins',
    vehicle_id: 'veh-001',
    vehicle_model: 'Toyota Corolla Cross Hybrid',
    vehicle_plate: 'ABC-1D23',
    service_summary:
      'Substituição de pastilhas de freio cerâmicas e teste de condutividade de fluído DOT 4 LV.',
    status: 'IN_REVIEW' as const,
    discount_percent: 20,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      {
        id: 'msg-05',
        appointment_id: 'apt-003',
        sender_user_id: 'usr-driver-001',
        sender_name: 'Carlos Eduardo Silveira',
        sender_role: 'DRIVER' as const,
        body: 'Solicito orçamento para substituição das pastilhas de freio antes da próxima viagem.',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
    ],
  },
];

// Rich mock data for Driver Community & Forum Posts
export const MOCK_FORUM_POSTS = [
  {
    id: 'post-001',
    user_id: 'usr-driver-001',
    user_name: 'Carlos Eduardo Silveira',
    user_plan: 'ADVANCED' as const,
    type: 'FORUM' as const,
    title: 'Calibração ideal dos pneus em estradas de alta velocidade com calor intenso',
    content:
      'Pessoal, com o calor recente de mais de 32°C no asfalto da Rodovia dos Bandeirantes, reparei que a pressão dos pneus subiu de 33 para quase 37 PSI pela leitura dos sensores TPMS da CarCity. Como vocês costumam compensar a calibragem pré-viagem para não correr risco de sobrepressão?',
    tags: ['SEGURANCA' as const, 'MANUTENCAO' as const],
    likes_count: 24,
    is_hidden: false,
    user_has_liked: true,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    comments: [
      {
        id: 'comm-01',
        post_id: 'post-001',
        user_id: 'usr-driver-002',
        user_name: 'Felipe Ramos',
        user_plan: 'STANDARD' as const,
        content:
          'Excelente observação, Carlos! O manual do Corolla recomenda calibrar sempre com pneus frios (máximo 1 km rodado). A subida de 3-4 PSI a quente é normal e esperada pela expansão do ar!',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'comm-02',
        post_id: 'post-001',
        user_id: 'usr-workshop-001',
        user_name: 'Roberto Miranda (AutoPro)',
        user_plan: 'ADVANCED' as const,
        content:
          'Dica de oficina: nunca esvazie o pneu enquanto ele estiver quente. A sobrepressão tolerada no sensor é até 38 PSI. Acima disso é bom revisar em uma de nossas unidades credenciadas.',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'post-002',
    user_id: 'usr-driver-003',
    user_name: 'Juliana Mendes',
    user_plan: 'ADVANCED' as const,
    type: 'FORUM' as const,
    title: 'Dúvida sobre frenagem regenerativa e desgaste de pastilhas em veículos híbridos',
    content:
      'Notei que o desgaste preditivo das pastilhas de freio no app CarCity está indicando que minhas pastilhas ainda têm 7.2 mm mesmo após 28.000 km. É comum durar tanto assim em comparação a carros 100% a combustão?',
    tags: ['HIBRIDOS_ELETRICOS' as const, 'MANUTENCAO' as const],
    likes_count: 38,
    is_hidden: false,
    user_has_liked: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    comments: [
      {
        id: 'comm-03',
        post_id: 'post-002',
        user_id: 'usr-driver-001',
        user_name: 'Carlos Eduardo Silveira',
        user_plan: 'ADVANCED' as const,
        content:
          'Sim, Juliana! O motor elétrico/gerador atua como freio motor (KERS) na maior parte das desacelerações leves, poupando drasticamente o atrito mecânico das pastilhas.',
        created_at: new Date(Date.now() - 16 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: 'post-003',
    user_id: 'usr-driver-004',
    user_name: 'Lucas Nogueira',
    user_plan: 'STANDARD' as const,
    type: 'DIY' as const,
    title: 'Tutorial Passo a Passo: Como verificar o nível de fluido de arrefecimento do inversor híbrido',
    content:
      'Fiz um guia rápido em vídeo mostrando a diferença entre o reservatório do motor a combustão e o circuito dedicado de refrigeração do inversor/bateria de alta voltagem.',
    tags: ['HIBRIDOS_ELETRICOS' as const, 'MANUTENCAO' as const],
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    likes_count: 52,
    is_hidden: false,
    user_has_liked: true,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    comments: [
      {
        id: 'comm-04',
        post_id: 'post-003',
        user_id: 'usr-driver-002',
        user_name: 'Felipe Ramos',
        user_plan: 'STANDARD' as const,
        content:
          'Vídeo top! Pouca gente sabe que o híbrido tem 2 circuitos de arrefecimento totalmente independentes.',
        created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
    ],
  },
];

// Rich mock data for Vehicle Maintenance History Logs
export const MOCK_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'log-001',
    vehicle_id: 'veh-001',
    vehicle_plate: 'ABC-1D23',
    service_type: 'REVISAO_PERIODICA',
    service_title: 'Revisão Periódica dos 20.000 km',
    date: '2024-03-15',
    odometer_km: 20150,
    workshop_name: 'AutoPro Centro Especializado Jardins',
    technician_name: 'Roberto Miranda (Técnico Master)',
    cost: 640.0,
    status: 'CONCLUIDO',
    notes:
      'Troca de óleo sintético 0W-20 homologado, filtro de óleo, filtro de cabine, inspeção do sistema híbrido e verificação dos freios.',
    invoice_number: 'NF-0048291',
    anti_fraud_verified: true,
  },
  {
    id: 'log-002',
    vehicle_id: 'veh-001',
    vehicle_plate: 'ABC-1D23',
    service_type: 'FREIOS_PASTILHAS',
    service_title: 'Substituição de Pastilhas Dianteiras e Fluído DOT4',
    date: '2023-11-20',
    odometer_km: 15400,
    workshop_name: 'Bosch Car Service Moema',
    technician_name: 'Lucas Ferreira',
    cost: 420.0,
    status: 'CONCLUIDO',
    notes:
      'Instalação de pastilhas cerâmicas originais Bosch e sangria com troca do fluido de freio DOT 4 LV.',
    invoice_number: 'NF-0039120',
    anti_fraud_verified: true,
  },
  {
    id: 'log-003',
    vehicle_id: 'veh-001',
    vehicle_plate: 'ABC-1D23',
    service_type: 'PNEUS_BALANCEAMENTO',
    service_title: 'Alinhamento 3D, Balanceamento e Rodízio de Pneus',
    date: '2023-08-10',
    odometer_km: 10020,
    workshop_name: 'Della Via Pneus & Centro Automotivo',
    technician_name: 'Marcos Vinícius',
    cost: 180.0,
    status: 'CONCLUIDO',
    notes:
      'Rodízio em X dos pneus Michelin Primacy 4 225/50 R18, geometria dianteira calibrada e calibração de sensores TPMS.',
    invoice_number: 'NF-0027814',
    anti_fraud_verified: true,
  },
  {
    id: 'log-004',
    vehicle_id: 'veh-001',
    vehicle_plate: 'ABC-1D23',
    service_type: 'REVISAO_PERIODICA',
    service_title: '1ª Revisão de Concessionária (10.000 km)',
    date: '2023-04-05',
    odometer_km: 9980,
    workshop_name: 'Toyota Tsusho Nações Unidas',
    technician_name: 'Eng. Paulo Sampaio',
    cost: 510.0,
    status: 'CONCLUIDO',
    notes:
      'Primeira revisão de fábrica: verificação de 28 itens, reaperto de suspensão, atualização de software ECU e troca de lubrificante.',
    invoice_number: 'NF-0019482',
    anti_fraud_verified: true,
  },
  {
    id: 'log-005',
    vehicle_id: 'veh-002',
    vehicle_plate: 'EV-9876',
    service_type: 'BATERIA_SISTEMA_ELETRICO',
    service_title: 'Inspeção Sistema Alta Tensão & Bateria Blade',
    date: '2024-02-18',
    odometer_km: 12000,
    workshop_name: 'ElectroCar Soluções EV Credenciada',
    technician_name: 'André Guimarães',
    cost: 380.0,
    status: 'CONCLUIDO',
    notes:
      'Diagnóstico completo das células LFP Blade, verificação do circuito de arrefecimento do inversor e firmware BMS v4.1.',
    invoice_number: 'NF-0051109',
    anti_fraud_verified: true,
  },
  {
    id: 'log-006',
    vehicle_id: 'veh-002',
    vehicle_plate: 'EV-9876',
    service_type: 'AR_CONDICIONADO',
    service_title: 'Higienização por Ozônio e Filtro de Cabine N95',
    date: '2023-10-12',
    odometer_km: 6500,
    workshop_name: 'AutoPro Centro Especializado Jardins',
    technician_name: 'Marcelo Rossi',
    cost: 160.0,
    status: 'CONCLUIDO',
    notes:
      'Higienização completa dos dutos de ventilação e substituição do elemento filtrante anti-alérgico PM2.5.',
    invoice_number: 'NF-0032901',
    anti_fraud_verified: true,
  },
  {
    id: 'log-007',
    vehicle_id: 'veh-003',
    vehicle_plate: 'CAR-2024',
    service_type: 'TROCA_OLEO_FILTRO',
    service_title: 'Troca de Óleo Castrol Edge 5W-30 LL-01 e Filtros MANN',
    date: '2024-01-14',
    odometer_km: 32100,
    workshop_name: 'M Power Garage Especializada',
    technician_name: 'Claudio Bernardes',
    cost: 890.0,
    status: 'CONCLUIDO',
    notes:
      'Troca de 5.25L de óleo sintético Castrol Edge, filtro MANN e teste de estanqueidade nas tubulações da turbina TwinPower.',
    invoice_number: 'NF-0045520',
    anti_fraud_verified: true,
  },
];

/**
 * Calculates visual states and status badge for a single tire
 */
export function getTireStatus(psi: number, isElectric = false): TireHealthStatus {
  const criticalLimit = isElectric
    ? TELEMETRY_CONSTANTS.CRITICAL_TIRE_EV_PSI
    : TELEMETRY_CONSTANTS.CRITICAL_TIRE_PSI;

  if (psi <= criticalLimit) {
    return {
      psi,
      status: 'CRITICAL',
      color: '#E5484D', // Red / Panic
      bg: 'bg-[#E5484D]/25',
      border: 'border-[#E5484D]',
      label: 'CRÍTICO',
    };
  }

  if (psi <= TELEMETRY_CONSTANTS.WARNING_TIRE_PSI) {
    return {
      psi,
      status: 'WARNING',
      color: '#E09F3E', // Amber / Warning
      bg: 'bg-[#E09F3E]/25',
      border: 'border-[#E09F3E]',
      label: 'ATENÇÃO',
    };
  }

  return {
    psi,
    status: 'NORMAL',
    color: '#2FA67A', // Protected Green
    bg: 'bg-[#2FA67A]/20',
    border: 'border-[#2FA67A]/40',
    label: 'OK',
  };
}

/**
 * Calculates battery charge state, estimated voltage and color codes
 */
export function getBatteryStatus(batteryPct: number): BatteryHealthStatus {
  const voltage =
    batteryPct > 50
      ? 12.8
      : batteryPct > 20
      ? 12.2
      : 11.4;

  if (batteryPct <= TELEMETRY_CONSTANTS.CRITICAL_BATTERY_PCT) {
    return {
      pct: batteryPct,
      voltage,
      status: 'CRITICAL',
      color: '#E5484D',
      bg: 'bg-[#E5484D]/20',
      label: 'BATERIA CRÍTICA',
    };
  }

  if (batteryPct <= TELEMETRY_CONSTANTS.WARNING_BATTERY_PCT) {
    return {
      pct: batteryPct,
      voltage,
      status: 'WARNING',
      color: '#E09F3E',
      bg: 'bg-[#E09F3E]/20',
      label: 'CARGA BAIXA',
    };
  }

  return {
    pct: batteryPct,
    voltage,
    status: 'NORMAL',
    color: '#2FA67A',
    bg: 'bg-[#2FA67A]/20',
    label: 'ESTÁVEL',
  };
}

/**
 * Calculates oil and revision progress, remaining kilometers and lubricant spec
 */
export function getOilRevisionStatus(
  odometerKm: number,
  nextRevisionKm: number,
  propulsion: PropulsionType
): OilRevisionHealthStatus {
  const remainingKm = Math.max(0, nextRevisionKm - odometerKm);
  const spec =
    propulsion === 'HIBRIDO'
      ? '0W-20 Sintético'
      : propulsion === 'ELETRICO'
      ? 'Fluido Térmico EV'
      : '5W-30 Sintético';

  const progressPct = Math.min(100, Math.max(0, (remainingKm / 10000) * 100));

  if (remainingKm <= TELEMETRY_CONSTANTS.OIL_CRITICAL_KM) {
    return {
      remainingKm,
      progressPct,
      spec,
      status: 'CRITICAL',
      color: '#E5484D',
      label: 'REVISÃO URGENTE',
    };
  }

  if (remainingKm <= TELEMETRY_CONSTANTS.OIL_WARNING_KM) {
    return {
      remainingKm,
      progressPct,
      spec,
      status: 'WARNING',
      color: '#E09F3E',
      label: 'PRÓXIMA REVISÃO',
    };
  }

  return {
    remainingKm,
    progressPct,
    spec,
    status: 'NORMAL',
    color: '#2FA67A',
    label: 'CONFORME',
  };
}

/**
 * Calculates brake pad wear status
 */
export function getBrakePadStatus(brakePadMm: number): BrakePadHealthStatus {
  if (brakePadMm <= TELEMETRY_CONSTANTS.BRAKE_PAD_CRITICAL_MM) {
    return {
      mm: brakePadMm,
      status: 'CRITICAL',
      color: '#E5484D',
      label: 'DESGASTE CRÍTICO',
    };
  }

  if (brakePadMm <= TELEMETRY_CONSTANTS.BRAKE_PAD_WARNING_MM) {
    return {
      mm: brakePadMm,
      status: 'WARNING',
      color: '#E09F3E',
      label: 'DESGASTE ACENTUADO',
    };
  }

  return {
    mm: brakePadMm,
    status: 'NORMAL',
    color: '#2FA67A',
    label: 'REGULAR',
  };
}

/**
 * Returns overall engine relay cut status
 */
export function getEngineStatus(vehicle: Vehicle): EngineStatus {
  if (vehicle.panic_mode_active) {
    return {
      connected: vehicle.engine_cut_connected,
      locked: vehicle.doors_locked,
      panic: true,
      color: '#E5484D',
      label: 'MODO PÂNICO ATIVO',
    };
  }

  if (!vehicle.engine_cut_connected) {
    return {
      connected: false,
      locked: vehicle.doors_locked,
      panic: false,
      color: '#E09F3E',
      label: 'GATEWAY OFFLINE',
    };
  }

  return {
    connected: true,
    locked: vehicle.doors_locked,
    panic: false,
    color: '#2FA67A',
    label: 'CONECTADO',
  };
}

/**
 * Evaluates in-memory alerts based on updated vehicle readings and thresholds
 */
export function evaluateVehicleTelemetryAlerts(
  vehicle: Vehicle,
  reading: VehicleReading
): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = [];
  const isElectric = vehicle.propulsion === 'ELETRICO';

  // 1. Check all 4 tires
  const tires = [
    { name: 'FL (Diant. Esq.)', psi: reading.tire_fl_psi },
    { name: 'FR (Diant. Dir.)', psi: reading.tire_fr_psi },
    { name: 'RL (Tras. Esq.)', psi: reading.tire_rl_psi },
    { name: 'RR (Tras. Dir.)', psi: reading.tire_rr_psi },
  ];

  const criticalLimit = isElectric
    ? TELEMETRY_CONSTANTS.CRITICAL_TIRE_EV_PSI
    : TELEMETRY_CONSTANTS.CRITICAL_TIRE_PSI;

  for (const t of tires) {
    if (t.psi <= criticalLimit) {
      alerts.push({
        id: `alt-tire-crit-${t.name}-${vehicle.id}`,
        vehicle_id: vehicle.id,
        component: 'PNEU',
        severity: 'CRITICO',
        message: `Risco Crítico de Destalonamento em ${t.name}: ${t.psi.toFixed(1)} PSI (abaixo do limiar de ${criticalLimit} PSI).`,
        status: 'ACTIVE',
        sensor_reading: `${t.psi.toFixed(1)} PSI`,
        nominal_value: `${TELEMETRY_CONSTANTS.NOMINAL_TIRE_PSI} PSI`,
        tolerance: '±2.0 PSI',
      });
    } else if (t.psi <= TELEMETRY_CONSTANTS.WARNING_TIRE_PSI) {
      alerts.push({
        id: `alt-tire-warn-${t.name}-${vehicle.id}`,
        vehicle_id: vehicle.id,
        component: 'PNEU',
        severity: 'PREVENTIVO',
        message: `Pressão baixa detectada em ${t.name}: ${t.psi.toFixed(1)} PSI. Recomenda-se calibrar.`,
        status: 'ACTIVE',
        sensor_reading: `${t.psi.toFixed(1)} PSI`,
        nominal_value: `${TELEMETRY_CONSTANTS.NOMINAL_TIRE_PSI} PSI`,
        tolerance: '±2.0 PSI',
      });
    }
  }

  // 2. Check engine oil / revision
  if (vehicle.propulsion !== 'ELETRICO') {
    const remainingKm = Math.max(0, vehicle.next_revision_km - vehicle.odometer_km);
    const oilSpec = vehicle.propulsion === 'HIBRIDO' ? '0W-20 Sintético' : '5W-30 Sintético';

    if (remainingKm <= TELEMETRY_CONSTANTS.OIL_CRITICAL_KM) {
      alerts.push({
        id: `alt-oil-crit-${vehicle.id}`,
        vehicle_id: vehicle.id,
        component: 'OLEO',
        severity: 'CRITICO',
        message: `Revisão do Motor Vencendo em ${remainingKm} km! Troca de óleo ${oilSpec} e filtro obrigatória.`,
        status: 'ACTIVE',
        sensor_reading: `${vehicle.odometer_km} km`,
        nominal_value: `${vehicle.next_revision_km} km`,
        tolerance: '0 km',
      });
    } else if (remainingKm <= TELEMETRY_CONSTANTS.OIL_WARNING_KM) {
      alerts.push({
        id: `alt-oil-warn-${vehicle.id}`,
        vehicle_id: vehicle.id,
        component: 'OLEO',
        severity: 'PREVENTIVO',
        message: `Próxima revisão em ${remainingKm} km. Agende a substituição preventiva de óleo (${oilSpec}).`,
        status: 'ACTIVE',
        sensor_reading: `${vehicle.odometer_km} km`,
        nominal_value: `${vehicle.next_revision_km} km`,
        tolerance: '±500 km',
      });
    }
  }

  // 3. Check brake pads
  if (reading.brake_pad_mm <= TELEMETRY_CONSTANTS.BRAKE_PAD_CRITICAL_MM) {
    alerts.push({
      id: `alt-brake-crit-${vehicle.id}`,
      vehicle_id: vehicle.id,
      component: 'FREIO',
      severity: 'CRITICO',
      message: `Espessura das pastilhas de freio crítica: ${reading.brake_pad_mm.toFixed(1)} mm. Risco iminente de perda de frenagem.`,
      status: 'ACTIVE',
      sensor_reading: `${reading.brake_pad_mm.toFixed(1)} mm`,
      nominal_value: '10.0 mm',
      tolerance: '> 3.0 mm',
    });
  } else if (reading.brake_pad_mm <= TELEMETRY_CONSTANTS.BRAKE_PAD_WARNING_MM) {
    alerts.push({
      id: `alt-brake-warn-${vehicle.id}`,
      vehicle_id: vehicle.id,
      component: 'FREIO',
      severity: 'PREVENTIVO',
      message: `Desgaste acentuado das pastilhas: ${reading.brake_pad_mm.toFixed(1)} mm. Programe substituição preventiva.`,
      status: 'ACTIVE',
      sensor_reading: `${reading.brake_pad_mm.toFixed(1)} mm`,
      nominal_value: '10.0 mm',
      tolerance: '> 4.5 mm',
    });
  }

  // 4. Check battery
  if (reading.battery_pct <= TELEMETRY_CONSTANTS.CRITICAL_BATTERY_PCT) {
    alerts.push({
      id: `alt-bat-crit-${vehicle.id}`,
      vehicle_id: vehicle.id,
      component: 'BATERIA',
      severity: 'CRITICO',
      message: `Carga residual da bateria crítica: ${reading.battery_pct}% (11.4V). Conecte imediatamente para evitar descarga profunda.`,
      status: 'ACTIVE',
      sensor_reading: `${reading.battery_pct}%`,
      nominal_value: '> 80%',
      tolerance: '> 20%',
    });
  } else if (reading.battery_pct <= TELEMETRY_CONSTANTS.WARNING_BATTERY_PCT) {
    alerts.push({
      id: `alt-bat-warn-${vehicle.id}`,
      vehicle_id: vehicle.id,
      component: 'BATERIA',
      severity: 'PREVENTIVO',
      message: `Carga da bateria baixa: ${reading.battery_pct}%. Estabilidade térmica e células em monitoramento.`,
      status: 'ACTIVE',
      sensor_reading: `${reading.battery_pct}%`,
      nominal_value: '> 80%',
      tolerance: '> 35%',
    });
  }

  return alerts;
}

/**
 * Pure simulation state update function.
 * Calculates next state, updates readings and generates maintenance alerts instantly.
 */
export function simulateTelemetryChange(
  currentReading: VehicleReading,
  vehicle: Vehicle,
  action: TelemetrySimulationAction
): {
  updatedReading: VehicleReading;
  updatedVehicle: Vehicle;
  alerts: MaintenanceAlert[];
  message: string;
} {
  const updatedReading: VehicleReading = {
    ...currentReading,
    id: `read-sim-${Date.now()}`,
    recorded_at: new Date().toISOString(),
    is_simulated: true,
  };

  const updatedVehicle: Vehicle = {
    ...vehicle,
  };

  let message = '';

  switch (action) {
    case 'PNEU_BAIXO':
      // Drop Front Left tire to 24.5 PSI (triggers critical blowout alert)
      updatedReading.tire_fl_psi = 24.5;
      message = 'Anomalia aplicada: Pneu Dianteiro Esquerdo (FL) despressurizado para 24.5 PSI (Crítico).';
      break;

    case 'OLEO_PROXIMO':
      // Set remaining revision km to 80 km (triggers critical revision alert)
      updatedVehicle.odometer_km = updatedVehicle.next_revision_km - 80;
      message = 'Anomalia aplicada: Odômetro avançado para 80 km da revisão obrigatória.';
      break;

    case 'BATERIA_FRACA':
      // Drop battery to 14% SoC and 11.4V
      updatedReading.battery_pct = 14;
      message = 'Anomalia aplicada: Bateria com carga residual crítica de 14% SoC (11.4V).';
      break;

    case 'CALIBRAR_TUDO':
      // Reset all 4 tires to nominal 33.0 PSI, battery to 95%, pads to 8.0mm, revision to +10.000km
      updatedReading.tire_fl_psi = 33.0;
      updatedReading.tire_fr_psi = 33.0;
      updatedReading.tire_rl_psi = 33.0;
      updatedReading.tire_rr_psi = 33.0;
      updatedReading.battery_pct = 95;
      updatedReading.brake_pad_mm = 8.0;
      updatedVehicle.next_revision_km = updatedVehicle.odometer_km + 10000;
      message = 'Calibração concluída: Todos os sensores calibrados com valores nominais de fábrica.';
      break;
  }

  updatedVehicle.latestReading = updatedReading;
  const alerts = evaluateVehicleTelemetryAlerts(updatedVehicle, updatedReading);

  return {
    updatedReading,
    updatedVehicle,
    alerts,
    message,
  };
}

/**
 * Generates a clean CSV-formatted report string summarizing telemetry data for the vehicle.
 * Includes UTF-8 BOM so Excel and spreadsheet applications display Portuguese accents properly.
 */
export function generateTelemetryCsvReport(
  vehicle: Vehicle,
  tripsData: any
): string {
  const chartData = tripsData?.chartData || [];
  const exportDate = new Date().toLocaleString('pt-BR');

  const metaRows = [
    `"Relatório de Telemetria Automotiva - CarCity Web"`,
    `"Veículo:","${vehicle.brand} ${vehicle.model} (${vehicle.model_year}) - Placa: ${vehicle.plate}"`,
    `"Propulsão:","${vehicle.propulsion}"`,
    `"Período:","Últimos 6 Meses de Telemetria IoT"`,
    `"Data de Extração:","${exportDate}"`,
    `"Total de Deslocamentos:","${chartData.length}"`,
    `"Total Rodado no Período:","${tripsData?.totalDistanceKm || 0} km"`,
    `"Tempo Total em Trânsito:","${tripsData?.totalTransitTimeMin || 0} min (${((tripsData?.totalTransitTimeMin || 0) / 60).toFixed(1)} horas)"`,
    `"Consumo Médio Registrado:","${tripsData?.avgEfficiency || 0} ${vehicle.propulsion === 'ELETRICO' ? 'kWh/100km' : 'km/L'}"`,
    `""`,
  ];

  const headers = [
    '"Data / Registro"',
    '"Veículo"',
    '"Placa"',
    '"Propulsão"',
    '"Distância do Deslocamento (km)"',
    '"Quilometragem Acumulada (km)"',
    '"Duração em Trânsito (min)"',
    '"Duração Formatada"',
    '"Consumo / Eficiência"',
    '"Unidade"',
    '"Desgaste Estimado Pneus (mm)"',
    '"Desgaste Estimado Pastilhas (mm)"',
  ];

  const dataRows = chartData.map((item: any) => [
    `"${item.fullDate || item.date}"`,
    `"${vehicle.brand} ${vehicle.model}"`,
    `"${vehicle.plate}"`,
    `"${vehicle.propulsion}"`,
    item.km,
    item.cumulativeKm,
    item.durationMin,
    `"${item.durationFormatted || item.durationMin + ' min'}"`,
    item.efficiency,
    `"${item.efficiencyUnit || (vehicle.propulsion === 'ELETRICO' ? 'kWh/100km' : 'km/L')}"`,
    `"${item.tireWearMm || ((item.km / 1000) * 0.12).toFixed(3)}"`,
    `"${item.brakeWearMm || ((item.km / 1000) * 0.08).toFixed(3)}"`,
  ]);

  // Prepend UTF-8 BOM (\uFEFF) to guarantee correct character encoding
  return (
    '\uFEFF' +
    [...metaRows, headers.join(','), ...dataRows.map((r: any) => r.join(','))].join('\r\n')
  );
}

// ==========================================
// B2B CREDITED WORKSHOP - AUTOTECH PREMIUM LTDA
// ==========================================

export const MODEL_WORKSHOP_AUTOTECH: Workshop = {
  id: 'ws-autotech-001',
  owner_user_id: 'usr-workshop-001',
  razao_social: 'AutoTech Centro Automotivo Especializado LTDA',
  nome_fantasia: 'AutoTech Premium - Unidade Jardins',
  cnpj: '12.345.678/0001-90',
  address: 'Av. Brig. Faria Lima, 3477 - Itaim Bibi, São Paulo - SP',
  latitude: -23.5874,
  longitude: -46.6821,
  rating: 4.9,
  reviews_count: 142,
  phone: '(11) 98765-4321',
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
  gallery: [
    {
      id: 'gal-1',
      label: 'Fachada Principal',
      url: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'gal-2',
      label: 'Elevadores Hidráulicos',
      url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'gal-3',
      label: 'Scanner de Bateria EV',
      url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'gal-4',
      label: 'Certificados CREA/CFT',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    },
  ],
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

export const MOCK_WORKSHOP_KANBAN_APPOINTMENTS: Appointment[] = [
  // 1. PENDENTE / NOVAS SOLICITAÇÕES
  {
    id: 'apt-kb-001',
    driver_user_id: 'usr-driver-001',
    driver_name: 'Carlos Eduardo Silveira',
    driver_plan: 'ADVANCED',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-001',
    vehicle_model: 'Toyota Corolla Cross Hybrid 2024',
    vehicle_plate: 'ABC-1D23',
    service_summary: 'Calibragem TPMS + Alerta de Óleo (Revisão 30.000 km)',
    status: 'PENDING',
    discount_percent: 20,
    distance_km: 1.8,
    benefit_label: 'Plano Advanced (20% OFF)',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    messages: [
      {
        id: 'msg-k-01',
        appointment_id: 'apt-kb-001',
        sender_user_id: 'usr-driver-001',
        sender_name: 'Carlos Eduardo Silveira',
        sender_role: 'DRIVER',
        body: 'Olá equipe AutoTech! O painel CarCity alertou que a revisão de 30.000 km está a 1.200 km de vencer e um pneu oscilou a pressão. O desconto do Plano Advanced é aplicado direto na proposta?',
        created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      },
      {
        id: 'msg-k-02',
        sender_user_id: 'usr-workshop-001',
        appointment_id: 'apt-kb-001',
        sender_name: 'AutoTech Premium (Consultor Técnico)',
        sender_role: 'WORKSHOP_OWNER',
        body: 'Olá Carlos! Sim, o benefício do Plano Advanced garante 20% OFF na mão de obra e itens de revisão homologados. Estamos montando a sua proposta oficial agora mesmo!',
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      },
    ],
  },
  {
    id: 'apt-kb-002',
    driver_user_id: 'usr-driver-002',
    driver_name: 'Mariana Costa',
    driver_plan: 'STANDARD',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-byd-002',
    vehicle_model: 'BYD Dolphin EV 2024',
    vehicle_plate: 'EV-9876',
    service_summary: 'Checkup de Carga Residual e Bateria 12V',
    status: 'PENDING',
    discount_percent: 10,
    distance_km: 2.4,
    benefit_label: 'Plano Standard (10% OFF)',
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },

  // 2. EM ANÁLISE / ORÇAMENTO
  {
    id: 'apt-kb-003',
    driver_user_id: 'usr-driver-003',
    driver_name: 'Roberto Alves',
    driver_plan: 'ADVANCED',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-bmw-003',
    vehicle_model: 'BMW 320i M Sport 2023',
    vehicle_plate: 'CAR-2024',
    service_summary: 'Troca Preditiva de Pastilhas de Freio (Sensor acusa 3.4 mm)',
    status: 'IN_REVIEW',
    discount_percent: 20,
    distance_km: 3.1,
    benefit_label: 'Plano Advanced (20% OFF)',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    service_cost: 920.0,
  },

  // 3. APROVADO PELO MOTORISTA (2 atendimentos confirmados aguardando recepção)
  {
    id: 'apt-kb-004',
    driver_user_id: 'usr-driver-004',
    driver_name: 'Juliana Mendes',
    driver_plan: 'ADVANCED',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-004',
    vehicle_model: 'Honda HR-V Touring 2023',
    vehicle_plate: 'XYZ-5A67',
    service_summary: 'Revisão Periódica 40.000 km + Troca de Fluidos Arrefecimento',
    status: 'APPROVED',
    discount_percent: 20,
    distance_km: 2.8,
    benefit_label: 'Plano Advanced (20% OFF)',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    service_cost: 750.0,
  },
  {
    id: 'apt-kb-005',
    driver_user_id: 'usr-driver-005',
    driver_name: 'Fernando Rocha',
    driver_plan: 'STANDARD',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-005',
    vehicle_model: 'Jeep Compass Longitude 2023',
    vehicle_plate: 'JEP-7K89',
    service_summary: 'Alinhamento 3D + Calibragem de Sensores de Roda TPMS',
    status: 'APPROVED',
    discount_percent: 10,
    distance_km: 4.2,
    benefit_label: 'Plano Standard (10% OFF)',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    service_cost: 320.0,
  },

  // 4. EM MANUTENÇÃO (NA OFICINA - 2 veículos em execução com barra de progresso)
  {
    id: 'apt-kb-006',
    driver_user_id: 'usr-driver-006',
    driver_name: 'Patrícia Lima',
    driver_plan: 'ADVANCED',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-006',
    vehicle_model: 'Volvo XC60 Recharge Híbrido 2024',
    vehicle_plate: 'EVX-1010',
    service_summary: 'Diagnóstico e Balanceamento de Módulos EV + Pastilhas Cerâmica',
    status: 'IN_MAINTENANCE',
    discount_percent: 20,
    distance_km: 1.5,
    progress_pct: 75,
    benefit_label: 'Box EV #02 (Elevador 1)',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
    service_cost: 1480.0,
  },
  {
    id: 'apt-kb-007',
    driver_user_id: 'usr-driver-007',
    driver_name: 'Lucas Albuquerque',
    driver_plan: 'STANDARD',
    workshop_id: 'ws-autotech-001',
    workshop_name: 'AutoTech Premium - Unidade Jardins',
    vehicle_id: 'veh-007',
    vehicle_model: 'Volkswagen Nivus TSI 2023',
    vehicle_plate: 'VW-4321',
    service_summary: 'Troca de Óleo 5W-40 + Filtros e Discos Dianteiros',
    status: 'IN_MAINTENANCE',
    discount_percent: 10,
    distance_km: 3.5,
    progress_pct: 40,
    benefit_label: 'Box Mecânico #01 (Elevador 2)',
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
    service_cost: 690.0,
  },

  // 5. CONCLUÍDO (Histórico com 15 atendimentos finalizados)
  ...Array.from({ length: 15 }).map((_, idx) => {
    const drivers = [
      'Renato Siqueira',
      'Camila Nogueira',
      'Guilherme Prado',
      'Beatriz Vasconcelos',
      'Thiago Barbosa',
      'Amanda Farias',
      'Eduardo Pinheiro',
      'Larissa Fonseca',
      'Felipe Antunes',
      'Letícia Moreira',
      'Marcos Castro',
      'Débora Lins',
      'Vinícius Braga',
      'Cláudia Rezende',
      'Gabriel Duarte',
    ];
    const cars = [
      'Toyota Corolla Altis 2023',
      'Honda Civic Touring 2022',
      'Hyundai Creta N-Line 2024',
      'Chevrolet Tracker Premier 2023',
      'Nissan Kicks Exclusive 2023',
      'Peugeot 208 GT EV 2023',
      'Jeep Renegade Trailhawk 2022',
      'Audi A3 Sedan S-Line 2023',
      'Volkswagen Taos Highline 2023',
      'BMW X1 sDrive20i 2024',
      'BYD Song Plus DM-i 2024',
      'Caoa Chery Tiggo 8 Pro 2023',
      'Renault Megane E-Tech 2024',
      'Fiat Fastback Abarth 2023',
      'Mercedes-Benz C200 AMG 2023',
    ];
    const services = [
      'Revisão dos 20.000 km e Geometria 3D',
      'Troca de Discos e Pastilhas com Selo Anti-Fraude',
      'Substituição de Óleo 0W-20 + Filtro de Cabine',
      'Diagnóstico Preditivo de Injeção e Sensor TPMS',
      'Alinhamento, Balanceamento e Rodízio de Pneus',
    ];
    const dateOffsetDays = 1 + idx * 2;
    return {
      id: `apt-hist-${String(idx + 1).padStart(3, '0')}`,
      driver_user_id: `usr-hist-driver-${idx + 1}`,
      driver_name: drivers[idx] || `Motorista #${idx + 1}`,
      driver_plan: (idx % 2 === 0 ? 'ADVANCED' : 'STANDARD') as any,
      workshop_id: 'ws-autotech-001',
      workshop_name: 'AutoTech Premium - Unidade Jardins',
      vehicle_id: `veh-hist-${idx + 1}`,
      vehicle_model: cars[idx] || 'Veículo Homologado',
      vehicle_plate: `ABC-${idx + 1}K99`,
      service_summary: services[idx % services.length],
      status: 'COMPLETED' as const,
      discount_percent: idx % 2 === 0 ? 20 : 10,
      service_cost: 380 + (idx * 65) % 800,
      created_at: new Date(Date.now() - (dateOffsetDays + 1) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - dateOffsetDays * 86400000).toISOString(),
    };
  }),
];

export const MOCK_CMS_B2B_ARTICLES: Article[] = [
  {
    id: 'art-b2b-001',
    author_user_id: 'usr-admin-001',
    author_name: 'Equipe Técnica CMS',
    title: 'Procedimento Padrão para Diagnóstico Preditivo em Baterias de Veículos Elétricos',
    slug: 'diagnostico-preditivo-baterias-veiculos-eletricos',
    content: `## Manual de Homologação de Células de Alta Tensão (EV)
Publicado pela diretoria de engenharia CarCity para oficinas credenciadas e centros técnicos parceiros.

### 1. Parâmetros Nominais de Tolerância
A resistência interna das células LFP e NMC não deve sofrer divergência superior a 8 mΩ entre o módulo mais equilibrado e o de menor capacitância. O monitoramento contínuo via telemetria OBD-II envia eventos de alerta quando o State of Health (SoH) atinge o patamar de 80%.

### 2. Passo a Passo do Protocolo de Segurança
1. Desarmar a trava de alta tensão (Manual Service Disconnect - MSD) antes de conectar o scanner dedicado.
2. Aferir a temperatura do pack térmico em repouso (faixa ideal: 22°C a 28°C).
3. Conectar a ponte de impedância de 4 pontas e registrar o laudo digital no sistema CarCity para validação do Selo Anti-Fraude.

### 3. Emissão de Certificado Técnico
Após a conclusão do diagnóstico preditivo, o sistema vincula o laudo ao histórico do veículo, liberando o carimbo de garantia para o motorista no aplicativo.`,
    category: 'MANUTENCAO',
    status: 'PUBLISHED',
    views_count: 2450,
    created_at: '2026-10-05T14:00:00.000Z',
  },
  {
    id: 'art-b2b-002',
    author_user_id: 'usr-superadmin-001',
    author_name: 'Diretoria de Segurança CarCity',
    title: 'Diretrizes de Homologação Anti-Fraude e Emissão de Laudos Preditivos 2026/2027',
    slug: 'diretrizes-homologacao-anti-fraude-laudos-2026-2027',
    content: `## Compliance e Transparência na Rede Credenciada
Regulamento obrigatório para oficinas parceiras CarCity com Selo Verified ativo.

### 1. Rastreabilidade das Peças e Fluidos
Todas as ordens de serviço geradas com descontos dos Planos Standard e Advanced devem anexar a chave de acesso da Nota Fiscal Eletrônica (NF-e) ou o número de lote do óleo utilizado.

### 2. Responsabilidade Técnica (CREA / CFT)
O credenciamento exige que o Responsável Técnico mantenha anotação de responsabilidade técnica (ART/TRT) vigente cadastrada na Central B2B. A auditoria trimestral automática verifica a regularidade cadastral junto aos conselhos profissionais.

### 3. Vantagens do Selo Verified
Oficinas com índice de aprovação documental 100% recebem prioridade máxima de roteamento no mapa de riscos de 5KM quando condutores ativam alertas preventivos de manutenção.`,
    category: 'ECONOMIA_LEIS',
    status: 'PUBLISHED',
    views_count: 3180,
    created_at: '2026-09-28T09:30:00.000Z',
  },
];

export const MOCK_WORKSHOP_ROI_STATS = {
  totalDriversServed: 142,
  grossRevenue: 88400.0,
  totalDiscountsGranted: 14200.0,
  monthlyCategoryComparison: [
    { month: 'Mai/26', standard: 14, advanced: 18, total: 32 },
    { month: 'Jun/26', standard: 18, advanced: 22, total: 40 },
    { month: 'Jul/26', standard: 16, advanced: 26, total: 42 },
    { month: 'Ago/26', standard: 20, advanced: 29, total: 49 },
    { month: 'Set/26', standard: 24, advanced: 35, total: 59 },
    { month: 'Out/26', standard: 28, advanced: 42, total: 70 },
  ],
};

// ==========================================
// CMS Admin & Portal Official Content Mock Data (Bloco 3)
// ==========================================

export const MOCK_CMS_ARTICLES_LIST: Article[] = [
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

export const MOCK_CMS_REPORTED_CONTENT: ContentReport[] = [
  {
    id: 'rep-cms-001',
    target_type: 'POST',
    target_id: 'post-corolla-freios',
    target_title_or_snippet: 'Barulho ao frear o Corolla Cross em dias chuvosos...',
    author_name: 'Carlos Eduardo',
    reporter_user_id: 'usr-mod-system',
    reporter_name: 'Auditoria de Qualidade',
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

export const MOCK_CMS_FORUM_METRICS = {
  totalTopics: 1240,
  pendingAnalysis: 4,
  hiddenContent: 12,
  openReports: 2,
};

export const MOCK_CMS_DIY_VIDEOS: DiyVideo[] = [
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

export const MOCK_CMS_SEARCH_ANALYTICS: SearchKeywordAnalytics[] = [
  { term: 'IPCA 2026', searches: 1420 },
  { term: 'Seguro EV / Bateria', searches: 980 },
  { term: 'Pressão Pneu Corolla', searches: 850 },
  { term: 'Corte de Motor Remoto', searches: 620 },
];

export const MOCK_CMS_CATEGORY_VIEWS_30D = [
  { date: '10/Set', ECONOMIA_LEIS: 420, SEGURANCA: 680, MANUTENCAO: 310, total: 1410 },
  { date: '15/Set', ECONOMIA_LEIS: 580, SEGURANCA: 790, MANUTENCAO: 390, total: 1760 },
  { date: '20/Set', ECONOMIA_LEIS: 690, SEGURANCA: 850, MANUTENCAO: 480, total: 2020 },
  { date: '25/Set', ECONOMIA_LEIS: 840, SEGURANCA: 960, MANUTENCAO: 610, total: 2410 },
  { date: '30/Set', ECONOMIA_LEIS: 980, SEGURANCA: 1120, MANUTENCAO: 750, total: 2850 },
  { date: '05/Out', ECONOMIA_LEIS: 1250, SEGURANCA: 1380, MANUTENCAO: 920, total: 3550 },
  { date: '08/Out', ECONOMIA_LEIS: 1420, SEGURANCA: 1590, MANUTENCAO: 1080, total: 4090 },
];



