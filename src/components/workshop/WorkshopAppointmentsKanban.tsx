import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Send,
  FileText,
  User,
  Car,
  ChevronRight,
  ShieldAlert,
  Percent,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { Appointment, AppointmentStatus, AppointmentMessage } from '../../types/index.ts';

interface WorkshopAppointmentsKanbanProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onSendMessage?: (aptId: string, message: string, quote?: number) => void;
}

export const WorkshopAppointmentsKanban: React.FC<WorkshopAppointmentsKanbanProps> = ({
  appointments,
  onUpdateStatus,
  onSendMessage,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTabPanel, setActiveTabPanel] = useState<'chat' | 'budget'>('chat');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, AppointmentMessage[]>>({});

  // Budget Builder state
  const [budgetItems, setBudgetItems] = useState([
    { id: 'item-1', name: 'Óleo Sintético 0W-20 (4 Litros)', price: 280.0 },
    { id: 'item-2', name: 'Filtro de Óleo Original Toyota', price: 60.0 },
    { id: 'item-3', name: 'Mão de Obra + Checklist TPMS', price: 260.0 },
  ]);

  const discountRate = selectedAppointment?.discount_percent ? selectedAppointment.discount_percent / 100 : 0.2; // 20%
  const subtotal = budgetItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = subtotal * discountRate;
  const finalTotal = subtotal - discountAmount;

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      apt.driver_name?.toLowerCase().includes(q) ||
      apt.vehicle_model?.toLowerCase().includes(q) ||
      apt.vehicle_plate?.toLowerCase().includes(q) ||
      apt.service_summary.toLowerCase().includes(q)
    );
  });

  // Top Metrics
  const requestedToday = 5;
  const inMaintenanceCount = 3;
  const completedMonth = 28;
  const accumulatedRevenue = 34800.0;

  // Pipeline Columns
  const columns: {
    id: AppointmentStatus;
    title: string;
    description: string;
    badgeBg: string;
    borderCol: string;
  }[] = [
    {
      id: 'PENDING',
      title: 'Pendente / Novas',
      description: 'Solicitações recentes',
      badgeBg: 'bg-[#E09F3E]/20 text-[#E09F3E]',
      borderCol: 'border-[#E09F3E]/40',
    },
    {
      id: 'IN_REVIEW',
      title: 'Em Análise / Orçamento',
      description: 'Aguardando precificação',
      badgeBg: 'bg-[#5DA9E9]/20 text-[#5DA9E9]',
      borderCol: 'border-[#5DA9E9]/40',
    },
    {
      id: 'APPROVED',
      title: 'Aprovado pelo Motorista',
      description: 'Confirmados para recepção',
      badgeBg: 'bg-[#3A76C2]/20 text-[#3A76C2]',
      borderCol: 'border-[#3A76C2]/40',
    },
    {
      id: 'IN_MAINTENANCE',
      title: 'Em Manutenção (Oficina)',
      description: 'No elevador / Box ativo',
      badgeBg: 'bg-[#A855F7]/20 text-[#A855F7]',
      borderCol: 'border-[#A855F7]/40',
    },
    {
      id: 'COMPLETED',
      title: 'Concluído',
      description: 'Serviço finalizado & entregue',
      badgeBg: 'bg-[#2FA67A]/20 text-[#2FA67A]',
      borderCol: 'border-[#2FA67A]/40',
    },
  ];

  const handleOpenDrawer = (apt: Appointment, mode: 'chat' | 'budget') => {
    setSelectedAppointment(apt);
    setActiveTabPanel(mode);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !chatInput.trim()) return;

    const newMsg: AppointmentMessage = {
      id: `msg-${Date.now()}`,
      appointment_id: selectedAppointment.id,
      sender_user_id: 'usr-workshop-001',
      sender_name: 'AutoTech Premium (Consultor Técnico)',
      sender_role: 'WORKSHOP_OWNER',
      body: chatInput.trim(),
      created_at: new Date().toISOString(),
    };

    setLocalMessages((prev) => ({
      ...prev,
      [selectedAppointment.id]: [
        ...(prev[selectedAppointment.id] || selectedAppointment.messages || []),
        newMsg,
      ],
    }));

    if (onSendMessage) {
      onSendMessage(selectedAppointment.id, chatInput.trim());
    }

    setChatInput('');
  };

  const handleSendBudgetToDriver = () => {
    if (!selectedAppointment) return;

    const budgetMsg: AppointmentMessage = {
      id: `msg-bgt-${Date.now()}`,
      appointment_id: selectedAppointment.id,
      sender_user_id: 'usr-workshop-001',
      sender_name: 'AutoTech Premium (Proposta Oficial)',
      sender_role: 'WORKSHOP_OWNER',
      body: `Orçamento comercial gerado para aprovação:\n• ${budgetItems
        .map((i) => `${i.name} (R$ ${i.price.toFixed(2)})`)
        .join('\n• ')}\nSubtotal: R$ ${subtotal.toFixed(2)}\nDesconto ${selectedAppointment.driver_plan || 'Advanced'} (-${(discountRate * 100).toFixed(0)}%): - R$ ${discountAmount.toFixed(2)}\nValor Final: R$ ${finalTotal.toFixed(2)}`,
      quote_amount: finalTotal,
      created_at: new Date().toISOString(),
    };

    setLocalMessages((prev) => ({
      ...prev,
      [selectedAppointment.id]: [
        ...(prev[selectedAppointment.id] || selectedAppointment.messages || []),
        budgetMsg,
      ],
    }));

    // Update status to IN_REVIEW or APPROVED
    onUpdateStatus(selectedAppointment.id, 'IN_REVIEW');

    setToastMessage(`Proposta de R$ ${finalTotal.toFixed(2)} enviada com sucesso para ${selectedAppointment.driver_name}!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const currentMessages = selectedAppointment
    ? localMessages[selectedAppointment.id] || selectedAppointment.messages || []
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Orçamento Transmitido</div>
            <div className="text-[#9FB3C8]">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* 1. Métricas no Topo do Painel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-md flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#E09F3E]/20 text-[#E09F3E]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase block">
              Solicitados Hoje
            </span>
            <span className="text-xl font-bold font-mono text-white">{requestedToday}</span>
            <span className="text-[10px] text-[#2FA67A] block mt-0.5">+2 desde 08h00</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-md flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#A855F7]/20 text-[#A855F7]">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase block">
              Em Manutenção
            </span>
            <span className="text-xl font-bold font-mono text-white">{inMaintenanceCount}</span>
            <span className="text-[10px] text-[#A855F7] block mt-0.5">Boxes 1, 2 e EV ativos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-md flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#2FA67A]/20 text-[#2FA67A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase block">
              Concluídos no Mês
            </span>
            <span className="text-xl font-bold font-mono text-white">{completedMonth}</span>
            <span className="text-[10px] text-[#2FA67A] block mt-0.5">100% Selo Homologado</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-md flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#3A76C2]/20 text-[#5DA9E9]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase block">
              Faturamento Acumulado
            </span>
            <span className="text-xl font-bold font-mono text-[#2FA67A]">
              R$ {accumulatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#9FB3C8] block mt-0.5">Ticket médio: R$ 1.242,00</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#12273F] border border-[#223B57]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9FB3C8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por motorista, modelo de carro, placa ou serviço..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white placeholder-[#9FB3C8] focus:outline-hidden focus:border-[#3A76C2]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9FB3C8]">
          <Filter className="w-3.5 h-3.5" />
          <span>Exibindo <strong>{filteredAppointments.length}</strong> ordens de serviço</span>
        </div>
      </div>

      {/* 2. Pipeline Kanban com 5 Colunas Interativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colAppointments = filteredAppointments.filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl bg-[#0E1E33] border border-[#223B57] p-3 min-w-[260px] shadow-lg"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-[#223B57] mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{col.title}</span>
                  </h4>
                  <span className="text-[10px] text-[#9FB3C8]">{col.description}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${col.badgeBg}`}>
                  {colAppointments.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                {colAppointments.length === 0 ? (
                  <div className="p-6 text-center text-[#9FB3C8] text-[11px] border border-dashed border-[#223B57] rounded-xl">
                    Nenhum atendimento nesta etapa
                  </div>
                ) : (
                  colAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-xl bg-[#12273F] border border-[#223B57] hover:border-[#3A76C2] transition-all shadow-md space-y-2.5 relative group"
                    >
                      {/* Driver & Plan Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {apt.driver_name || 'Motorista'}
                          </span>
                          <span className="text-[10px] text-[#9FB3C8] flex items-center gap-1 mt-0.5">
                            <Car className="w-3 h-3 text-[#5DA9E9]" />
                            {apt.vehicle_model}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            apt.driver_plan === 'ADVANCED'
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40'
                              : 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/40'
                          }`}
                        >
                          {apt.driver_plan || 'ADVANCED'}
                        </span>
                      </div>

                      {/* Service Summary */}
                      <div className="p-2 rounded-lg bg-[#0B1A2E] border border-[#223B57]/80 text-[11px] text-[#F1F5F9]">
                        <p className="line-clamp-2">{apt.service_summary}</p>
                        {apt.vehicle_plate && (
                          <span className="text-[10px] font-mono text-[#5DA9E9] mt-1 block">
                            Placa: {apt.vehicle_plate} • {apt.distance_km ? `${apt.distance_km} km` : '1.8 km'}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar for IN_MAINTENANCE */}
                      {apt.status === 'IN_MAINTENANCE' && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-[#9FB3C8] mb-1">
                            <span>Execução no Box:</span>
                            <span className="font-bold text-[#A855F7] font-mono">
                              {apt.progress_pct || 65}% Concluído
                            </span>
                          </div>
                          <div className="w-full bg-[#0B1A2E] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#A855F7] h-full rounded-full transition-all duration-500"
                              style={{ width: `${apt.progress_pct || 65}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Cost or Discount */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#223B57]/60">
                        <span className="text-[#2FA67A] font-semibold">
                          {apt.benefit_label || `Desconto: ${apt.discount_percent}% OFF`}
                        </span>
                        {apt.service_cost && (
                          <span className="font-mono font-bold text-white">
                            R$ {apt.service_cost.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {apt.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleOpenDrawer(apt, 'budget')}
                              className="flex-1 py-1 px-2 rounded-lg bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                            >
                              <FileText className="w-3 h-3" />
                              Orçar
                            </button>
                            <button
                              onClick={() => handleOpenDrawer(apt, 'chat')}
                              className="py-1 px-2 rounded-lg bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#9FB3C8] hover:text-white text-[10px] font-medium"
                              title="Abrir Chat"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {apt.status === 'IN_REVIEW' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(apt.id, 'APPROVED')}
                              className="flex-1 py-1 px-2 rounded-lg bg-[#2FA67A] hover:bg-[#258763] text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleOpenDrawer(apt, 'chat')}
                              className="py-1 px-2 rounded-lg bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#9FB3C8] hover:text-white text-[10px]"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {apt.status === 'APPROVED' && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, 'IN_MAINTENANCE')}
                            className="w-full py-1 px-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Iniciar Atendimento
                          </button>
                        )}

                        {apt.status === 'IN_MAINTENANCE' && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, 'COMPLETED')}
                            className="w-full py-1 px-2 rounded-lg bg-[#2FA67A] hover:bg-[#258763] text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Concluir Serviço
                          </button>
                        )}

                        {apt.status === 'COMPLETED' && (
                          <div className="w-full text-center text-[10px] text-[#2FA67A] font-semibold py-0.5">
                            ✓ Entregue com Selo Anti-Fraude
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Gaveta Lateral / Modal de Chat Direct B2B & Criador de Orçamentos (BLOCO 2.4) */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="p-4 bg-[#0E1E33] border-b border-[#223B57] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {selectedAppointment.driver_name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                    {selectedAppointment.vehicle_model} • {selectedAppointment.vehicle_plate}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    {selectedAppointment.driver_plan || 'ADVANCED'} (20% OFF)
                  </span>
                </div>
                <p className="text-xs text-[#9FB3C8] mt-0.5">{selectedAppointment.service_summary}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#0B1A2E] p-1 rounded-xl border border-[#223B57]">
                  <button
                    onClick={() => setActiveTabPanel('chat')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTabPanel === 'chat'
                        ? 'bg-[#3A76C2] text-white shadow-xs'
                        : 'text-[#9FB3C8] hover:text-white'
                    }`}
                  >
                    Chat Direct
                  </button>
                  <button
                    onClick={() => setActiveTabPanel('budget')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTabPanel === 'budget'
                        ? 'bg-[#2FA67A] text-white shadow-xs'
                        : 'text-[#9FB3C8] hover:text-white'
                    }`}
                  >
                    Criador de Orçamento
                  </button>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body: Switch between Chat and Budget Builder */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTabPanel === 'chat' ? (
                /* Chat Direct B2B Panel */
                <div className="space-y-4 flex flex-col h-[460px]">
                  <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                    {currentMessages.length === 0 ? (
                      <div className="text-center text-[#9FB3C8] text-xs py-8">
                        Nenhuma mensagem trocada ainda com o motorista.
                      </div>
                    ) : (
                      currentMessages.map((m) => {
                        const isWorkshop = m.sender_role === 'WORKSHOP_OWNER';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isWorkshop ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-[#9FB3C8] mb-0.5">
                              {m.sender_name || (isWorkshop ? 'AutoTech Premium' : 'Motorista')}
                            </span>
                            <div
                              className={`p-3 rounded-2xl max-w-md text-xs whitespace-pre-line ${
                                isWorkshop
                                  ? 'bg-[#2FA67A] text-white rounded-tr-xs'
                                  : 'bg-[#12273F] text-white border border-[#223B57] rounded-tl-xs'
                              }`}
                            >
                              {m.body}
                              {m.quote_amount && (
                                <div className="mt-2 pt-2 border-t border-white/20 font-mono font-bold text-sm">
                                  Valor Proposto: R$ {m.quote_amount.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-[#9FB3C8] mt-0.5 font-mono">
                              {new Date(m.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Negocie itens de revisão ou informe o status da bancada..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white placeholder-[#9FB3C8] focus:outline-hidden focus:border-[#3A76C2]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      Enviar
                    </button>
                  </form>
                </div>
              ) : (
                /* Budget Builder Component (W2) */
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#2FA67A]" />
                          Criador de Proposta Comercial Homologada
                        </h4>
                        <p className="text-xs text-[#9FB3C8]">
                          Monte itens de peças e mão de obra com desconto automático de acordo com o plano do motorista.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30">
                        Benefício Aplicado: {selectedAppointment.driver_plan || 'Advanced'} ({(discountRate * 100).toFixed(0)}% OFF)
                      </span>
                    </div>

                    {/* Table of Budget Items */}
                    <div className="space-y-2">
                      {budgetItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#12273F] border border-[#223B57] text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] text-[#9FB3C8]">{index + 1}.</span>
                            <span className="font-semibold text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-white">
                              R$ {item.price.toFixed(2)}
                            </span>
                            <button
                              onClick={() => setBudgetItems(budgetItems.filter((b) => b.id !== item.id))}
                              className="text-[#E5484D] hover:opacity-80"
                              title="Remover Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item form */}
                    <button
                      onClick={() =>
                        setBudgetItems([
                          ...budgetItems,
                          {
                            id: `item-${Date.now()}`,
                            name: 'Alinhamento 3D + Balanceamento',
                            price: 180.0,
                          },
                        ])
                      }
                      className="mt-3 px-3 py-1.5 rounded-lg bg-[#12273F] hover:bg-[#1a3454] border border-[#223B57] text-xs text-[#5DA9E9] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Item Personalizado
                    </button>
                  </div>

                  {/* Calculations Summary Card */}
                  <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-[#9FB3C8]">
                      <span>Subtotal das Peças e Serviços:</span>
                      <strong className="text-white">R$ {subtotal.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-[#2FA67A]">
                      <span>Desconto {selectedAppointment.driver_plan || 'Advanced'} (-{(discountRate * 100).toFixed(0)}%):</span>
                      <strong>- R$ {discountAmount.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#223B57]">
                      <span>Valor Final para o Cliente:</span>
                      <span className="text-[#2FA67A]">R$ {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setActiveTabPanel('chat')}
                      className="px-4 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white text-xs font-medium"
                    >
                      Voltar ao Chat
                    </button>
                    <button
                      onClick={handleSendBudgetToDriver}
                      className="px-5 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#258763] text-white text-xs font-bold shadow-md flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Enviar Orçamento para Aprovação do Motorista
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
