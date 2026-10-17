import React, { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  CheckCircle2,
  Sparkles,
  Award,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Workshop } from '../../types/index.ts';
import { MOCK_WORKSHOP_ROI_STATS } from '../../lib/telemetry.ts';

interface WorkshopOffersRoiProps {
  workshop: Workshop;
  onUpdateOffers: (standard: number, advanced: number) => void;
}

export const WorkshopOffersRoi: React.FC<WorkshopOffersRoiProps> = ({
  workshop,
  onUpdateOffers,
}) => {
  const stdOffer = workshop.offers?.find((o) => o.tier === 'STANDARD');
  const advOffer = workshop.offers?.find((o) => o.tier === 'ADVANCED');

  const [standardDiscount, setStandardDiscount] = useState(
    stdOffer ? String(stdOffer.discount_percent) : '10'
  );
  const [advancedDiscount, setAdvancedDiscount] = useState(
    advOffer ? String(advOffer.discount_percent) : '20'
  );
  const [isStandardActive, setIsStandardActive] = useState(true);
  const [isAdvancedActive, setIsAdvancedActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveOffers = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOffers(Number(standardDiscount), Number(advancedDiscount));
    setToastMessage('Regras de descontos dos Planos Standard e Advanced atualizadas com sucesso!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const stats = MOCK_WORKSHOP_ROI_STATS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Configuração Salva</div>
            <div className="text-[#9FB3C8]">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* 1. Métricas Financeiras de Retorno (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#3A76C2]/20 text-[#5DA9E9] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase tracking-wider block">
              Motoristas Atendidos via CarCity
            </span>
            <span className="text-2xl font-extrabold font-mono text-white mt-0.5 block">
              {stats.totalDriversServed} clientes
            </span>
            <span className="text-[11px] text-[#2FA67A] flex items-center gap-1 mt-0.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +18% no último trimestre
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#2FA67A]/20 text-[#2FA67A] shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase tracking-wider block">
              Faturamento Bruto Gerado
            </span>
            <span className="text-2xl font-extrabold font-mono text-[#2FA67A] mt-0.5 block">
              R$ {stats.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-[#9FB3C8] mt-0.5 block">
              Ordens de serviço faturadas
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#E09F3E]/20 text-[#E09F3E] shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#9FB3C8] uppercase tracking-wider block">
              Total de Descontos Concedidos
            </span>
            <span className="text-2xl font-extrabold font-mono text-white mt-0.5 block">
              R$ {stats.totalDiscountsGranted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-[#E09F3E] mt-0.5 block">
              Investimento em fidelização do clube
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid com Configurador de Cupons (Esquerda) e Gráfico de ROI (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configurador de Cupons & Benefícios (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-5">
          <div className="border-b border-[#223B57] pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#3A76C2]" />
              Configurador de Cupons por Plano
            </h3>
            <p className="text-xs text-[#9FB3C8] mt-1">
              Parametrize os descontos oficiais concedidos aos motoristas cadastrados nos planos do ecossistema CarCity.
            </p>
          </div>

          <form onSubmit={handleSaveOffers} className="space-y-4">
            {/* Plano Standard */}
            <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2FA67A]" />
                  <span className="text-xs font-bold text-white">Plano Standard</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStandardActive(!isStandardActive)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                    isStandardActive
                      ? 'bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40'
                      : 'bg-[#9FB3C8]/20 text-[#9FB3C8]'
                  }`}
                >
                  {isStandardActive ? '[ATIVO]' : '[INATIVO]'}
                </button>
              </div>

              <p className="text-[11px] text-[#9FB3C8]">
                Desconto em alinhamento, balanceamento e diagnósticos de telemetria.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={standardDiscount}
                  onChange={(e) => setStandardDiscount(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-[#12273F] border border-[#223B57] text-white text-xs font-mono font-bold focus:outline-hidden focus:border-[#2FA67A]"
                />
                <span className="text-xs text-[#9FB3C8] font-bold">% OFF</span>
              </div>
            </div>

            {/* Plano Advanced */}
            <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <span className="text-xs font-bold text-white">Plano Advanced</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdvancedActive(!isAdvancedActive)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${
                    isAdvancedActive
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                      : 'bg-[#9FB3C8]/20 text-[#9FB3C8]'
                  }`}
                >
                  {isAdvancedActive ? '[ATIVO]' : '[INATIVO]'}
                </button>
              </div>

              <p className="text-[11px] text-[#9FB3C8]">
                Desconto em mão de obra especializada, troca de óleo sintético e revisões preventivas.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={advancedDiscount}
                  onChange={(e) => setAdvancedDiscount(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-[#12273F] border border-[#223B57] text-white text-xs font-mono font-bold focus:outline-hidden focus:border-[#D4AF37]"
                />
                <span className="text-xs text-[#9FB3C8] font-bold">% OFF</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Parametrização de Benefícios
            </button>
          </form>
        </div>

        {/* Gráfico Recharts de ROI & Atendimentos por Categoria (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#223B57] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#2FA67A]" />
                Atendimentos por Categoria (Standard vs. Advanced)
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Volume mensal de clientes atendidos via aplicativo nos últimos 6 meses.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30">
              ROI: +3.8x
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.monthlyCategoryComparison}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#223B57" />
                <XAxis dataKey="month" stroke="#9FB3C8" fontSize={11} tickLine={false} />
                <YAxis stroke="#9FB3C8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1A2E',
                    borderColor: '#223B57',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} clientes`,
                    name === 'advanced' ? 'Plano Advanced (20% OFF)' : 'Plano Standard (10% OFF)',
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar dataKey="standard" name="Standard" fill="#2FA67A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="advanced" name="Advanced" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-[#223B57] flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#9FB3C8] gap-2">
            <span>
              Crescimento de clientes Advanced: <strong>+133% nos últimos 6 meses</strong>
            </span>
            <span className="text-[#2FA67A] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Parceria Homologada CarCity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
