import React from 'react';
import {
  Activity,
  MapPin,
  ShieldAlert,
  MessageSquare,
  Wrench,
  FileText,
  ShieldCheck,
  BarChart3,
  Users2,
  Trash2,
  Sliders,
  CalendarCheck,
  UserCheck,
  Clock,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const Navigation: React.FC = () => {
  const { activeRole, activeTab, setActiveTab, setIsJwtModalOpen } = useApp();

  // Desktop navigation items per role
  const getNavItems = () => {
    switch (activeRole) {
      case 'DRIVER':
        return [
          { id: 'dashboard', label: 'Painel Telemetria', icon: Activity },
          { id: 'maintenance_logs', label: 'Histórico Manutenção', icon: Wrench },
          { id: 'map', label: 'Mapa & Riscos 5KM', icon: MapPin },
          { id: 'commands', label: 'Comando & Pânico', icon: ShieldAlert },
          { id: 'community', label: 'Comunidade & DIY', icon: MessageSquare },
          { id: 'appointments', label: 'Agendamentos', icon: CalendarCheck },
        ];
      case 'WORKSHOP_OWNER':
        return [
          { id: 'workshop', label: 'Vitrine da Oficina', icon: Wrench },
          { id: 'workshop_appointments', label: 'Central de Agendamentos', icon: CalendarCheck },
          { id: 'workshop_anti_fraud', label: 'Selo Anti-Fraude', icon: ShieldCheck },
          { id: 'workshop_offers', label: 'Ofertas & Descontos', icon: Sliders },
          { id: 'workshop_news', label: 'Comunicados & Mercado', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { id: 'cms_articles', label: 'Central de Notícias', icon: FileText },
          { id: 'cms_moderation', label: 'Moderação Geral', icon: ShieldAlert },
          { id: 'cms_diy', label: 'Curadoria Hub DIY', icon: Video },
          { id: 'cms_analytics', label: 'Analytics & Engajamento', icon: BarChart3 },
        ];
      case 'SUPER_ADMIN':
        return [
          { id: 'super_admin', label: 'Dashboard Mestre (S1)', icon: Activity },
          { id: 'super_team', label: 'Gestão RBAC (S2)', icon: Users2 },
          { id: 'super_audit', label: 'Trilha Auditoria (S3)', icon: ShieldAlert },
          { id: 'super_workshops', label: 'Fila Anti-Fraude (S4)', icon: ShieldCheck },
          { id: 'super_trash', label: 'Lixeira Central (S5)', icon: Trash2 },
          { id: 'super_timeline', label: 'Linha do Tempo (S6)', icon: Clock },
          { id: 'cms_articles', label: 'Artigos CMS', icon: FileText },
          { id: 'cms_moderation', label: 'Moderação Geral', icon: ShieldAlert },
          { id: 'cms_diy', label: 'Hub DIY', icon: Video },
          { id: 'cms_analytics', label: 'Analytics', icon: BarChart3 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop Horizontal Sub-Navbar */}
      <nav className="bg-[#0B1A2E] border-b border-[#223B57] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#3A76C2] text-white shadow-sm'
                      : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9FB3C8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Section 5) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12273F] border-t border-[#223B57] px-2 py-1 shadow-2xl">
        <div className="flex items-center justify-around">
          {activeRole === 'DRIVER' ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'dashboard' ? 'text-[#3A76C2]' : 'text-[#9FB3C8]'
                }`}
              >
                <Activity className="w-5 h-5 mb-0.5" />
                <span>Painel</span>
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'map' ? 'text-[#3A76C2]' : 'text-[#9FB3C8]'
                }`}
              >
                <MapPin className="w-5 h-5 mb-0.5" />
                <span>Mapa</span>
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'commands' ? 'text-[#E5484D]' : 'text-[#9FB3C8]'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span>Pânico</span>
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'community' ? 'text-[#3A76C2]' : 'text-[#9FB3C8]'
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-0.5" />
                <span>Comunidade</span>
              </button>
              <button
                onClick={() => setIsJwtModalOpen(true)}
                className="flex flex-col items-center py-1 px-2 text-[10px] font-medium text-[#9FB3C8] hover:text-white"
              >
                <UserCheck className="w-5 h-5 mb-0.5 text-[#5DA9E9]" />
                <span>Perfil</span>
              </button>
            </>
          ) : activeRole === 'WORKSHOP_OWNER' ? (
            <>
              <button
                onClick={() => setActiveTab('workshop')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'workshop' ? 'text-[#2FA67A]' : 'text-[#9FB3C8]'
                }`}
              >
                <Wrench className="w-5 h-5 mb-0.5" />
                <span>Oficina B2B</span>
              </button>
              <button
                onClick={() => setActiveTab('workshop_appointments')}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  activeTab === 'workshop_appointments' ? 'text-[#2FA67A]' : 'text-[#9FB3C8]'
                }`}
              >
                <CalendarCheck className="w-5 h-5 mb-0.5" />
                <span>Agendamentos</span>
              </button>
              <button
                onClick={() => setIsJwtModalOpen(true)}
                className="flex flex-col items-center py-1 px-2 text-[10px] font-medium text-[#9FB3C8]"
              >
                <UserCheck className="w-5 h-5 mb-0.5 text-[#5DA9E9]" />
                <span>Perfil</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab(activeRole === 'SUPER_ADMIN' ? 'super_admin' : 'cms_articles')}
                className="flex flex-col items-center py-1 px-2 text-[10px] font-medium text-[#3A76C2]"
              >
                <Activity className="w-5 h-5 mb-0.5" />
                <span>CMS</span>
              </button>
              <button
                onClick={() => setIsJwtModalOpen(true)}
                className="flex flex-col items-center py-1 px-2 text-[10px] font-medium text-[#9FB3C8]"
              >
                <UserCheck className="w-5 h-5 mb-0.5 text-[#5DA9E9]" />
                <span>Perfil</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
