import React from 'react';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface AccessDeniedProps {
  requiredRoles: string[];
}

export const AccessDeniedView: React.FC<AccessDeniedProps> = ({ requiredRoles }) => {
  const { user, activeRole, logout, setActiveTab } = useApp();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30 flex items-center justify-center mb-4 shadow-xl">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Acesso Restrito: Permissão Insuficiente
      </h2>

      <p className="text-xs text-[#9FB3C8] max-w-md leading-relaxed mb-4">
        Seu perfil atual de <strong>{activeRole}</strong> não possui autorização no servidor MariaDB para acessar este módulo. Esta rota exige papel [
        <strong>{requiredRoles.join(', ')}</strong>].
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab(activeRole === 'DRIVER' ? 'dashboard' : 'workshop')}
          className="px-4 py-2.5 rounded-xl bg-[#0B1A2E] hover:bg-[#12273F] text-white border border-[#223B57] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retornar à Minha Área
        </button>

        <button
          onClick={logout}
          className="px-4 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#B42318] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
        >
          <LogOut className="w-4 h-4" />
          Trocar Credenciais
        </button>
      </div>
    </div>
  );
};
