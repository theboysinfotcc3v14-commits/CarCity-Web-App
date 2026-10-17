import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  FileText,
  KeyRound,
  Sun,
  Moon,
  AlertCircle,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { UserRole } from '../../types/index.ts';

export const AuthView: React.FC = () => {
  const { login, theme, setTheme } = useApp();

  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('DRIVER');
  const [identifier, setIdentifier] = useState('motorista@carcity.com.br');
  const [password, setPassword] = useState('password123');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [require2fa, setRequire2fa] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  // Switch tabs and populate convenient demo credentials
  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRoleTab(role);
    setErrorMsg(null);
    setRequire2fa(false);
    setTotpCode('');

    switch (role) {
      case 'DRIVER':
        setIdentifier('motorista@carcity.com.br');
        setPassword('password123');
        break;
      case 'WORKSHOP_OWNER':
        setIdentifier('oficina@carcity.com.br');
        setPassword('password123');
        break;
      case 'ADMIN':
        setIdentifier('admin@carcity.com.br');
        setPassword('password123');
        setTotpCode('123456');
        break;
      case 'SUPER_ADMIN':
        setIdentifier('master@carcity.com.br');
        setPassword('password123');
        setTotpCode('123456');
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await login(identifier, password, totpCode || undefined, selectedRoleTab);
      setLoading(false);

      if (!result.success) {
        if (result.require2fa) {
          setRequire2fa(true);
          setErrorMsg(result.error || 'Informe o código 2FA TOTP para continuar.');
        } else {
          setErrorMsg(result.error || 'Credenciais inválidas.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      console.warn('Login intercept error:', err);
    }
  };

  // Login instantâneo em 1 clique para a banca examinadora
  const handleQuickLogin = async (role: UserRole) => {
    setErrorMsg(null);
    setLoading(true);
    let id = 'motorista@carcity.com.br';
    let code: string | undefined = undefined;

    if (role === 'WORKSHOP_OWNER') {
      id = 'oficina@carcity.com.br';
    } else if (role === 'ADMIN') {
      id = 'admin@carcity.com.br';
      code = '123456';
    } else if (role === 'SUPER_ADMIN') {
      id = 'master@carcity.com.br';
      code = '123456';
    }

    try {
      await login(id, 'password123', code, role);
    } catch (err: any) {
      console.warn('Quick login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0B1A2E] text-[#F1F5F9]">
      {/* Top Brand */}
      <div className="flex flex-col items-center mb-8 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#3A76C2] flex items-center justify-center text-white shadow-2xl ring-4 ring-[#3A76C2]/25">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white mt-2">
          CARCITY WEB
        </h1>
        <p className="text-xs text-[#9FB3C8] max-w-sm text-center">
          Plataforma de Telemetria IoT, Gestão B2B e Proteção Veicular Corporativa
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#12273F] border border-[#223B57] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Role Selection Tabs (Section 5) */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleRoleTabChange('DRIVER')}
            className={`py-2 rounded-lg transition-colors text-center ${
              selectedRoleTab === 'DRIVER' ? 'bg-[#3A76C2] text-white shadow' : 'text-[#9FB3C8] hover:text-white'
            }`}
          >
            Motorista
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('WORKSHOP_OWNER')}
            className={`py-2 rounded-lg transition-colors text-center ${
              selectedRoleTab === 'WORKSHOP_OWNER' ? 'bg-[#2FA67A] text-white shadow' : 'text-[#9FB3C8] hover:text-white'
            }`}
          >
            Oficina
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('ADMIN')}
            className={`py-2 rounded-lg transition-colors text-center ${
              selectedRoleTab === 'ADMIN' ? 'bg-[#E09F3E] text-[#0B1A2E] shadow font-black' : 'text-[#9FB3C8] hover:text-white'
            }`}
          >
            Admin CMS
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('SUPER_ADMIN')}
            className={`py-2 rounded-lg transition-colors text-center ${
              selectedRoleTab === 'SUPER_ADMIN' ? 'bg-[#D4AF37] text-[#0B1A2E] shadow font-black' : 'text-[#9FB3C8] hover:text-white'
            }`}
          >
            Master
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#E5484D]/15 border border-[#E5484D] text-xs text-[#E5484D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {forgotPasswordNotice && (
          <div className="p-3 rounded-xl bg-[#3A76C2]/20 border border-[#3A76C2] text-xs text-white space-y-1">
            <strong>Recuperação de Senha:</strong>
            <p className="text-[11px] text-[#9FB3C8]">
              Um link de uso único válido por 30 minutos foi simulado para seu e-mail cadastrado.
            </p>
          </div>
        )}

        {/* Acesso Rápido para Banca Examinadora */}
        <div className="p-3 rounded-2xl bg-[#0B1A2E] border border-[#3A76C2]/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5DA9E9] uppercase tracking-wider">
              Acesso Rápido para a Banca (1 Clique):
            </span>
            <span className="text-[9px] font-mono text-[#2FA67A] bg-[#2FA67A]/20 px-1.5 py-0.5 rounded border border-[#2FA67A]/30 font-bold">
              MODO SIMULADO ATIVO
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('DRIVER')}
              className="px-2.5 py-2 rounded-xl bg-[#12273F] hover:bg-[#3A76C2]/30 border border-[#3A76C2]/30 hover:border-[#3A76C2] text-left transition-colors flex items-center gap-2 group"
            >
              <span className="text-base">🚗</span>
              <div className="truncate">
                <div className="text-[11px] font-bold text-white group-hover:text-[#5DA9E9]">Motorista</div>
                <div className="text-[9px] text-[#9FB3C8] truncate">CEEP Newton Sucupira</div>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('WORKSHOP_OWNER')}
              className="px-2.5 py-2 rounded-xl bg-[#12273F] hover:bg-[#2FA67A]/30 border border-[#2FA67A]/30 hover:border-[#2FA67A] text-left transition-colors flex items-center gap-2 group"
            >
              <span className="text-base">🔧</span>
              <div className="truncate">
                <div className="text-[11px] font-bold text-white group-hover:text-[#2FA67A]">Oficina</div>
                <div className="text-[9px] text-[#9FB3C8] truncate">Kanban Orçamentos</div>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('ADMIN')}
              className="px-2.5 py-2 rounded-xl bg-[#12273F] hover:bg-[#E09F3E]/30 border border-[#E09F3E]/30 hover:border-[#E09F3E] text-left transition-colors flex items-center gap-2 group"
            >
              <span className="text-base">📝</span>
              <div className="truncate">
                <div className="text-[11px] font-bold text-white group-hover:text-[#E09F3E]">Admin CMS</div>
                <div className="text-[9px] text-[#9FB3C8] truncate">Artigos & Moderação</div>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('SUPER_ADMIN')}
              className="px-2.5 py-2 rounded-xl bg-[#12273F] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-left transition-colors flex items-center gap-2 group"
            >
              <span className="text-base">👑</span>
              <div className="truncate">
                <div className="text-[11px] font-bold text-white group-hover:text-[#D4AF37]">Master</div>
                <div className="text-[9px] text-[#9FB3C8] truncate">Auditoria & Gestão</div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Identifier: CPF or Email for Driver, CNPJ/Email for Workshop, Corporate email for Admin */}
          <div>
            <label className="block text-[#9FB3C8] mb-1 font-semibold">
              {selectedRoleTab === 'DRIVER'
                ? 'CPF ou E-mail do Motorista:'
                : selectedRoleTab === 'WORKSHOP_OWNER'
                ? 'E-mail ou CNPJ da Oficina:'
                : 'E-mail Corporativo:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRoleTab === 'DRIVER'
                    ? 'motorista@carcity.com.br'
                    : selectedRoleTab === 'WORKSHOP_OWNER'
                    ? 'oficina@carcity.com.br'
                    : selectedRoleTab === 'ADMIN'
                    ? 'admin@carcity.com.br'
                    : 'master@carcity.com.br'
                }
                className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3.5 py-2.5 text-white placeholder-[#9FB3C8]/40 focus:outline-none focus:border-[#3A76C2]"
                required
              />
            </div>
          </div>

          {/* Password with View Toggle (Section 5) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#9FB3C8] font-semibold">Senha:</label>
              <button
                type="button"
                onClick={() => setForgotPasswordNotice(true)}
                className="text-[11px] text-[#5DA9E9] hover:underline"
              >
                Esqueceu sua senha?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9FB3C8] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2FA TOTP input for Admin & Super Admin */}
          {(selectedRoleTab === 'ADMIN' || selectedRoleTab === 'SUPER_ADMIN' || require2fa) && (
            <div className="p-3.5 rounded-xl bg-[#0B1A2E] border border-[#D4AF37]/40 space-y-2">
              <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                2FA {selectedRoleTab === 'SUPER_ADMIN' ? 'WebAuthn / TOTP' : 'TOTP'}:
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="Digite o token de 6 dígitos (ex: 123456)"
                className="w-full bg-[#12273F] border border-[#223B57] rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
              <p className="text-[10px] text-[#9FB3C8] text-center">
                Para homologação, utilize o código de teste <strong className="text-white">123456</strong>.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-colors mt-2"
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO CARCITY'}
          </button>
        </form>

        {/* Footer info & Theme Switcher */}
        <div className="pt-2 border-t border-[#223B57] flex items-center justify-between text-xs text-[#9FB3C8]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg bg-[#0B1A2E] border border-[#223B57] hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
            </button>
            <span>Tema: {theme === 'dark' ? 'Escuro (Padrão)' : 'Claro'}</span>
          </div>

          <span className="font-mono text-[10px]">MariaDB 10.11 • JWT HS256</span>
        </div>
      </div>
    </div>
  );
};
