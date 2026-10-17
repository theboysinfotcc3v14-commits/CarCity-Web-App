import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  CalendarCheck,
  ShieldCheck,
  Sliders,
  FileText,
  Sparkles,
  Bot,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { Workshop, AppointmentStatus, WorkshopDoc } from '../../types/index.ts';
import { MODEL_WORKSHOP_AUTOTECH } from '../../lib/telemetry.ts';
import { WorkshopShowcase } from './WorkshopShowcase.tsx';
import { WorkshopAppointmentsKanban } from './WorkshopAppointmentsKanban.tsx';
import { WorkshopAntiFraud } from './WorkshopAntiFraud.tsx';
import { WorkshopOffersRoi } from './WorkshopOffersRoi.tsx';
import { WorkshopNewsHub } from './WorkshopNewsHub.tsx';
import { WorkshopTechCopilotModal } from './WorkshopTechCopilotModal.tsx';

export const WorkshopView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    workshop: contextWorkshop,
    setWorkshop: setContextWorkshop,
    workshopAppointments,
    updateWorkshopAppointmentStatus,
    cmsB2BArticles,
    addWorkshopDocument,
    updateWorkshopOffers,
  } = useApp();

  // Internal active tab initialized with activeTab or 'workshop'
  const [currentTab, setCurrentTab] = useState<
    'workshop' | 'workshop_appointments' | 'workshop_anti_fraud' | 'workshop_offers' | 'workshop_news'
  >(() => {
    if (
      activeTab === 'workshop_appointments' ||
      activeTab === 'workshop_anti_fraud' ||
      activeTab === 'workshop_offers' ||
      activeTab === 'workshop_news'
    ) {
      return activeTab as any;
    }
    return 'workshop';
  });

  // Keep local state in sync when activeTab changes from navigation
  useEffect(() => {
    if (
      activeTab === 'workshop' ||
      activeTab === 'workshop_appointments' ||
      activeTab === 'workshop_anti_fraud' ||
      activeTab === 'workshop_offers' ||
      activeTab === 'workshop_news'
    ) {
      setCurrentTab(activeTab as any);
    }
  }, [activeTab]);

  // Loading state with 300ms emergency fallback
  const [isLoading, setIsLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // [BLOCO 2.1] Correção Definitiva do Bug de Loading Infinito
  // Trava de segurança (fallback): se a requisição das rotas /api/workshops/me ou /api/workshops/documents
  // demorar mais de 300ms ou retornar 404/vazio/erro, desativa isLoading e força o carregamento da oficina modelo "AutoTech Premium LTDA".
  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança estrito de 300ms
    fallbackTimerRef.current = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        if (!contextWorkshop || !contextWorkshop.nome_fantasia) {
          setContextWorkshop(MODEL_WORKSHOP_AUTOTECH);
        }
      }
    }, 300);

    const loadRemoteWorkshop = async () => {
      try {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 300);

        const [resMe, resDocs] = await Promise.allSettled([
          fetch('/api/workshops/me', { signal: controller.signal }),
          fetch('/api/workshops/documents', { signal: controller.signal }),
        ]);

        clearTimeout(fetchTimeout);

        if (!isMounted) return;

        if (resMe.status === 'fulfilled' && resMe.value.ok) {
          const data = await resMe.value.json();
          if (data && data.nome_fantasia) {
            let docs = data.documents;
            if (resDocs.status === 'fulfilled' && resDocs.value.ok) {
              const docsData = await resDocs.value.json();
              if (Array.isArray(docsData) && docsData.length > 0) {
                docs = docsData;
              }
            }
            setContextWorkshop({
              ...MODEL_WORKSHOP_AUTOTECH,
              ...data,
              documents: docs || MODEL_WORKSHOP_AUTOTECH.documents,
            });
          } else {
            // Retornou vazio ou 404: força AutoTech Premium LTDA
            setContextWorkshop(MODEL_WORKSHOP_AUTOTECH);
          }
        } else {
          // Requisição falhou: força AutoTech Premium LTDA
          setContextWorkshop(MODEL_WORKSHOP_AUTOTECH);
        }
      } catch {
        // Erro ou abort de 300ms: força AutoTech Premium LTDA
        if (isMounted) {
          setContextWorkshop(MODEL_WORKSHOP_AUTOTECH);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRemoteWorkshop();

    return () => {
      isMounted = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  // Garantia absoluta de renderização: se contextWorkshop for null/undefined, utiliza MODEL_WORKSHOP_AUTOTECH
  const workshop: Workshop =
    contextWorkshop && contextWorkshop.nome_fantasia
      ? contextWorkshop
      : MODEL_WORKSHOP_AUTOTECH;

  const handleTabChange = (
    tab: 'workshop' | 'workshop_appointments' | 'workshop_anti_fraud' | 'workshop_offers' | 'workshop_news'
  ) => {
    setCurrentTab(tab);
    setActiveTab(tab);
  };

  const handleUpdateWorkshopProfile = (updated: Partial<Workshop>) => {
    setContextWorkshop((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Top B2B Operational Header with Quick Actions & Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1E33] border border-[#223B57] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2FA67A]/20 text-[#2FA67A] flex items-center justify-center shrink-0 border border-[#2FA67A]/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {workshop.nome_fantasia || 'AutoTech Premium - Unidade Jardins'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFICADO
              </span>
            </div>
            <p className="text-xs text-[#9FB3C8]">
              Portal Corporativo B2B • Credenciamento CarCity 2026/2027
            </p>
          </div>
        </div>

        {/* Action Buttons: Copiloto IA Técnico 24h & Ver Mapa */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2FA67A] to-[#1F7A56] hover:from-[#258763] hover:to-[#176646] text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Suporte IA Técnico 24h</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar (Vitrine, Agendamentos, Selo Anti-Fraude, Ofertas, Comunicados) */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl bg-[#0B1A2E] border border-[#223B57] shadow-inner">
        <button
          onClick={() => handleTabChange('workshop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            currentTab === 'workshop'
              ? 'bg-[#3A76C2] text-white shadow-md'
              : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Vitrine da Oficina (W1)</span>
        </button>

        <button
          onClick={() => handleTabChange('workshop_appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            currentTab === 'workshop_appointments'
              ? 'bg-[#3A76C2] text-white shadow-md'
              : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Central de Agendamentos & Kanban (W2)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
            {workshopAppointments.filter((a) => a.status !== 'COMPLETED').length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('workshop_anti_fraud')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            currentTab === 'workshop_anti_fraud'
              ? 'bg-[#2FA67A] text-white shadow-md'
              : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Selo Anti-Fraude & Documentos (W3)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
            {workshop.documents?.length || 4}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('workshop_offers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            currentTab === 'workshop_offers'
              ? 'bg-[#3A76C2] text-white shadow-md'
              : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ofertas, Benefícios & ROI (W4)</span>
        </button>

        <button
          onClick={() => handleTabChange('workshop_news')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            currentTab === 'workshop_news'
              ? 'bg-[#3A76C2] text-white shadow-md'
              : 'text-[#9FB3C8] hover:text-white hover:bg-[#12273F]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Comunicados & Mercado Automotivo</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
            {cmsB2BArticles.length}
          </span>
        </button>
      </div>

      {/* Tab Panels Rendering */}
      {currentTab === 'workshop' && (
        <WorkshopShowcase
          workshop={workshop}
          onUpdateWorkshop={handleUpdateWorkshopProfile}
        />
      )}

      {currentTab === 'workshop_appointments' && (
        <WorkshopAppointmentsKanban
          appointments={workshopAppointments}
          onUpdateStatus={updateWorkshopAppointmentStatus}
        />
      )}

      {currentTab === 'workshop_anti_fraud' && (
        <WorkshopAntiFraud
          workshop={workshop}
          onAddDocument={addWorkshopDocument}
        />
      )}

      {currentTab === 'workshop_offers' && (
        <WorkshopOffersRoi
          workshop={workshop}
          onUpdateOffers={updateWorkshopOffers}
        />
      )}

      {currentTab === 'workshop_news' && (
        <WorkshopNewsHub articles={cmsB2BArticles} />
      )}

      {/* Floating Button for Copiloto IA Técnico 24h (BLOCO 2.8) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#2FA67A] to-[#1F7A56] hover:from-[#258763] hover:to-[#176646] text-white text-xs font-extrabold shadow-2xl border border-white/20 hover:scale-105 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Suporte IA Técnico 24h</span>
        </button>
      </div>

      {/* Copiloto IA Técnico Modal */}
      <WorkshopTechCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};
