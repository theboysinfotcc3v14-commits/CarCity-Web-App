import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  Tag,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Article } from '../../types/index.ts';

interface WorkshopNewsHubProps {
  articles: Article[];
}

export const WorkshopNewsHub: React.FC<WorkshopNewsHubProps> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownloadAttachment = (article: Article) => {
    // Generate text/pdf attachment
    const content = `CARCITY WEB - COMUNICADO TÉCNICO OFICIAL B2B\r\n\r\n` +
      `Título: ${article.title}\r\n` +
      `Categoria: ${article.category}\r\n` +
      `Autor: ${article.author_name}\r\n` +
      `Data de Emissão: ${new Date(article.created_at).toLocaleDateString('pt-BR')}\r\n\r\n` +
      `--------------------------------------------------\r\n` +
      `${article.content}\r\n` +
      `--------------------------------------------------\r\n` +
      `Homologado pelo Conselho de Engenharia Automotiva CarCity.\r\n` +
      `Hash de Autenticidade: ${Math.random().toString(36).substring(2, 15).toUpperCase()}\r\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comunicado_${article.slug || 'carcity'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(`Anexo técnico "${article.title.substring(0, 30)}..." baixado com sucesso!`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {downloadToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Download Concluído</div>
            <div className="text-[#9FB3C8]">{downloadToast}</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                Portal CMS Master
              </span>
              <span className="text-xs text-[#9FB3C8]">Canal Direto da Diretoria Técnica</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Comunicados Técnicos & Mercado Automotivo (B2B)
            </h2>
            <p className="text-xs text-[#9FB3C8] mt-1 max-w-2xl">
              Diretrizes de engenharia, normas para diagnósticos preditivos de baterias e regulamentos do Selo Anti-Fraude.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-xs font-mono text-[#2FA67A] shrink-0">
            ✓ Atualizações semanais sincronizadas
          </div>
        </div>
      </div>

      {/* Grid de Artigos em Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => {
          const isEvArticle = article.category === 'MANUTENCAO';

          return (
            <div
              key={article.id}
              className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] hover:border-[#3A76C2] transition-all shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      isEvArticle
                        ? 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/40'
                        : 'bg-[#E09F3E]/20 text-[#E09F3E] border-[#E09F3E]/40'
                    }`}
                  >
                    {isEvArticle ? <Zap className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {article.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#9FB3C8] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(article.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-[#5DA9E9] transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs text-[#9FB3C8] line-clamp-3 leading-relaxed">
                  {article.content.replace(/#+\s+/g, '').substring(0, 180)}...
                </p>
              </div>

              <div className="pt-4 border-t border-[#223B57] flex items-center justify-between">
                <div className="text-[11px] text-[#9FB3C8] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#5DA9E9]" />
                  <span>{article.author_name || 'Equipe CMS'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadAttachment(article)}
                    className="p-2 rounded-xl bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#9FB3C8] hover:text-white transition-colors"
                    title="Baixar Anexo Técnico"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Ler Artigo Completo
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Leitor de Artigo Completo */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#223B57] pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                  {selectedArticle.category} • {new Date(selectedArticle.created_at).toLocaleDateString('pt-BR')}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedArticle.title}
                </h3>
                <span className="text-xs text-[#9FB3C8] block">
                  Publicado por: <strong className="text-white">{selectedArticle.author_name}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-[#E2E8F0] space-y-3 leading-relaxed whitespace-pre-line font-sans">
              {selectedArticle.content}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#223B57]">
              <button
                onClick={() => handleDownloadAttachment(selectedArticle)}
                className="px-4 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#5DA9E9] text-xs font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Anexo Técnico em Arquivo
              </button>

              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl bg-[#3A76C2] hover:bg-[#2c5da0] text-white text-xs font-bold shadow-md"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
