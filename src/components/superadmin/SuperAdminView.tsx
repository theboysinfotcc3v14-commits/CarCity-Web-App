import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
  Server,
  Database,
  Radio,
  UserPlus,
  Power,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Clock,
  TrendingUp,
  DollarSign,
  Zap,
  KeyRound,
  Download,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext.tsx';
import { AuditLog, Workshop, UserRole } from '../../types/index.ts';
import { AuditorTimelineView } from './AuditorTimelineView.tsx';
import {
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WORKSHOP_APPROVAL_QUEUE,
  INITIAL_TRASH_REPOSITORY,
  INITIAL_SYSTEM_HEALTH,
} from '../../store/seedStore.ts';

interface PlatformUser {
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

interface SessionInspectData {
  user: {
    id: string;
    name: string;
    email: string;
    cpf_cnpj_masked: string;
    role: UserRole;
    plan: string;
    is_active: boolean;
  };
  claims: {
    sub: string;
    email: string;
    name: string;
    role: UserRole;
    plan: string;
    token_version: number;
    permissions: string[];
    iat: number;
    exp: number;
  };
  ip_origin: string;
  permissions_checklist: string[];
}

export const SuperAdminView: React.FC = () => {
  const { activeTab, toggleAuditorMode, isAuditorMode, impersonatedRole } = useApp();
  const [subTab, setSubTab] = useState<'system' | 'users' | 'audit' | 'workshops' | 'trash' | 'timeline'>('system');

  // S1 System Health & KPIs
  const [health, setHealth] = useState<any>(INITIAL_SYSTEM_HEALTH);

  // S2 Platform Users & RBAC
  const [usersList, setUsersList] = useState<PlatformUser[]>(INITIAL_USERS);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminCpf, setNewAdminCpf] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [newAdminPass, setNewAdminPass] = useState('tempPass123!');
  const [mustChangePassChecked, setMustChangePassChecked] = useState(true);
  const [sessionInspectData, setSessionInspectData] = useState<SessionInspectData | null>(null);

  // S3 Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('ALL');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [selectedAuditLogPayload, setSelectedAuditLogPayload] = useState<AuditLog | null>(null);

