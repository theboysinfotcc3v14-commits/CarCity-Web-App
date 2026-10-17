import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  KeyRound,
  Users,
  LogOut,
  ChevronDown,
  Car,
  AlertTriangle,
  BadgeCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { UserRole } from '../types/index.ts';

export const Header: React.FC = () => {
  const {
    user,
    activeRole,
    isAuditorMode,
    impersonatedRole,
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    theme,
    setTheme,
    alertsCount,
    criticalAlertsCount,
    setIsNotificationsOpen,
    setIsJwtModalOpen,
    switchRoleForDemo,
    toggleAuditorMode,
    logout,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'DRIVER':
        return { label: 'Motorista', bg: 'bg-[#3A76C2]/15 text-[#3A76C2] border-[#3A76C2]/30' };
      case 'WORKSHOP_OWNER':
        return { label: 'Oficina Credenciada', bg: 'bg-[#2FA67A]/15 text-[#2FA67A] border-[#2FA67A]/30' };
      case 'ADMIN':
        return { label: 'CMS Admin', bg: 'bg-[#E09F3E]/15 text-[#E09F3E] border-[#E09F3E]/30' };
      case 'SUPER_ADMIN':
        return { label: 'Super Administrador', bg: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30' };
    }
  };

  const badge = getRoleBadge(activeRole);

  return (
    <header className="sticky top-0 z-40 bg-[#12273F] dark:bg-[#12273F] border-b border-[#223B57] dark:border-[#223B57] shadow-md">
      {/* Impersonation Auditor Banner (Bloco 4.6 / S6) */}
      {isAuditorMode && (
        <div className="bg-[#E09F3E] text-[#0B1A2E] px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              Modo Auditor Ativo: A visualizar o sistema como{' '}
              <strong>
                {activeRole === 'DRIVER'
                  ? 'Motorista (Carlos Eduardo Silveira)'
                  : 'Oficina (AutoTech Premium)'}
              </strong>{' '}
              • Acesso em Modo de Leitura Registado em Auditoria.
            </span>
          </div>
          <button
            onClick={() => toggleAuditorMode(null)}
            className="bg-[#0B1A2E] text-white px-3 py-1 rounded-xl text-xs font-bold hover:bg-black transition-colors shrink-0 ml-3"
          >
            Sair do Modo Auditor
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F4E8C] dark:bg-[#3A76C2] flex items-center justify-center text-white shadow-sm ring-2 ring-[#3A76C2]/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white dark:text-white">
                CARCITY
              </span>
              <span className="text-[10px] tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                TELEMETRIA IoT
              </span>
            </div>
            <p className="text-[11px] text-[#9FB3C8] hidden sm:block">
              Proteção Automotiva & Gestão Corporativa
            </p>
          </div>
        </div>

        {/* Center: Vehicle selector (Visible for DRIVER or in Auditor mode) */}
        {(activeRole === 'DRIVER' || isAuditorMode) && vehicles.length > 0 && (
          <div className="flex items-center gap-2.5">
            {/* 2. Badge de Proteção Ativa (Verde Protegido #2FA67A) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2FA67A]/15 border border-[#2FA67A]/40 text-[#2FA67A] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#2FA67A] shrink-0" />
              <span>Proteção Conectada • Gateway IoT v4.2 OK</span>
            </div>

            {/* 3. Indicador de Assinatura (Dourado Premium #D4AF37) com atalho para o Inspetor de Sessão & RBAC */}
            <button
              onClick={() => setIsJwtModalOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-colors text-xs font-bold"
              title="Clique para abrir o Inspetor de Sessão & RBAC"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span>Plano Advanced</span>
            </button>

            {/* 1. Seletor de Veículo Ativo (Dropdown na Header) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white hover:border-[#3A76C2] transition-colors text-xs font-medium"
              >
                <Car className="w-4 h-4 text-[#5DA9E9]" />
                <div className="text-left">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <span>{selectedVehicle?.brand} {selectedVehicle?.model}</span>
                    <span className="text-[10px] px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-mono">
                      {selectedVehicle?.id === 'veh-corolla-001'
                        ? 'Advanced'
                        : selectedVehicle?.id === 'veh-byd-002'
                        ? 'Standard'
                        : 'Basic'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#9FB3C8]">
                    Placa: {selectedVehicle?.plate} • {selectedVehicle?.propulsion}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#9FB3C8] ml-1" />
              </button>

              {isVehicleDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-[#12273F] border border-[#223B57] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-bold text-[#9FB3C8] uppercase tracking-wider">
                    Selecionar Veículo Conectado
                  </div>
                  {vehicles.map((v) => {
                    const planLabel =
                      v.id === 'veh-corolla-001'
                        ? 'Plano Advanced'
                        : v.id === 'veh-byd-002'
                        ? 'Plano Standard'
                        : 'Plano Basic';
                    const isSelected = selectedVehicle?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setIsVehicleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#223B57]/50 transition-colors ${
                          isSelected ? 'bg-[#3A76C2]/20 text-white font-semibold' : 'text-[#F1F5F9]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            <span>{v.brand} {v.model} {v.model_year}</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#9FB3C8] mt-0.5">
                            Placa: <strong className="text-white">{v.plate}</strong> ({planLabel})
                          </div>
                        </div>
                        {v.engine_cut_connected && (
                          <span className="text-[10px] text-[#2FA67A] bg-[#2FA67A]/15 px-1.5 py-0.5 rounded font-mono border border-[#2FA67A]/30">
                            IoT OK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell with Critical Pulse Indicator (Section D2) */}
          {(activeRole === 'DRIVER' || isAuditorMode) && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white hover:border-[#3A76C2] transition-colors"
              title="Central de Alertas & Notificações"
            >
              <Bell className="w-4 h-4" />
              {criticalAlertsCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5484D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E5484D] text-[9px] font-bold text-white items-center justify-center">
                    {criticalAlertsCount}
                  </span>
                </span>
              ) : alertsCount > 0 ? (
                <span className="absolute -top-1 -right-1 rounded-full h-4 w-4 bg-[#E09F3E] text-[9px] font-bold text-black flex items-center justify-center">
                  {alertsCount}
                </span>
              ) : null}
            </button>
          )}

          {/* JWT & RBAC Real-Time Inspector Modal Trigger (Section 5) */}
          <button
            onClick={() => setIsJwtModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white hover:border-[#3A76C2] text-xs font-medium transition-colors"
            title="Inspecionar JWT decodificado e status de assinatura"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#5DA9E9]" />
            <span className="hidden sm:inline">Inspetor RBAC</span>
          </button>

          {/* Theme Switcher (Escuro / Claro) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white hover:border-[#3A76C2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A76C2]"
            title={`Alternar para tema ${theme === 'dark' ? 'Claro' : 'Escuro'} (Persistido no LocalStorage)`}
            aria-label={`Alternar para tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline text-xs font-medium text-amber-300">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="hidden xl:inline text-xs font-medium text-blue-300">Modo Escuro</span>
              </>
            )}
          </button>

          {/* Role Pill & Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${badge.bg}`}
              title="Alternar perfil de demonstração"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#12273F] border border-[#223B57] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-bold text-[#9FB3C8] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#3A76C2]" />
                  Simular Perfil / RBAC
                </div>
                <div className="divide-y divide-[#223B57]/50 my-1">
                  <button
                    onClick={() => {
                      switchRoleForDemo('DRIVER');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#F1F5F9] hover:bg-[#223B57]/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Motorista (DRIVER)</div>
                      <div className="text-[10px] text-[#9FB3C8]">Telemetria, GPS & Pânico</div>
                    </div>
                    {activeRole === 'DRIVER' && <span className="text-xs text-[#2FA67A]">●</span>}
                  </button>

                  <button
                    onClick={() => {
                      switchRoleForDemo('WORKSHOP_OWNER');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#F1F5F9] hover:bg-[#223B57]/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Oficina (WORKSHOP_OWNER)</div>
                      <div className="text-[10px] text-[#9FB3C8]">Agendamentos & Anti-Fraude</div>
                    </div>
                    {activeRole === 'WORKSHOP_OWNER' && <span className="text-xs text-[#2FA67A]">●</span>}
                  </button>

                  <button
                    onClick={() => {
                      switchRoleForDemo('ADMIN');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#F1F5F9] hover:bg-[#223B57]/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">CMS Admin (ADMIN)</div>
                      <div className="text-[10px] text-[#9FB3C8]">Artigos, Moderação, 2FA</div>
                    </div>
                    {activeRole === 'ADMIN' && <span className="text-xs text-[#2FA67A]">●</span>}
                  </button>

                  <button
                    onClick={() => {
                      switchRoleForDemo('SUPER_ADMIN');
                      setIsRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#F1F5F9] hover:bg-[#223B57]/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Super Admin (SUPER_ADMIN)</div>
                      <div className="text-[10px] text-[#9FB3C8]">Auditoria, Equipe & Lixeira</div>
                    </div>
                    {activeRole === 'SUPER_ADMIN' && <span className="text-xs text-[#2FA67A]">●</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-[#E5484D] hover:border-[#E5484D]/40 transition-colors"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
