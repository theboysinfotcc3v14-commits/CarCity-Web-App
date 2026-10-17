import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  ShieldAlert,
  BarChart3,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  Video,
  Play,
  ExternalLink,
  Sparkles,
  Check,
  AlertTriangle,
  User,
  Tag,
  Clock,
  Radio,
  ArrowUpRight,
  MessageSquare,
  AlertOctagon,
  X,
  Share2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Article,
  ArticleAudience,
  ArticleCategory,
  ArticleStatus,
  ContentReport,
  DiyVideo,
} from '../../types/index.ts';
import { MOCK_CMS_CATEGORY_VIEWS_30D } from '../../lib/telemetry.ts';

export const CmsAdminView: React.FC = () => {
  const {
    activeTab,
    articlesList,
    reportedContentList,
    diyVideosList,
    searchKeywordsAnalytics,
    forumMetrics,
    addArticle,
    updateArticle,
    deleteArticle,
    resolveReport,
    addDiyVideo,
    toggleDiyVideo,
    deleteDiyVideo,
  } = useApp();

  const [subTab, setSubTab] = useState<'articles' | 'moderation' | 'diy' | 'analytics'>('articles');

  // C1: Articles filter & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL');

  // C1: Create / Edit Article Modal
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [articleSummary, setArticleSummary] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState<ArticleCategory>('ECONOMIA_LEIS');
  const [targetDriver, setTargetDriver] = useState(true);
  const [targetWorkshop, setTargetWorkshop] = useState(true);
  const [articleStatus, setArticleStatus] = useState<ArticleStatus>('PUBLISHED');
  const [articleCoverUrl, setArticleCoverUrl] = useState('');
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // C2: Moderation feedback toast
  const [moderationToast, setModerationToast] = useState<string | null>(null);

  // C3: DIY Video Creation Modal / Form
  const [isDiyModalOpen, setIsDiyModalOpen] = useState(false);
  const [diyTitle, setDiyTitle] = useState('');
  const [diyDescription, setDiyDescription] = useState('');
  const [diyYoutubeUrl, setDiyYoutubeUrl] = useState('');
  const [diyCategory, setDiyCategory] = useState<'Manutenção Básica' | 'Eletrônica & Telemetria' | 'Cuidados EV/Híbridos' | 'Pneus & Calibragem'>('Pneus & Calibragem');
  const [playingVideo, setPlayingVideo] = useState<DiyVideo | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (activeTab === 'cms_moderation') setSubTab('moderation');
    else if (activeTab === 'cms_analytics') setSubTab('analytics');
    else if (activeTab === 'cms_diy') setSubTab('diy');
    else setSubTab('articles');
  }, [activeTab]);

  // Auto-generate slug when title changes in new mode
  const handleTitleChange = (val: string) => {
    setArticleTitle(val);
    if (!editingArticleId) {
      const autoSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setArticleSlug(autoSlug);
    }
  };

  // Helper to extract YouTube ID for preview
  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) return match[1];
    if (url.trim().length === 11) return url.trim();
    return null;
  };

  const currentDiyYoutubeId = extractYoutubeId(diyYoutubeUrl);

  const handleOpenCreateArticle = () => {
    setEditingArticleId(null);
    setArticleTitle('');
    setArticleSlug('');
    setArticleSummary('');
    setArticleContent('');
    setArticleCategory('ECONOMIA_LEIS');
    setTargetDriver(true);
    setTargetWorkshop(true);
    setArticleStatus('PUBLISHED');
    setArticleCoverUrl('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80');
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArticleTitle(art.title);
    setArticleSlug(art.slug);
    setArticleSummary(art.summary || '');
    setArticleContent(art.content);
    setArticleCategory(art.category);
    const hasDriver = !art.target_audience || art.target_audience.includes('DRIVER') || art.audience === 'ALL' || art.audience === 'DRIVER';
    const hasWorkshop = !art.target_audience || art.target_audience.includes('WORKSHOP_OWNER') || art.audience === 'ALL' || art.audience === 'WORKSHOP_OWNER';
    setTargetDriver(hasDriver);
    setTargetWorkshop(hasWorkshop);
    setArticleStatus(art.status);
    setArticleCoverUrl(art.cover_image_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80');
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleContent.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }

    const target_audience: ('DRIVER' | 'WORKSHOP_OWNER')[] = [];
    if (targetDriver) target_audience.push('DRIVER');
    if (targetWorkshop) target_audience.push('WORKSHOP_OWNER');
    if (target_audience.length === 0) target_audience.push('DRIVER');

    const audience: ArticleAudience =
      target_audience.length === 2 ? 'ALL' : (target_audience[0] as ArticleAudience);

    const articlePayload = {
      author_user_id: 'usr-admin-001',
      author_name: 'Roberto Dias (Admin CMS)',
      title: articleTitle.trim(),
      slug: articleSlug.trim() || `artigo-${Date.now()}`,
      summary: articleSummary.trim() || articleContent.slice(0, 160) + '...',
      content: articleContent.trim(),
      category: articleCategory,
      status: articleStatus,
      audience,
      target_audience,
      cover_image_url: articleCoverUrl.trim(),
    };

    if (editingArticleId) {
      updateArticle(editingArticleId, articlePayload);
      showToast(`Artigo "${articleTitle.slice(0, 30)}..." atualizado e transmitido com sucesso!`);
    } else {
      addArticle(articlePayload);
      showToast(`Novo artigo "${articleTitle.slice(0, 30)}..." publicado e transmitido aos feeds!`);
    }

    // Tenta persistir no servidor em segundo plano
    try {
      const url = editingArticleId ? `/api/articles/${editingArticleId}` : '/api/articles';
      const method = editingArticleId ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articlePayload),
      });
    } catch {}

    setIsArticleModalOpen(false);
  };

  const handleConfirmDeleteArticle = async () => {
    if (!deletingArticle) return;
    deleteArticle(deletingArticle.id);
    showToast(`Artigo "${deletingArticle.title.slice(0, 30)}..." movido para a Lixeira Central (Soft Delete).`);

    try {
      await fetch(`/api/articles/${deletingArticle.id}`, { method: 'DELETE' });
    } catch {}

    setDeletingArticle(null);
  };

  const handleResolveModeration = async (reportId: string, action: 'KEPT' | 'HIDDEN' | 'DELETED' | 'BAN_USER') => {
    resolveReport(reportId, action);
    const actionLabel =
      action === 'KEPT'
        ? 'Publicação mantida no fórum'
        : action === 'HIDDEN'
        ? 'Conteúdo ocultado preventivamente'
        : action === 'DELETED'
        ? 'Comentário excluído logicamente (soft delete)'
        : 'Usuário banido e comentário excluído';

    showToast(`Moderação concluída: ${actionLabel}. Registro salvo em audit_logs.`);

    try {
      await fetch(`/api/admin/moderation/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch {}
  };

  const handleSaveDiyVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diyTitle.trim() || !diyYoutubeUrl.trim()) {
      alert('Título e URL do YouTube são obrigatórios.');
      return;
    }

    const yId = extractYoutubeId(diyYoutubeUrl) || 'dQw4w9WgXcQ';

    const newVideo = {
      title: diyTitle.trim(),
      description: diyDescription.trim(),
      youtube_url: diyYoutubeUrl.trim(),
      youtube_id: yId,
      category: diyCategory,
      is_active: true,
    };

    addDiyVideo(newVideo);
    showToast(`Tutorial "${diyTitle.slice(0, 30)}..." publicado no Hub DIY!`);

    try {
      await fetch('/api/admin/diy-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo),
      });
    } catch {}

    setIsDiyModalOpen(false);
    setDiyTitle('');
    setDiyDescription('');
    setDiyYoutubeUrl('');
  };

  const handleToggleDiy = async (id: string) => {
    toggleDiyVideo(id);
    showToast('Status do vídeo no Hub DIY atualizado.');
    try {
      await fetch(`/api/admin/diy-videos/${id}/toggle`, { method: 'PATCH' });
    } catch {}
  };

  const handleDeleteDiy = async (id: string) => {
    deleteDiyVideo(id);
    showToast('Vídeo removido da curadoria DIY.');
    try {
      await fetch(`/api/admin/diy-videos/${id}`, { method: 'DELETE' });
    } catch {}
  };

  // Filtered articles
  const filteredArticles = articlesList.filter((art) => {
    if (selectedCategory !== 'ALL' && art.category !== selectedCategory) return false;
    if (selectedAudience !== 'ALL') {
      if (selectedAudience === 'DRIVER' && !art.target_audience?.includes('DRIVER') && art.audience !== 'ALL' && art.audience !== 'DRIVER') return false;
      if (selectedAudience === 'WORKSHOP_OWNER' && !art.target_audience?.includes('WORKSHOP_OWNER') && art.audience !== 'ALL' && art.audience !== 'WORKSHOP_OWNER') return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        art.title.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.slug.toLowerCase().includes(q) ||
        (art.summary && art.summary.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const categoryBadge = (cat: ArticleCategory) => {
    switch (cat) {
      case 'ECONOMIA_LEIS':
        return { label: 'Economia & Leis', bg: 'bg-[#3A76C2]/20 text-[#5DA9E9] border-[#3A76C2]/30' };
      case 'SEGURANCA':
        return { label: 'Segurança & Pânico', bg: 'bg-[#E5484D]/20 text-[#E5484D] border-[#E5484D]/30' };
      case 'MANUTENCAO':
        return { label: 'Manutenção & IoT', bg: 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/30' };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-6xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0B1A2E] border-2 border-[#2FA67A] text-white shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#2FA67A] shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">Ação Realizada</div>
            <div className="text-[#9FB3C8]">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Top Header & Subtabs */}
      <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#3A76C2]/20 border border-[#3A76C2]/40 text-[#5DA9E9] text-[11px] font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Portal Administrativo CMS
            </span>
            <span className="text-xs text-[#9FB3C8] font-mono">CarCity Web v2.5</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Central de Notícias & Comunicações Oficiais CarCity
          </h2>
          <p className="text-xs text-[#9FB3C8]">
            Gestão editorial corporativa, moderação da comunidade, hub DIY e analytics de engajamento da rede.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setSubTab('articles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'articles'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notícias & Feed (C1)
          </button>
          <button
            onClick={() => setSubTab('moderation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'moderation'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Moderação (C2)
            {forumMetrics.openReports > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#E5484D] text-white text-[10px] font-extrabold">
                {forumMetrics.openReports}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('diy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'diy'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Hub Vídeos DIY (C3)
          </button>
          <button
            onClick={() => setSubTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'analytics'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics (C4)
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BLOCO 3.1: C1 — Editor & Gestor de Notícias do Portal CMS */}
      {/* ============================================================== */}
      {subTab === 'articles' && (
        <div className="space-y-6">
          {/* Top Control Bar with Filters & Action */}
          <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9FB3C8]" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, resumo ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#9FB3C8]/50 focus:outline-none focus:border-[#3A76C2]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
              >
                <option value="ALL">Todas as Categorias</option>
                <option value="ECONOMIA_LEIS">Economia & Leis</option>
                <option value="SEGURANCA">Segurança & Pânico</option>
                <option value="MANUTENCAO">Manutenção & IoT</option>
              </select>

              {/* Audience Filter */}
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
              >
                <option value="ALL">Todos os Públicos</option>
                <option value="DRIVER">Motoristas (DRIVER)</option>
                <option value="WORKSHOP_OWNER">Oficinas (WORKSHOP)</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreateArticle}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2FA67A] to-[#1F7A56] hover:from-[#258763] hover:to-[#176646] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Artigo</span>
            </button>
          </div>

          {/* Tabela de Artigos Cadastrados */}
          <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#223B57]/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#5DA9E9]" />
                Artigos Cadastrados no Portal ({filteredArticles.length})
              </h3>
              <span className="text-[11px] text-[#9FB3C8] font-mono">
                Transmissão Automática para App do Motorista e Portal B2B
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F1F5F9]">
                <thead className="bg-[#0B1A2E] text-[#9FB3C8] uppercase font-mono text-[10px] border-b border-[#223B57]">
                  <tr>
                    <th className="py-3 px-4">Título & Slug</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Público Alvo</th>
                    <th className="py-3 px-4">Visualizações</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223B57]">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#9FB3C8]">
                        Nenhum artigo encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => {
                      const badge = categoryBadge(art.category);
                      const isAllAudience =
                        art.audience === 'ALL' ||
                        (Array.isArray(art.target_audience) && art.target_audience.length === 2);
                      const isWorkshopOnly =
                        art.audience === 'WORKSHOP_OWNER' ||
                        (Array.isArray(art.target_audience) &&
                          art.target_audience.length === 1 &&
                          art.target_audience[0] === 'WORKSHOP_OWNER');

                      return (
                        <tr key={art.id} className="hover:bg-[#0B1A2E]/50 transition-colors group">
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-bold text-white group-hover:text-[#5DA9E9] transition-colors line-clamp-1">
                              {art.title}
                            </div>
                            <div className="text-[10px] font-mono text-[#9FB3C8] truncate">
                              /{art.slug}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isAllAudience ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/30">
                                Todos (Motoristas + Oficinas)
                              </span>
                            ) : isWorkshopOnly ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30">
                                Oficinas Credenciadas
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/30">
                                Motoristas
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {art.views_count.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-4 text-[#9FB3C8] font-mono">
                            {new Date(art.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                art.status === 'PUBLISHED'
                                  ? 'bg-[#2FA67A]/20 text-[#2FA67A]'
                                  : 'bg-[#E09F3E]/20 text-[#E09F3E]'
                              }`}
                            >
                              {art.status === 'PUBLISHED' ? 'PUBLICADO' : 'RASCUNHO'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewArticle(art)}
                                className="p-1.5 rounded-lg bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] transition-colors"
                                title="Pré-visualizar Card"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditArticle(art)}
                                className="p-1.5 rounded-lg bg-[#0B1A2E] text-[#5DA9E9] hover:bg-[#3A76C2]/20 border border-[#223B57] transition-colors"
                                title="Editar Artigo"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingArticle(art)}
                                className="p-1.5 rounded-lg bg-[#0B1A2E] text-[#E5484D] hover:bg-[#E5484D]/20 border border-[#E5484D]/40 transition-colors"
                                title="Excluir Artigo (Soft Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BLOCO 3.2: C2 — Central de Moderação da Comunidade */}
      {/* ============================================================== */}
      {subTab === 'moderation' && (
        <div className="space-y-6">
          {/* Cards de Resumo do Fórum (KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A76C2]/20 border border-[#3A76C2]/30 flex items-center justify-center text-[#5DA9E9]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-[#9FB3C8] font-medium">Total de Tópicos</div>
                <div className="text-xl font-bold text-white font-mono">
                  {forumMetrics.totalTopics.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E09F3E]/20 border border-[#E09F3E]/30 flex items-center justify-center text-[#E09F3E]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-[#9FB3C8] font-medium">Pendentes de Análise</div>
                <div className="text-xl font-bold text-white font-mono">
                  {forumMetrics.pendingAnalysis}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8E44AD]/20 border border-[#8E44AD]/30 flex items-center justify-center text-[#C39BD3]">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-[#9FB3C8] font-medium">Conteúdos Ocultos</div>
                <div className="text-xl font-bold text-white font-mono">
                  {forumMetrics.hiddenContent}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E5484D]/20 border border-[#E5484D]/30 flex items-center justify-center text-[#E5484D]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-[#9FB3C8] font-medium">Denúncias Abertas</div>
                <div className="text-xl font-bold text-white font-mono">
                  {reportedContentList.filter((r) => r.status === 'OPEN').length}
                </div>
              </div>
            </div>
          </div>

          {/* Fila de Conteúdo Denunciado (Tabela Interativa) */}
          <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#223B57]/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
                Fila de Conteúdo Denunciado ({reportedContentList.length} itens)
              </h3>
              <span className="text-[11px] text-[#9FB3C8] font-mono">
                Exclusão Lógica com Rastreabilidade em audit_logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F1F5F9]">
                <thead className="bg-[#0B1A2E] text-[#9FB3C8] uppercase font-mono text-[10px] border-b border-[#223B57]">
                  <tr>
                    <th className="py-3 px-4">Autor</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Conteúdo / Título</th>
                    <th className="py-3 px-4">Motivo da Denúncia</th>
                    <th className="py-3 px-4">Denúncias</th>
                    <th className="py-3 px-4 text-right">Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223B57]">
                  {reportedContentList.map((rep) => {
                    const isClosed = rep.status !== 'OPEN';

                    return (
                      <tr
                        key={rep.id}
                        className={`transition-colors ${
                          isClosed ? 'opacity-60 bg-[#0B1A2E]/30' : 'hover:bg-[#0B1A2E]/50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#3A76C2]/20 flex items-center justify-center text-[10px] text-[#5DA9E9] font-mono">
                              {rep.author_name ? rep.author_name.slice(0, 2).toUpperCase() : 'UA'}
                            </div>
                            <span>{rep.author_name || 'Usuário Anônimo'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              rep.target_type === 'POST'
                                ? 'bg-[#3A76C2]/20 text-[#5DA9E9]'
                                : 'bg-[#8E44AD]/20 text-[#C39BD3]'
                            }`}
                          >
                            {rep.target_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <div className="font-medium text-white truncate">
                            {rep.target_title_or_snippet}
                          </div>
                          <div className="text-[10px] text-[#9FB3C8]">
                            ID Alvo: #{rep.target_id} • Status: {rep.status}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[#E09F3E] font-medium">{rep.reason}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              (rep.reports_count || 0) > 0
                                ? 'bg-[#E5484D]/20 text-[#E5484D]'
                                : 'bg-gray-500/20 text-[#9FB3C8]'
                            }`}
                          >
                            {rep.reports_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleResolveModeration(rep.id, 'KEPT')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#2FA67A]/20 hover:bg-[#2FA67A] text-[#2FA67A] hover:text-white text-xs font-bold transition-colors"
                              title="Manter publicação no ar"
                            >
                              Manter Publicação
                            </button>
                            <button
                              onClick={() => handleResolveModeration(rep.id, 'HIDDEN')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#E09F3E]/20 hover:bg-[#E09F3E] text-[#E09F3E] hover:text-black text-xs font-bold transition-colors"
                              title="Ocultar do feed"
                            >
                              Ocultar
                            </button>
                            <button
                              onClick={() => handleResolveModeration(rep.id, 'DELETED')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#E5484D]/20 hover:bg-[#E5484D] text-[#E5484D] hover:text-white text-xs font-bold transition-colors"
                              title="Excluir logicamente (Soft Delete)"
                            >
                              Excluir
                            </button>
                            {rep.author_name === 'Usuario_Anonimo99' && (
                              <button
                                onClick={() => handleResolveModeration(rep.id, 'BAN_USER')}
                                className="px-2.5 py-1.5 rounded-lg bg-[#B42318] hover:bg-red-700 text-white text-xs font-bold transition-colors shadow"
                                title="Banir conta do usuário"
                              >
                                Banir Usuário
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BLOCO 3.3: C3 — Curadoria do Hub DIY & Integração YouTube */}
      {/* ============================================================== */}
      {subTab === 'diy' && (
        <div className="space-y-6">
          {/* Header e Botão de Novo Vídeo */}
          <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-[#D4AF37]" />
                Curadoria de Vídeos Tutoriais DIY ("Faça Você Mesmo")
              </h3>
              <p className="text-xs text-[#9FB3C8]">
                Gerenciamento de mídia integrada ao YouTube, extração de IDs e controle de visibilidade pública.
              </p>
            </div>
            <button
              onClick={() => setIsDiyModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Novo Vídeo DIY</span>
            </button>
          </div>

          {/* Grid de Vídeos DIY Cadastrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diyVideosList.map((vid) => {
              const thumbUrl = `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg`;

              return (
                <div
                  key={vid.id}
                  className={`rounded-2xl bg-[#0B1A2E] border overflow-hidden transition-all shadow-xl flex flex-col ${
                    vid.is_active ? 'border-[#223B57] hover:border-[#3A76C2]' : 'border-red-900/40 opacity-70'
                  }`}
                >
                  {/* Thumbnail com Overlay */}
                  <div className="relative aspect-video bg-black overflow-hidden group">
                    <img
                      src={thumbUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=640&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPlayingVideo(vid)}
                        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                      </button>
                    </div>
                    {/* Badge de Categoria */}
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white font-semibold">
                      {vid.category}
                    </span>
                    {/* Badge de Status */}
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        vid.is_active
                          ? 'bg-[#2FA67A] text-white'
                          : 'bg-[#E5484D] text-white'
                      }`}
                    >
                      {vid.is_active ? 'ATIVO NO HUB' : 'OCULTO'}
                    </span>
                  </div>

                  {/* Detalhes do Card */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] text-[#9FB3C8] mt-1.5 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#223B57]/50 flex items-center justify-between text-[11px] text-[#9FB3C8]">
                      <span className="font-mono flex items-center gap-1 text-[#5DA9E9]">
                        <Eye className="w-3.5 h-3.5" />
                        {vid.views_count.toLocaleString('pt-BR')} visualizações
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleDiy(vid.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            vid.is_active
                              ? 'bg-[#E09F3E]/20 text-[#E09F3E] hover:bg-[#E09F3E] hover:text-black'
                              : 'bg-[#2FA67A]/20 text-[#2FA67A] hover:bg-[#2FA67A] hover:text-white'
                          }`}
                        >
                          {vid.is_active ? 'Ocultar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteDiy(vid.id)}
                          className="p-1 rounded-lg text-[#E5484D] hover:bg-[#E5484D]/20 transition-colors"
                          title="Excluir Tutorial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BLOCO 3.4: C4 — Analytics de Engajamento, Busca & Conteúdo */}
      {/* ============================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Cards de Desempenho e KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow">
              <div className="text-[11px] text-[#9FB3C8] font-medium flex items-center justify-between">
                <span>Artigo Mais Lido</span>
                <TrendingUp className="w-4 h-4 text-[#5DA9E9]" />
              </div>
              <div className="text-sm font-bold text-white mt-1 line-clamp-1">
                Como o Sensor de Corte de Motor Previne Furtos
              </div>
              <div className="text-lg font-bold text-[#5DA9E9] font-mono mt-0.5">
                5.120 acessos
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow">
              <div className="text-[11px] text-[#9FB3C8] font-medium flex items-center justify-between">
                <span>Taxa de Resposta Oficial</span>
                <CheckCircle className="w-4 h-4 text-[#2FA67A]" />
              </div>
              <div className="text-2xl font-bold text-[#2FA67A] font-mono mt-1">
                84%
              </div>
              <div className="text-[10px] text-[#9FB3C8]">
                Oficinas credenciadas ativas no fórum
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow">
              <div className="text-[11px] text-[#9FB3C8] font-medium flex items-center justify-between">
                <span>Leitores Únicos / Mês</span>
                <User className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                9.850
              </div>
              <div className="text-[10px] text-[#2FA67A]">
                +18.4% vs mês anterior
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow">
              <div className="text-[11px] text-[#9FB3C8] font-medium flex items-center justify-between">
                <span>Tempo Médio de Leitura</span>
                <Clock className="w-4 h-4 text-[#C39BD3]" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                3m 45s
              </div>
              <div className="text-[10px] text-[#9FB3C8]">
                Engajamento qualificado nos artigos
              </div>
            </div>
          </div>

          {/* Gráfico 1: Linhas / Área "Visualização de Notícias por Categoria (Últimos 30 Dias)" */}
          <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3A76C2]" />
                  Visualização de Notícias por Categoria (Últimos 30 Dias)
                </h4>
                <p className="text-xs text-[#9FB3C8]">
                  Evolução comparativa de acessos entre Economia & Leis, Segurança e Manutenção Preventiva.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#5DA9E9]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3A76C2]" /> Economia
                </span>
                <span className="flex items-center gap-1.5 text-[#E5484D]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" /> Segurança
                </span>
                <span className="flex items-center gap-1.5 text-[#2FA67A]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2FA67A]" /> Manutenção
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CMS_CATEGORY_VIEWS_30D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEco" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3A76C2" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3A76C2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5484D" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2FA67A" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#2FA67A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#223B57" vertical={false} />
                  <XAxis dataKey="date" stroke="#9FB3C8" fontSize={11} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#9FB3C8" fontSize={11} fontFamily="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1A2E',
                      borderColor: '#223B57',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ECONOMIA_LEIS"
                    name="Economia & Leis"
                    stroke="#3A76C2"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradEco)"
                  />
                  <Area
                    type="monotone"
                    dataKey="SEGURANCA"
                    name="Segurança & Pânico"
                    stroke="#E5484D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradSeg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="MANUTENCAO"
                    name="Manutenção & IoT"
                    stroke="#2FA67A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradMan)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Barras "Termos Mais Buscados na Plataforma" (search_logs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#D4AF37]" />
                Termos Mais Buscados na Plataforma (search_logs)
              </h4>
              <p className="text-xs text-[#9FB3C8]">
                Volume total de buscas realizadas nos buscadores internos e canais de ajuda.
              </p>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={searchKeywordsAnalytics} layout="vertical" margin={{ left: 15, right: 20 }}>
                    <XAxis type="number" stroke="#9FB3C8" fontSize={11} fontFamily="JetBrains Mono" />
                    <YAxis
                      type="category"
                      dataKey="term"
                      stroke="#9FB3C8"
                      fontSize={11}
                      width={140}
                      fontFamily="JetBrains Mono"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B1A2E',
                        borderColor: '#223B57',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="searches" name="Buscas" fill="#D4AF37" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resumo Estatístico dos Termos */}
            <div className="p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#2FA67A]" />
                  Detalhamento de Demanda dos Usuários
                </h4>
                <p className="text-xs text-[#9FB3C8] mt-1">
                  Recomendações editoriais geradas automaticamente com base no comportamento de pesquisa:
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {searchKeywordsAnalytics.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white block">{item.term}</span>
                      <span className="text-[10px] text-[#9FB3C8]">
                        Prioridade de pauta editorial: Alta
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#D4AF37]">
                      {item.searches.toLocaleString('pt-BR')} buscas
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-[#2FA67A]/10 border border-[#2FA67A]/30 text-[11px] text-[#2FA67A]">
                ✓ A cobertura editorial atual cobre 100% dos termos com maior volume de busca.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: Criar / Editar Artigo com Editor Rico (WYSIWYG) */}
      {/* ============================================================== */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#223B57]">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3A76C2]" />
                  {editingArticleId ? 'Editar Artigo Corporativo' : 'Criar Novo Artigo Corporativo'}
                </h3>
                <p className="text-xs text-[#9FB3C8]">
                  Transmissão e publicação direta nos feeds do Motorista e da Oficina parceira.
                </p>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              {/* Título & Auto Slug */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[#9FB3C8] font-bold mb-1">Título do Artigo:</label>
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Novas Regras de Inspeção Veicular e Impacto no IPCA em 2026"
                    className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#9FB3C8] font-bold mb-1">Slug Automático:</label>
                  <input
                    type="text"
                    value={articleSlug}
                    onChange={(e) => setArticleSlug(e.target.value)}
                    placeholder="slug-amigavel"
                    className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#3A76C2]"
                    required
                  />
                </div>
              </div>

              {/* Categoria, Segmentação de Público & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9FB3C8] font-bold mb-1">Categoria (Enum):</label>
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value as ArticleCategory)}
                    className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                  >
                    <option value="ECONOMIA_LEIS">ECONOMIA_LEIS</option>
                    <option value="SEGURANCA">SEGURANCA</option>
                    <option value="MANUTENCAO">MANUTENCAO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9FB3C8] font-bold mb-1">Público Alvo (Segmentação):</label>
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-white">
                      <input
                        type="checkbox"
                        checked={targetDriver}
                        onChange={(e) => setTargetDriver(e.target.checked)}
                        className="rounded border-[#223B57] bg-[#0B1A2E] text-[#3A76C2] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Motoristas</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-white">
                      <input
                        type="checkbox"
                        checked={targetWorkshop}
                        onChange={(e) => setTargetWorkshop(e.target.checked)}
                        className="rounded border-[#223B57] bg-[#0B1A2E] text-[#2FA67A] focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Oficinas B2B</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[#9FB3C8] font-bold mb-1">Status de Publicação:</label>
                  <select
                    value={articleStatus}
                    onChange={(e) => setArticleStatus(e.target.value as ArticleStatus)}
                    className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                  >
                    <option value="PUBLISHED">PUBLICADO (Ao vivo nos feeds)</option>
                    <option value="DRAFT">RASCUNHO (Oculto)</option>
                  </select>
                </div>
              </div>

              {/* Subtítulo / Resumo Curto */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#9FB3C8] font-bold">Resumo / Subtítulo para Cards:</label>
                  <span className="text-[10px] text-[#9FB3C8] font-mono">
                    {articleSummary.length}/200 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={articleSummary}
                  onChange={(e) => setArticleSummary(e.target.value)}
                  placeholder="Texto corrido curto de apoio para exibição nos feeds..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                />
              </div>

              {/* Imagem de Capa */}
              <div>
                <label className="block text-[#9FB3C8] font-bold mb-1">URL da Imagem de Capa:</label>
                <input
                  type="url"
                  value={articleCoverUrl}
                  onChange={(e) => setArticleCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                />
              </div>

              {/* Editor de Texto Rico (Corpo do Artigo) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#9FB3C8] font-bold">
                    Corpo do Artigo (Editor com Formatação Markdown):
                  </label>
                  {/* Ferramentas rápidas de formatação */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setArticleContent((prev) => prev + '\n## Subtítulo Técnico\n')}
                      className="px-2 py-0.5 rounded bg-[#0B1A2E] text-[10px] text-[#5DA9E9] border border-[#223B57] hover:bg-[#3A76C2] hover:text-white"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleContent((prev) => prev + '\n### Item de Verificação\n')}
                      className="px-2 py-0.5 rounded bg-[#0B1A2E] text-[10px] text-[#5DA9E9] border border-[#223B57] hover:bg-[#3A76C2] hover:text-white"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleContent((prev) => prev + '\n- Ponto chave de diagnóstico\n')}
                      className="px-2 py-0.5 rounded bg-[#0B1A2E] text-[10px] text-[#5DA9E9] border border-[#223B57] hover:bg-[#3A76C2] hover:text-white"
                    >
                      Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleContent((prev) => prev + '\n> Alerta de segurança técnica\n')}
                      className="px-2 py-0.5 rounded bg-[#0B1A2E] text-[10px] text-[#5DA9E9] border border-[#223B57] hover:bg-[#3A76C2] hover:text-white"
                    >
                      Citação
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Redija o conteúdo técnico do artigo. Você pode utilizar marcações Markdown (## cabeçalhos, listas - ou negrito **texto**)..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#3A76C2] font-sans leading-relaxed"
                  required
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex gap-2 pt-3 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3A76C2] to-[#1F4E8C] hover:from-[#4E88D4] hover:to-[#2B62A8] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{editingArticleId ? 'Salvar & Transmitir Alterações' : 'Publicar & Transmitir aos Feeds'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Inserir Vídeo no Hub DIY */}
      {/* ============================================================== */}
      {isDiyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#223B57]">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#D4AF37]" />
                  Inserir Vídeo Tutorial DIY
                </h3>
                <p className="text-xs text-[#9FB3C8]">
                  Integração direta com o YouTube para a seção "Faça Você Mesmo".
                </p>
              </div>
              <button
                onClick={() => setIsDiyModalOpen(false)}
                className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiyVideo} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9FB3C8] font-bold mb-1">URL do Vídeo do YouTube:</label>
                <input
                  type="url"
                  value={diyYoutubeUrl}
                  onChange={(e) => setDiyYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              {/* Preview Dinâmico do YouTube */}
              {currentDiyYoutubeId && (
                <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] flex items-center gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${currentDiyYoutubeId}/hqdefault.jpg`}
                    alt="Preview"
                    className="w-24 h-16 object-cover rounded-lg border border-[#223B57]"
                  />
                  <div>
                    <span className="text-[10px] text-[#2FA67A] font-bold block">✓ ID Identificado:</span>
                    <code className="text-xs text-white font-mono">{currentDiyYoutubeId}</code>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#9FB3C8] font-bold mb-1">Título do Tutorial:</label>
                <input
                  type="text"
                  value={diyTitle}
                  onChange={(e) => setDiyTitle(e.target.value)}
                  placeholder="Ex: Tutorial DIY: Como Resetar e Calibrar o Sensor TPMS..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9FB3C8] font-bold mb-1">Categoria:</label>
                <select
                  value={diyCategory}
                  onChange={(e) => setDiyCategory(e.target.value as any)}
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                >
                  <option value="Manutenção Básica">Manutenção Básica</option>
                  <option value="Eletrônica & Telemetria">Eletrônica & Telemetria</option>
                  <option value="Cuidados EV/Híbridos">Cuidados EV/Híbridos</option>
                  <option value="Pneus & Calibragem">Pneus & Calibragem</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9FB3C8] font-bold mb-1">Descrição Técnica:</label>
                <textarea
                  rows={3}
                  value={diyDescription}
                  onChange={(e) => setDiyDescription(e.target.value)}
                  placeholder="Breve descrição dos procedimentos executados..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#3A76C2]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsDiyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-extrabold text-xs shadow-lg"
                >
                  Publicar no Hub DIY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Pré-visualização de Card de Notícia */}
      {/* ============================================================== */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="relative aspect-video bg-black">
              <img
                src={previewArticle.cover_image_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'}
                alt={previewArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewArticle(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[#3A76C2] text-white">
                {previewArticle.category}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-white text-sm leading-snug">
                {previewArticle.title}
              </h3>
              <p className="text-xs text-[#9FB3C8] leading-relaxed">
                {previewArticle.summary || previewArticle.content.slice(0, 140) + '...'}
              </p>

              <div className="pt-3 border-t border-[#223B57] flex items-center justify-between text-[11px] text-[#9FB3C8]">
                <span>{previewArticle.author_name}</span>
                <span className="font-mono">{previewArticle.views_count} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Player de Vídeo DIY */}
      {/* ============================================================== */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#223B57] flex items-center justify-between">
              <h4 className="font-bold text-white text-sm line-clamp-1">
                {playingVideo.title}
              </h4>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1 rounded-lg text-[#9FB3C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.youtube_id}?autoplay=1`}
                title={playingVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: Confirmação de Exclusão de Artigo (Soft Delete) */}
      {/* ============================================================== */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border-2 border-[#E5484D] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="font-bold text-white text-base text-[#E5484D] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão de Artigo
            </h4>
            <p className="text-xs text-white leading-relaxed">
              O artigo <strong>"{deletingArticle.title}"</strong> será removido das listagens públicas e movido para a Lixeira Central do Super Administrador (Soft Delete com registro em <code className="text-[#5DA9E9]">audit_logs</code>).
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingArticle(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteArticle}
                className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#B42318] text-white font-extrabold text-xs shadow-lg"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
