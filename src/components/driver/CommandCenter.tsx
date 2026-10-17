import React, { useState } from 'react';
import {
  ShieldAlert,
  PowerOff,
  Lock,
  Radio,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Loader2,
  Clock,
  Car,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { CommandType, CommandStatus } from '../../types/index.ts';
import { DEFAULT_VEHICLES } from '../../lib/telemetry.ts';

export const CommandCenter: React.FC = () => {
  const { selectedVehicle, vehicles, refreshVehicleData } = useApp();

  // Confirmation modal states
  const [confirmingCommand, setConfirmingCommand] = useState<CommandType | null>(null);
  const [executing, setExecuting] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    command: CommandType;
    status: CommandStatus;
    message: string;
  } | null>(null);

  // Sem guarda que retorne null: renderização imediata garantida
  const activeVehicle = selectedVehicle || vehicles[0] || DEFAULT_VEHICLES[0];

  const handleExecuteCommand = async (command: CommandType) => {
    setExecuting(true);
    setConfirmingCommand(null);

    try {
      const res = await fetch(`/api/vehicles/${activeVehicle.id}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommandFeedback({
          command,
          status: 'EXECUTED',
          message: data.command.gateway_response,
        });
        await refreshVehicleData();
      } else {
        setCommandFeedback({
          command,
          status: 'FAILED',
          message: data.error || 'Falha ao processar comando.',
        });
      }
    } catch (e: any) {
      setCommandFeedback({
        command,
        status: 'FAILED',
        message: 'Falha de comunicação com o gateway IoT.',
      });
    } finally {
      setExecuting(false);
    }
  };

  const isSensorOnline = activeVehicle.engine_cut_connected;

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#5DA9E9] animate-pulse" />
          Central de Comando IoT & Modo Pânico 5KM
        </h2>
        <p className="text-xs text-[#9FB3C8]">
          Atuação remota de segurança via barramento CAN/OBD-II e relé não volátil.
        </p>
      </div>

      {/* Command Feedback Banner */}
      {commandFeedback && (
        <div
          className={`p-4 rounded-2xl border shadow-xl flex items-start justify-between gap-3 ${
            commandFeedback.status === 'EXECUTED'
              ? 'bg-[#2FA67A]/15 border-[#2FA67A] text-white'
              : 'bg-[#E5484D]/15 border-[#E5484D] text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {commandFeedback.status === 'EXECUTED' ? (
              <CheckCircle2 className="w-6 h-6 text-[#2FA67A] shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-[#E5484D] shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold font-mono">
                Status: {commandFeedback.status}
              </div>
              <div className="text-xs font-medium mt-0.5">{commandFeedback.message}</div>
            </div>
          </div>
          <button
            onClick={() => setCommandFeedback(null)}
            className="text-xs text-[#9FB3C8] hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Two-step Confirmation Modals */}
      {confirmingCommand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#E5484D]">
              <AlertOctagon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">
                  Confirmação em Duas Etapas
                </h3>
                <p className="text-xs text-[#9FB3C8]">Ação crítica com registro em auditoria</p>
              </div>
            </div>

            <p className="text-xs text-white leading-relaxed">
              Você está prestes a emitir a ordem remota{' '}
              <strong className="text-[#5DA9E9]">{confirmingCommand}</strong> para o veículo{' '}
              <strong>{activeVehicle.brand} {activeVehicle.model} ({activeVehicle.plate})</strong>.
            </p>

            {confirmingCommand === 'ACIONAR_POLICIA_BLOQUEIO_TOTAL' && (
              <div className="p-3 rounded-xl bg-[#E5484D]/20 border border-[#E5484D] text-xs text-white">
                <strong>ATENÇÃO DE SEGURANÇA:</strong>
                <p className="mt-1 text-[11px] text-[#9FB3C8]">
                  Esta função simula o protocolo de emergência na plataforma CarCity e bloqueia o motor.
                  Em uma situação de risco real à vida ou sequestro, disque imediatamente 190 (Polícia Militar).
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmingCommand(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExecuteCommand(confirmingCommand)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${
                  confirmingCommand === 'ACIONAR_POLICIA_BLOQUEIO_TOTAL'
                    ? 'bg-[#E5484D] hover:bg-[#B42318]'
                    : 'bg-[#3A76C2] hover:bg-[#1F4E8C]'
                }`}
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar e Executar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Corte de Motor Remoto */}
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">
                <PowerOff className="w-6 h-6" />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0B1A2E] text-[#9FB3C8] border border-[#223B57]">
                Relé ECU: {isSensorOnline ? 'Pronto' : 'Offline'}
              </span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">
              Corte de Motor Remoto
            </h3>
            <p className="text-xs text-[#9FB3C8] leading-relaxed mb-4">
              Desativa a bomba de combustível e ignição eletrônica em caso de apropriação indevida ou tentativa de furto.
            </p>
          </div>

          <button
            disabled={!isSensorOnline || executing}
            onClick={() => setConfirmingCommand('CORTE_MOTOR')}
            className="w-full py-3 rounded-xl bg-[#0B1A2E] hover:bg-[#E5484D]/20 text-[#E5484D] hover:text-white border border-[#E5484D]/40 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PowerOff className="w-4 h-4" />
            Solicitar Corte de Motor
          </button>
        </div>

        {/* Trancar Portas e Vidros */}
        <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-[#3A76C2]/15 text-[#5DA9E9] border border-[#3A76C2]/30">
                <Lock className="w-6 h-6" />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0B1A2E] text-[#9FB3C8] border border-[#223B57]">
                Status: {activeVehicle.doors_locked ? 'Trancado' : 'Destrancado'}
              </span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">
              Trancar Portas e Vidros
            </h3>
            <p className="text-xs text-[#9FB3C8] leading-relaxed mb-4">
              Envia pulso de travamento central e acionamento anti-esmagamento dos vidros e teto solar.
            </p>
          </div>

          <button
            disabled={executing}
            onClick={() => setConfirmingCommand('TRANCAR_PORTAS')}
            className="w-full py-3 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Lock className="w-4 h-4" />
            Trancar Portas e Vidros
          </button>
        </div>
      </div>

      {/* Cartão "MODO PÂNICO 5KM" (Section D4) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#12273F] via-[#0B1A2E] to-[#12273F] border-2 border-[#3A76C2]/40 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A76C2] text-white shadow-lg">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">MODO PÂNICO 5KM</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2FA67A]/20 text-[#2FA67A]">
                  Cerca Virtual Pronta
                </span>
              </div>
              <p className="text-xs text-[#9FB3C8]">
                Ancora um perímetro circular de 5 km ao redor das coordenadas atuais do veículo.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleExecuteCommand('MODO_PANICO_5KM')}
            disabled={executing}
            className="px-4 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] border border-[#3A76C2] text-xs font-semibold text-white transition-colors"
          >
            Ativar Cerca 5KM
          </button>
        </div>

        {/* Emergency Red Button (Section D4) */}
        <div className="pt-4 border-t border-[#223B57] flex flex-col items-center text-center space-y-3">
          <p className="text-xs text-[#9FB3C8] max-w-lg">
            Em situação de risco grave iminente, o protocolo aciona bloqueio motor, sirene codificada e alerta prioritário na central.
          </p>

          <button
            onClick={() => setConfirmingCommand('ACIONAR_POLICIA_BLOQUEIO_TOTAL')}
            disabled={executing}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E5484D] hover:bg-[#B42318] text-white font-black text-sm tracking-wide uppercase shadow-2xl flex items-center justify-center gap-2 transition-transform hover:scale-102 ring-4 ring-[#E5484D]/25"
          >
            <AlertOctagon className="w-5 h-5" />
            ACIONAR POLÍCIA & BLOQUEIO TOTAL
          </button>

          {/* Dials orientation */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[#9FB3C8]">
            <span className="font-semibold text-white">Central Telefônica de Emergência Pública:</span>
            <a href="tel:190" className="text-[#E5484D] font-bold hover:underline">
              190 (Polícia Militar)
            </a>
            <span>•</span>
            <a href="tel:192" className="text-white font-bold hover:underline">
              192 (SAMU)
            </a>
            <span>•</span>
            <a href="tel:193" className="text-white font-bold hover:underline">
              193 (Bombeiros)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ComandoPanicoView = CommandCenter;
export default CommandCenter;
