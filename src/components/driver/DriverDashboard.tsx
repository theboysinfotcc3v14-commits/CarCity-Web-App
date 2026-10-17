import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Car,
  BatteryCharging,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Sliders,
  ShieldCheck,
  Disc,
  Droplet,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  CalendarCheck,
  ChevronDown,
  PowerOff,
  Radio,
  SlidersHorizontal,
  Download,
  Loader2,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { MaintenanceAlert } from '../../types/index.ts';
import {
  getTireStatus,
  getBatteryStatus,
  getOilRevisionStatus,
  getBrakePadStatus,
  DEFAULT_NOMINAL_READINGS,
  DEFAULT_VEHICLES,
  TelemetrySimulationAction,
  generateTelemetryCsvReport,
} from '../../lib/telemetry.ts';
import { MaintenanceLogs } from './MaintenanceLogs.tsx';

const DEFAULT_7D_TRIPS_DATA = {
  totalDistanceKm: 388,
  totalTransitTimeMin: 695,
  avgDistancePerTrip: 55.4,
  avgEfficiency: 17.9,
  peakDistanceKm: 112,
  variationVsPreviousPeriod: '+12%',
  chartData: [
    { date: '01/10', fullDate: '01/10/2026', weekday: 'Seg', km: 42, cumulativeKm: 42, durationMin: 75, durationFormatted: '1h 15m', efficiency: 18.2, efficiencyUnit: 'km/L', tireWearMm: '0.005', brakeWearMm: '0.003' },
    { date: '02/10', fullDate: '02/10/2026', weekday: 'Ter', km: 68, cumulativeKm: 110, durationMin: 130, durationFormatted: '2h 10m', efficiency: 17.5, efficiencyUnit: 'km/L', tireWearMm: '0.008', brakeWearMm: '0.005' },
    { date: '03/10', fullDate: '03/10/2026', weekday: 'Qua', km: 15, cumulativeKm: 125, durationMin: 35, durationFormatted: '0h 35m', efficiency: 19.1, efficiencyUnit: 'km/L', tireWearMm: '0.002', brakeWearMm: '0.001' },
    { date: '04/10', fullDate: '04/10/2026', weekday: 'Qui', km: 94, cumulativeKm: 219, durationMin: 165, durationFormatted: '2h 45m', efficiency: 16.8, efficiencyUnit: 'km/L', tireWearMm: '0.011', brakeWearMm: '0.007' },
    { date: '05/10', fullDate: '05/10/2026', weekday: 'Sex', km: 112, cumulativeKm: 331, durationMin: 200, durationFormatted: '3h 20m', efficiency: 15.9, efficiencyUnit: 'km/L', tireWearMm: '0.013', brakeWearMm: '0.009' },
    { date: '06/10', fullDate: '06/10/2026', weekday: 'Sáb', km: 35, cumulativeKm: 366, durationMin: 50, durationFormatted: '0h 50m', efficiency: 18.8, efficiencyUnit: 'km/L', tireWearMm: '0.004', brakeWearMm: '0.003' },
    { date: '07/10', fullDate: '07/10/2026', weekday: 'Dom', km: 22, cumulativeKm: 388, durationMin: 40, durationFormatted: '0h 40m', efficiency: 19.5, efficiencyUnit: 'km/L', tireWearMm: '0.003', brakeWearMm: '0.002' },
  ],
  predictiveDiagnostics: {
    tireWearMm: '0.047',
    brakeWearMm: '0.031',
    consumptionSummary: '17.9 km/L (Excelente)',
  },
};

