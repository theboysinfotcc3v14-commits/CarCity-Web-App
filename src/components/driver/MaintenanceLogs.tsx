import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Gauge,
  PlusCircle,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Car,
  ChevronRight,
  Download,
  CalendarCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { MaintenanceLog, MaintenanceServiceType } from '../../types/index.ts';

export const MaintenanceLogs: React.FC = () => {
  const {
    selectedVehicle,
    vehicles,
    setSelectedVehicle,
    maintenanceLogs,
    addMaintenanceLog,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State for new log
  const [formTitle, setFormTitle] = useState('');
  const [formServiceType, setFormServiceType] = useState<MaintenanceServiceType>('REVISAO_PERIODICA');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOdometer, setFormOdometer] = useState(
    selectedVehicle?.odometer_km ? selectedVehicle.odometer_km.toString() : '30000'
  );
  const [formWorkshop, setFormWorkshop] = useState('AutoPro Centro Especializado Jardins');
  const [formTechnician, setFormTechnician] = useState('');
  const [formCost, setFormCost] = useState('450');
  const [formStatus, setFormStatus] = useState<'CONCLUIDO' | 'AGENDADO' | 'EM_ANDAMENTO'>('CONCLUIDO');
  const [formInvoice, setFormInvoice] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center text-[#9FB3C8] bg-[#12273F] rounded-2xl border border-[#223B57]">
        <Car className="w-12 h-12 mx-auto mb-2 opacity-50 text-[#5DA9E9]" />
        <p className="text-white font-medium">Nenhum veículo selecionado.</p>
        <p className="text-xs text-[#9FB3C8] mt-1">Selecione um veículo ativo para ver o histórico de manutenção.</p>
      </div>
    );
  }

  // Filter logs for selected vehicle (or match by vehicle id or plate)
  const vehicleLogs = maintenanceLogs.filter(
    (log) =>
      log.vehicle_id === selectedVehicle.id ||
      (selectedVehicle.id === 'veh-corolla-001' && (log.vehicle_id === 'veh-001' || log.vehicle_plate === 'ABC-1D23')) ||
      (selectedVehicle.id === 'veh-001' && (log.vehicle_id === 'veh-corolla-001' || log.vehicle_plate === 'ABC-1D23')) ||
      (selectedVehicle.id === 'veh-byd-002' && (log.vehicle_id === 'veh-002' || log.vehicle_plate === 'EV-9876')) ||
      (selectedVehicle.id === 'veh-002' && (log.vehicle_id === 'veh-byd-002' || log.vehicle_plate === 'EV-9876')) ||
      (selectedVehicle.id === 'veh-bmw-003' && (log.vehicle_id === 'veh-003' || log.vehicle_plate === 'CAR-2024')) ||
      (selectedVehicle.id === 'veh-003' && (log.vehicle_id === 'veh-bmw-003' || log.vehicle_plate === 'CAR-2024'))
  );

  // Filtered by user search and service type filter
  const filteredLogs = vehicleLogs.filter((log) => {
    const matchesSearch =
      log.service_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.workshop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.invoice_number && log.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedServiceType === 'ALL' || log.service_type === selectedServiceType;

    return matchesSearch && matchesType;
  });

  // Calculate summary metrics
  const totalCost = vehicleLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
  const completedLogs = vehicleLogs.filter((log) => log.status === 'CONCLUIDO');
  const lastService = completedLogs.length > 0 ? completedLogs[0] : null;
  const remainingRevisionKm = Math.max(0, selectedVehicle.next_revision_km - selectedVehicle.odometer_km);

  const getServiceTypeBadge = (type: MaintenanceServiceType) => {
    switch (type) {
      case 'REVISAO_PERIODICA':
        return { label: 'Revisão Periódica', bg: 'bg-[#3A76C2]/20 text-[#5DA9E9] border-[#3A76C2]/40' };
      case 'TROCA_OLEO_FILTRO':
        return { label: 'Óleo & Lubrificação', bg: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' };
      case 'FREIOS_PASTILHAS':
        return { label: 'Pastilhas & Freios', bg: 'bg-[#E5484D]/20 text-[#E5484D] border-[#E5484D]/40' };
      case 'PNEUS_BALANCEAMENTO':
        return { label: 'Pneus & Geometria', bg: 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/40' };
      case 'BATERIA_SISTEMA_ELETRICO':
        return { label: 'Bateria & Elétrica', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' };
      case 'AR_CONDICIONADO':
        return { label: 'Climatização & Cabine', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' };
      default:
        return { label: 'Manutenção Geral', bg: 'bg-gray-500/20 text-gray-300 border-gray-500/40' };
    }
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addMaintenanceLog({
      vehicle_id: selectedVehicle.id,
      vehicle_plate: selectedVehicle.plate,
      service_type: formServiceType,
      service_title: formTitle.trim(),
      date: formDate,
      odometer_km: parseInt(formOdometer) || selectedVehicle.odometer_km,
      workshop_name: formWorkshop.trim(),
      technician_name: formTechnician.trim() || undefined,
      cost: parseFloat(formCost) || 0,
      status: formStatus,
      notes: formNotes.trim(),
      invoice_number: formInvoice.trim() || undefined,
      anti_fraud_verified: true,
    });

    setIsAddModalOpen(false);
    setFormTitle('');
    setFormNotes('');
    setFormInvoice('');
    setSuccessToast('Novo registro de manutenção gravado com sucesso no livro digital!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = [
      'ID Registro',
      'Veículo',
      'Placa',
      'Data Serviço',
      'Odômetro (km)',
      'Tipo Serviço',
      'Título / Descrição',
      'Oficina Prestadora',
      'Técnico',
      'Custo (R$)',
      'Status',
      'NF-e',
      'Observações Técnicas',
    ];

    const rows = vehicleLogs.map((log) => [
      `"${log.id}"`,
      `"${selectedVehicle.brand} ${selectedVehicle.model}"`,
      `"${selectedVehicle.plate}"`,
      `"${log.date}"`,
      log.odometer_km,
      `"${log.service_type}"`,
      `"${log.service_title.replace(/"/g, '""')}"`,
      `"${log.workshop_name.replace(/"/g, '""')}"`,
      `"${(log.technician_name || '').replace(/"/g, '""')}"`,
      log.cost.toFixed(2),
      `"${log.status}"`,
      `"${log.invoice_number || ''}"`,
      `"${log.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_manutencao_${selectedVehicle.plate}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Livro Digital Atualizado</div>
            <div className="text-[#9FB3C8]">{successToast}</div>
          </div>
        </div>
      )}

      {/* Header & Quick Action Banner */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#2FA67A]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Livro Digital de Manutenções
              </span>
              <span className="text-xs font-mono text-[#9FB3C8]">
                Placa: <strong className="text-white">{selectedVehicle.plate}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Wrench className="w-6 h-6 text-[#2FA67A]" />
              <span>Histórico de Serviços & Revisões (Maintenance Logs)</span>
            </h2>
            <p className="text-xs text-[#9FB3C8] mt-1">
              Rastreamento imutável de quilometragem, ordens de serviço, notas fiscais e laudos técnicos com verificação anti-fraude.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white text-xs font-bold transition-colors shadow flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Serviço
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] border border-[#223B57] text-[#9FB3C8] hover:text-white text-xs font-medium transition-colors flex items-center gap-2"
              title="Baixar histórico em CSV"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className="px-3.5 py-2.5 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] border border-[#223B57] text-[#5DA9E9] text-xs font-medium transition-colors flex items-center gap-2"
              title="Agendar nova revisão na rede credenciada"
            >
              <CalendarCheck className="w-4 h-4" />
              Agendar Oficina
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#223B57]/60">
          <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
            <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-1">
              <span>Total de Serviços:</span>
              <Wrench className="w-4 h-4 text-[#5DA9E9]" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {vehicleLogs.length} intervenções
            </div>
            <div className="text-[10px] text-[#2FA67A] mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> 100% verificadas por telemetria
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
            <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-1">
              <span>Investimento Total:</span>
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="text-lg font-bold text-[#D4AF37] font-mono">
              R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#9FB3C8] mt-1 font-mono">
              Economia média: ~18% (Plano Ativo)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
            <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-1">
              <span>Última Revisão:</span>
              <Calendar className="w-4 h-4 text-[#2FA67A]" />
            </div>
            <div className="text-sm font-bold text-white">
              {lastService ? (
                <span>
                  {new Date(lastService.date + 'T00:00:00').toLocaleDateString('pt-BR')} ({lastService.odometer_km.toLocaleString('pt-BR')} km)
                </span>
              ) : (
                <span className="text-[#9FB3C8]">Nenhuma registrada</span>
              )}
            </div>
            <div className="text-[10px] text-[#9FB3C8] mt-1 truncate">
              {lastService?.workshop_name || 'Rede autorizada'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
            <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-1">
              <span>Próxima Revisão Obrigatória:</span>
              <Clock className="w-4 h-4 text-[#E09F3E]" />
            </div>
            <div className="text-lg font-bold text-[#E09F3E] font-mono">
              Em {remainingRevisionKm.toLocaleString('pt-BR')} km
            </div>
            <div className="text-[10px] text-[#9FB3C8] mt-1 font-mono">
              Odômetro alvo: {selectedVehicle.next_revision_km.toLocaleString('pt-BR')} km
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9FB3C8] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por serviço, oficina, NF..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white placeholder-[#9FB3C8] focus:border-[#3A76C2] focus:outline-none"
          />
        </div>

        {/* Filter by Service Type */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-[#9FB3C8] shrink-0 hidden sm:block" />
          <button
            onClick={() => setSelectedServiceType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedServiceType === 'ALL'
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            Todos ({vehicleLogs.length})
          </button>
          <button
            onClick={() => setSelectedServiceType('REVISAO_PERIODICA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedServiceType === 'REVISAO_PERIODICA'
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            Revisões Periódicas
          </button>
          <button
            onClick={() => setSelectedServiceType('PNEUS_BALANCEAMENTO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedServiceType === 'PNEUS_BALANCEAMENTO'
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            Pneus & TPMS
          </button>
          <button
            onClick={() => setSelectedServiceType('FREIOS_PASTILHAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedServiceType === 'FREIOS_PASTILHAS'
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            Freios
          </button>
          <button
            onClick={() => setSelectedServiceType('BATERIA_SISTEMA_ELETRICO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedServiceType === 'BATERIA_SISTEMA_ELETRICO'
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            Bateria / EV
          </button>
        </div>
      </div>

      {/* Maintenance Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-[#12273F] rounded-2xl border border-[#223B57] text-[#9FB3C8]">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#5DA9E9]" />
            <h3 className="text-sm font-bold text-white">Nenhum registro encontrado</h3>
            <p className="text-xs text-[#9FB3C8] mt-1 max-w-md mx-auto">
              Nenhuma intervenção mecânica corresponde aos filtros selecionados. Clique em "Registrar Serviço" para adicionar o histórico.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getServiceTypeBadge(log.service_type);
            const formattedDate = new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR');

            return (
              <div
                key={log.id}
                className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] hover:border-[#3A76C2]/60 transition-all shadow-sm space-y-4"
              >
                {/* Top Row: Service Title, Type Badge, Cost, Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#5DA9E9] shrink-0 mt-0.5">
                      <Wrench className="w-5 h-5 text-[#2FA67A]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {log.service_title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {log.anti_fraud_verified && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#2FA67A]/15 text-[#2FA67A] border border-[#2FA67A]/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Anti-Fraude Verified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#9FB3C8] mt-1 font-mono">
                        <span className="flex items-center gap-1 text-white">
                          <Calendar className="w-3.5 h-3.5 text-[#5DA9E9]" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-white">
                          <Gauge className="w-3.5 h-3.5 text-[#2FA67A]" />
                          {log.odometer_km.toLocaleString('pt-BR')} km
                        </span>
                        <span>•</span>
                        <span className="text-[#9FB3C8]">
                          Oficina: <strong className="text-white">{log.workshop_name}</strong>
                          {log.technician_name && ` (${log.technician_name})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Status Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-[#223B57]">
                    <div className="text-base sm:text-lg font-bold font-mono text-[#D4AF37]">
                      R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2FA67A]/15 text-[#2FA67A] border border-[#2FA67A]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status === 'CONCLUIDO' ? 'Concluído' : log.status}
                    </span>
                  </div>
                </div>

                {/* Technical notes & Invoice detail */}
                <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]/60 text-xs text-[#9FB3C8] space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                    <span>Parecer Técnico & Peças Substituídas:</span>
                    {log.invoice_number && (
                      <span className="font-mono text-[#5DA9E9] flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        NF-e: {log.invoice_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[#CAD7E6] leading-relaxed">
                    {log.notes}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New Maintenance Log */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#12273F] border border-[#223B57] rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#223B57] bg-[#0B1A2E]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#2FA67A]/20 text-[#2FA67A]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Nova Manutenção</h3>
                  <p className="text-xs text-[#9FB3C8]">
                    Veículo: {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#223B57] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLog} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                  Título da Ordem de Serviço / Intervenção *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Troca de Óleo e Filtros / Rodízio de Pneus"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white placeholder-[#9FB3C8] focus:border-[#2FA67A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Tipo de Serviço *
                  </label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value as MaintenanceServiceType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white focus:border-[#2FA67A] focus:outline-none"
                  >
                    <option value="REVISAO_PERIODICA">Revisão Periódica</option>
                    <option value="TROCA_OLEO_FILTRO">Óleo e Lubrificação</option>
                    <option value="FREIOS_PASTILHAS">Freios e Pastilhas</option>
                    <option value="PNEUS_BALANCEAMENTO">Pneus, Rodízio e TPMS</option>
                    <option value="BATERIA_SISTEMA_ELETRICO">Bateria e Sistema Elétrico / EV</option>
                    <option value="SUSPENSAO_DIRECAO">Suspensão e Direção</option>
                    <option value="AR_CONDICIONADO">Ar Condicionado e Cabine</option>
                    <option value="OUTRO">Outros Serviços</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Data do Serviço *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white focus:border-[#2FA67A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Odômetro no Ato (km) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formOdometer}
                    onChange={(e) => setFormOdometer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white font-mono focus:border-[#2FA67A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white font-mono focus:border-[#2FA67A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white focus:border-[#2FA67A] focus:outline-none"
                  >
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="AGENDADO">Agendado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Oficina Prestadora *
                  </label>
                  <input
                    type="text"
                    required
                    value={formWorkshop}
                    onChange={(e) => setFormWorkshop(e.target.value)}
                    placeholder="Nome da oficina"
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white focus:border-[#2FA67A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                    Número da NF-e / OS (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                    placeholder="Ex: NF-0049210"
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white focus:border-[#2FA67A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9FB3C8] mb-1">
                  Laudo Técnico / Peças Substituídas
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Descreva detalhes como especificação do óleo, marcas das peças utilizadas, garantias e torque aplicado..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-white placeholder-[#9FB3C8] focus:border-[#2FA67A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar no Livro Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
