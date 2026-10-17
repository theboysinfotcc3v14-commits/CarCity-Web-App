import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  AlertOctagon,
  PhoneCall,
  Loader2,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC = () => {
  const { isAiModalOpen, setIsAiModalOpen, user, rawToken, activeRole } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o Assistente Virtual VIP CarCity. Como posso ajudar com diagnósticos mecânicos, dicas de telemetria ou recomendações da nossa rede de oficinas credenciadas?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Intelligent in-memory fallback for Demo Mode or offline resilience
  const getDemoRoleFallback = (query: string, role: string): string => {
    const q = query.toLowerCase();

    // 1. Fallback para Oficina Credenciada (WORKSHOP_OWNER)
    if (role === 'WORKSHOP_OWNER') {
      if (
        q.includes('torque') ||
        q.includes('cárter') ||
        q.includes('carter') ||
        q.includes('óleo') ||
        q.includes('oleo') ||
        q.includes('corolla')
      ) {
        return `🔧 **Especificação Técnica de Oficina (AutoTech / CarCity):**\n\n• **Toyota Corolla Cross Hybrid (1.8 Flex + HSD):**\n  - Óleo de motor: **API SP / ILSAC GF-6A SAE 0W-20 (100% Sintético)** (4,2 L com filtro).\n  - Torque do bujão do cárter: **38 Nm** (substituir arruela de vedação de alumínio).\n  - Torque do filtro de óleo: **18 Nm**.\n  - Calibragem TPMS padrão: **32 PSI (diant.) e 33 PSI (tras.)**.\n\n• **Selo Anti-Fraude:** Registre a Nota Fiscal e o lote do lubrificante na ordem de serviço para homologação do carimbo digital.`;
      }
      if (
        q.includes('selo') ||
        q.includes('fraude') ||
        q.includes('alvara') ||
        q.includes('alvará') ||
        q.includes('cft') ||
        q.includes('crea')
      ) {
        return `🛡️ **Homologação e Selo Anti-Fraude CarCity:**\n\n• Para manter o status **VERIFICADO & ATIVO**, certifique-se de que o Alvará de Funcionamento e a certidão do Responsável Técnico (CFT/CREA) estejam vigentes na aba de Selo Anti-Fraude.\n• Ordens de serviço concluídas com laudo técnico e peças homologadas conferem garantia digital imediata ao motorista credenciado.`;
      }
      if (
        q.includes('byd') ||
        q.includes('dolphin') ||
        q.includes('eletrico') ||
        q.includes('elétrico') ||
        q.includes('ev') ||
        q.includes('bateria')
      ) {
        return `⚡ **Diretriz de Manutenção EV (BYD Dolphin / Híbridos):**\n\n• **Fluido de Bateria/Inversor:** Líquido refrigerante OAT específico para EV com baixa condutividade elétrica (< 100 μS/cm).\n• **Bateria 12V Auxiliar:** 12.8V nominal, ciclo AGM/LFP. Corrente máxima de recarga: 14.4V.\n• **Torque de Rodas:** 120 Nm em padrão cruzado.`;
      }
      return `🔧 **Suporte Técnico B2B CarCity:**\n\n• Como oficina credenciada, você tem acesso às fichas de torque de fábrica, especificações de fluidos OEM e validação do Selo Anti-Fraude.\n• As propostas comerciais aos motoristas dos Planos Standard (10% OFF) e Advanced (20% OFF) contam com cálculo automático de benefícios.\n• Em caso de dúvidas sobre códigos de erro OBD-II ou calibração de sensores CAN, informe o modelo e ano do veículo.`;
    }

    // 2. Fallback para Motorista (DRIVER)
    if (
      q.includes('emergencia') ||
      q.includes('emergência') ||
      q.includes('socorro') ||
      q.includes('perigo') ||
      q.includes('roubo') ||
      q.includes('furto') ||
      q.includes('panico') ||
      q.includes('pânico')
    ) {
      return `🚨 **ALERTA DE EMERGÊNCIA CARCITY:**\n\nSe você estiver em situação de perigo iminente, acione imediatamente as autoridades competentes:\n\n• 🚔 **Polícia Militar:** Ligue **190**\n• 🚑 **SAMU (Resgate Médico):** Ligue **192**\n• 🚒 **Bombeiros:** Ligue **193**\n\nEm caso de suspeita de furto ou assalto, utilize os botões de **Corte de Motor** e **Modo Pânico 5KM** no painel de comando do aplicativo para imobilizar o veículo com segurança.`;
    }
    if (
      q.includes('pneu') ||
      q.includes('pressao') ||
      q.includes('pressão') ||
      q.includes('tpms') ||
      q.includes('psi') ||
      q.includes('calibrar')
    ) {
      return `🚗 **Monitoramento de Pressão dos Pneus (TPMS):**\n\n• A pressão nominal recomendada para o seu veículo é de **32 a 34 PSI** a frio.\n• **Alerta de Destalonamento:** O sistema CarCity emite alerta crítico se a leitura cair abaixo de **26,5 PSI**.\n• Para calibrar ou verificar microvazamentos, visite uma de nossas oficinas credenciadas com o **Selo Anti-Fraude Verified** (clientes do Plano Advanced têm 20% de desconto no serviço).`;
    }
    if (
      q.includes('oleo') ||
      q.includes('óleo') ||
      q.includes('revisao') ||
      q.includes('revisão') ||
      q.includes('motor')
    ) {
      return `🛢️ **Telemetria de Troca de Óleo e Revisão:**\n\n• Seu painel CarCity calcula a degradação do óleo com base na quilometragem real percorrida e horas de trânsito.\n• Quando a quilometragem para a próxima revisão for inferior a **1.500 km**, o aplicativo emitirá um alerta preventivo.\n• Recomendamos utilizar exclusivamente a viscosidade homologada no manual (ex: **0W-20 Sintético**) para manter a garantia e a eficiência do motor.`;
    }

    return `✨ **Assistente Virtual VIP CarCity:**\n\n• Monitoramento contínuo de telemetria IoT ativo (sensores CAN/OBD-II, TPMS, bateria de partida e pastilhas de freio).\n• Em caso de falha mecânica, você pode agendar atendimento direto em uma oficina credenciada da rede com até 20% de desconto.\n• Se precisar de apoio imediato em pista ou emergência, utilize os botões de discagem rápida (190 Polícia, 192 SAMU) ou ative o Modo Pânico pelo app.`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Retrieve active JWT token from state or localStorage
    const storedJwt = typeof window !== 'undefined' ? localStorage.getItem('carcity_jwt') : null;
    const authToken = rawToken || storedJwt || '';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages,
          role: activeRole,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      // Tratamento de Erro e Fallback de Demonstração (Demo Mode):
      // Se a rota retornar 401 ou erro de autenticação, previne a mensagem crua e ativa o fallback inteligente
      let reply = data.reply;
      if (!res.ok || !reply || (data.error && data.error.includes('Não autenticado'))) {
        reply = getDemoRoleFallback(userMsg.content, activeRole);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // Fallback inteligente em memória em caso de falha de conexão
      const fallbackReply = getDemoRoleFallback(userMsg.content, activeRole);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-[#3A76C2] to-[#1F4E8C] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-[#5DA9E9]/40 group"
        title="Abrir Suporte IA 24h CarCity"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-[#D4AF37]" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">Suporte IA 24h</span>
      </button>

      {/* Chat Window Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-lg sm:rounded-2xl shadow-2xl h-[90vh] sm:h-[620px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#0B1A2E] border-b border-[#223B57] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3A76C2] to-[#5DA9E9] flex items-center justify-center text-white shadow">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    Assistente Virtual VIP CarCity
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#2FA67A]/20 text-[#2FA67A] rounded font-semibold">
                      Gemini 3.8 Flash
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#9FB3C8]">
                    Dúvidas mecânicas, alertas e suporte 24h
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#223B57] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Emergency Hotbar (Section D7) */}
            <div className="bg-[#E5484D]/10 border-b border-[#E5484D]/25 px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-[#E5484D] font-bold flex items-center gap-1 text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5" />
                Emergências Imediatas:
              </span>
              <div className="flex gap-2 font-mono text-[11px]">
                <a
                  href="tel:190"
                  className="px-2 py-0.5 rounded bg-[#E5484D] text-white font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <PhoneCall className="w-2.5 h-2.5" /> 190 Polícia
                </a>
                <a
                  href="tel:192"
                  className="px-2 py-0.5 rounded bg-[#0B1A2E] text-white hover:bg-[#223B57]"
                >
                  192 SAMU
                </a>
                <a
                  href="tel:193"
                  className="px-2 py-0.5 rounded bg-[#0B1A2E] text-white hover:bg-[#223B57]"
                >
                  193 Bombeiros
                </a>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[#3A76C2]/20 text-[#5DA9E9] flex items-center justify-center shrink-0 mt-0.5 border border-[#3A76C2]/30">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#3A76C2] text-white rounded-tr-none'
                        : 'bg-[#0B1A2E] text-[#F1F5F9] border border-[#223B57] rounded-tl-none'
                    }`}
                  >
                    <p>{m.content}</p>
                    <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[#223B57] text-[#9FB3C8] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 items-center text-[#9FB3C8]">
                  <div className="w-7 h-7 rounded-lg bg-[#3A76C2]/20 text-[#5DA9E9] flex items-center justify-center shrink-0 border border-[#3A76C2]/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0B1A2E] border border-[#223B57] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3A76C2]" />
                    <span>Consultando telemetria e manuais veiculares...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#0B1A2E] border-t border-[#223B57] flex gap-2 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Pneu está em 25 PSI, posso rodar? Ou agendar revisão..."
                className="flex-1 bg-[#12273F] border border-[#223B57] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9FB3C8]/60 focus:outline-none focus:border-[#3A76C2]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
