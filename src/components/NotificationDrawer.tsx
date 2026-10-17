import React from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Wrench,
  Gauge,
  CheckCircle,
  CalendarCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { MaintenanceAlert } from '../types/index.ts';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    activeVehicleAlerts,
    selectedVehicle,
    setActiveTab,
    refreshVehicleData,
  } = useApp();

  if (!isNotificationsOpen) return null;

  const activeAlerts = activeVehicleAlerts.filter((a) => a.status === 'ACTIVE');
  const criticalAlert = activeAlerts.find((a) => a.severity === 'CRITICO');

  const handleSnooze = async (alertId: string) => {
    if (!selectedVehicle) return;
    try {
      await fetch(`/api/vehicles/${selectedVehicle.id}/alerts/${alertId}/snooze`, {
        method: 'POST',
      });
      await refreshVehicleData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleAppointment = (alert: MaintenanceAlert) => {
    setIsNotificationsOpen(false);
    setActiveTab('appointments');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-md bg-[#12273F] border-l border-[#223B57] h-full shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 bg-[#0B1A2E] border-b border-[#223B57] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#3A76C2]/20 text-[#5DA9E9]">
              <AlertTriangle className="w-5 h-5 text-[#E09F3E]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Central de Alertas & Diagnóstico</h3>
              <p className="text-[11px] text-[#9FB3C8]">
                {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.plate})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#223B57] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Priority Banner on Top if Critical Alert exists (Section D2) */}
          {criticalAlert && (
            <div className="p-4 rounded-2xl bg-[#E5484D]/15 border-2 border-[#E5484D] shadow-lg animate-pulse-slow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#E5484D] text-white">
                  PRIORIDADE MÁXIMA
                </span>
                <span className="text-[11px] text-[#E5484D] font-mono font-bold">
                  {criticalAlert.component}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                {criticalAlert.message}
              </h4>

              {/* Technical readings */}
              <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-[#0B1A2E]/80 border border-[#E5484D]/30 text-[11px] mb-3">
                <div>
                  <span className="text-[#9FB3C8] block text-[9px]">Leitura Sensor:</span>
                  <span className="font-mono font-bold text-[#E5484D]">
                    {criticalAlert.sensor_reading || 'Alerta'}
                  </span>
                </div>
                <div>
                  <span className="text-[#9FB3C8] block text-[9px]">Valor Nominal:</span>
                  <span className="font-mono text-white">
                    {criticalAlert.nominal_value || 'Padrão'}
                  </span>
                </div>
                <div>
                  <span className="text-[#9FB3C8] block text-[9px]">Tolerância:</span>
                  <span className="font-mono text-[#9FB3C8]">
                    {criticalAlert.tolerance || '±0'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleScheduleAppointment(criticalAlert)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Agendar na Oficina Credenciada
                </button>
                <button
                  onClick={() => handleSnooze(criticalAlert.id)}
                  className="py-2 px-3 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] text-[#9FB3C8] text-xs font-medium border border-[#223B57] transition-colors"
                  title="Dispensar alerta temporariamente"
                >
                  Dispensar
                </button>
              </div>
            </div>
          )}

          {/* List of remaining notifications */}
          {activeAlerts.length === 0 ? (
            <div className="p-8 text-center text-[#9FB3C8] space-y-2">
              <CheckCircle className="w-10 h-10 text-[#2FA67A] mx-auto opacity-70" />
              <p className="font-medium text-sm text-white">Nenhum alerta ativo</p>
              <p className="text-xs">
                Todos os subsistemas IoT (TPMS, Óleo, Pastilhas e Bateria) estão operando dentro dos limiares normais.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#9FB3C8] uppercase tracking-wider flex items-center justify-between">
                <span>Todos os Avisos Ativos ({activeAlerts.length})</span>
              </div>
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border ${
                    alert.severity === 'CRITICO'
                      ? 'bg-[#E5484D]/10 border-[#E5484D]/40'
                      : 'bg-[#E09F3E]/10 border-[#E09F3E]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICO'
                          ? 'bg-[#E5484D] text-white'
                          : 'bg-[#E09F3E] text-black font-semibold'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-[#9FB3C8] font-mono">
                      Componente: {alert.component}
                    </span>
                  </div>
                  <p className="text-xs text-white mb-2 leading-relaxed font-medium">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#9FB3C8] font-mono">
                      {alert.sensor_reading && `Leitura: ${alert.sensor_reading}`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSnooze(alert.id)}
                        className="text-[11px] text-[#9FB3C8] hover:text-white underline"
                      >
                        Dispensar (48h)
                      </button>
                      <button
                        onClick={() => handleScheduleAppointment(alert)}
                        className="text-[11px] text-[#5DA9E9] hover:underline font-bold"
                      >
                        Agendar &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Technical Specifications by Component Drawer Card */}
          <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs text-[#9FB3C8] space-y-2">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#3A76C2]" />
              Especificações Técnicas de Tolerância
            </h5>
            <ul className="space-y-1.5 text-[11px]">
              <li>• <strong>TPMS:</strong> 33 PSI nominal. Risco crítico de destalonamento abaixo de 26-28 PSI. Sobrepressão &gt; 38 PSI.</li>
              <li>• <strong>Óleo do Motor:</strong> Sintético 0W-20 (Híbridos) / 5W-30 (Combustão). Alerta crítico em &le; 200 km para revisão.</li>
              <li>• <strong>Freios:</strong> Pastilhas com espessura mínima de segurança de 3.0 mm. Preventivo em 4.5 mm.</li>
              <li>• <strong>Bateria:</strong> Nível residual crítico abaixo de 20%. Modo economia ativado automaticamente.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