interface DriverDashboardProps {
  initialTab?: 'telemetry' | 'maintenance';
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ initialTab = 'telemetry' }) => {
  const {
    selectedVehicle,
    vehicles,
    setSelectedVehicle,
    triggerSimulation,
    activeVehicleAlerts,
    maintenanceLogs,
    setActiveTab,
    setIsNotificationsOpen,
    setIsJwtModalOpen,
  } = useApp();

  const [dashboardTab, setDashboardTab] = useState<'telemetry' | 'maintenance'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setDashboardTab(initialTab);
    }
  }, [initialTab]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '4s' | '6m'>('7d');
  const [chartMode, setChartMode] = useState<'point' | 'accumulated'>('point');
  const [tripsData, setTripsData] = useState<any>(null);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [simToast, setSimToast] = useState<string | null>(null);
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Animation state for diagnostic cards when simulation updates sensors (fading & scaling)
  const [animatingCard, setAnimatingCard] = useState<{
    tires?: boolean;
    battery?: boolean;
    oil?: boolean;
    brakes?: boolean;
  }>({});

  const prevReadingsRef = useRef<{
    battery_pct: number;
    tire_fl_psi: number;
    tire_fr_psi: number;
    tire_rl_psi: number;
    tire_rr_psi: number;
    brake_pad_mm: number;
    odometer_km: number;
  }>({
    battery_pct: 94,
    tire_fl_psi: 32.5,
    tire_fr_psi: 32.8,
    tire_rl_psi: 33.0,
    tire_rr_psi: 32.2,
    brake_pad_mm: 7.2,
    odometer_km: 28800,
  });

  // Watch for sensor updates triggered by simulation or background telemetry and trigger smooth scaling/fading
  useEffect(() => {
    if (!selectedVehicle) return;
    const current = selectedVehicle.latestReading || {
      battery_pct: 94,
      tire_fl_psi: 32.5,
      tire_fr_psi: 32.8,
      tire_rl_psi: 33.0,
      tire_rr_psi: 32.2,
      brake_pad_mm: 7.2,
    };
    const prev = prevReadingsRef.current;

    const tiresChanged =
      prev.tire_fl_psi !== current.tire_fl_psi ||
      prev.tire_fr_psi !== current.tire_fr_psi ||
      prev.tire_rl_psi !== current.tire_rl_psi ||
      prev.tire_rr_psi !== current.tire_rr_psi;
    const batteryChanged = prev.battery_pct !== current.battery_pct;
    const brakesChanged = prev.brake_pad_mm !== current.brake_pad_mm;
    const oilChanged = prev.odometer_km !== selectedVehicle.odometer_km;

    if (tiresChanged || batteryChanged || brakesChanged || oilChanged) {
      setAnimatingCard({
        tires: tiresChanged,
        battery: batteryChanged,
        brakes: brakesChanged,
        oil: oilChanged,
      });

      const timer = setTimeout(() => {
        setAnimatingCard({});
      }, 1500);

      prevReadingsRef.current = {
        battery_pct: current.battery_pct,
        tire_fl_psi: current.tire_fl_psi,
        tire_fr_psi: current.tire_fr_psi,
        tire_rl_psi: current.tire_rl_psi,
        tire_rr_psi: current.tire_rr_psi,
        brake_pad_mm: current.brake_pad_mm,
        odometer_km: selectedVehicle.odometer_km,
      };

      return () => clearTimeout(timer);
    }
  }, [
    selectedVehicle?.latestReading?.tire_fl_psi,
    selectedVehicle?.latestReading?.tire_fr_psi,
    selectedVehicle?.latestReading?.battery_pct,
    selectedVehicle?.latestReading?.brake_pad_mm,
    selectedVehicle?.odometer_km,
  ]);

  useEffect(() => {
    if (selectedVehicle) {
      loadTrips(selectedVehicle.id, timeRange);
    }
  }, [selectedVehicle?.id, timeRange]);

  const loadTrips = async (vehicleId: string, range: string) => {
    setLoadingTrips(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/trips?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setTripsData(data);
      }
    } catch (e) {
      console.error('Falha ao carregar telemetria:', e);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedVehicle) return;
    setDownloadingReport(true);
    try {
      // If 6m horizon is already loaded in application state, use it; otherwise fetch 6m dataset
      let data6m = tripsData;
      if (timeRange !== '6m' || !data6m || !data6m.chartData) {
        const res = await fetch(`/api/vehicles/${selectedVehicle.id}/trips?range=6m`);
        if (res.ok) {
          data6m = await res.json();
        }
      }

      const csvString = generateTelemetryCsvReport(selectedVehicle, data6m);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `relatorio_telemetria_${selectedVehicle.plate}_6m_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSimToast(
        `Relatório CSV gerado: ${data6m?.chartData?.length || 0} registros de telemetria dos últimos 6 meses baixados.`
      );
      setTimeout(() => setSimToast(null), 4500);
    } catch (err) {
      console.error('Erro ao gerar relatório CSV:', err);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleSimulate = async (action: TelemetrySimulationAction) => {
    // Immediately activate fading & scaling transition effect on the affected diagnostic card(s)
    if (action === 'PNEU_BAIXO') {
      setAnimatingCard({ tires: true });
    } else if (action === 'BATERIA_FRACA') {
      setAnimatingCard({ battery: true });
    } else if (action === 'OLEO_PROXIMO') {
      setAnimatingCard({ oil: true });
    } else if (action === 'CALIBRAR_TUDO') {
      setAnimatingCard({ tires: true, battery: true, oil: true, brakes: true });
    }

    const msg = await triggerSimulation(action);
    if (msg) {
      setSimToast(msg);
      setTimeout(() => setSimToast(null), 4500);
      if (selectedVehicle) loadTrips(selectedVehicle.id, timeRange);
    }
    setTimeout(() => {
      setAnimatingCard({});
    }, 1800);
  };

  if (!selectedVehicle) {
    return (
      <div className="p-8 text-center text-[#9FB3C8] bg-[#12273F] rounded-2xl border border-[#223B57]">
        <Car className="w-12 h-12 mx-auto mb-2 opacity-50 text-[#5DA9E9]" />
        <p className="text-white font-medium">Nenhum veículo ativo selecionado.</p>
        <p className="text-xs text-[#9FB3C8] mt-1">Selecione um veículo para visualizar os dados de telemetria.</p>
      </div>
    );
  }

  const latestReading = selectedVehicle.latestReading || {
    tire_fl_psi: 32.5,
    tire_fr_psi: 32.8,
    tire_rl_psi: 33.0,
    tire_rr_psi: 32.2,
    battery_pct: 94,
    brake_pad_mm: 7.2,
  };

  const remainingRevisionKm = Math.max(0, selectedVehicle.next_revision_km - selectedVehicle.odometer_km);
  const criticalAlert = activeVehicleAlerts.find((a) => a.severity === 'CRITICO' && a.status === 'ACTIVE');

  // Plan metadata helper
  const getVehiclePlanInfo = (vehicleId: string) => {
    switch (vehicleId) {
      case 'veh-corolla-001':
        return { label: 'Plano Advanced', color: '#D4AF37', badgeBg: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' };
      case 'veh-byd-002':
        return { label: 'Plano Standard', color: '#2FA67A', badgeBg: 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/40' };
      default:
        return { label: 'Plano Basic', color: '#5DA9E9', badgeBg: 'bg-[#5DA9E9]/20 text-[#5DA9E9] border-[#5DA9E9]/40' };
    }
  };

  const currentPlan = getVehiclePlanInfo(selectedVehicle.id);

  // Wheel status from telemetry library for 3D silhouette and cards
  const isElectric = selectedVehicle.propulsion === 'ELETRICO';
  const tireFL = getTireStatus(latestReading.tire_fl_psi, isElectric);
  const tireFR = getTireStatus(latestReading.tire_fr_psi, isElectric);
  const tireRL = getTireStatus(latestReading.tire_rl_psi, isElectric);
  const tireRR = getTireStatus(latestReading.tire_rr_psi, isElectric);

  // Component statuses
  const batteryStatus = getBatteryStatus(latestReading.battery_pct);
  const oilStatus = getOilRevisionStatus(
    selectedVehicle.odometer_km,
    selectedVehicle.next_revision_km,
    selectedVehicle.propulsion
  );
  const brakeStatus = getBrakePadStatus(latestReading.brake_pad_mm);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification for Telemetry Simulation */}
      {simToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Simulador IoT Gravado (is_simulated)</div>
            <div className="text-[#9FB3C8]">{simToast}</div>
          </div>
        </div>
      )}

      {/* Priority Banner on Top if Alert Exists (Section D2 / Bloco 1.2) */}
      {criticalAlert && (
        <div className="p-4 rounded-2xl bg-[#E5484D]/15 border-2 border-[#E5484D] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E5484D] text-white shadow">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E5484D] text-white">
                  ALERTA CRÍTICO DE SEGURANÇA
                </span>
                <span className="text-xs font-mono font-bold text-[#E5484D]">
                  {criticalAlert.component}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white mt-1">
                {criticalAlert.message}
              </p>
              <p className="text-[11px] text-[#9FB3C8] font-mono mt-0.5">
                Leitura do sensor: <strong>{criticalAlert.sensor_reading}</strong> | Nominal:{' '}
                {criticalAlert.nominal_value} | Tolerância: {criticalAlert.tolerance}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('appointments')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              Agendar Oficina Credenciada
            </button>
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-medium"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      )}

      {/* Top Vehicle Selector & 3D Styled Silhouette HUD Card (Bloco 1.1 e 1.2) */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#3A76C2]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header inside Card: Integrated Vehicle Selector & Plan Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#223B57]/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB3C8]">
                Painel do Veículo Conectado
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${currentPlan.badgeBg}`}>
                {currentPlan.label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{selectedVehicle.brand} {selectedVehicle.model}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#0B1A2E] border border-[#223B57] font-mono text-[#5DA9E9]">
                {selectedVehicle.plate}
              </span>
            </h2>
          </div>

          {/* Interactive Multi-Vehicle Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsVehicleSelectorOpen(!isVehicleSelectorOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white hover:border-[#3A76C2] transition-colors text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#5DA9E9]" />
                <span className="font-semibold">Alternar Veículo ({vehicles.length})</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#9FB3C8]" />
            </button>

            {isVehicleSelectorOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0B1A2E] border border-[#223B57] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[11px] font-bold text-[#9FB3C8] uppercase tracking-wider border-b border-[#223B57]/60">
                  Selecione o Veículo Ativo
                </div>
                {vehicles.map((v) => {
                  const pInfo = getVehiclePlanInfo(v.id);
                  const isSelected = selectedVehicle.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicle(v);
                        setIsVehicleSelectorOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-[#12273F] transition-colors ${
                        isSelected ? 'bg-[#3A76C2]/15 text-white font-semibold' : 'text-[#F1F5F9]'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          <span>{v.brand} {v.model} ({v.model_year})</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#9FB3C8] mt-0.5">
                          Placa: <strong className="text-white">{v.plate}</strong> • {pInfo.label}
                        </div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${pInfo.badgeBg}`}>
                        {v.propulsion}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Vehicle HUD & 3D Styled Silhouette (Bloco 1.2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
          {/* Left Column: Quick Spec & Actions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
                <span className="text-[#9FB3C8]">Tipo de Propulsão:</span>
                <span className="text-white font-bold">{selectedVehicle.propulsion}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
                <span className="text-[#9FB3C8]">Odômetro Atual:</span>
                <span className="text-white font-bold">{selectedVehicle.odometer_km.toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]/70">
                <span className="text-[#9FB3C8]">Trava Remota:</span>
                <span className="text-[#2FA67A] font-bold">
                  {selectedVehicle.doors_locked ? 'PORTAS TRANCADAS' : 'DESTRANCADO'}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setDashboardTab('telemetry')}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  dashboardTab === 'telemetry'
                    ? 'bg-[#3A76C2] text-white border-[#3A76C2]'
                    : 'bg-[#0B1A2E] hover:bg-[#223B57] border-[#223B57] text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-[#5DA9E9]" />
                Diagnóstico
              </button>
              <button
                onClick={() => setDashboardTab('maintenance')}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  dashboardTab === 'maintenance'
                    ? 'bg-[#2FA67A] text-white border-[#2FA67A]'
                    : 'bg-[#0B1A2E] hover:bg-[#223B57] border-[#223B57] text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-[#2FA67A]" />
                Manutenções
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] border border-[#223B57] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-[#E5484D]" />
                Modo Pânico
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#223B57] border border-[#223B57] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                Agendar
              </button>
            </div>
          </div>

          {/* Center/Right: 3D Styled Silhouette HUD with Active Sensors & Wheels */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#0B1A2E]/80 border border-[#223B57] shadow-inner relative">
            {/* Visual Isometric/Top HUD Silhouette */}
            <div className="relative w-full max-w-lg h-44 flex items-center justify-center my-2">
              {/* Chassis Main Shell */}
              <div className="relative w-80 h-28 rounded-[48px] border-2 border-[#5DA9E9]/40 bg-gradient-to-r from-[#12273F] via-[#1F4E8C]/25 to-[#12273F] flex items-center justify-between px-8 shadow-2xl">
                {/* Front Headlights Glow */}
                <div className="absolute left-2 w-3 h-12 rounded-full bg-[#5DA9E9]/40 blur-xs" />
                {/* Rear Taillights Glow */}
                <div className="absolute right-2 w-3 h-12 rounded-full bg-[#E5484D]/40 blur-xs" />

                {/* Windshield & Cabin Core */}
                <div className="w-40 h-16 rounded-2xl border border-[#5DA9E9]/50 bg-[#3A76C2]/15 flex items-center justify-center text-center">
                  <div className="text-[10px] font-mono text-[#5DA9E9] flex flex-col items-center">
                    <span className="font-bold tracking-wider">GATEWAY IoT v4.2</span>
                    <span className="text-[9px] text-[#2FA67A]">CAN/OBD-II ATIVO</span>
                  </div>
                </div>

                {/* Wheel FL (Front Left) */}
                <div
                  className={`absolute -top-4 left-10 px-2 py-1 rounded-lg border text-[10px] font-mono shadow-md flex items-center gap-1 ${tireFL.bg} ${tireFL.border}`}
                  style={{ color: tireFL.color }}
                  title="Pneu Dianteiro Esquerdo"
                >
                  <Disc className="w-3 h-3" />
                  <span>FL: {latestReading.tire_fl_psi.toFixed(1)} PSI</span>
                </div>

                {/* Wheel FR (Front Right) */}
                <div
                  className={`absolute -bottom-4 left-10 px-2 py-1 rounded-lg border text-[10px] font-mono shadow-md flex items-center gap-1 ${tireFR.bg} ${tireFR.border}`}
                  style={{ color: tireFR.color }}
                  title="Pneu Dianteiro Direito"
                >
                  <Disc className="w-3 h-3" />
                  <span>FR: {latestReading.tire_fr_psi.toFixed(1)} PSI</span>
                </div>

                {/* Wheel RL (Rear Left) */}
                <div
                  className={`absolute -top-4 right-10 px-2 py-1 rounded-lg border text-[10px] font-mono shadow-md flex items-center gap-1 ${tireRL.bg} ${tireRL.border}`}
                  style={{ color: tireRL.color }}
                  title="Pneu Traseiro Esquerdo"
                >
                  <Disc className="w-3 h-3" />
                  <span>RL: {latestReading.tire_rl_psi.toFixed(1)} PSI</span>
                </div>

                {/* Wheel RR (Rear Right) */}
                <div
                  className={`absolute -bottom-4 right-10 px-2 py-1 rounded-lg border text-[10px] font-mono shadow-md flex items-center gap-1 ${tireRR.bg} ${tireRR.border}`}
                  style={{ color: tireRR.color }}
                  title="Pneu Traseiro Direito"
                >
                  <Disc className="w-3 h-3" />
                  <span>RR: {latestReading.tire_rr_psi.toFixed(1)} PSI</span>
                </div>
              </div>
            </div>

            {/* The 3 Required Dynamic Seals (Bloco 1.2) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 w-full">
              {/* 1. Corte de Motor: CONECTADO */}
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#2FA67A]" />
                <span>Corte de Motor: {selectedVehicle.engine_cut_connected ? 'CONECTADO' : 'OFFLINE'}</span>
              </span>

              {/* 2. Bateria de Partida/EV: 94% • 12.8V */}
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 flex items-center gap-1.5 shadow-sm">
                <BatteryCharging className="w-4 h-4 text-[#2FA67A]" />
                <span>Bateria de Partida/EV: {latestReading.battery_pct}% • 12.8V</span>
              </span>

              {/* 3. Próxima Revisão: Em 1.200 km */}
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/40 flex items-center gap-1.5 shadow-sm">
                <Clock className="w-4 h-4 text-[#E09F3E]" />
                <span>Próxima Revisão: Em {remainingRevisionKm.toLocaleString('pt-BR')} km</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Section: Telemetry vs Maintenance Logs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#0B1A2E] border border-[#223B57]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDashboardTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              dashboardTab === 'telemetry'
                ? 'bg-[#3A76C2] text-white shadow-lg'
                : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Telemetria & Diagnósticos IoT</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              dashboardTab === 'maintenance'
                ? 'bg-[#2FA67A] text-white shadow-lg'
                : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Histórico de Manutenções (Maintenance Logs)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
              {maintenanceLogs.filter(
                (l) =>
                  l.vehicle_id === selectedVehicle.id ||
                  (selectedVehicle.id === 'veh-corolla-001' && (l.vehicle_id === 'veh-001' || l.vehicle_plate === 'ABC-1D23')) ||
                  (selectedVehicle.id === 'veh-001' && (l.vehicle_id === 'veh-corolla-001' || l.vehicle_plate === 'ABC-1D23')) ||
                  (selectedVehicle.id === 'veh-byd-002' && (l.vehicle_id === 'veh-002' || l.vehicle_plate === 'EV-9876')) ||
                  (selectedVehicle.id === 'veh-002' && (l.vehicle_id === 'veh-byd-002' || l.vehicle_plate === 'EV-9876')) ||
                  (selectedVehicle.id === 'veh-bmw-003' && (l.vehicle_id === 'veh-003' || l.vehicle_plate === 'CAR-2024')) ||
                  (selectedVehicle.id === 'veh-003' && (l.vehicle_id === 'veh-bmw-003' || l.vehicle_plate === 'CAR-2024'))
              ).length}
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 text-xs text-[#9FB3C8]">
          <span className="w-2 h-2 rounded-full bg-[#2FA67A] animate-ping" />
          <span className="text-[11px] font-mono">Gateway IoT v4.2 Conectado</span>
        </div>
      </div>

      {/* Conditionally Render Maintenance Logs Tab or Telemetry Section */}
      {dashboardTab === 'maintenance' ? (
        <MaintenanceLogs />
      ) : (
        <>

      {/* Telemetry Simulator Bar (Bloco 1.2 & 1.3) */}
      <div className="p-4 rounded-2xl bg-[#0B1A2E] border border-[#223B57] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Simulador de Telemetria IoT Embarcada</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                LIVE
              </span>
            </h4>
            <p className="text-[11px] text-[#9FB3C8]">
              Injeta anomalias nos sensores CAN/OBD-II e recalcula alertas e gráficos em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleSimulate('PNEU_BAIXO')}
            className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#E5484D]/20 text-xs font-semibold text-[#F1F5F9] border border-[#223B57] hover:border-[#E5484D] transition-colors"
          >
            Pneu Baixo
          </button>
          <button
            onClick={() => handleSimulate('OLEO_PROXIMO')}
            className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#E09F3E]/20 text-xs font-semibold text-[#F1F5F9] border border-[#223B57] hover:border-[#E09F3E] transition-colors"
          >
            Troca de Óleo Próxima
          </button>
          <button
            onClick={() => handleSimulate('BATERIA_FRACA')}
            className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#E5484D]/20 text-xs font-semibold text-[#F1F5F9] border border-[#223B57] hover:border-[#E5484D] transition-colors"
          >
            Bateria Fraca
          </button>
          <button
            onClick={() => handleSimulate('CALIBRAR_TUDO')}
            className="px-3.5 py-1.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-xs font-bold text-white transition-colors shadow flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Calibrar Tudo
          </button>
        </div>
      </div>

      {/* Recharts AreaChart: Quilometragem vs Tempo em Trânsito (Bloco 1.2) */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg">
        {/* Header Controls for Chart */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2FA67A]" />
              Quilometragem vs. Tempo em Trânsito
            </h3>
            <p className="text-xs text-[#9FB3C8]">
              Monitoramento contínuo com diagnósticos preditivos e histórico de eficiência
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Mode Toggle */}
            <div className="p-1 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex text-xs">
              <button
                onClick={() => setChartMode('point')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'point' ? 'bg-[#3A76C2] text-white shadow' : 'text-[#9FB3C8] hover:text-white'
                }`}
              >
                Intervalo por Ponto (Linha Média)
              </button>
              <button
                onClick={() => setChartMode('accumulated')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'accumulated' ? 'bg-[#3A76C2] text-white shadow' : 'text-[#9FB3C8] hover:text-white'
                }`}
              >
                Curva Acumulada
              </button>
            </div>

            {/* Time Horizons: 24H, 7D, 4S, 6M */}
            <div className="p-1 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex text-xs font-mono font-semibold">
              {(['24h', '7d', '4s', '6m'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg transition-colors uppercase ${
                    timeRange === r ? 'bg-[#2FA67A] text-white shadow' : 'text-[#9FB3C8] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Download Report Button (CSV) - Last 6 Months Telemetry Summary */}
            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              className="px-3 py-1.5 rounded-xl bg-[#0B1A2E] hover:bg-[#1F4E8C]/30 border border-[#223B57] hover:border-[#3A76C2] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow disabled:opacity-50"
              title="Baixar sumário em CSV dos últimos 6 meses de dados de telemetria"
            >
              {downloadingReport ? (
                <Loader2 className="w-3.5 h-3.5 text-[#5DA9E9] animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#5DA9E9]" />
              )}
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Diagnostic KPI Metrics (Bloco 1.2 & 1.3) */}
        {tripsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 font-mono">
            <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
              <span className="text-[10px] text-[#9FB3C8] uppercase block">Total Rodado na Semana:</span>
              <span className="text-lg font-bold text-white">
                {tripsData.totalDistanceKm} km
              </span>
              <span className="text-[10px] text-[#2FA67A] block font-sans mt-0.5">
                {tripsData.variationVsPreviousPeriod} vs período anterior
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
              <span className="text-[10px] text-[#9FB3C8] uppercase block">Média por Viagem / Dia:</span>
              <span className="text-lg font-bold text-white">
                {tripsData.avgDistancePerTrip} km
              </span>
              <span className="text-[10px] text-[#9FB3C8] block font-sans mt-0.5">
                Consumo: {tripsData.avgEfficiency}{' '}
                {selectedVehicle.propulsion === 'ELETRICO' ? 'kWh/100km' : 'km/L'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
              <span className="text-[10px] text-[#9FB3C8] uppercase block">Pico de Uso:</span>
              <span className="text-lg font-bold text-white">
                {tripsData.peakDistanceKm} km
              </span>
              <span className="text-[10px] text-[#5DA9E9] block font-sans mt-0.5">
                Maior percurso registrado
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
              <span className="text-[10px] text-[#9FB3C8] uppercase block">Tempo em Trânsito:</span>
              <span className="text-lg font-bold text-white">
                {tripsData.totalTransitTimeMin} min
              </span>
              <span className="text-[10px] text-[#9FB3C8] block font-sans mt-0.5">
                {(tripsData.totalTransitTimeMin / 60).toFixed(1)} horas totais
              </span>
            </div>
          </div>
        )}

        {/* Recharts Area Chart Container with Protected Green Gradient */}
        <div className="h-72 w-full">
          {tripsData?.chartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tripsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="protectedGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2FA67A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0B1A2E" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#223B57" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  stroke="#9FB3C8"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="#9FB3C8"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B1A2E] border border-[#223B57] p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
                          <div className="font-bold text-white border-b border-[#223B57] pb-1">
                            {data.fullDate || data.date}
                          </div>
                          <div className="text-[#2FA67A] flex items-center justify-between gap-4">
                            <span>Distância:</span>
                            <strong>{data.km} km</strong>
                          </div>
                          {chartMode === 'accumulated' && (
                            <div className="text-[#5DA9E9] flex items-center justify-between gap-4">
                              <span>Curva Acumulada:</span>
                              <strong>{data.cumulativeKm} km</strong>
                            </div>
                          )}
                          <div className="text-[#9FB3C8] flex items-center justify-between gap-4">
                            <span>Tempo em Trânsito:</span>
                            <strong className="text-white">{data.durationFormatted || `${data.durationMin} min`}</strong>
                          </div>
                          <div className="text-[#D4AF37] flex items-center justify-between gap-4">
                            <span>Consumo Médio:</span>
                            <strong>{data.efficiency} {data.efficiencyUnit}</strong>
                          </div>
                          <div className="pt-1.5 border-t border-[#223B57] text-[10px] text-[#9FB3C8]">
                            <div className="text-white font-semibold">Índice Preditivo de Desgaste:</div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span>Pneus:</span>
                              <span className="text-[#5DA9E9]">~{data.tireWearMm || ((data.km / 1000) * 0.12).toFixed(3)} mm</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Pastilhas:</span>
                              <span className="text-[#E09F3E]">~{data.brakeWearMm || ((data.km / 1000) * 0.08).toFixed(3)} mm</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMode === 'accumulated' ? 'cumulativeKm' : 'km'}
                  stroke="#2FA67A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#protectedGreenGrad)"
                />
                {chartMode === 'point' && tripsData?.avgDistancePerTrip && (
                  <ReferenceLine
                    y={tripsData.avgDistancePerTrip}
                    stroke="#E09F3E"
                    strokeDasharray="4 4"
                    label={{
                      value: `Média: ${tripsData.avgDistancePerTrip} km`,
                      fill: '#E09F3E',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#9FB3C8] text-xs">
              Carregando dados de telemetria...
            </div>
          )}
        </div>

        {/* Predictive Diagnostics Strip (Bloco 1.2 & 1.3) */}
        {tripsData?.predictiveDiagnostics && (
          <div className="mt-6 pt-4 border-t border-[#223B57] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-bold text-white">Diagnóstico Preditivo Consolidado:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[#9FB3C8] font-mono text-[11px]">
              <span>
                Desgaste Pneus: <strong className="text-white">{tripsData.predictiveDiagnostics.tireWearMm} mm</strong>
              </span>
              <span>
                Desgaste Pastilhas: <strong className="text-white">{tripsData.predictiveDiagnostics.brakeWearMm} mm</strong>
              </span>
              <span>
                Consumo Total: <strong className="text-white">{tripsData.predictiveDiagnostics.consumptionSummary}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cards de Diagnóstico Preditivo por Componente (Bloco 1.3) com Transição (Fading/Scaling) IoT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. TPMS Tires Card com Efeito de Transição (Fading & Scaling) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-700 ease-out transform ${
            animatingCard.tires
              ? 'scale-[1.03] ring-2 ring-[#5DA9E9] shadow-2xl bg-[#162f52] opacity-100 border-[#5DA9E9]'
              : 'scale-100 ring-0 opacity-95 hover:opacity-100 bg-[#12273F] border-[#223B57]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-2">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Disc className={`w-4 h-4 text-[#5DA9E9] ${animatingCard.tires ? 'animate-spin' : ''}`} />
              Pressão Pneus (TPMS)
            </span>
            <div className="flex items-center gap-1.5">
              {animatingCard.tires && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#5DA9E9]/20 text-[#5DA9E9] animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Atualizado IoT
                </span>
              )}
              <span className="font-mono text-[11px]">Nominal: 33 PSI</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 font-mono">
            <div className={`p-2 rounded-xl text-center border transition-all duration-500 ${tireFL.bg} ${tireFL.border} ${animatingCard.tires ? 'scale-105' : 'scale-100'}`}>
              <span className="text-[10px] text-[#9FB3C8] block">FL (Diant. E)</span>
              <span className="text-sm font-bold" style={{ color: tireFL.color }}>
                {latestReading.tire_fl_psi.toFixed(1)} PSI
              </span>
            </div>
            <div className={`p-2 rounded-xl text-center border transition-all duration-500 ${tireFR.bg} ${tireFR.border} ${animatingCard.tires ? 'scale-105' : 'scale-100'}`}>
              <span className="text-[10px] text-[#9FB3C8] block">FR (Diant. D)</span>
              <span className="text-sm font-bold" style={{ color: tireFR.color }}>
                {latestReading.tire_fr_psi.toFixed(1)} PSI
              </span>
            </div>
            <div className={`p-2 rounded-xl text-center border transition-all duration-500 ${tireRL.bg} ${tireRL.border} ${animatingCard.tires ? 'scale-105' : 'scale-100'}`}>
              <span className="text-[10px] text-[#9FB3C8] block">RL (Tras. E)</span>
              <span className="text-sm font-bold" style={{ color: tireRL.color }}>
                {latestReading.tire_rl_psi.toFixed(1)} PSI
              </span>
            </div>
            <div className={`p-2 rounded-xl text-center border transition-all duration-500 ${tireRR.bg} ${tireRR.border} ${animatingCard.tires ? 'scale-105' : 'scale-100'}`}>
              <span className="text-[10px] text-[#9FB3C8] block">RR (Tras. D)</span>
              <span className="text-sm font-bold" style={{ color: tireRR.color }}>
                {latestReading.tire_rr_psi.toFixed(1)} PSI
              </span>
            </div>
          </div>
        </div>

        {/* 2. Óleo e Filtro de Motor com Efeito de Transição (Fading & Scaling) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-700 ease-out transform ${
            animatingCard.oil
              ? 'scale-[1.03] ring-2 ring-[#E09F3E] shadow-2xl bg-[#162f52] opacity-100 border-[#E09F3E]'
              : 'scale-100 ring-0 opacity-95 hover:opacity-100 bg-[#12273F] border-[#223B57]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-2">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Droplet className={`w-4 h-4 text-[#D4AF37] ${animatingCard.oil ? 'animate-bounce' : ''}`} />
              Óleo & Filtro
            </span>
            <div className="flex items-center gap-1.5">
              {animatingCard.oil && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E09F3E]/20 text-[#E09F3E] animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Atualizado IoT
                </span>
              )}
              <span className="font-mono text-[10px] text-[#9FB3C8]">
                {oilStatus.spec}
              </span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
            <div className="text-xs text-[#9FB3C8] mb-1 flex items-center justify-between">
              <span>Próxima Troca de Óleo:</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: oilStatus.color }}>
                {oilStatus.label}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-white">
              Em {remainingRevisionKm.toLocaleString('pt-BR')} km
            </div>
            <div className="w-full bg-[#12273F] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${oilStatus.progressPct}%`,
                  backgroundColor: oilStatus.color,
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. Pastilhas de Freio com Efeito de Transição (Fading & Scaling) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-700 ease-out transform ${
            animatingCard.brakes
              ? 'scale-[1.03] ring-2 ring-[#E09F3E] shadow-2xl bg-[#162f52] opacity-100 border-[#E09F3E]'
              : 'scale-100 ring-0 opacity-95 hover:opacity-100 bg-[#12273F] border-[#223B57]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-2">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-[#E09F3E]" />
              Pastilhas de Freio
            </span>
            <div className="flex items-center gap-1.5">
              {animatingCard.brakes && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E09F3E]/20 text-[#E09F3E] animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Atualizado IoT
                </span>
              )}
              <span className="font-mono text-[10px] text-[#9FB3C8]">Limiar: 3.0 mm</span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
            <div className="text-xs text-[#9FB3C8] mb-1 flex items-center justify-between">
              <span>Espessura Estimada:</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: brakeStatus.color }}>
                {brakeStatus.label}
              </span>
            </div>
            <div
              className={`text-base font-bold font-mono transition-transform duration-500 ${animatingCard.brakes ? 'scale-110' : 'scale-100'}`}
              style={{ color: brakeStatus.color }}
            >
              {latestReading.brake_pad_mm.toFixed(1)} mm
            </div>
            <div className="text-[10px] text-[#9FB3C8] mt-1">
              Desgaste por atrito em conformidade com o odômetro
            </div>
          </div>
        </div>

        {/* 4. Bateria & Sistema Elétrico / EV com Efeito de Transição (Fading & Scaling) */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-700 ease-out transform ${
            animatingCard.battery
              ? 'scale-[1.03] ring-2 ring-[#5DA9E9] shadow-2xl bg-[#162f52] opacity-100 border-[#5DA9E9]'
              : 'scale-100 ring-0 opacity-95 hover:opacity-100 bg-[#12273F] border-[#223B57]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9FB3C8] mb-2">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Zap className={`w-4 h-4 text-[#5DA9E9] ${animatingCard.battery ? 'animate-pulse' : ''}`} />
              Bateria & Térmica
            </span>
            <div className="flex items-center gap-1.5">
              {animatingCard.battery && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#5DA9E9]/20 text-[#5DA9E9] animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Atualizado IoT
                </span>
              )}
              <span className="font-mono text-[10px] text-[#5DA9E9]">{batteryStatus.voltage}V</span>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
            <div className="text-xs text-[#9FB3C8] mb-1 flex items-center justify-between">
              <span>Carga Residual (SoC):</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: batteryStatus.color }}>
                {batteryStatus.label}
              </span>
            </div>
            <div
              className={`text-base font-bold font-mono transition-transform duration-500 ${animatingCard.battery ? 'scale-110' : 'scale-100'}`}
              style={{ color: batteryStatus.color }}
            >
              {latestReading.battery_pct}% SoC
            </div>
            <div className="text-[10px] text-[#2FA67A] mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Monitoramento contínuo de células ativo
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
