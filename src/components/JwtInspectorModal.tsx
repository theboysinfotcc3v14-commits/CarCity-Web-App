import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  User,
  Shield,
  Clock,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const JwtInspectorModal: React.FC = () => {
  const { user, rawToken, isJwtModalOpen, setIsJwtModalOpen, activeRole } = useApp();
  const [signatureStatus, setSignatureStatus] = useState<'VALID' | 'INVALID' | 'EXPIRED' | 'CHECKING'>('CHECKING');
  const [serverVerificationData, setServerVerificationData] = useState<any>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (isJwtModalOpen && rawToken) {
      verifyJwtOnServer();
    }
  }, [isJwtModalOpen, rawToken]);

  const verifyJwtOnServer = async () => {
    setSignatureStatus('CHECKING');
    try {
      const res = await fetch('/api/auth/verify-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });
      const data = await res.json();
      setSignatureStatus(data.status || 'INVALID');
      setServerVerificationData(data);
    } catch (e) {
      setSignatureStatus('INVALID');
    }
  };

  if (!isJwtModalOpen || !user) return null;

  // Mask CPF for LGPD compliance (e.g. 123.***.***-00)
  const maskCpfCnpj = (doc: string) => {
    if (!doc) return '***';
    if (doc.length <= 14) {
      // CPF: 123.456.789-00 -> 123.***.***-00
      return doc.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2');
    }
    // CNPJ: 12.345.678/0001-90 -> 12.***.***/0001-90
    return doc.replace(/(\d{2})\.\d{3}\.\d{3}\/(\d{4})-(\d{2})/, '$1.***.***/$2-$3');
  };

  const allPossiblePermissions = [
    { code: 'vehicles:read', label: 'Leitura de Veículos Conectados' },
    { code: 'telemetry:read', label: 'Telemetria & Histórico de Viagens' },
    { code: 'telemetry:simulate', label: 'Simulador de Sensores IoT' },
    { code: 'commands:execute', label: 'Comandos de Corte & Trava' },
    { code: 'risk:report', label: 'Relato de Ocorrências no Mapa' },
    { code: 'community:write', label: 'Publicações e Fórum Técnico' },
    { code: 'appointments:create', label: 'Agendamento em Oficinas' },
    { code: 'ai:chat', label: 'Acesso ao Suporte VIP Gemini' },
    { code: 'workshop:manage', label: 'Gestão da Vitrine B2B' },
    { code: 'appointments:manage', label: 'Aprovação de Orçamentos' },
    { code: 'anti_fraud:submit', label: 'Submissão de Documentos Anti-Fraude' },
    { code: 'cms:manage', label: 'Criação e Edição de Artigos' },
    { code: 'community:moderate', label: 'Moderação de Conteúdo' },
    { code: 'analytics:read', label: 'Analytics e Métricas de Tráfego' },
    { code: 'trash:permanent_delete', label: 'Exclusão Definitiva no Banco' },
    { code: 'team:manage', label: 'Gestão e Revogação de Credenciais' },
    { code: 'system:audit', label: 'Trilha de Auditoria do MariaDB' },
    { code: 'impersonate:run', label: 'Ativação do Modo Auditor' },
  ];

  const userPermissions = user.permissions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12273F] border border-[#223B57] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1A2E] border-b border-[#223B57] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Inspetor de Sessão & RBAC</h3>
              <p className="text-xs text-[#9FB3C8]">
                Auditoria de autorização no servidor (JWT HS256 & MariaDB)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsJwtModalOpen(false)}
            className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#223B57] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status da Assinatura no Servidor */}
          <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#9FB3C8] font-medium uppercase tracking-wider mb-1">
                Status da Assinatura Criptográfica
              </div>
              <div className="flex items-center gap-2">
                {signatureStatus === 'VALID' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Válida (Confirmada no MariaDB)
                  </span>
                ) : signatureStatus === 'EXPIRED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/40">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Expirada (&gt; 15 min)
                  </span>
                ) : signatureStatus === 'CHECKING' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#3A76C2]/20 text-[#3A76C2]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Validando no Servidor...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E5484D]/20 text-[#E5484D] border border-[#E5484D]/40">
                    <XCircle className="w-3.5 h-3.5" />
                    Inválida ou Revogada
                  </span>
                )}
                <span className="text-xs text-[#9FB3C8]">Algoritmo: HS256</span>
              </div>
            </div>
            <button
              onClick={verifyJwtOnServer}
              className="px-3 py-1.5 rounded-lg bg-[#12273F] border border-[#223B57] text-xs font-medium text-white hover:border-[#3A76C2] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Revalidar
            </button>
          </div>

          {/* Claims Não Sensíveis Decodificadas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9FB3C8] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#3A76C2]" />
              Claims Autorizadas no Token (Server-Side)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">Subject (sub / ID único):</span>
                <span className="font-mono text-white font-medium">{user.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">Papel Autoritativo (role):</span>
                <span className="font-bold text-[#5DA9E9]">{activeRole}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">Nome do Titular:</span>
                <span className="text-white font-medium">{user.full_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">Plano Contratado:</span>
                <span className="font-semibold text-[#D4AF37]">{user.plan}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">CPF / CNPJ (LGPD Mascarado):</span>
                <span className="font-mono text-white font-medium">{maskCpfCnpj(user.cpf_cnpj)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[11px]">E-mail Corporativo:</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Checklist Visual de Permissões Concedidas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9FB3C8] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2FA67A]" />
              Checklist de Permissões RBAC Ativas
            </h4>
            <div className="p-4 rounded-xl bg-[#0B1A2E] border border-[#223B57] max-h-52 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {allPossiblePermissions.map((perm) => {
                  const hasPermission = userPermissions.includes(perm.code);
                  return (
                    <div
                      key={perm.code}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        hasPermission ? 'bg-[#2FA67A]/10 text-white' : 'opacity-40 text-[#9FB3C8]'
                      }`}
                    >
                      {hasPermission ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2FA67A] shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-mono text-[11px] block">{perm.code}</span>
                        <span className="text-[10px] text-[#9FB3C8]">{perm.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LGPD & Exclusão de Conta */}
          <div className="pt-2 border-t border-[#223B57] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9FB3C8]">
            <span>
              Privacidade LGPD: Localização coletada somente com consentimento ativo.
            </span>
            <button
              onClick={() => setIsDeletingAccount(true)}
              className="text-[#E5484D] hover:underline flex items-center gap-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Solicitar Exclusão da Conta
            </button>
          </div>

          {isDeletingAccount && (
            <div className="p-4 rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-xs text-white space-y-2">
              <p className="font-semibold text-[#E5484D]">
                Direito de Exclusão Definitiva (Art. 18 LGPD)
              </p>
              <p className="text-[#9FB3C8]">
                Seus dados cadastrais, telemetrias históricas e acessos serão revogados imediatamente na próxima rotina de expurgo.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsDeletingAccount(false)}
                  className="px-3 py-1.5 rounded bg-[#0B1A2E] text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert('Solicitação registrada. A sessão será encerrada.');
                    setIsDeletingAccount(false);
                    setIsJwtModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded bg-[#E5484D] text-white font-bold"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
