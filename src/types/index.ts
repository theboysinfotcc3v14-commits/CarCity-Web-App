export type UserRole = 'DRIVER' | 'WORKSHOP_OWNER' | 'ADMIN' | 'SUPER_ADMIN';

export type UserPlan = 'BASIC' | 'STANDARD' | 'ADVANCED';

export type ThemePreference = 'DARK' | 'LIGHT';

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  cpf_cnpj: string;
  must_change_password?: boolean;
  theme_preference: ThemePreference;
  plan: UserPlan;
  is_active: boolean;
  token_version: number;
  created_at: string;
  totp_enabled?: boolean;
  permissions?: string[];
}

export type PropulsionType = 'COMBUSTAO' | 'HIBRIDO' | 'ELETRICO';

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  model_year: number;
  plate: string;
  propulsion: PropulsionType;
  odometer_km: number;
  next_revision_km: number;
  parked_latitude: number;
  parked_longitude: number;
  engine_cut_connected: boolean;
  doors_locked: boolean;
  panic_mode_active: boolean;
  latestReading?: VehicleReading;
  alertsCount?: number;
  criticalAlertsCount?: number;
  hasCriticalAlert?: boolean;
}

export interface VehicleReading {
  id: string;
  vehicle_id: string;
  recorded_at: string;
  tire_fl_psi: number;
  tire_fr_psi: number;
  tire_rl_psi: number;
  tire_rr_psi: number;
  battery_pct: number;
  brake_pad_mm: number;
  engine_cut_connected: boolean;
  is_simulated: boolean;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  started_at: string;
  distance_km: number;
  duration_min: number;
  efficiency: number; // kWh/100km or L/100km
}

export type AlertComponent = 'PNEU' | 'OLEO' | 'FREIO' | 'BATERIA' | 'GEOFENCE' | 'SEGURANCA';
export type AlertSeverity = 'PREVENTIVO' | 'CRITICO';
export type AlertStatus = 'ACTIVE' | 'SNOOZED' | 'RESOLVED';

export interface MaintenanceAlert {
  id: string;
  vehicle_id: string;
  component: AlertComponent;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  snoozed_until?: string | null;
  sensor_reading?: string;
  nominal_value?: string;
  tolerance?: string;
  description?: string;
  suggested_action?: string;
  created_at?: string;
}

export type CommandType =
  | 'CORTE_MOTOR'
  | 'TRANCAR_PORTAS'
  | 'MODO_PANICO_5KM'
  | 'ACIONAR_POLICIA_BLOQUEIO_TOTAL';

export type CommandStatus = 'REQUESTED' | 'CONFIRMED' | 'EXECUTED' | 'FAILED';

export interface VehicleCommand {
  id: string;
  vehicle_id: string;
  requested_by: string;
  command: CommandType;
  status: CommandStatus;
  gateway_response: string;
  created_at: string;
  executed_at?: string | null;
}

export type RiskType = 'FURTO' | 'ROUBO' | 'OUTRO';

export type MaintenanceServiceType =
  | 'REVISAO_PERIODICA'
  | 'TROCA_OLEO_FILTRO'
  | 'FREIOS_PASTILHAS'
  | 'PNEUS_BALANCEAMENTO'
  | 'BATERIA_SISTEMA_ELETRICO'
  | 'SUSPENSAO_DIRECAO'
  | 'AR_CONDICIONADO'
  | 'OUTRO';

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  vehicle_plate?: string;
  service_type: MaintenanceServiceType;
  service_title: string;
  date: string;
  odometer_km: number;
  workshop_name: string;
  technician_name?: string;
  cost: number;
  status: 'CONCLUIDO' | 'AGENDADO' | 'EM_ANDAMENTO';
  notes: string;
  invoice_number?: string;
  anti_fraud_verified?: boolean;
}

export interface RiskReport {
  id: string;
  reporter_user_id: string;
  reporter_name?: string;
  reporter_plan?: UserPlan;
  risk_type: RiskType;
  latitude: number;
  longitude: number;
  description: string;
  created_at: string;
}

export type WorkshopStatus = 'PENDING_APPROVAL' | 'VERIFIED' | 'REJECTED';

export type WorkshopDocKind =
  | 'ALVARA'
  | 'RT_CFT_CREA'
  | 'FOTO_FACHADA'
  | 'FOTO_INSTALACOES'
  | 'CERTIFICADO_TECNICO';

export interface WorkshopDoc {
  id: string;
  workshop_id: string;
  kind: WorkshopDocKind;
  file_url: string;
  file_name?: string;
  uploaded_at: string;
  status?: 'PENDING' | 'VALIDATED' | 'REJECTED';
}