  // S4 Workshops Queue
  const [workshopsQueue, setWorkshopsQueue] = useState<Workshop[]>(INITIAL_WORKSHOP_APPROVAL_QUEUE);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectWorkshopTarget, setRejectWorkshopTarget] = useState<Workshop | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('Alvará de funcionamento com data de validade expirada');

  // S5 Trash Central
  const [trashItems, setTrashItems] = useState<any[]>(INITIAL_TRASH_REPOSITORY);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{ type: string; id: string; title: string } | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync subTab with activeTab navigation
  useEffect(() => {
    if (activeTab === 'super_team') setSubTab('users');
    else if (activeTab === 'super_audit') setSubTab('audit');
    else if (activeTab === 'super_workshops') setSubTab('workshops');
    else if (activeTab === 'super_trash') setSubTab('trash');
    else if (activeTab === 'super_timeline') setSubTab('timeline');
    else setSubTab('system');
  }, [activeTab]);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchAll = async () => {
    try {
      const [hRes, uRes, aRes, wRes, trRes] = await Promise.all([
        fetch('/api/admin/system-health'),
        fetch('/api/admin/users'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/workshops-audit'),
        fetch('/api/admin/trash'),
      ]);

      if (hRes.ok) setHealth(await hRes.json());
      if (uRes.ok) {
        const uList = await uRes.json();
        setUsersList(uList.length > 0 ? uList : INITIAL_USERS);
      }
      if (aRes.ok) {
        const aList = await aRes.json();
        setAuditLogs(aList.length > 0 ? aList : INITIAL_AUDIT_LOGS);
      }
      if (wRes.ok) {
        const wList = await wRes.json();
        setWorkshopsQueue(wList.length > 0 ? wList : INITIAL_WORKSHOP_APPROVAL_QUEUE);
      }
      if (trRes.ok) {
        const trData = await trRes.json();
        setTrashItems(trData.items && trData.items.length > 0 ? trData.items : INITIAL_TRASH_REPOSITORY);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle user activation / revoke token_version instantly
  const handleToggleUserActive = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        showToast(
          data.is_active
            ? `Conta de ${userName} reativada com sucesso!`
            : `Acesso de ${userName} revogado imediatamente! Tokens JWT ativos foram invalidados.`
        );
        await fetchAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao alterar status do usuário.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inspect Session Modal
  const handleInspectSession = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/session-inspect`);
      if (res.ok) {
        setSessionInspectData(await res.json());
      } else {
        alert('Não foi possível obter dados da sessão.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new Administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          cpf: newAdminCpf.trim(),
          role: newAdminRole,
          temp_password: newAdminPass,
          must_change_password: mustChangePassChecked,
        }),
      });

      if (res.ok) {
        showToast(`Novo administrador "${newAdminName}" registrado com sucesso!`);
        setIsAddAdminOpen(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminCpf('');
        await fetchAll();
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao criar administrador.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Evaluate Workshop Approval
  const handleEvaluateWorkshop = async (workshopId: string, decision: 'VERIFIED' | 'REJECTED', feedbackText?: string) => {
    try {
      const res = await fetch(`/api/admin/workshops-audit/${workshopId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback: feedbackText || 'Oficina homologada com sucesso.' }),
      });

      if (res.ok) {
        showToast(
          decision === 'VERIFIED'
            ? 'Oficina homologada! Selo Anti-Fraude emitido e visibilidade no mapa liberada.'
            : 'Homologação indeferida. Justificativa registrada e enviada à oficina.'
        );
        setIsRejectModalOpen(false);
        setRejectWorkshopTarget(null);
        await fetchAll();
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao avaliar oficina.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Restore trash item
  const handleRestoreTrash = async (type: string, id: string, title: string) => {
    try {
      const res = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      if (res.ok) {
        showToast(`Item "${title}" restaurado com sucesso!`);
        await fetchAll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Permanent Hard Deletion
  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget || confirmDeleteText !== 'EXCLUIR') {
      alert('Digite exatamente EXCLUIR para autorizar a remoção definitiva.');
      return;
    }

    try {
      const res = await fetch('/api/admin/trash/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: permanentDeleteTarget.type,
          id: permanentDeleteTarget.id,
          confirmationText: 'EXCLUIR',
        }),
      });

      if (res.ok) {
        showToast(`Item "${permanentDeleteTarget.title}" excluído definitivamente do banco de dados!`);
        setPermanentDeleteTarget(null);
        setConfirmDeleteText('');
        await fetchAll();
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao excluir item.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userSearchTerm.trim()) {
      const q = userSearchTerm.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cpf_cnpj.includes(q) ||
        u.cpf_cnpj_masked.includes(q)
      );
    }
    return true;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditSeverityFilter !== 'ALL') {
      const sev = log.severity || 'INFO';
      if (sev !== auditSeverityFilter) return false;
    }
    if (auditStartDate) {
      const start = new Date(auditStartDate).getTime();
      if (new Date(log.created_at).getTime() < start) return false;
    }
    if (auditEndDate) {
      const end = new Date(auditEndDate).getTime();
      if (new Date(log.created_at).getTime() > end) return false;
    }
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(q)) ||
        log.entity.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.ip.includes(q) ||
        (log.status && log.status.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#2FA67A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in font-sans text-xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Subtabs */}
      <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Painel Mestre Super Administrador
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono font-bold">
                  MASTER RBAC
                </span>
              </h2>
              <p className="text-xs text-[#9FB3C8] mt-0.5">
                Autoridade máxima sobre infraestrutura IoT, matriz de permissões, auditoria corporativa e conformidade anti-fraude.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('system')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'system'
                ? 'bg-[#3A76C2] text-white shadow-md'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard Mestre (S1)</span>
          </button>
          <button
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'users'
                ? 'bg-[#3A76C2] text-white shadow-md'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestão RBAC & Equipe (S2)</span>
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'audit'
                ? 'bg-[#3A76C2] text-white shadow-md'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#5DA9E9]" />
            <span>Trilha de Auditoria (S3)</span>
          </button>
          <button
            onClick={() => setSubTab('workshops')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'workshops'
                ? 'bg-[#2FA67A] text-white shadow-md'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2FA67A]" />
            <span>Fila Anti-Fraude (S4)</span>
          </button>
          <button
            onClick={() => setSubTab('trash')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'trash'
                ? 'bg-[#E5484D] text-white shadow-md'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-[#E5484D]" />
            <span>Lixeira Central (S5)</span>
          </button>
          <button
            onClick={() => setSubTab('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'timeline'
                ? 'bg-[#8E44AD] text-white shadow-lg shadow-[#8E44AD]/30'
                : 'bg-[#0B1A2E] text-[#C39BD3] hover:text-white border border-[#8E44AD]/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Linha do Tempo Auditor (S6)</span>
          </button>
        </div>
      </div>

      {/* S6: Banner de Controle do Modo Auditor (Bloco 4.6) */}
      <div className="p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#E09F3E]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/30 shrink-0">
            <Eye className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Modo Auditor / Impersonador de Perfil (S6)
              {isAuditorMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E09F3E] text-[#0B1A2E] font-bold">
                  SESSÃO ATIVA ({impersonatedRole})
                </span>
              )}
            </h4>
            <p className="text-[11px] text-[#9FB3C8]">
              Permite inspecionar a interface do Motorista ou Oficina em modo somente leitura. Todas as interações gravam <code>impersonated = true</code> na trilha de auditoria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setSubTab('timeline')}
            className="px-3 py-1.5 rounded-xl bg-[#8E44AD]/20 hover:bg-[#8E44AD]/30 text-[#C39BD3] border border-[#8E44AD]/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Linha do Tempo</span>
          </button>

          {isAuditorMode ? (
            <button
              onClick={() => toggleAuditorMode(null)}
              className="px-3.5 py-1.5 rounded-xl bg-[#E5484D] hover:bg-[#B42318] text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Sair do Modo Auditor</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => toggleAuditorMode('DRIVER')}
                className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#3A76C2] text-white border border-[#223B57] text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Inspecionar como Motorista</span>
              </button>
              <button
                onClick={() => toggleAuditorMode('WORKSHOP_OWNER')}
                className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#2FA67A] text-white border border-[#223B57] text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Inspecionar como Oficina B2B</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* [BLOCO 4.1] S1 — Dashboard Mestre do Sistema & Infraestrutura */}
      {/* ======================================================== */}
      {subTab === 'system' && (
        <div className="space-y-6">
          {/* Banner de Integridade do Sistema */}
          <div className="p-4 rounded-2xl bg-[#12273F] border border-[#2FA67A]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-[#2FA67A] ring-4 ring-[#2FA67A]/20 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Integridade Operacional Global:
                </span>{' '}
                <span className="text-xs font-semibold text-[#2FA67A]">
                  Todos os Serviços em Operação Nominal
                </span>
                <span className="text-xs text-[#9FB3C8] ml-2">
                  • Tempo de Atividade (Uptime): <strong className="text-white font-mono">{health.uptime_pct}%</strong>
                  • Versão do Sistema: <strong className="text-white font-mono">{health.system_version}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9FB3C8] font-mono">
                Latência Gateway: {health.kpis.iot_gateway_latency_ms}ms
              </span>
              <button
                onClick={() => setSubTab('timeline')}
                className="px-3 py-1 rounded-xl bg-[#8E44AD]/20 hover:bg-[#8E44AD]/30 text-[#C39BD3] border border-[#8E44AD]/40 text-xs font-bold transition-colors"
              >
                Ver Trilha de Ações &rarr;
              </button>
            </div>
          </div>

          {/* 6 Cards de Indicadores de Infraestrutura (Bloco 4.1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total de Condutores Registados */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Total de Condutores Registados
                </span>
                <div className="p-2 rounded-xl bg-[#3A76C2]/15 text-[#5DA9E9]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.total_drivers.toLocaleString('pt-BR')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#2FA67A] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>▲ +{health.kpis.drivers_growth_pct}% este mês</span>
              </div>
            </div>

            {/* Card 2: Oficinas Credenciadas */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Oficinas Credenciadas
                </span>
                <div className="p-2 rounded-xl bg-[#2FA67A]/15 text-[#2FA67A]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.workshops_count}
              </div>
              <div className="text-xs text-[#E09F3E] font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{health.kpis.workshops_pending_analysis} aguardando análise de documentos</span>
              </div>
            </div>

            {/* Card 3: Veículos Conectados (IoT Gateway) */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Veículos Conectados (IoT Gateway)
                </span>
                <div className="p-2 rounded-xl bg-[#5DA9E9]/15 text-[#5DA9E9]">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.connected_vehicles_iot.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-[#2FA67A] font-medium">
                Taxa de Transmissão: {health.gateway_iot.can_bus_frames_per_sec} frames/s CAN
              </div>
            </div>

            {/* Card 4: Receita Recorrente Mensal (MRR) */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Receita Recorrente Mensal (MRR)
                </span>
                <div className="p-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.mrr_recurrent_brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-[#2FA67A] font-semibold">
                ▲ +14% vs. trimestre anterior (Planos B2B e Motoristas)
              </div>
            </div>

            {/* Card 5: Latência Média do Gateway IoT */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Latência Média do Gateway IoT
                </span>
                <div className="p-2 rounded-xl bg-[#2FA67A]/15 text-[#2FA67A]">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.iot_gateway_latency_ms} ms
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2FA67A]">
                <div className="w-2 h-2 rounded-full bg-[#2FA67A] animate-ping" />
                <span>Status: {health.kpis.iot_status} (Buffer Socket 0%)</span>
              </div>
            </div>

            {/* Card 6: Conexões Ativas MariaDB */}
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9FB3C8] uppercase tracking-wider">
                  Conexões Ativas MariaDB
                </span>
                <div className="p-2 rounded-xl bg-[#3A76C2]/15 text-[#5DA9E9]">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {health.kpis.mariadb_active_connections} / {health.kpis.mariadb_max_pool}
              </div>
              <div className="text-xs font-semibold text-[#2FA67A]">
                Status: {health.kpis.mariadb_status} (Singleton Pool SSL Ativo)
              </div>
            </div>
          </div>

          {/* Gráfico Consolidado: Crescimento da Frota vs Alertas Resolvidos (Recharts) */}
          <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3A76C2]" />
                  Crescimento da Frota Conectada vs. Alertas Preditivos Resolvidos
                </h3>
                <p className="text-xs text-[#9FB3C8]">
                  Evolução consolidada dos últimos 6 meses com telemetria em tempo real e resolução na rede de oficinas credenciadas.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#3A76C2]" />
                  <span className="text-white">Frota Conectada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#2FA67A]" />
                  <span className="text-white">Alertas Resolvidos</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={health.fleet_growth_chart}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3A76C2" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3A76C2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2FA67A" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#2FA67A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223B57" vertical={false} />
                  <XAxis dataKey="month" stroke="#9FB3C8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9FB3C8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1A2E',
                      borderColor: '#223B57',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#FFF',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fleet_connected"
                    name="Frota Conectada (IoT)"
                    stroke="#3A76C2"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFleet)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predictive_alerts_resolved"
                    name="Alertas Resolvidos"
                    stroke="#2FA67A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 4.2] S2 — Gestão da Equipa, Perfis & Controlo de Acesso RBAC */}
      {/* ======================================================== */}
      {subTab === 'users' && (
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5DA9E9]" />
                Tabela de Utilizadores da Plataforma & RBAC
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Gerenciamento integral de contas com revogação imediata via <code>token_version</code> e inspeção de claims JWT.
              </p>
            </div>

            <button
              onClick={() => setIsAddAdminOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-bold text-xs flex items-center gap-2 shadow transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Administrador</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9FB3C8] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail corporativo ou documento CPF/CNPJ..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9FB3C8] focus:outline-none focus:border-[#3A76C2]"
              />
            </div>

            {/* Filtro por Papel */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'DRIVER', label: 'DRIVER' },
                { id: 'WORKSHOP_OWNER', label: 'WORKSHOP_OWNER' },
                { id: 'ADMIN', label: 'ADMIN' },
                { id: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setUserRoleFilter(pill.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    userRoleFilter === pill.id
                      ? 'bg-[#3A76C2] text-white'
                      : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Utilizadores */}
          <div className="overflow-x-auto rounded-xl border border-[#223B57]">
            <table className="w-full text-left text-xs text-[#F1F5F9]">
              <thead className="bg-[#0B1A2E] text-[#9FB3C8] uppercase font-mono text-[10px] border-b border-[#223B57]">
                <tr>
                  <th className="py-3 px-4">Nome / Utilizador</th>
                  <th className="py-3 px-4">E-mail Corporativo</th>
                  <th className="py-3 px-4">CPF/CNPJ (LGPD Mascarado)</th>
                  <th className="py-3 px-4">Papel (Role)</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações de Segurança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223B57]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#9FB3C8]">
                      Nenhum utilizador encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#0B1A2E]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{u.full_name}</div>
                        <div className="text-[10px] font-mono text-[#9FB3C8]">{u.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{u.email}</td>
                      <td className="py-3 px-4 font-mono text-[#9FB3C8]">{u.cpf_cnpj_masked}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              : u.role === 'ADMIN'
                              ? 'bg-[#E09F3E]/20 text-[#E09F3E]'
                              : u.role === 'WORKSHOP_OWNER'
                              ? 'bg-[#2FA67A]/20 text-[#2FA67A]'
                              : 'bg-[#3A76C2]/20 text-[#5DA9E9]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-white">
                          {u.plan ? u.plan : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            u.is_active ? 'bg-[#2FA67A]/20 text-[#2FA67A]' : 'bg-[#E5484D]/20 text-[#E5484D]'
                          }`}
                        >
                          {u.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> [ATIVO]
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> [REVOGADO]
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspectSession(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#3A76C2]/20 hover:bg-[#3A76C2] text-[#5DA9E9] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Inspecionar Claims do JWT e Permissões"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Inspecionar</span>
                          </button>

                          <button
                            onClick={() => handleToggleUserActive(u.id, u.is_active, u.full_name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                              u.is_active
                                ? 'bg-[#E5484D]/20 text-[#E5484D] hover:bg-[#E5484D] hover:text-white'
                                : 'bg-[#2FA67A]/20 text-[#2FA67A] hover:bg-[#2FA67A] hover:text-white'
                            }`}
                          >
                            {u.is_active ? 'Desativar Conta' : 'Reativar Conta'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 4.3] S3 — Trilha de Auditoria em Tempo Real (Audit Logs System) */}
      {/* ======================================================== */}
      {subTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#5DA9E9]" />
                Trilha de Auditoria em Tempo Real (Audit Logs System)
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Registro cronológico e imutável de todas as ações de segurança, comandos IoT e credenciamento na plataforma.
              </p>
            </div>
            <div className="text-xs text-[#9FB3C8] font-mono">
              Total Registrado: <strong className="text-white">{auditLogs.length}</strong> eventos
            </div>
          </div>

          {/* Filtros Avançados (Ator, Severidade, Datas) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0B1A2E] p-4 rounded-xl border border-[#223B57]">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-[#9FB3C8] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por ator, ação executada, IP ou entidade..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-[#12273F] border border-[#223B57] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#9FB3C8] focus:outline-none focus:border-[#3A76C2]"
              />
            </div>

            <div>
              <select
                value={auditSeverityFilter}
                onChange={(e) => setAuditSeverityFilter(e.target.value)}
                className="w-full bg-[#12273F] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
              >
                <option value="ALL">Severidade: Todas</option>
                <option value="INFO">INFO (Operações Comuns)</option>
                <option value="WARNING">WARNING (Risco / Alertas)</option>
                <option value="CRITICAL">CRITICAL (Comandos Críticos)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={auditStartDate}
                onChange={(e) => setAuditStartDate(e.target.value)}
                className="w-full bg-[#12273F] border border-[#223B57] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                title="Data Inicial"
              />
              <span className="text-xs text-[#9FB3C8]">-</span>
              <input
                type="date"
                value={auditEndDate}
                onChange={(e) => setAuditEndDate(e.target.value)}
                className="w-full bg-[#12273F] border border-[#223B57] rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                title="Data Final"
              />
            </div>
          </div>

          {/* Tabela de Registo de Eventos */}
          <div className="overflow-x-auto rounded-xl border border-[#223B57]">
            <table className="w-full text-left text-xs text-[#F1F5F9]">
              <thead className="bg-[#0B1A2E] text-[#9FB3C8] uppercase font-mono text-[10px] border-b border-[#223B57]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Ator (Actor)</th>
                  <th className="py-3 px-4">Ação Executada</th>
                  <th className="py-3 px-4">Entidade Alvo</th>
                  <th className="py-3 px-4">Endereço IP</th>
                  <th className="py-3 px-4">Status / Severidade</th>
                  <th className="py-3 px-4 text-right">Metadados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223B57]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#9FB3C8]">
                      Nenhum registro de auditoria corresponde aos critérios filtrados.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const isCritical = log.severity === 'CRITICAL' || log.action.includes('CORTE_MOTOR') || log.action.includes('PANICO');
                    const isWarning = log.severity === 'WARNING' || log.action.includes('INVALIDO') || log.action.includes('ALERTA');
                    const isSuccess = log.status === 'SUCESSO' || log.status === 'EXECUTADO';

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAuditLogPayload(log)}
                        className="hover:bg-[#0B1A2E]/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-[#9FB3C8] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-white block">{log.actor_name || log.actor_user_id}</strong>
                          <span className="text-[10px] font-mono text-[#9FB3C8]">
                            {log.actor_role ? `[${log.actor_role}]` : '(Sistema)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              isCritical
                                ? 'bg-[#E5484D]/20 text-[#E5484D]'
                                : isWarning
                                ? 'bg-[#E09F3E]/20 text-[#E09F3E]'
                                : 'bg-[#3A76C2]/20 text-[#5DA9E9]'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#9FB3C8]">
                          {log.entity} {log.entity_id}
                        </td>
                        <td className="py-3 px-4 font-mono text-white whitespace-nowrap">
                          {log.ip}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCritical
                                ? 'bg-[#E5484D]/20 text-[#E5484D]'
                                : isWarning
                                ? 'bg-[#E09F3E]/20 text-[#E09F3E]'
                                : 'bg-[#2FA67A]/20 text-[#2FA67A]'
                            }`}
                          >
                            [{log.status || (isSuccess ? 'EXECUTADO' : 'INFO')}]
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditLogPayload(log);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0B1A2E] hover:bg-[#3A76C2] text-[#9FB3C8] hover:text-white border border-[#223B57] text-[11px] font-mono transition-colors"
                          >
                            JSON &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 4.4] S4 — Fila de Homologação Anti-Fraude & Aprovação de Oficinas */}
      {/* ======================================================== */}
      {subTab === 'workshops' && (
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2FA67A]" />
                Fila de Homologação Anti-Fraude & Selo CarCity
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Análise criteriosa de alvarás de funcionamento, responsáveis técnicos e fotos das instalações antes de liberar no mapa interativo.
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#E09F3E]/15 text-[#E09F3E] border border-[#E09F3E]/30 text-xs font-bold font-mono">
              {workshopsQueue.filter((w) => w.status === 'PENDING_APPROVAL').length} Oficina(s) Aguardando Decisão
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workshopsQueue.map((ws) => {
              const isPending = ws.status === 'PENDING_APPROVAL';
              const isVerified = ws.status === 'VERIFIED';

              return (
                <div
                  key={ws.id}
                  className={`p-6 rounded-2xl bg-[#0B1A2E] border-2 space-y-4 shadow-xl transition-all ${
                    isPending
                      ? 'border-[#E09F3E]'
                      : isVerified
                      ? 'border-[#2FA67A]/50'
                      : 'border-[#E5484D]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{ws.razao_social}</h4>
                      <p className="text-xs text-[#5DA9E9] font-medium">{ws.nome_fantasia}</p>
                      <p className="text-xs text-[#9FB3C8] font-mono mt-0.5">CNPJ: {ws.cnpj}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono uppercase ${
                        isVerified
                          ? 'bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30'
                          : isPending
                          ? 'bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/30 animate-pulse'
                          : 'bg-[#E5484D]/20 text-[#E5484D] border border-[#E5484D]/30'
                      }`}
                    >
                      {ws.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#9FB3C8] space-y-1">
                    <div>
                      <strong className="text-white">Endereço:</strong> {ws.address}
                    </div>
                    <div>
                      <strong className="text-white">Responsável Técnico / Contato:</strong> {ws.phone || '(11) 97123-4567'} • {ws.email}
                    </div>
                  </div>

                  {/* Documentos Submetidos */}
                  <div className="p-4 rounded-xl bg-[#12273F] border border-[#223B57] space-y-2 text-xs">
                    <strong className="text-white block text-[11px] uppercase tracking-wider">
                      Documentos Submetidos para Homologação:
                    </strong>
                    <div className="space-y-1.5 font-mono">
                      {ws.documents && ws.documents.length > 0 ? (
                        ws.documents.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#0B1A2E] text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-[#5DA9E9]" />
                              <span className="text-white">{d.kind}:</span>
                              <span className="text-[#9FB3C8]">{d.file_name || 'arquivo_anexo.pdf'}</span>
                            </div>
                            <a
                              href={d.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#5DA9E9] hover:underline flex items-center gap-1 font-sans text-xs"
                            >
                              <span>Visualizar</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#9FB3C8]">Nenhum documento anexado.</p>
                      )}
                    </div>
                  </div>

                  {/* Feedback anterior se houver */}
                  {ws.review_feedback && (
                    <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs">
                      <span className="text-[#9FB3C8] block text-[10px] uppercase font-bold">Parecer Técnico:</span>
                      <p className="text-white mt-0.5">{ws.review_feedback}</p>
                    </div>
                  )}

                  {/* Ações Decisórias do Super Administrador */}
                  <div className="flex gap-2 pt-2 border-t border-[#223B57]">
                    <button
                      onClick={() => handleEvaluateWorkshop(ws.id, 'VERIFIED')}
                      className="flex-1 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Aprovar & Emitir Selo Anti-Fraude</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectWorkshopTarget(ws);
                        setIsRejectModalOpen(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white border border-[#E5484D]/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rejeitar & Solicitar Revisão</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 4.5] S5 — Lixeira Central, Restauração & Exclusão Definitiva */}
      {/* ======================================================== */}
      {subTab === 'trash' && (
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-[#E5484D]" />
                Lixeira Central & Gestão de Expurgo
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Registros sob exclusão lógica (soft delete). Somente o Super Administrador pode restaurar ou efetuar a purga permanente física (Hard Delete).
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30 text-xs font-bold font-mono">
              {trashItems.length} Itens sob Quarentena
            </div>
          </div>

          {/* Tabela do Repositório de Deletados */}
          <div className="overflow-x-auto rounded-xl border border-[#223B57]">
            <table className="w-full text-left text-xs text-[#F1F5F9]">
              <thead className="bg-[#0B1A2E] text-[#9FB3C8] uppercase font-mono text-[10px] border-b border-[#223B57]">
                <tr>
                  <th className="py-3 px-4">Tipo do Item</th>
                  <th className="py-3 px-4">Identificador / Título</th>
                  <th className="py-3 px-4">Deletado por</th>
                  <th className="py-3 px-4">Data da Deleção</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223B57]">
                {trashItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#9FB3C8]">
                      Lixeira vazia. Nenhum conteúdo arquivado em modo soft delete.
                    </td>
                  </tr>
                ) : (
                  trashItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#0B1A2E]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            item.item_type === 'Artigo CMS'
                              ? 'bg-[#3A76C2]/20 text-[#5DA9E9]'
                              : 'bg-[#E09F3E]/20 text-[#E09F3E]'
                          }`}
                        >
                          {item.item_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-white block">{item.title}</strong>
                        <span className="text-[10px] font-mono text-[#9FB3C8]">ID: {item.id}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{item.deleted_by || 'Administrador'}</td>
                      <td className="py-3 px-4 font-mono text-[#9FB3C8] whitespace-nowrap">
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('pt-BR') : '02/10/2026'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreTrash(item.type, item.id, item.title)}
                            className="px-3 py-1.5 rounded-xl bg-[#2FA67A]/20 hover:bg-[#2FA67A] text-[#2FA67A] hover:text-white font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            onClick={() =>
                              setPermanentDeleteTarget({
                                type: item.type,
                                id: item.id,
                                title: item.title,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Definitivamente</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* S6: Linha do Tempo do Modo Auditor (AuditorTimelineView) */}
      {/* ======================================================== */}
      {subTab === 'timeline' && <AuditorTimelineView />}

      {/* ======================================================== */}
      {/* MODAL 1: Hard Delete com validação da palavra "EXCLUIR" */}
      {/* ======================================================== */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border-2 border-[#E5484D] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="text-base font-bold text-[#E5484D] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Exclusão Definitiva no Banco de Dados (Hard Delete)
            </h4>
            <p className="text-xs text-white leading-relaxed">
              Esta ação executará um <strong>HARD DELETE</strong> físico e irreversível no MariaDB para o item:{' '}
              <span className="text-[#E09F3E] font-bold">"{permanentDeleteTarget.title}"</span>.
            </p>
            <p className="text-xs text-[#9FB3C8]">
              Para autorizar o expurgo permanente, digite exatamente a palavra{' '}
              <strong className="text-[#E5484D] font-mono">EXCLUIR</strong> na caixa abaixo:
            </p>

            <input
              type="text"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-4 py-2.5 text-white font-mono text-center uppercase tracking-widest text-sm focus:outline-none focus:border-[#E5484D]"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setPermanentDeleteTarget(null);
                  setConfirmDeleteText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                disabled={confirmDeleteText !== 'EXCLUIR'}
                onClick={handlePermanentDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#B42318] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition-all"
              >
                Purgar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Cadastro de Novo Administrador (Bloco 4.2) */}
      {/* ======================================================== */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2FA67A]" />
                Registrar Novo Administrador
              </h3>
              <button onClick={() => setIsAddAdminOpen(false)} className="text-[#9FB3C8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#9FB3C8] mb-1 font-semibold">Nome Completo:</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ex: Carlos Roberto Mendes"
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1 font-semibold">E-mail Corporativo:</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin.corporativo@carcity.com.br"
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1 font-semibold">CPF (Cadastro de Pessoa Física):</label>
                <input
                  type="text"
                  value={newAdminCpf}
                  onChange={(e) => setNewAdminCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1 font-semibold">Papel Administrativo (RBAC):</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                >
                  <option value="ADMIN">ADMIN (CMS, Moderação de Conteúdo & Hub DIY)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Mestre Completo, Banco MariaDB & Auditoria)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1 font-semibold">Palavra-passe Temporária:</label>
                <input
                  type="text"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={mustChangePassChecked}
                  onChange={(e) => setMustChangePassChecked(e.target.checked)}
                  className="rounded bg-[#0B1A2E] border-[#223B57] text-[#2FA67A] focus:ring-0"
                />
                <span className="text-[#9FB3C8] text-[11px]">
                  Exigir alteração obrigatória de senha no primeiro acesso do usuário.
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-bold shadow transition-colors"
                >
                  Cadastrar Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Inspetor de Sessão em Tempo Real (Claims JWT) */}
      {/* ======================================================== */}
      {sessionInspectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#3A76C2] w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#5DA9E9]" />
                Inspetor de Sessão em Tempo Real (JWT Claims & RBAC)
              </h3>
              <button
                onClick={() => setSessionInspectData(null)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Informações do Usuário */}
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-1">
                <div className="text-white font-bold">{sessionInspectData.user.name}</div>
                <div className="text-[#9FB3C8] font-mono">
                  {sessionInspectData.user.email} • {sessionInspectData.user.cpf_cnpj_masked}
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[#3A76C2]/20 text-[#5DA9E9]">
                    Papel: {sessionInspectData.user.role}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#2FA67A]/20 text-[#2FA67A]">
                    Plano: {sessionInspectData.user.plan}
                  </span>
                  <span className="text-[#9FB3C8]">IP Origem: {sessionInspectData.ip_origin}</span>
                </div>
              </div>

              {/* Claims do Token JWT */}
              <div>
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                  Claims Ativas do Token JWT Decodificado:
                </h4>
                <pre className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#5DA9E9] font-mono text-[11px] overflow-x-auto max-h-40">
                  {JSON.stringify(sessionInspectData.claims, null, 2)}
                </pre>
              </div>

              {/* Checklist de Permissões RBAC Ativas */}
              <div>
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                  Checklist Visual de Permissões Ativas:
                </h4>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#0B1A2E] rounded-xl border border-[#223B57]">
                  {sessionInspectData.permissions_checklist.map((perm) => (
                    <div key={perm} className="flex items-center gap-1.5 text-[11px] font-mono text-[#2FA67A]">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSessionInspectData(null)}
              className="w-full py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] text-white font-bold text-xs"
            >
              Fechar Inspetor de Sessão
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Rejeitar Homologação de Oficina com Justificativa */}
      {/* ======================================================== */}
      {isRejectModalOpen && rejectWorkshopTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#E5484D] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="text-base font-bold text-[#E5484D] flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Rejeitar Homologação da Oficina
            </h4>
            <p className="text-xs text-white">
              Oficina alvo: <strong className="text-[#5DA9E9]">{rejectWorkshopTarget.razao_social}</strong> (CNPJ: {rejectWorkshopTarget.cnpj}).
            </p>
            <p className="text-xs text-[#9FB3C8]">
              É obrigatório informar o motivo detalhado do indeferimento para que a oficina realize as adequações necessárias.
            </p>

            <textarea
              rows={3}
              value={reviewFeedback}
              onChange={(e) => setReviewFeedback(e.target.value)}
              placeholder="Ex: Alvará de funcionamento com data de validade expirada..."
              className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#E5484D]"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectWorkshopTarget(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs"
              >
                Cancelar
              </button>
              <button
                disabled={!reviewFeedback.trim()}
                onClick={() => handleEvaluateWorkshop(rejectWorkshopTarget.id, 'REJECTED', reviewFeedback)}
                className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#B42318] disabled:opacity-40 text-white font-bold text-xs"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: Visualizador de Metadados JSON da Auditoria */}
      {/* ======================================================== */}
      {selectedAuditLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#3A76C2] w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5DA9E9]" />
                Payload de Metadados JSON do Evento
              </h3>
              <button
                onClick={() => setSelectedAuditLogPayload(null)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px] text-[#9FB3C8]">
                <span>Ação: <strong className="text-white">{selectedAuditLogPayload.action}</strong></span>
                <span>ID: {selectedAuditLogPayload.id}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#9FB3C8]">
                <span>Ator: {selectedAuditLogPayload.actor_name} ({selectedAuditLogPayload.actor_role})</span>
                <span>IP: {selectedAuditLogPayload.ip}</span>
              </div>

              <pre className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#2FA67A] font-mono text-[11px] overflow-x-auto max-h-72">
                {JSON.stringify(selectedAuditLogPayload, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedAuditLogPayload(null)}
              className="w-full py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] text-white font-bold text-xs"
            >
              Fechar Visualizador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
