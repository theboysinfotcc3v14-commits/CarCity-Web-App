import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Wrench,
  CheckCircle2,
  Edit3,
  X,
  Camera,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Workshop } from '../../types/index.ts';

interface WorkshopShowcaseProps {
  workshop: Workshop;
  onUpdateWorkshop: (updated: Partial<Workshop>) => void;
}

export const WorkshopShowcase: React.FC<WorkshopShowcaseProps> = ({
  workshop,
  onUpdateWorkshop,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeGalleryModal, setActiveGalleryModal] = useState<{ label: string; url: string } | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // Form edit state
  const [formData, setFormData] = useState({
    nome_fantasia: workshop.nome_fantasia,
    razao_social: workshop.razao_social,
    cnpj: workshop.cnpj || '12.345.678/0001-90',
    address: workshop.address,
    phone: workshop.phone || '(11) 98765-4321',
    email: workshop.email || 'contato@autotechpremium.com.br',
    specialties: workshop.specialties || [],
  });

  const availableSpecialties = [
    'Mecânica Geral & Injeção Eletrônica',
    'Elétrica, Telemetria & Sensores IoT',
    'Híbridos & Veículos Elétricos (EV)',
    'Alinhamento 3D, Pneus & Calibragem TPMS',
    'Diagnóstico Preditivo de Freios',
    'Ar Condicionado & Sanitização',
    'Câmbio Automático & Transmissão',
  ];

  const handleToggleSpecialty = (item: string) => {
    setFormData((prev) => {
      const exists = prev.specialties.includes(item);
      return {
        ...prev,
        specialties: exists ? prev.specialties.filter((s) => s !== item) : [...prev.specialties, item],
      };
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkshop(formData);
    setIsEditModalOpen(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Perfil B2B Atualizado</div>
            <div className="text-[#9FB3C8]">As informações institucionais foram sincronizadas na rede CarCity.</div>
          </div>
        </div>
      )}

      {/* 1. Header de Identificação Corporativa & Selo Anti-Fraude */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#2FA67A]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#223B57]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#2FA67A]" />
                Oficina Credenciada & Homologada CarCity
              </span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1 font-mono">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                {workshop.rating || 4.9} ★★★★★ ({workshop.reviews_count || 142} avaliações)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {workshop.nome_fantasia}
            </h1>

            <p className="text-xs sm:text-sm text-[#9FB3C8]">
              <span className="font-semibold text-white">{workshop.razao_social}</span> • CNPJ:{' '}
              <span className="font-mono text-[#5DA9E9]">{workshop.cnpj || '12.345.678/0001-90'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar Informações do Perfil
            </button>
            <a
              href={`https://maps.google.com/?q=${workshop.latitude},${workshop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#5DA9E9] text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ver no Mapa Interativo
            </a>
          </div>
        </div>

        {/* 2. Localização & Contatos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#3A76C2]/20 text-[#5DA9E9] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB3C8] block">
                Localização Física
              </span>
              <p className="text-xs font-medium text-white mt-0.5">{workshop.address}</p>
              <span className="text-[10px] font-mono text-[#5DA9E9] mt-1 block">
                Lat: {workshop.latitude} • Lng: {workshop.longitude}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#2FA67A]/20 text-[#2FA67A] shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB3C8] block">
                Telefone & WhatsApp
              </span>
              <p className="text-xs font-mono font-bold text-white mt-0.5">
                {workshop.phone || '(11) 98765-4321'}
              </p>
              <span className="text-[10px] text-[#2FA67A] mt-1 block font-medium">
                Linha Direta de Atendimento B2B
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#E09F3E]/20 text-[#E09F3E] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB3C8] block">
                E-mail Corporativo
              </span>
              <p className="text-xs font-mono font-medium text-white mt-0.5">
                {workshop.email || 'contato@autotechpremium.com.br'}
              </p>
              <span className="text-[10px] text-[#9FB3C8] mt-1 block">
                Faturamento e Ordens de Serviço
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Checklist de Especialidades Técnicas */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#2FA67A]" />
            <h3 className="text-base font-bold text-white">Especialidades Técnicas Homologadas</h3>
          </div>
          <span className="text-xs text-[#9FB3C8]">
            {workshop.specialties.length} especialidades verificadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workshop.specialties.map((spec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-center gap-3 hover:border-[#2FA67A]/50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#2FA67A]/20 text-[#2FA67A] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-white">{spec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Galeria das Instalações (Grid com 4 fotos temáticas) */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#5DA9E9]" />
            <h3 className="text-base font-bold text-white">Galeria das Instalações & Boxes de Atendimento</h3>
          </div>
          <span className="text-xs text-[#9FB3C8]">Auditoria visual CarCity 2026</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            workshop.gallery || [
              {
                id: 'gal-1',
                label: 'Fachada Principal',
                url: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=800&q=80',
              },
              {
                id: 'gal-2',
                label: 'Elevadores Hidráulicos',
                url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
              },
              {
                id: 'gal-3',
                label: 'Scanner de Bateria EV',
                url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
              },
              {
                id: 'gal-4',
                label: 'Certificados CREA/CFT',
                url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
              },
            ]
          ).map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveGalleryModal({ label: item.label, url: item.url })}
              className="group relative rounded-xl overflow-hidden border border-[#223B57] bg-[#0B1A2E] cursor-pointer hover:border-[#3A76C2] transition-all shadow-md aspect-4/3"
            >
              <img
                src={item.url}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                <span className="text-xs font-bold text-white group-hover:text-[#5DA9E9] transition-colors">
                  {item.label}
                </span>
                <span className="text-[10px] text-[#9FB3C8] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-[#2FA67A]" /> Verificado no Credenciamento
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Editar Informações do Perfil */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#223B57] pb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#3A76C2]" />
                <h3 className="text-lg font-bold text-white">Editar Perfil Institucional B2B</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#3A76C2]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#3A76C2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs font-mono focus:outline-hidden focus:border-[#3A76C2]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#3A76C2]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#3A76C2]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                  Endereço Físico Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#3A76C2]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-2">
                  Especialidades Técnicas Homologadas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableSpecialties.map((item) => {
                    const isChecked = formData.specialties.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleToggleSpecialty(item)}
                        className={`text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-[#2FA67A]/15 border-[#2FA67A] text-white font-medium'
                            : 'bg-[#0B1A2E] border-[#223B57] text-[#9FB3C8]'
                        }`}
                      >
                        <span>{item}</span>
                        {isChecked && <Check className="w-4 h-4 text-[#2FA67A]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#258763] text-white text-xs font-bold shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Foto da Galeria */}
      {activeGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-3xl w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">{activeGalleryModal.label}</h4>
              <button
                onClick={() => setActiveGalleryModal(null)}
                className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden max-h-[70vh]">
              <img
                src={activeGalleryModal.url}
                alt={activeGalleryModal.label}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
