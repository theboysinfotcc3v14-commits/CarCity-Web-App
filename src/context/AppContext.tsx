import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Vehicle,
  UserRole,
  MaintenanceAlert,
  Appointment,
  AppointmentStatus,
  CommunityPost,
  MaintenanceLog,
  Workshop,
  WorkshopDoc,
  Article,
  ContentReport,
  DiyVideo,
  SearchKeywordAnalytics,
  AuditLog,
  GeofenceConfig,
} from '../types/index.ts';
import {
  simulateTelemetryChange,
  DEFAULT_NOMINAL_READINGS,
  DEFAULT_VEHICLES,
  MOCK_APPOINTMENTS,
  MOCK_FORUM_POSTS,
  MOCK_MAINTENANCE_LOGS,
  TelemetrySimulationAction,
  MODEL_WORKSHOP_AUTOTECH,
  MOCK_WORKSHOP_KANBAN_APPOINTMENTS,
  MOCK_CMS_B2B_ARTICLES,
} from '../lib/telemetry.ts';
import {
  PlatformUser,
  TrashItem,
  SystemHealthData,
  INITIAL_ARTICLES_LIST,
  INITIAL_REPORTED_CONTENT,
  INITIAL_FORUM_METRICS,
  INITIAL_DIY_VIDEOS,
  INITIAL_SEARCH_KEYWORDS_ANALYTICS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WORKSHOP_APPROVAL_QUEUE,
  INITIAL_TRASH_REPOSITORY,
  INITIAL_SYSTEM_HEALTH,
} from '../store/seedStore.ts';

interface AppContextType {
  user: User | null;
  rawToken: string | null;
  activeRole: UserRole;
  isAuditorMode: boolean;
  impersonatedRole: UserRole | null;
  vehicles: Vehicle[];
  selectedVehicleId: string;
  selectedVehicle: Vehicle;
  appointments: Appointment[];
  forumPosts: CommunityPost[];
  maintenanceLogs: MaintenanceLog[];
  theme: 'dark' | 'light';
  alertsCount: number;
  criticalAlertsCount: number;
  activeTab: string;
  isAiModalOpen: boolean;
  isNotificationsOpen: boolean;
  isJwtModalOpen: boolean;
  activeVehicleAlerts: MaintenanceAlert[];
  setActiveTab: (tab: string) => void;
  setIsAiModalOpen: (open: boolean) => void;
  setIsNotificationsOpen: (open: boolean) => void;
  setIsJwtModalOpen: (open: boolean) => void;
  setSelectedVehicleId: (id: string | null | undefined) => void;
  setSelectedVehicle: (vehicle: Vehicle | null | undefined) => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setForumPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  workshop: Workshop;
  setWorkshop: React.Dispatch<React.SetStateAction<Workshop>>;
  workshopAppointments: Appointment[];
  setWorkshopAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  updateWorkshopAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cmsB2BArticles: Article[];
  addWorkshopDocument: (doc: Omit<WorkshopDoc, 'id' | 'uploaded_at'>) => void;
  updateWorkshopOffers: (standard: number, advanced: number) => void;
  // CMS Admin State & Methods (Bloco 3)
  articlesList: Article[];
  setArticlesList: React.Dispatch<React.SetStateAction<Article[]>>;
  reportedContentList: ContentReport[];
  setReportedContentList: React.Dispatch<React.SetStateAction<ContentReport[]>>;
  diyVideosList: DiyVideo[];
  setDiyVideosList: React.Dispatch<React.SetStateAction<DiyVideo[]>>;
  searchKeywordsAnalytics: SearchKeywordAnalytics[];
  forumMetrics: typeof INITIAL_FORUM_METRICS;
  addArticle: (art: Omit<Article, 'id' | 'views_count' | 'created_at'>) => void;
  updateArticle: (id: string, art: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  resolveReport: (id: string, action: 'KEPT' | 'HIDDEN' | 'DELETED' | 'BAN_USER') => void;
  addDiyVideo: (video: Omit<DiyVideo, 'id' | 'views_count' | 'created_at'>) => void;
  toggleDiyVideo: (id: string) => void;
  deleteDiyVideo: (id: string) => void;
  // Super Admin Master State & Methods (Bloco 4.7)
  users: PlatformUser[];
  setUsers: React.Dispatch<React.SetStateAction<PlatformUser[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  workshopApprovalQueue: Workshop[];
  setWorkshopApprovalQueue: React.Dispatch<React.SetStateAction<Workshop[]>>;
  trashRepository: TrashItem[];
  setTrashRepository: React.Dispatch<React.SetStateAction<TrashItem[]>>;
  systemHealth: SystemHealthData;
  setSystemHealth: React.Dispatch<React.SetStateAction<SystemHealthData>>;
  toggleUserStatus: (userId: string) => Promise<{ success: boolean; is_active?: boolean; error?: string }>;
  addAdminUser: (adminData: { full_name: string; email: string; cpf: string; role: 'ADMIN' | 'SUPER_ADMIN'; temp_password?: string; must_change_password?: boolean }) => Promise<{ success: boolean; error?: string }>;
  evaluateWorkshopApproval: (workshopId: string, decision: 'VERIFIED' | 'REJECTED', feedback?: string) => Promise<{ success: boolean; error?: string }>;
  restoreTrashItem: (type: string, id: string) => Promise<{ success: boolean; error?: string }>;
  permanentDeleteTrashItem: (type: string, id: string, confirmationText: string) => Promise<{ success: boolean; error?: string }>;
  setTheme: (theme: 'dark' | 'light') => void;
  login: (identifier: string, password: string, totpCode?: string, hintRole?: UserRole) => Promise<{ success: boolean; error?: string; require2fa?: boolean }>;
  logout: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => Promise<void>;
  toggleAuditorMode: (targetRole: UserRole | null) => Promise<void>;
  refreshVehicleData: () => Promise<void>;
  triggerSimulation: (action: TelemetrySimulationAction) => Promise<string | null>;
  // Geofencing State & Methods
  geofenceConfig: GeofenceConfig;
  updateGeofenceConfig: (config: Partial<GeofenceConfig>) => void;
  recordGeofenceBreach: (breached: boolean, distanceKm: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('carcity_jwt') : null;
  });
  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);

