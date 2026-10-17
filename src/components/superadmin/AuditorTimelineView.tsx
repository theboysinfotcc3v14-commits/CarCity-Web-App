import React, { useState, useEffect } from 'react';
import {
  Activity,
  Eye,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Filter,
  Search,
  Download,
  RotateCw,
  User,
  Wrench,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  Key,
  ShieldAlert,
  Server,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { AuditLog, UserRole } from '../../types/index.ts';

interface AuditedUserOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  is_active: boolean;
  actions_count: number;
  last_action_at: string;
  has_impersonated_actions: boolean;
}

interface TimelineItem extends AuditLog {
  category: 'SECURITY' | 'TELEMETRY' | 'B2B' | 'CMS' | 'AUDIT_MODE' | 'SYSTEM';
  actor_details?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    plan: string;
  } | null;
}

export const AuditorTimelineView: React.FC = () => {
  const { isAuditorMode, impersonatedRole, toggleAuditorMode } = useApp();

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [users, setUsers] = useState<AuditedUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyImpersonated, setOnlyImpersonated] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados de expansão de payload
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Set<string>>(new Set());

  // Métricas de resumo
  const [summary, setSummary] = useState({
    security_events: 0,
    auditor_mode_events: 0,
    b2b_events: 0,
    telemetry_events: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Busca lista de usuários para o seletor
      const usersRes = await fetch('/api/admin/audited-users');
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      // 2. Monta query params para a timeline
      const params = new URLSearchParams();
      if (selectedUserId) params.set('userId', selectedUserId);
      if (selectedRole) params.set('role', selectedRole);
      if (selectedCategory) params.set('category', selectedCategory);
      if (onlyImpersonated) params.set('impersonated', 'true');
      if (searchTerm) params.set('search', searchTerm);

      const timelineRes = await fetch(`/api/admin/audit-timeline?${params.toString()}`);
      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setTimeline(data.timeline || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Erro ao carregar linha do tempo de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedUserId, selectedRole, selectedCategory, onlyImpersonated]);

  const toggleExpand = (id: string) => {
    setExpandedPayloadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(timeline, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auditoria_carcity_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatRelativeTime = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'agora há pouco';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHour < 24) return `há ${diffHour} h`;
    if (diffDay === 1) return 'ontem';
    return `há ${diffDay} dias`;
  };

  const getActionBadgeColor = (action: string, category: string) => {
    if (action.includes('PANICO') || action.includes('CORTE_MOTOR') || action.includes('REVOGACAO')) {
      return {
        bg: 'bg-[#E5484D]/15',
        border: 'border-[#E5484D]/30',
        text: 'text-[#E5484D]',
        dot: 'bg-[#E5484D]',
      };
    }
    if (category === 'AUDIT_MODE' || action.includes('MODO_AUDITOR')) {
      return {
        bg: 'bg-[#8E44AD]/15',
        border: 'border-[#8E44AD]/30',
        text: 'text-[#C39BD3]',
        dot: 'bg-[#8E44AD]',
      };
    }
    if (action.includes('HOMOLOGADA') || action.includes('VALIDADO') || action.includes('SUCESSO')) {
      return {
        bg: 'bg-[#2FA67A]/15',
        border: 'border-[#2FA67A]/30',
        text: 'text-[#2FA67A]',
        dot: 'bg-[#2FA67A]',
      };
    }
    if (category === 'TELEMETRIA' || action.includes('TPMS') || action.includes('ALERTA')) {
      return {
        bg: 'bg-[#E09F3E]/15',
        border: 'border-[#E09F3E]/30',
        text: 'text-[#E09F3E]',
        dot: 'bg-[#E09F3E]',
      };
    }
    return {
      bg: 'bg-[#3A76C2]/15',
      border: 'border-[#3A76C2]/30',
      text: 'text-[#5DA9E9]',
      dot: 'bg-[#3A76C2]',
    };
  };

  const getActionFriendlyDescription = (item: TimelineItem): string => {
    switch (item.action) {
      case 'MODO_AUDITOR_INICIADO_DRIVER':
        return `Sessão de auditoria iniciada para o perfil Motorista (${item.metadata?.audited_user || 'Carlos Silveira'}). Inspeção de telemetria, rotas e painel em modo somente leitura.`;
      case 'MODO_AUDITOR_INICIADO_WORKSHOP_OWNER':
        return `Sessão de auditoria iniciada para o perfil Oficina B2B (${item.metadata?.audited_user || 'AutoTech Premium'}). Inspeção de conformidade técnica, pedidos e Selo Anti-Fraude.`;
      case 'MODO_AUDITOR_ENCERRADO':
        return `Sessão de auditoria impersonada encerrada com sucesso pelo Super Administrador. Nenhuma anomalia de conformidade encontrada.`;
      case 'TELEMETRIA_CONSULTADA_AUDITOR':
        return `Super Administrador em Modo Auditor inspecionou as leituras telemétricas do sensor CAN-Bus e pressão TPMS do veículo ${item.entity_id}.`;
      case 'CORTE_MOTOR_EXECUTADO':
        return `Comando de segurança telemétrica emitido: relé de corte de combustível desativado. Veículo imobilizado com segurança.`;
      case 'MODO_PANICO_ATIVADO':
        return `Botão de pânico de emergência acionado. Raio de alerta de 5 KM e sinalização transmitidos para o servidor CarCity.`;
      case 'TELEMETRIA_TPMS_ALERTA_DETECTADO':
        return `Sensor TPMS registrou pressão de ${item.metadata?.tire_fl_psi || '26.2'} PSI na roda dianteira esquerda. Alerta preventivo gerado.`;
      case 'OFICINA_HOMOLOGADA_SELO':
        return `Selo Anti-Fraude homologado para a oficina credenciada. Alvará e registro profissional (CFT/CREA) verificados.`;
      case 'DOCUMENTO_SUBMETIDO_SELO':
        return `Oficina submeteu documento oficial para auditoria: ${item.metadata?.fileName || 'Alvará'}.`;
      case 'AGENDAMENTO_CRIADO':
        return `Agendamento mecânico preventivo solicitado para o veículo, vinculado à oficina homologada.`;
      case 'PROPOSTA_CRIADA_OFICINA':
        return `Oficina credenciada emitiu proposta orçamentária com desconto de benefício do plano do motorista.`;
      case 'LOGIN_MFA_SUCESSO':
        return `Autenticação multifatorial TOTP (RFC 6238) validada com sucesso pelo servidor de segurança.`;
      case 'SISTEMA_INICIALIZADO':
        return `Núcleo de auditoria e conexões MariaDB inicializados com TLS 1.3 obrigatório.`;
      case 'ARTIGO_PUBLICADO':
        return `Administrador publicou artigo técnico na central informativa e base de conhecimento.`;
      case 'MODERACAO_CONTEUDO_RESOLVIDA':
        return `Denúncia de conteúdo da comunidade moderada e resolvida com validação técnica.`;
      default:
        return `Ação de sistema registrada na entidade ${item.entity} (#${item.entity_id}) com IP ${item.ip}.`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner de Identificação & Modo Auditor Ativo */}
      <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5DA9E9]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#8E44AD]/20 border border-[#8E44AD]/40 text-[#C39BD3] text-[11px] font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Painel do Modo Auditor
              </span>
              <span className="text-xs text-[#9FB3C8] font-mono">
                Trilha de Ações & Linha do Tempo
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              Linha do Tempo de Ações de Usuários Auditados
            </h2>
            <p className="text-xs text-[#9FB3C8] mt-1 max-w-2xl">
              Rastreamento cronológico de ponta a ponta com registro imutável em <code className="text-[#5DA9E9]">audit_logs</code>. Inspecione eventos de motoristas, oficinas credenciadas e sessões impersonadas pelo Super Administrador.
            </p>
          </div>

          {/* Controles de Disparo do Modo Auditor */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAuditorMode ? (
              <div className="flex items-center gap-2 bg-[#E09F3E]/15 border border-[#E09F3E]/40 px-3.5 py-2 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E09F3E] animate-pulse" />
                <div>
                  <div className="text-[10px] text-[#E09F3E] font-bold uppercase tracking-wider">
                    Modo Auditor Ativo
                  </div>
                  <div className="text-xs font-bold text-white">
                    Inspecionando: {impersonatedRole === 'DRIVER' ? 'Motorista (Carlos)' : 'Oficina (AutoTech)'}
                  </div>
                </div>
                <button
                  onClick={() => toggleAuditorMode(null)}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-[#E5484D] hover:bg-[#B42318] text-white text-[11px] font-bold transition-colors"
                >
                  Encerrar
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleAuditorMode('DRIVER')}
                  className="px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#3A76C2] text-white border border-[#223B57] text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
                  title="Auditar sessão do motorista Carlos Silveira"
                >
                  <Eye className="w-3.5 h-3.5 text-[#5DA9E9]" />
                  <span>Auditar Motorista</span>
                </button>
                <button
                  onClick={() => toggleAuditorMode('WORKSHOP_OWNER')}
                  className="px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#2FA67A] text-white border border-[#223B57] text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
                  title="Auditar sessão da oficina AutoTech Premium"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#2FA67A]" />
                  <span>Auditar Oficina B2B</span>
                </button>
              </div>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#0B1A2E] hover:bg-[#12273F] text-[#9FB3C8] hover:text-white border border-[#223B57] transition-colors"
              title="Atualizar linha do tempo"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5DA9E9]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status de última atualização */}
        <div className="mt-3 pt-3 border-t border-[#223B57]/60 flex items-center justify-between text-[11px] text-[#9FB3C8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2FA67A]" />
            Banco de Dados: MariaDB 10.11 InnoDB (Trilha de auditoria persistente)
          </span>
          <span className="font-mono">
            Última sincronização: {lastRefreshed.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Cards de Métricas / KPIs da Linha do Tempo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A76C2]/20 border border-[#3A76C2]/30 flex items-center justify-center text-[#5DA9E9]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#9FB3C8] font-medium">Total de Ações</div>
            <div className="text-xl font-bold text-white font-mono">{timeline.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E5484D]/20 border border-[#E5484D]/30 flex items-center justify-center text-[#E5484D]">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#9FB3C8] font-medium">Segurança & Pânico</div>
            <div className="text-xl font-bold text-white font-mono">{summary.security_events}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8E44AD]/20 border border-[#8E44AD]/30 flex items-center justify-center text-[#C39BD3]">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#9FB3C8] font-medium">Sessões em Modo Auditor</div>
            <div className="text-xl font-bold text-white font-mono">{summary.auditor_mode_events}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2FA67A]/20 border border-[#2FA67A]/30 flex items-center justify-center text-[#2FA67A]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#9FB3C8] font-medium">Oficinas & Selo B2B</div>
            <div className="text-xl font-bold text-white font-mono">{summary.b2b_events}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Seletor de Usuários e Busca */}
      <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] space-y-4">
        {/* Chips de Seleção Rápida de Usuários Auditados */}
        <div>
          <label className="text-[11px] font-bold text-[#9FB3C8] uppercase tracking-wider block mb-2">
            Filtrar por Usuário Auditado:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUserId('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedUserId === ''
                  ? 'bg-[#3A76C2] text-white shadow'
                  : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
              }`}
            >
              Todos os Usuários ({users.reduce((acc, u) => acc + u.actions_count, 0)})
            </button>
            {users.map((u) => {
              const isSelected = selectedUserId === u.id;
              const roleColor =
                u.role === 'DRIVER'
                  ? 'text-[#5DA9E9]'
                  : u.role === 'WORKSHOP_OWNER'
                  ? 'text-[#2FA67A]'
                  : u.role === 'ADMIN'
                  ? 'text-[#D4AF37]'
                  : 'text-[#C39BD3]';

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(isSelected ? '' : u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#3A76C2] text-white shadow ring-2 ring-[#5DA9E9]/40'
                      : 'bg-[#0B1A2E] text-[#F1F5F9] hover:bg-[#12273F] border border-[#223B57]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${roleColor} bg-current`} />
                  <span>{u.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono opacity-80">
                    {u.actions_count} ações
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros Secundários & Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#223B57]/50">
          {/* Categoria */}
          <div>
            <label className="text-[10px] text-[#9FB3C8] font-bold uppercase block mb-1">
              Categoria do Evento
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
            >
              <option value="">Todas as Categorias</option>
              <option value="SECURITY">Segurança & Pânico</option>
              <option value="AUDIT_MODE">Modo Auditor (S5)</option>
              <option value="TELEMETRY">Telemetria & TPMS</option>
              <option value="B2B">Oficinas Credenciadas (B2B)</option>
              <option value="CMS">CMS & Moderação</option>
              <option value="SYSTEM">Sistema & Sessão</option>
            </select>
          </div>

          {/* Papel */}
          <div>
            <label className="text-[10px] text-[#9FB3C8] font-bold uppercase block mb-1">
              Papel (Role)
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
            >
              <option value="">Todos os Papéis</option>
              <option value="DRIVER">Motorista (DRIVER)</option>
              <option value="WORKSHOP_OWNER">Oficina (WORKSHOP_OWNER)</option>
              <option value="ADMIN">Administrador (ADMIN)</option>
              <option value="SUPER_ADMIN">Super Administrador (SUPER_ADMIN)</option>
            </select>
          </div>

          {/* Campo de Busca Livre */}
          <div>
            <label className="text-[10px] text-[#9FB3C8] font-bold uppercase block mb-1">
              Buscar Termo / IP / Entidade
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Ex: TPMS, Corolla, corte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder-[#9FB3C8]/50 focus:outline-none focus:border-[#3A76C2]"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-2.5 text-[#9FB3C8] hover:text-white"
                title="Buscar"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Toggle de Apenas Impersonados & Exportar */}
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F1F5F9] select-none py-1">
              <input
                type="checkbox"
                checked={onlyImpersonated}
                onChange={(e) => setOnlyImpersonated(e.target.checked)}
                className="rounded border-[#223B57] bg-[#0B1A2E] text-[#3A76C2] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-[#9FB3C8]">
                Apenas Ações em Modo Auditor
              </span>
            </label>

            <button
              onClick={handleExportJSON}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0B1A2E] hover:bg-[#12273F] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#5DA9E9]" />
              <span>Exportar Trilha (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visualizador da Linha do Tempo (Chronological Timeline) */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#223B57]/60">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#5DA9E9]" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Linha do Tempo Cronológica ({timeline.length} eventos encontrados)
            </h3>
          </div>
          <span className="text-xs text-[#9FB3C8] font-mono">
            Ordem: Mais Recente para o Mais Antigo
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="p-12 text-center text-[#9FB3C8] space-y-3">
            <Clock className="w-10 h-10 mx-auto text-[#9FB3C8]/40" />
            <p className="text-sm">Nenhum evento registrado com os filtros aplicados.</p>
            <button
              onClick={() => {
                setSelectedUserId('');
                setSelectedRole('');
                setSelectedCategory('');
                setOnlyImpersonated(false);
                setSearchTerm('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#3A76C2] text-white text-xs font-bold"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#223B57]">
            {timeline.map((item, index) => {
              const badgeStyle = getActionBadgeColor(item.action, item.category);
              const isExpanded = expandedPayloadIds.has(item.id);

              return (
                <div key={item.id} className="relative group">
                  {/* Marcador do nó na linha vertical */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full ${badgeStyle.bg} border-2 ${badgeStyle.border} flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 z-10`}
                  >
                    <div className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                  </div>

                  {/* Card do Evento na Linha do Tempo */}
                  <div className="p-4 rounded-2xl bg-[#0B1A2E] border border-[#223B57] hover:border-[#3A76C2]/60 transition-all shadow-md space-y-3">
                    {/* Topo do Card: Horário, Ação e Papel */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Badge da Ação */}
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
                        >
                          {item.action}
                        </span>

                        {/* Indicador de Modo Auditor / Impersonado */}
                        {item.impersonated && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#8E44AD]/20 border border-[#8E44AD]/40 text-[#C39BD3] flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Modo Auditor (Impersonado)
                          </span>
                        )}

                        {/* Categoria */}
                        <span className="text-[10px] text-[#9FB3C8] font-mono uppercase bg-[#12273F] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>

                      {/* Horário */}
                      <div className="flex items-center gap-2 text-right shrink-0">
                        <span className="text-xs font-semibold text-[#5DA9E9]">
                          {formatRelativeTime(item.created_at)}
                        </span>
                        <span className="text-[11px] text-[#9FB3C8] font-mono">
                          ({new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                        </span>
                      </div>
                    </div>

                    {/* Descrição Amigável do Evento */}
                    <p className="text-xs sm:text-sm text-[#F1F5F9] leading-relaxed">
                      {getActionFriendlyDescription(item)}
                    </p>

                    {/* Metadados Básicos: Ator, Entidade e IP */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#223B57]/50 text-[11px]">
                      <div className="flex flex-wrap items-center gap-3 text-[#9FB3C8]">
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <User className="w-3.5 h-3.5 text-[#5DA9E9]" />
                          <span>{item.actor_name || item.actor_user_id}</span>
                          <span className="text-[10px] text-[#9FB3C8] font-mono">
                            ({item.actor_role})
                          </span>
                        </span>

                        <span>•</span>

                        <span className="font-mono text-[#9FB3C8]">
                          Entidade: <strong className="text-white">{item.entity}</strong> #{item.entity_id}
                        </span>

                        <span>•</span>

                        <span className="font-mono text-[#9FB3C8]">
                          IP: {item.ip}
                        </span>
                      </div>

                      {/* Botão de Expansão de Metadados / Payload */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#5DA9E9] hover:text-white transition-colors ml-auto"
                        >
                          <span>{isExpanded ? 'Ocultar Payload' : 'Ver Payload & Detalhes'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Bloco Expandido com Payload JSON Formatado */}
                    {isExpanded && item.metadata && (
                      <div className="pt-2 animate-fade-in">
                        <div className="p-3 rounded-xl bg-[#071322] border border-[#223B57] font-mono text-[11px] text-[#5DA9E9] overflow-x-auto">
                          <div className="text-[10px] text-[#9FB3C8] uppercase font-sans mb-1 font-bold flex items-center justify-between">
                            <span>Metadados e Payload Registrados no Banco (audit_logs.metadata):</span>
                            <span>ID: {item.id}</span>
                          </div>
                          <pre className="text-xs text-[#2FA67A]">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