export interface WorkshopOffer {
  workshop_id: string;
  tier: 'STANDARD' | 'ADVANCED';
  discount_percent: number;
  is_active: boolean;
}

export interface Workshop {
  id: string;
  owner_user_id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj?: string;
  address: string;
  latitude: number;
  longitude: number;
  specialties: string[];
  status: WorkshopStatus;
  review_feedback?: string | null;
  deleted_at?: string | null;
  documents?: WorkshopDoc[];
  offers?: WorkshopOffer[];
  drivers_served_count?: number;
  benefits_revenue?: number;
  rating?: number;
  reviews_count?: number;
  phone?: string;
  email?: string;
  gallery?: { id: string; label: string; url: string }[];
}

export type AppointmentStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'IN_MAINTENANCE'
  | 'COMPLETED';

export interface AppointmentMessage {
  id: string;
  appointment_id: string;
  sender_user_id: string;
  sender_name?: string;
  sender_role?: UserRole;
  body: string;
  quote_amount?: number | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  driver_user_id: string;
  driver_name?: string;
  driver_plan?: UserPlan;
  workshop_id: string;
  workshop_name?: string;
  vehicle_id: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  service_summary: string;
  status: AppointmentStatus;
  discount_percent: number;
  created_at: string;
  updated_at: string;
  messages?: AppointmentMessage[];
  distance_km?: number;
  benefit_label?: string;
  progress_pct?: number;
  service_cost?: number;
}

export type ArticleCategory = 'ECONOMIA_LEIS' | 'SEGURANCA' | 'MANUTENCAO';
export type ArticleStatus = 'PUBLISHED' | 'DRAFT';
export type ArticleAudience = 'ALL' | 'DRIVER' | 'WORKSHOP_OWNER';

export interface Article {
  id: string;
  author_user_id: string;
  author_name?: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  views_count: number;
  audience?: ArticleAudience;
  target_audience?: ('DRIVER' | 'WORKSHOP_OWNER')[];
  cover_image_url?: string;
  created_at: string;
  deleted_at?: string | null;
}

export type PostType = 'FORUM' | 'DIY';
export type PostTag =
  | 'SEGURANCA'
  | 'HIBRIDOS_ELETRICOS'
  | 'MANUTENCAO'
  | 'LEIS_IPCA';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_plan: UserPlan;
  content: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  user_plan: UserPlan;
  type: PostType;
  title: string;
  content: string;
  tags: PostTag[];
  youtube_url?: string | null;
  likes_count: number;
  is_hidden: boolean;
  created_at: string;
  deleted_at?: string | null;
  comments?: PostComment[];
  user_has_liked?: boolean;
}

export interface ContentReport {
  id: string;
  target_type: 'POST' | 'COMMENT';
  target_id: string;
  target_title_or_snippet?: string;
  author_name?: string;
  reporter_user_id: string;
  reporter_name?: string;
  reason: string;
  reports_count?: number;
  status: 'OPEN' | 'KEPT' | 'HIDDEN' | 'DELETED';
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface DiyVideo {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_id: string;
  category: 'Manutenção Básica' | 'Eletrônica & Telemetria' | 'Cuidados EV/Híbridos' | 'Pneus & Calibragem';
  views_count: number;
  is_active: boolean;
  created_at: string;
}

export interface SearchKeywordAnalytics {
  term: string;
  searches: number;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name?: string;
  actor_role?: UserRole;
  impersonated: boolean;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, any>;
  ip: string;
  created_at: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  status?: 'EXECUTADO' | 'SUCESSO' | 'ALERTA' | 'FALHA' | 'INFO';
}

export interface SearchLog {
  id: string;
  term: string;
  user_id?: string;
  created_at: string;
}

export interface DecodedTokenPayload {
  sub: string;
  role: UserRole;
  permissions: string[];
  email: string;
  name: string;
  plan: UserPlan;
  iat: number;
  exp: number;
}

export interface GeofenceConfig {
  id: string;
  name: string;
  vehicle_id?: string;
  center_latitude: number;
  center_longitude: number;
  center_label: string;
  radius_km: number;
  enabled: boolean;
  action_on_breach: 'ALERT_ONLY' | 'LOCK_IGNITION' | 'DISPATCH_SECURITY';
  notify_push: boolean;
  notify_sms: boolean;
  breach_detected: boolean;
  breach_distance_km?: number;
  last_breach_timestamp?: string | null;
  created_at: string;
}
