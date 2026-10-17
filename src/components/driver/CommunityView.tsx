import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Video,
  ThumbsUp,
  Share2,
  Flag,
  Send,
  Plus,
  Play,
  Check,
  X,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { CommunityPost, PostType, PostTag } from '../../types/index.ts';

export const CommunityView: React.FC = () => {
  const { user, forumPosts: globalPosts } = useApp();
  const [activeTab, setActiveTab] = useState<PostType>('FORUM');
  const [selectedTag, setSelectedTag] = useState<PostTag | 'ALL'>('ALL');
  const [posts, setPosts] = useState<CommunityPost[]>(globalPosts || []);
  const [loading, setLoading] = useState(false);

  // Comments drawer / modal
  const [activeCommentPost, setActiveCommentPost] = useState<CommunityPost | null>(null);
  const [newComment, setNewComment] = useState('');

  // Report modal
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Create post modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newYoutube, setNewYoutube] = useState('');
  const [newTags, setNewTags] = useState<PostTag[]>(['MANUTENCAO']);

  // Copy share feedback
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedTag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/community?type=${activeTab}`;
      if (selectedTag !== 'ALL') url += `&tag=${selectedTag}`;
      const res = await fetch(url);
      if (res.ok) setPosts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post: CommunityPost) => {
    try {
      const res = await fetch(`/api/community/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likes_count: data.likes_count, user_has_liked: data.liked }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Section D6: Web Share API with clipboard fallback
  const handleShare = async (post: CommunityPost) => {
    const postUrl = `${window.location.origin}/comunidade/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Confira este post na Comunidade CarCity: ${post.title}`,
          url: postUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 3000);
    } catch (err) {
      prompt('Copie o link abaixo:', postUrl);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPost || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/community/${activeCommentPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...activeCommentPost,
          comments: [...(activeCommentPost.comments || []), data.comment],
        };
        setActiveCommentPost(updated);
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setNewComment('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost || !reportReason.trim()) return;

    try {
      await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'POST',
          target_id: reportingPost.id,
          reason: reportReason,
          snippet: reportingPost.title,
        }),
      });
      alert('Denúncia enviada à equipe de moderação com sucesso.');
      setReportingPost(null);
      setReportReason('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          title: newTitle,
          content: newContent,
          tags: newTags,
          youtube_url: newYoutube.trim() || null,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewYoutube('');
        await fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to extract YouTube video ID
  const getYoutubeEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const tagsList: { id: PostTag; label: string }[] = [
    { id: 'SEGURANCA', label: '#Segurança' },
    { id: 'HIBRIDOS_ELETRICOS', label: '#HíbridosEElétricos' },
    { id: 'MANUTENCAO', label: '#Manutenção' },
    { id: 'LEIS_IPCA', label: '#LeisEIPCA' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Fixed Tabs at top (Section D5) */}
      <div className="p-2 rounded-2xl bg-[#12273F] border border-[#223B57] flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('FORUM')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'FORUM'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Fórum Técnico
          </button>
          <button
            onClick={() => setActiveTab('DIY')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'DIY'
                ? 'bg-[#3A76C2] text-white shadow'
                : 'text-[#9FB3C8] hover:text-white hover:bg-[#0B1A2E]'
            }`}
          >
            <Video className="w-4 h-4" />
            Tutoriais DIY
          </button>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#17805A] text-white font-bold text-xs flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          Novo Post
        </button>
      </div>

      {/* Filter Tags (Section D5) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTag('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedTag === 'ALL'
              ? 'bg-[#3A76C2] text-white'
              : 'bg-[#12273F] text-[#9FB3C8] hover:text-white border border-[#223B57]'
          }`}
        >
          Todos os Tópicos
        </button>
        {tagsList.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTag(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTag === t.id
                ? 'bg-[#3A76C2] text-white'
                : 'bg-[#12273F] text-[#9FB3C8] hover:text-white border border-[#223B57]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => {
          const embedUrl = getYoutubeEmbedUrl(post.youtube_url);

          return (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-lg space-y-4"
            >
              {/* DIY Video on top (Section D6) */}
              {post.type === 'DIY' && embedUrl && (
                <div className="rounded-xl overflow-hidden aspect-video w-full bg-black border border-[#223B57]">
                  <iframe
                    src={embedUrl}
                    title={post.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Title & Author Info */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{post.user_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                      {post.user_plan}
                    </span>
                    <span className="text-[11px] text-[#9FB3C8]">• {new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#0B1A2E] text-[#5DA9E9] border border-[#223B57]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{post.title}</h3>
                <p className="text-xs text-[#9FB3C8] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Action buttons (Curtir, Comentários, Compartilhar, Denunciar) */}
              <div className="pt-3 border-t border-[#223B57] flex items-center justify-between text-xs text-[#9FB3C8]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 font-semibold transition-colors ${
                      post.user_has_liked ? 'text-[#3A76C2]' : 'hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentPost(post)}
                    className="flex items-center gap-1.5 font-semibold hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments?.length || 0} Comentários</span>
                  </button>

                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 font-semibold hover:text-white transition-colors"
                    title="Compartilhar link da publicação"
                  >
                    {copiedPostId === post.id ? (
                      <>
                        <Check className="w-4 h-4 text-[#2FA67A]" />
                        <span className="text-[#2FA67A]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Compartilhar</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setReportingPost(post)}
                  className="hover:text-[#E5484D] transition-colors p-1"
                  title="Denunciar conteúdo"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Drawer / Modal (Section D6) */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 bg-[#0B1A2E] border-b border-[#223B57] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm line-clamp-1">
                  Discussão: {activeCommentPost.title}
                </h4>
                <p className="text-[11px] text-[#9FB3C8]">
                  {activeCommentPost.comments?.length || 0} respostas da comunidade
                </p>
              </div>
              <button
                onClick={() => setActiveCommentPost(null)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
              {activeCommentPost.comments?.length === 0 ? (
                <div className="text-center py-6 text-[#9FB3C8]">
                  Nenhum comentário ainda. Seja o primeiro a responder!
                </div>
              ) : (
                activeCommentPost.comments?.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white">{c.user_name}</strong>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#3A76C2]/20 text-[#5DA9E9]">
                          {c.user_plan}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9FB3C8]">
                        {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#F1F5F9] leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddComment}
              className="p-3 bg-[#0B1A2E] border-t border-[#223B57] flex gap-2"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário técnico..."
                className="flex-1 bg-[#12273F] border border-[#223B57] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#9FB3C8]/60 focus:outline-none focus:border-[#3A76C2]"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] disabled:opacity-40 text-white font-bold text-xs"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E5484D]" />
              Denunciar Publicação
            </h4>
            <p className="text-xs text-[#9FB3C8]">
              Publicação: "{reportingPost.title}"
            </p>
            <form onSubmit={handleReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9FB3C8] mb-1">Motivo da Denúncia:</label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Ex: Conteúdo ofensivo, orientação técnica incorreta ou spam..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="flex-1 py-2 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#E5484D] text-white font-bold hover:bg-[#B42318]"
                >
                  Enviar Denúncia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12273F] border border-[#223B57] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-base">
                Criar Nova Publicação ({activeTab === 'FORUM' ? 'Fórum Técnico' : 'Tutorial DIY'})
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9FB3C8] mb-1">Título:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Como aferir a pressão dos pneus antes de viagens..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              {activeTab === 'DIY' && (
                <div>
                  <label className="block text-[#9FB3C8] mb-1">
                    Link do Vídeo no YouTube (YouTube IFrame API):
                  </label>
                  <input
                    type="url"
                    value={newYoutube}
                    onChange={(e) => setNewYoutube(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#3A76C2]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#9FB3C8] mb-1">Conteúdo da Postagem:</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Descreva sua dúvida ou o procedimento passo a passo..."
                  className="w-full bg-[#0B1A2E] border border-[#223B57] rounded-xl p-3 text-white focus:outline-none focus:border-[#3A76C2]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white border border-[#223B57]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#3A76C2] hover:bg-[#1F4E8C] text-white font-bold"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
