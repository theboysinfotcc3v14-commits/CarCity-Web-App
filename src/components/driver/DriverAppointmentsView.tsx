import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Wrench,
  Clock,
  CheckCircle,
  MessageSquare,
  Send,
  Plus,
  Car,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { Appointment, Workshop } from '../../types/index.ts';

export const DriverAppointmentsView: React.FC = () => {
  const { user, selectedVehicle, appointments: globalAppointments } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>(globalAppointments || []);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(globalAppointments?.[0] || null);
  const [chatMessage, setChatMessage] = useState('');
  const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [serviceSummary, setServiceSummary] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchWorkshops();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
        if (data.length > 0) {
          setSelectedApt((prev) => (prev ? data.find((a: Appointment) => a.id === prev.id) || data[0] : data[0]));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const res = await fetch('/api/workshops?status=VERIFIED');
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data);
        if (data.length > 0) setSelectedWorkshopId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt || !chatMessage.trim()) return;

    try {
      const res = await fetch(`/api/appointments/${selectedApt.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatMessage.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...selectedApt,
          messages: [...(selectedApt.messages || []), data.message],
        };
        setSelectedApt(updated);
        setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setChatMessage('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId || !serviceSummary.trim() || !selectedVehicle) return;

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshop_id: selectedWorkshopId,
          vehicle_id: selectedVehicle.id,
          service_summary: serviceSummary.trim(),
        }),
      });

      if (res.ok) {
        setIsNewAptModalOpen(false);
        setServiceSummary('');
        await fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'IN_REVIEW':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'IN_MAINTENANCE':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12273F] border border-[#223B57]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#2FA67A]" />
            Meus Agendamentos na Rede Credenciada
          </h2>
          <p className="text-xs text-[#9FB3C8]">
            Benefício ativo: Plano {user?.plan} com{' '}
            <strong className="text-white">
              {user?.plan === 'ADVANCED' ? '20%' : user?.plan === 'STANDARD' ? '10%' : '5%'}
            </strong>{' '}
            de desconto em mão de obra e peças originais.
          </p>
        </div>

        <button
          onClick={() => setIsNewAptModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-bold text-xs flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          Solicitar Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9FB3C8]">
            Histórico de Agendamentos ({appointments.length})
          </h3>

          {appointments.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9FB3C8] bg-[#12273F] rounded-2xl border border-[#223B57]">
              Nenhum agendamento pendente.
            </div>
          ) : (
            appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedApt(apt)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedApt?.id === apt.id
                    ? 'bg-[#12273F] border-[#3A76C2] shadow-lg ring-1 ring-[#3A76C2]'
                    : 'bg-[#12273F]/70 border-[#223B57] hover:border-[#3A76C2]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{apt.workshop_name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#9FB3C8] mb-2">
                  Veículo: {apt.vehicle_plate} • Desconto: {apt.discount_percent}%
                </div>
                <p className="text-xs text-[#9FB3C8] line-clamp-2 leading-relaxed">
                  {apt.service_summary}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Selected Appointment Details & Chat */}
        <div className="md:col-span-2">
          {selectedApt ? (
            <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
              <div className="flex items-start justify-between border-b border-[#223B57] pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedApt.workshop_name}
                  </h3>
                  <div className="text-xs text-[#9FB3C8] font-mono mt-0.5">
                    {selectedApt.vehicle_model} ({selectedApt.vehicle_plate}) • Agendado em{' '}
                    {new Date(selectedApt.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-bold ${getStatusBadge(selectedApt.status)}`}>
                  {selectedApt.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs">
                <span className="text-[#9FB3C8] block text-[11px] font-semibold mb-1">
                  Resumo do Serviço Solicitado:
                </span>
                <p className="text-white leading-relaxed">{selectedApt.service_summary}</p>
              </div>

              {/* Chat Thread */}
              <div>
                <h4 className="text-xs font-bold text-[#9FB3C8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#3A76C2]" />
                  Chat Direto com o Responsável Técnico
                </h4>
                <div className="h-56 overflow-y-auto space-y-2 p-3 bg-[#0B1A2E] rounded-xl text-xs border border-[#223B57]">
                  {selectedApt.messages?.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl max-w-[85%] ${
                        m.sender_role === 'DRIVER'
                          ? 'bg-[#3A76C2] text-white ml-auto'
                          : 'bg-[#12273F] text-white border border-[#223B57]'
                      }`}
                    >
                      <div className="text-[10px] opacity-70 font-mono mb-0.5">
                        {m.sender_name}
                      </div>
                      <p>{m.body}</p>
                      {m.quote_amount && (
                        <div className="mt-1 pt-1 border-t border-white/20 font-mono font-bold text-yellow-300">
                          Orçamento Formal da Oficina: R$ {m.quote_amount.toFixed(2)} (com desconto de {selectedApt.discount_percent}%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Envie uma mensagem ou tire dúvidas sobre o orçamento..."
                    className="flex-1 bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9FB3C8]/60 focus:outline-none focus:border-[#3A76C2]"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] disabled:opacity-40 text-white font-bold text-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#9FB3C8] bg-[#12273F] rounded-2xl border border-[#223B57]">
              Selecione um agendamento para ver os detalhes e conversar com a oficina.
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {isNewAptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Solicitar Novo Agendamento</h3>
            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9FB3C8] mb-1">Oficina Credenciada (Anti-Fraude Verified):</label>
                <select
                  value={selectedWorkshopId}
                  onChange={(e) => setSelectedWorkshopId(e.target.value)}
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-white"
                >
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nome_fantasia} - {w.address.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1">Veículo Selecionado:</label>
                <div className="p-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] font-mono text-white">
                  {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.plate})
                </div>
              </div>

              <div>
                <label className="block text-[#9FB3C8] mb-1">Descrição do Serviço / Diagnóstico:</label>
                <textarea
                  rows={3}
                  value={serviceSummary}
                  onChange={(e) => setServiceSummary(e.target.value)}
                  placeholder="Ex: Troca preventiva de óleo sintético, pastilhas de freio ou calibração TPMS..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAptModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-bold"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