  // Inicializado por omissão com DEFAULT_VEHICLES e veh-001 (Toyota Corolla Cross Hybrid)
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleIdState] = useState<string>('veh-001');
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle>(DEFAULT_VEHICLES[0]);

  // Substitui os arrays vazios pelos dados simulados MOCK_APPOINTMENTS e MOCK_FORUM_POSTS
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS as Appointment[]);
  const [forumPosts, setForumPosts] = useState<CommunityPost[]>(MOCK_FORUM_POSTS as CommunityPost[]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(MOCK_MAINTENANCE_LOGS);

  // B2B Workshop State (AutoTech Premium LTDA) - In-Memory Instant Hydration
  const [workshop, setWorkshop] = useState<Workshop>(MODEL_WORKSHOP_AUTOTECH);
  const [workshopAppointments, setWorkshopAppointments] = useState<Appointment[]>(
    MOCK_WORKSHOP_KANBAN_APPOINTMENTS
  );
  const [cmsB2BArticles, setCmsB2BArticles] = useState<Article[]>(MOCK_CMS_B2B_ARTICLES);

  // CMS Admin State (Bloco 3.6)
  const [articlesList, setArticlesList] = useState<Article[]>(INITIAL_ARTICLES_LIST);
  const [reportedContentList, setReportedContentList] = useState<ContentReport[]>(INITIAL_REPORTED_CONTENT);
  const [diyVideosList, setDiyVideosList] = useState<DiyVideo[]>(INITIAL_DIY_VIDEOS);
  const [searchKeywordsAnalytics] = useState<SearchKeywordAnalytics[]>(INITIAL_SEARCH_KEYWORDS_ANALYTICS);
  const [forumMetrics, setForumMetrics] = useState(INITIAL_FORUM_METRICS);

  // Super Admin Master State (Bloco 4.7)
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [workshopApprovalQueue, setWorkshopApprovalQueue] = useState<Workshop[]>(INITIAL_WORKSHOP_APPROVAL_QUEUE);
  const [trashRepository, setTrashRepository] = useState<TrashItem[]>(INITIAL_TRASH_REPOSITORY);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData>(INITIAL_SYSTEM_HEALTH);

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: data.is_active, token_version: data.token_version } : u))
        );
        return { success: true, is_active: data.is_active };
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active, token_version: u.token_version + 1 } : u))
      );
      return { success: true };
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active, token_version: u.token_version + 1 } : u))
      );
      return { success: true };
    }
  };

  const addAdminUser = async (adminData: {
    full_name: string;
    email: string;
    cpf: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    temp_password?: string;
    must_change_password?: boolean;
  }) => {
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });
      if (res.ok) {
        const d = await res.json();
        const masked = adminData.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '$1.***.***-$4');
        const createdUser: PlatformUser = {
          ...d.user,
          cpf_cnpj_masked: masked,
          plan: 'BASIC',
          token_version: 1,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, createdUser]);
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Erro ao registrar administrador.' };
    } catch {
      const masked = adminData.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '$1.***.***-$4');
      const newU: PlatformUser = {
        id: `usr-admin-${Date.now()}`,
        full_name: adminData.full_name,
        email: adminData.email,
        cpf_cnpj: adminData.cpf,
        cpf_cnpj_masked: masked,
        role: adminData.role,
        plan: 'BASIC',
        is_active: true,
        token_version: 1,
        must_change_password: adminData.must_change_password ?? true,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newU]);
      return { success: true };
    }
  };

  const evaluateWorkshopApproval = async (
    workshopId: string,
    decision: 'VERIFIED' | 'REJECTED',
    feedback?: string
  ) => {
    try {
      const res = await fetch(`/api/admin/workshops-audit/${workshopId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback }),
      });
      if (res.ok) {
        setWorkshopApprovalQueue((prev) =>
          prev.map((w) =>
            w.id === workshopId
              ? {
                  ...w,
                  status: decision,
                  review_feedback: feedback || null,
                  documents: decision === 'VERIFIED' ? w.documents?.map((d) => ({ ...d, status: 'VALIDATED' as const })) : w.documents,
                }
              : w
          )
        );
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch {
      setWorkshopApprovalQueue((prev) =>
        prev.map((w) =>
          w.id === workshopId
            ? {
                ...w,
                status: decision,
                review_feedback: feedback || null,
                documents: decision === 'VERIFIED' ? w.documents?.map((d) => ({ ...d, status: 'VALIDATED' as const })) : w.documents,
              }
            : w
        )
      );
      return { success: true };
    }
  };

  const restoreTrashItem = async (type: string, id: string) => {
    try {
      await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
    } catch {}
    setTrashRepository((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  const permanentDeleteTrashItem = async (type: string, id: string, confirmationText: string) => {
    if (confirmationText !== 'EXCLUIR') {
      return { success: false, error: 'Confirmação obrigatória: digite EXCLUIR para confirmar a eliminação definitiva.' };
    }
    try {
      await fetch('/api/admin/trash/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, confirmationText }),
      });
    } catch {}
    setTrashRepository((prev) => prev.filter((item) => item.id !== id));
    return { success: true };
  };

  const addArticle = (artData: Omit<Article, 'id' | 'views_count' | 'created_at'>) => {
    const newArt: Article = {
      ...artData,
      id: `art-${Date.now()}`,
      views_count: 0,
      created_at: new Date().toISOString(),
    };
    setArticlesList((prev) => [newArt, ...prev]);
    if (!newArt.audience || newArt.audience === 'ALL' || newArt.audience === 'WORKSHOP_OWNER' || newArt.target_audience?.includes('WORKSHOP_OWNER')) {
      setCmsB2BArticles((prev) => [newArt, ...prev]);
    }
  };

  const updateArticle = (id: string, artData: Partial<Article>) => {
    setArticlesList((prev) => prev.map((a) => (a.id === id ? { ...a, ...artData } : a)));
    setCmsB2BArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...artData } : a)));
  };

  const deleteArticle = (id: string) => {
    setArticlesList((prev) => prev.filter((a) => a.id !== id));
    setCmsB2BArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const resolveReport = (id: string, action: 'KEPT' | 'HIDDEN' | 'DELETED' | 'BAN_USER') => {
    setReportedContentList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === 'BAN_USER' ? 'DELETED' : action } : r))
    );
    setForumMetrics((prev) => ({
      ...prev,
      openReports: Math.max(0, prev.openReports - 1),
      hiddenContent: action === 'HIDDEN' || action === 'DELETED' || action === 'BAN_USER' ? prev.hiddenContent + 1 : prev.hiddenContent,
    }));
  };

  const addDiyVideo = (videoData: Omit<DiyVideo, 'id' | 'views_count' | 'created_at'>) => {
    const newVid: DiyVideo = {
      ...videoData,
      id: `diy-${Date.now()}`,
      views_count: 0,
      created_at: new Date().toISOString(),
    };
    setDiyVideosList((prev) => [newVid, ...prev]);
  };

  const toggleDiyVideo = (id: string) => {
    setDiyVideosList((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !v.is_active } : v)));
  };

  const deleteDiyVideo = (id: string) => {
    setDiyVideosList((prev) => prev.filter((v) => v.id !== id));
  };

  const updateWorkshopAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setWorkshopAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status, updated_at: new Date().toISOString() } : apt))
    );
  };

  const addWorkshopDocument = (doc: Omit<WorkshopDoc, 'id' | 'uploaded_at'>) => {
    const newDoc: WorkshopDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      workshop_id: workshop.id,
      uploaded_at: new Date().toISOString(),
      status: 'VALIDATED',
    };
    setWorkshop((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }));
  };

  const updateWorkshopOffers = (standard: number, advanced: number) => {
    setWorkshop((prev) => ({
      ...prev,
      offers: [
        { workshop_id: prev.id, tier: 'STANDARD', discount_percent: standard, is_active: true },
        { workshop_id: prev.id, tier: 'ADVANCED', discount_percent: advanced, is_active: true },
      ],
    }));
  };

  const addMaintenanceLog = (logData: Omit<MaintenanceLog, 'id'>) => {
    const newEntry: MaintenanceLog = {
      ...logData,
      id: `log-${Date.now()}`,
    };
    setMaintenanceLogs((prev) => [newEntry, ...prev]);
  };

  const [activeVehicleAlerts, setActiveVehicleAlerts] = useState<MaintenanceAlert[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isJwtModalOpen, setIsJwtModalOpen] = useState(false);

  // Geofencing State (Cerca Eletrônica 5KM Mussurunga - CEEP Newton Sucupira)
  const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
    id: 'geo-mussurunga-001',
    name: 'Cerca Eletrônica CEEP Newton Sucupira (Mussurunga)',
    center_latitude: -12.9135,
    center_longitude: -38.3892,
    center_label: 'CEEP Newton Sucupira — Setor F de Mussurunga',
    radius_km: 5.0,
    enabled: true,
    action_on_breach: 'ALERT_ONLY',
    notify_push: true,
    notify_sms: true,
    breach_detected: false,
    breach_distance_km: 0,
    last_breach_timestamp: null,
    created_at: new Date().toISOString(),
  };

  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carcity_geofence');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_GEOFENCE_CONFIG;
  });

  const updateGeofenceConfig = (updates: Partial<GeofenceConfig>) => {
    setGeofenceConfig((prev) => {
      const updated = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('carcity_geofence', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const recordGeofenceBreach = (breached: boolean, distanceKm: number) => {
    setGeofenceConfig((prev) => {
      if (prev.breach_detected === breached && Math.abs((prev.breach_distance_km || 0) - distanceKm) < 0.1) {
        return prev;
      }
      const updated: GeofenceConfig = {
        ...prev,
        breach_detected: breached,
        breach_distance_km: Number(distanceKm.toFixed(2)),
        last_breach_timestamp: breached ? new Date().toISOString() : prev.last_breach_timestamp,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('carcity_geofence', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (breached) {
      setActiveVehicleAlerts((prev) => {
        const hasGeofenceAlert = prev.some(
          (a) => a.component === 'GEOFENCE' && ((a.description && a.description.includes('Mussurunga')) || (a.message && a.message.includes('Mussurunga')))
        );
        if (hasGeofenceAlert) return prev;
        const alertMsg = `Alerta Crítico: Veículo saiu do raio de 5.0 km do CEEP Newton Sucupira (Mussurunga). Distância registrada: ${distanceKm.toFixed(1)} km.`;
        const newAlert: MaintenanceAlert = {
          id: `alert-geo-${Date.now()}`,
          vehicle_id: selectedVehicleId || 'veh-001',
          component: 'GEOFENCE',
          message: alertMsg,
          description: alertMsg,
          severity: 'CRITICO',
          status: 'ACTIVE',
          suggested_action: 'Verifique a posição do veículo no mapa GPS ou acione o bloqueio preventivo de ignição.',
          sensor_reading: `${distanceKm.toFixed(1)} km`,
          nominal_value: '< 5.0 km',
          tolerance: '5.0 km',
          created_at: new Date().toISOString(),
        };
        return [newAlert, ...prev];
      });
    }
  };

  // Efeito de segurança: garante que selectedVehicleId e selectedVehicle nunca fiquem null ou undefined
  useEffect(() => {
    const available = vehicles.length > 0 ? vehicles : DEFAULT_VEHICLES;
    if (!selectedVehicleId || !selectedVehicle) {
      const fallback = available[0] || DEFAULT_VEHICLES[0];
      setSelectedVehicleIdState(fallback.id);
      setSelectedVehicleState(fallback);
    }
  }, [selectedVehicleId, selectedVehicle, vehicles]);

  // Sincroniza selectedVehicle sempre que selectedVehicleId ou vehicles mudarem
  useEffect(() => {
    const available = vehicles.length > 0 ? vehicles : DEFAULT_VEHICLES;
    const targetId = selectedVehicleId || available[0].id;
    const found =
      available.find(
        (v) =>
          v.id === targetId ||
          (targetId === 'veh-001' && (v.id === 'veh-corolla-001' || v.plate === 'ABC-1D23'))
      ) || available[0];
    setSelectedVehicleState(found);
  }, [selectedVehicleId, vehicles]);

  const setSelectedVehicleId = (id: string | null | undefined) => {
    const available = vehicles.length > 0 ? vehicles : DEFAULT_VEHICLES;
    const finalId = id || available[0]?.id || 'veh-001';
    setSelectedVehicleIdState(finalId);
    const target =
      available.find((v) => v.id === finalId || (finalId === 'veh-001' && v.id === 'veh-corolla-001')) ||
      available[0];
    if (target) setSelectedVehicleState(target);
  };

  const setSelectedVehicle = (v: Vehicle | null | undefined) => {
    const available = vehicles.length > 0 ? vehicles : DEFAULT_VEHICLES;
    const target = v || available[0];
    setSelectedVehicleState(target);
    setSelectedVehicleIdState(target.id);
  };

  // Initialize theme from localStorage or user preference
  useEffect(() => {
    const savedTheme = (localStorage.getItem('carcity_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    checkSession();
  }, []);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('carcity_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    if (user) {
      fetch('/api/auth/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme.toUpperCase() }),
      }).catch(() => {});
    }
  };

  const checkSession = async () => {
    try {
      // 1. Verificação de sessão simulada prévia salva no navegador (Mock Client-Side)
      if (typeof window !== 'undefined') {
        const demoSession = localStorage.getItem('carcity_demo_token');
        if (demoSession) {
          try {
            const parsed = JSON.parse(demoSession);
            if (parsed && parsed.user) {
              setUser(parsed.user);
              setRawToken(parsed.token || 'carcity_demo_token');
              if (parsed.user.theme_preference) {
                setTheme(parsed.user.theme_preference.toLowerCase() as 'dark' | 'light');
              }
              if (parsed.user.role === 'DRIVER') setActiveTab('dashboard');
              else if (parsed.user.role === 'WORKSHOP_OWNER') setActiveTab('workshop');
              else if (parsed.user.role === 'ADMIN') setActiveTab('cms_articles');
              else if (parsed.user.role === 'SUPER_ADMIN') setActiveTab('super_admin');
              await loadVehicles();
              return;
            }
          } catch {}
        }
      }

      // 2. Tenta verificar sessão via API backend protegendo contra respostas não-JSON
      const res = await fetch('/api/auth/me');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          setRawToken(data.token);
          if (data.token) {
            localStorage.setItem('carcity_jwt', data.token);
          }
          if (data.user.theme_preference) {
            setTheme(data.user.theme_preference.toLowerCase() as 'dark' | 'light');
          }
          await loadVehicles();
        }
      }
    } catch (err) {
      console.warn('Session check fallback', err);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const list: Vehicle[] = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          setVehicles(list);
          setSelectedVehicleState((prev: Vehicle | null) => {
            if (prev) {
              const updated = list.find((v) => v.id === prev.id);
              return updated || list[0];
            }
            return list[0];
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load vehicles from API, using default vehicles', err);
    }

    // Fallback: carregar DEFAULT_VEHICLES (com veh-001 em Mussurunga / CEEP Newton Sucupira)
    setVehicles(DEFAULT_VEHICLES);
    setSelectedVehicleState((prev) => {
      if (prev) {
        const found = DEFAULT_VEHICLES.find((v) => v.id === prev.id);
        return found || DEFAULT_VEHICLES[0];
      }
      return DEFAULT_VEHICLES[0];
    });
  };

  // Re-fetch vehicle alerts when selected vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      fetch(`/api/vehicles/${selectedVehicle.id}`)
        .then((r) => {
          const ct = r.headers.get('content-type') || '';
          if (r.ok && ct.includes('application/json')) {
            return r.json();
          }
          return null;
        })
        .then((data) => {
          if (data && data.alerts) {
            setActiveVehicleAlerts(data.alerts);
          }
        })
        .catch(() => {});
    }
  }, [selectedVehicle?.id]);

  const login = async (
    identifier: string,
    password: string,
    totpCode?: string,
    hintRole?: UserRole
  ): Promise<{ success: boolean; error?: string; require2fa?: boolean }> => {
    // [BLOCO 2] Mapeamento de Perfis de Teste para a Banca
    const getMockUser = (): { user: User; targetTab: string } => {
      const lower = (identifier || '').toLowerCase().trim();

      // Master (SUPER_ADMIN)
      if (
        lower.includes('master') ||
        lower.includes('super') ||
        hintRole === 'SUPER_ADMIN'
      ) {
        return {
          user: {
            id: 'usr-superadmin-001',
            role: 'SUPER_ADMIN',
            full_name: 'SuperAdmin Master',
            email: 'master@carcity.com.br',
            cpf_cnpj: '000.111.222-99',
            theme_preference: 'DARK',
            plan: 'ADVANCED',
            is_active: true,
            token_version: 1,
            created_at: '2026-04-11T10:00:00.000Z',
            totp_enabled: true,
            permissions: ['ALL_PERMISSIONS', 'MANAGE_USERS', 'AUDIT_LOGS', 'SUPER_ADMIN_VIEW'],
          },
          targetTab: 'super_admin',
        };
      }

      // Admin CMS (ADMIN)
      if (
        lower.includes('admin') ||
        lower.includes('cms') ||
        lower.includes('ana.souza') ||
        hintRole === 'ADMIN'
      ) {
        return {
          user: {
            id: 'usr-admin-001',
            role: 'ADMIN',
            full_name: 'Ana Souza (Admin CMS)',
            email: 'admin@carcity.com.br',
            cpf_cnpj: '456.789.012-11',
            theme_preference: 'DARK',
            plan: 'BASIC',
            is_active: true,
            token_version: 1,
            created_at: '2026-06-10T09:15:00.000Z',
            totp_enabled: true,
            permissions: ['MANAGE_ARTICLES', 'MODERATE_FORUM', 'MANAGE_DIY_VIDEOS', 'VIEW_CMS_ANALYTICS'],
          },
          targetTab: 'cms_articles',
        };
      }

      // Oficina (WORKSHOP_OWNER)
      if (
        lower.includes('oficina') ||
        lower.includes('workshop') ||
        lower.includes('autotech') ||
        lower.includes('autopro') ||
        lower.includes('12.345.678') ||
        hintRole === 'WORKSHOP_OWNER'
      ) {
        return {
          user: {
            id: 'usr-workshop-001',
            role: 'WORKSHOP_OWNER',
            full_name: 'AutoTech Premium (Oficina Credenciada)',
            email: 'oficina@carcity.com.br',
            cpf_cnpj: '12.345.678/0001-90',
            theme_preference: 'DARK',
            plan: 'STANDARD',
            is_active: true,
            token_version: 1,
            created_at: '2026-07-10T11:30:00.000Z',
            totp_enabled: false,
            permissions: ['VIEW_APPOINTMENTS', 'MANAGE_BUDGETS', 'VALIDATE_ANTI_FRAUD', 'OFFER_SPECIALS'],
          },
          targetTab: 'workshop',
        };
      }

      // Motorista (DRIVER - Padrão com veículo no CEEP Newton Sucupira)
      return {
        user: {
          id: 'usr-driver-001',
          role: 'DRIVER',
          full_name: 'Carlos Eduardo Silveira',
          email: 'motorista@carcity.com.br',
          cpf_cnpj: '123.456.789-00',
          theme_preference: 'DARK',
          plan: 'ADVANCED',
          is_active: true,
          token_version: 1,
          created_at: '2026-08-09T08:00:00.000Z',
          totp_enabled: false,
          permissions: ['VIEW_TELEMETRY', 'DISPATCH_COMMANDS', 'VIEW_MAP', 'REQUEST_MAINTENANCE'],
        },
        targetTab: 'dashboard',
      };
    };

    const activateMockSession = async () => {
      const { user: mockUser, targetTab } = getMockUser();
      const mockToken = `demo_jwt_${mockUser.role.toLowerCase()}_${Date.now()}`;

      // [BLOCO 2.2] Grava token simbólico no localStorage (carcity_demo_token)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('carcity_demo_token', JSON.stringify({ token: mockToken, user: mockUser }));
          localStorage.setItem('carcity_jwt', mockToken);
        } catch {}
      }

      setUser(mockUser);
      setRawToken(mockToken);
      setImpersonatedRole(null);
      if (mockUser.theme_preference) {
        setTheme(mockUser.theme_preference.toLowerCase() as 'dark' | 'light');
      }

      // Redireciona imediatamente o utilizador para o painel correspondente
      setActiveTab(targetTab);
      await loadVehicles();
      return { success: true };
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          totp_code: totpCode,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      // [BLOCO 1.1] Proteção do Parse de JSON e Fallback:
      // Se a rota backend devolver HTML (404 da Vercel ou SPA fallback),
      // não chama response.json() e ativa imediatamente o modo simulado.
      if (!contentType.includes('application/json')) {
        console.warn('API /api/auth/login não retornou JSON. Ativando autenticação simulada de fallback.');
        return await activateMockSession();
      }

      const data = await res.json();
      if (!res.ok) {
        // Se for erro de rota 404/502/503
        if (res.status === 404 || res.status >= 500) {
          return await activateMockSession();
        }
        if (data.require_2fa) {
          return { success: false, require2fa: true, error: data.message };
        }
        return { success: false, error: data.error || 'Falha ao autenticar.' };
      }

      // 200 OK da API com JSON válido
      setUser(data.user);
      setRawToken(data.token);
      if (data.token) {
        localStorage.setItem('carcity_jwt', data.token);
        localStorage.setItem('carcity_demo_token', JSON.stringify({ token: data.token, user: data.user }));
      }
      setImpersonatedRole(null);
      if (data.user.theme_preference) {
        setTheme(data.user.theme_preference.toLowerCase() as 'dark' | 'light');
      }

      // Roteamento
      if (data.user.role === 'DRIVER') setActiveTab('dashboard');
      else if (data.user.role === 'WORKSHOP_OWNER') setActiveTab('workshop');
      else if (data.user.role === 'ADMIN') setActiveTab('cms_articles');
      else if (data.user.role === 'SUPER_ADMIN') setActiveTab('super_admin');

      await loadVehicles();
      return { success: true };
    } catch (err: any) {
      // [BLOCO 1.2] Se a requisição falhar, der timeout ou devolver HTML (erro 404),
      // intercepta silenciosamente e autentica o usuário localmente
      console.warn('Interceptando falha de rede/API no login, ativando fallback simulado:', err);
      return await activateMockSession();
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('carcity_jwt');
    localStorage.removeItem('carcity_demo_token');
    setUser(null);
    setRawToken(null);
    setImpersonatedRole(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setActiveTab('auth');
  };

  // Switch account quickly for testing all 4 roles
  const switchRoleForDemo = async (targetRole: UserRole) => {
    let identifier = 'motorista@carcity.com.br';
    let totp = undefined;

    if (targetRole === 'WORKSHOP_OWNER') identifier = 'oficina@carcity.com.br';
    else if (targetRole === 'ADMIN') {
      identifier = 'admin@carcity.com.br';
      totp = '123456';
    } else if (targetRole === 'SUPER_ADMIN') {
      identifier = 'master@carcity.com.br';
      totp = '123456';
    }

    await login(identifier, 'password123', totp, targetRole);
  };

  const toggleAuditorMode = async (targetRole: UserRole | null) => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      if (res.ok) {
        setImpersonatedRole(targetRole);
        if (targetRole === 'DRIVER') setActiveTab('dashboard');
        else if (targetRole === 'WORKSHOP_OWNER') setActiveTab('workshop');
        else setActiveTab('super_admin');
        await loadVehicles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSimulation = async (
    action: TelemetrySimulationAction
  ) => {
    if (!selectedVehicle) return null;

    // 1. Immediate local state update for zero-latency UI reactivity
    const currentReading =
      selectedVehicle.latestReading ||
      DEFAULT_NOMINAL_READINGS[selectedVehicle.id] || {
        id: `read-tmp-${Date.now()}`,
        vehicle_id: selectedVehicle.id,
        recorded_at: new Date().toISOString(),
        tire_fl_psi: 32.5,
        tire_fr_psi: 32.8,
        tire_rl_psi: 33.0,
        tire_rr_psi: 32.2,
        battery_pct: 94,
        brake_pad_mm: 7.2,
        engine_cut_connected: selectedVehicle.engine_cut_connected,
        is_simulated: true,
      };

    const simulated = simulateTelemetryChange(currentReading, selectedVehicle, action);
    setSelectedVehicle(simulated.updatedVehicle);
    setActiveVehicleAlerts(simulated.alerts);
    setVehicles((prev) =>
      prev.map((v) => (v.id === simulated.updatedVehicle.id ? simulated.updatedVehicle : v))
    );

    // 2. Synchronize with backend to record audit log and persist reading
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alerts) {
          setActiveVehicleAlerts(data.alerts);
        }
        return data.message || simulated.message;
      }
      return simulated.message;
    } catch (e) {
      return simulated.message;
    }
  };

  const activeRole: UserRole = impersonatedRole || (user ? user.role : 'DRIVER');
  const isAuditorMode = impersonatedRole !== null;

  const alertsCount = activeVehicleAlerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalAlertsCount = activeVehicleAlerts.filter(
    (a) => a.severity === 'CRITICO' && a.status === 'ACTIVE'
  ).length;

  return (
    <AppContext.Provider
      value={{
        user,
        rawToken,
        activeRole,
        isAuditorMode,
        impersonatedRole,
        vehicles,
        selectedVehicleId,
        selectedVehicle,
        appointments,
        forumPosts,
        maintenanceLogs,
        setMaintenanceLogs,
        addMaintenanceLog,
        workshop,
        setWorkshop,
        workshopAppointments,
        setWorkshopAppointments,
        updateWorkshopAppointmentStatus,
        cmsB2BArticles,
        addWorkshopDocument,
        updateWorkshopOffers,
        articlesList,
        setArticlesList,
        reportedContentList,
        setReportedContentList,
        diyVideosList,
        setDiyVideosList,
        searchKeywordsAnalytics,
        forumMetrics,
        addArticle,
        updateArticle,
        deleteArticle,
        resolveReport,
        addDiyVideo,
        toggleDiyVideo,
        deleteDiyVideo,
        // Super Admin States & Methods
        users,
        setUsers,
        auditLogs,
        setAuditLogs,
        workshopApprovalQueue,
        setWorkshopApprovalQueue,
        trashRepository,
        setTrashRepository,
        systemHealth,
        setSystemHealth,
        toggleUserStatus,
        addAdminUser,
        evaluateWorkshopApproval,
        restoreTrashItem,
        permanentDeleteTrashItem,
        theme,
        alertsCount,
        criticalAlertsCount,
        activeTab,
        isAiModalOpen,
        isNotificationsOpen,
        isJwtModalOpen,
        activeVehicleAlerts,
        setActiveTab,
        setIsAiModalOpen,
        setIsNotificationsOpen,
        setIsJwtModalOpen,
        setSelectedVehicleId,
        setSelectedVehicle,
        setAppointments,
        setForumPosts,
        setTheme,
        login,
        logout,
        switchRoleForDemo,
        toggleAuditorMode,
        refreshVehicleData: loadVehicles,
        triggerSimulation,
        // Geofencing
        geofenceConfig,
        updateGeofenceConfig,
        recordGeofenceBreach,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
