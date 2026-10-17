import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  UploadCloud,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  X,
  Plus,
} from 'lucide-react';
import { Workshop, WorkshopDoc, WorkshopDocKind } from '../../types/index.ts';

interface WorkshopAntiFraudProps {
  workshop: Workshop;
  onAddDocument: (doc: Omit<WorkshopDoc, 'id' | 'uploaded_at'>) => void;
}

export const WorkshopAntiFraud: React.FC<WorkshopAntiFraudProps> = ({
  workshop,
  onAddDocument,
}) => {
  const [selectedDocToView, setSelectedDocToView] = useState<WorkshopDoc | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedKind, setSelectedKind] = useState<WorkshopDocKind>('ALVARA');
  const [fileName, setFileName] = useState('');
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  const documents = workshop.documents || [];

  const getDocKindLabel = (kind: WorkshopDocKind) => {
    switch (kind) {
      case 'ALVARA':
        return 'Alvará de Funcionamento';
      case 'RT_CFT_CREA':
        return 'Responsável Técnico (CFT/CREA)';
      case 'FOTO_FACHADA':
        return 'Foto da Fachada Principal';
      case 'FOTO_INSTALACOES':
        return 'Foto dos Elevadores e Box EV';
      case 'CERTIFICADO_TECNICO':
        return 'Certificado Técnico Homologado';
      default:
        return 'Documento Técnico';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fileName.trim() || `doc_${selectedKind.toLowerCase()}_2026.pdf`;

    onAddDocument({
      workshop_id: workshop.id,
      kind: selectedKind,
      file_name: finalName,
      file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      status: 'VALIDATED',
    });

    setIsUploadModalOpen(false);
    setFileName('');
    setUploadToast(`Documento "${finalName}" enviado e homologado com sucesso!`);
    setTimeout(() => setUploadToast(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {uploadToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Documento Homologado</div>
            <div className="text-[#9FB3C8]">{uploadToast}</div>
          </div>
        </div>
      )}

      {/* 1. Banner de Status do Selo Anti-Fraude (BLOCO 2.5) */}
      <div className="p-6 rounded-2xl bg-[#2FA67A]/15 border-2 border-[#2FA67A] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-[#2FA67A] text-white shadow-lg shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#2FA67A] text-white tracking-wider">
                  STATUS OFICIAL
                </span>
                <span className="text-xs font-mono font-bold text-[#2FA67A]">
                  AUDITORIA REGULAR 2026/2027
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                Selo Anti-Fraude VERIFICADO & ATIVO
              </h2>
              <p className="text-xs text-[#E1F2E8] mt-1 max-w-2xl leading-relaxed">
                {workshop.review_feedback ||
                  'Documentação vistoriada pelo departamento técnico. Alvará de funcionamento e registro CREA/CFT regulares.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#258763] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            Submeter Nova Certidão
          </button>
        </div>
      </div>

      {/* 2. Tabela de Documentos Técnicos Enviados */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#223B57] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#2FA67A]" />
              Dossiê Documental da Oficina Homologada
            </h3>
            <p className="text-xs text-[#9FB3C8]">
              Registros técnicos apresentados à CarCity para comprovação de idoneidade, engenharia e conformidade fiscal.
            </p>
          </div>
          <span className="text-xs text-[#9FB3C8] font-mono">
            {documents.length} itens registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#223B57] text-[10px] font-bold text-[#9FB3C8] uppercase tracking-wider">
                <th className="py-3 px-4">Tipo de Documento</th>
                <th className="py-3 px-4">Nome do Arquivo</th>
                <th className="py-3 px-4">Data de Envio</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#223B57]/60">
              {documents.map((doc) => {
                const label = getDocKindLabel(doc.kind);
                const isApproved = doc.status === 'VALIDATED';
                const formattedDate = new Date(doc.uploaded_at).toLocaleDateString('pt-BR');

                return (
                  <tr key={doc.id} className="hover:bg-[#0B1A2E]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#5DA9E9] shrink-0" />
                      <span>{label}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#9FB3C8]">
                      {doc.file_name || `${doc.kind.toLowerCase()}.pdf`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#9FB3C8]">
                      {formattedDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isApproved ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> APROVADO
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/40 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> EM ANÁLISE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDocToView(doc)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1A2E] hover:bg-[#1a3454] border border-[#223B57] text-[#5DA9E9] hover:text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Área Drag-and-Drop de Upload Rápido */}
      <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[#3A76C2]" />
            Upload Rápido de Certidões e Renovações Anuais
          </h4>
          <p className="text-xs text-[#9FB3C8]">
            Envie arquivos em formato PDF, JPG ou PNG para atualização imediata do cadastro junto ao departamento técnico.
          </p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => setIsUploadModalOpen(true)}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#2FA67A] bg-[#2FA67A]/10'
              : 'border-[#223B57] bg-[#0B1A2E]/50 hover:border-[#3A76C2] hover:bg-[#0B1A2E]'
          }`}
        >
          <UploadCloud className="w-10 h-10 mx-auto text-[#5DA9E9] mb-2 opacity-80" />
          <p className="text-xs font-bold text-white">
            Arraste e solte seus documentos aqui ou clique para selecionar
          </p>
          <p className="text-[10px] text-[#9FB3C8] mt-1">
            Formatos aceitos: PDF, JPG, PNG (tamanho máximo: 15MB) • Conexão criptografada TLS 1.3
          </p>
        </div>
      </div>

      {/* Modal: Submissão de Documento */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#223B57] pb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#2FA67A]" />
                <h3 className="text-base font-bold text-white">Enviar Novo Documento Técnico</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={selectedKind}
                  onChange={(e) => setSelectedKind(e.target.value as WorkshopDocKind)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#2FA67A]"
                >
                  <option value="ALVARA">Alvará de Funcionamento</option>
                  <option value="RT_CFT_CREA">Responsável Técnico (CFT/CREA)</option>
                  <option value="FOTO_FACHADA">Foto da Fachada Principal</option>
                  <option value="FOTO_INSTALACOES">Foto dos Elevadores e Box EV</option>
                  <option value="CERTIFICADO_TECNICO">Certificado Técnico Homologado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#9FB3C8] uppercase block mb-1">
                  Nome do Arquivo / Certidão
                </label>
                <input
                  type="text"
                  placeholder="Ex: certidao_cft_2026.pdf ou alvara_sp.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs focus:outline-hidden focus:border-[#2FA67A]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[11px] text-[#9FB3C8]">
                <span className="font-bold text-white block mb-0.5">Auditoria Instantânea B2B:</span>
                O documento será vinculado ao CNPJ <strong className="text-white">{workshop.cnpj}</strong> e liberado para auditoria da CarCity.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-[#9FB3C8] hover:text-white text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#258763] text-white text-xs font-bold shadow-md"
                >
                  Homologar Arquivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Documento */}
      {selectedDocToView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#223B57] pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#2FA67A]" />
                  {getDocKindLabel(selectedDocToView.kind)}
                </h4>
                <span className="text-[10px] font-mono text-[#9FB3C8]">
                  Arquivo: {selectedDocToView.file_name || `${selectedDocToView.kind.toLowerCase()}.pdf`}
                </span>
              </div>
              <button
                onClick={() => setSelectedDocToView(null)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#0B1A2E] p-4 border border-[#223B57] text-center space-y-3">
              <div className="p-3 rounded-lg bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30 text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Certidão Autenticada • Hash SHA-256 Validado no Portal de Auditoria
              </div>

              <div className="max-h-60 overflow-hidden rounded-lg border border-[#223B57]">
                <img
                  src={selectedDocToView.file_url}
                  alt={selectedDocToView.kind}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-left font-mono text-[11px] text-[#9FB3C8] space-y-1">
                <div>Oficina Vinculada: <strong className="text-white">{workshop.nome_fantasia}</strong></div>
                <div>CNPJ: <strong className="text-white">{workshop.cnpj}</strong></div>
                <div>Data de Emissão no Sistema: <strong className="text-white">{new Date(selectedDocToView.uploaded_at).toLocaleString('pt-BR')}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDocToView(null)}
                className="px-4 py-2 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs font-semibold"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
