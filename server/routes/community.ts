import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest } from '../lib/auth.ts';
import { PostType, PostTag } from '../../src/types/index.ts';

export const communityRouter = Router();

// GET /api/community - List posts with filters
communityRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const typeFilter = req.query.type as PostType;
  const tagFilter = req.query.tag as PostTag;
  const userId = req.user!.sub;

  let list = Array.from(dbStore.communityPosts.values()).filter(
    (p) => !p.deleted_at && (!p.is_hidden || req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN')
  );

  if (typeFilter) {
    list = list.filter((p) => p.type === typeFilter);
  }

  if (tagFilter) {
    list = list.filter((p) => p.tags.includes(tagFilter));
  }

  // Attach comments and user_has_liked
  const enriched = list.map((p) => {
    const comments = (dbStore.postComments.get(p.id) || []).filter((c) => !c.deleted_at);
    const hasLiked = dbStore.postLikes.has(`${p.id}:${userId}`);
    return {
      ...p,
      comments,
      user_has_liked: hasLiked,
    };
  });

  // Sort by created_at desc
  enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json(enriched);
});

// GET /api/community/:id - Single post (for deep link /comunidade/post/[id])
communityRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const post = dbStore.communityPosts.get(req.params.id);
  if (!post || post.deleted_at) {
    return res.status(404).json({ error: 'Publicação não encontrada ou removida.' });
  }

  const comments = (dbStore.postComments.get(post.id) || []).filter((c) => !c.deleted_at);
  const hasLiked = dbStore.postLikes.has(`${post.id}:${req.user!.sub}`);

  return res.json({
    ...post,
    comments,
    user_has_liked: hasLiked,
  });
});

// POST /api/community - Create post
communityRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { type, title, content, tags, youtube_url } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({ error: 'Título, conteúdo e tipo são obrigatórios.' });
  }

  const newPost = {
    id: `post-${Date.now()}`,
    user_id: req.user!.sub,
    user_name: req.user!.name,
    user_plan: req.user!.plan,
    type: type as PostType,
    title,
    content,
    tags: Array.isArray(tags) ? (tags as PostTag[]) : ['MANUTENCAO' as PostTag],
    youtube_url: youtube_url || null,
    likes_count: 0,
    is_hidden: false,
    created_at: new Date().toISOString(),
  };

  dbStore.communityPosts.set(newPost.id, newPost);

  return res.status(201).json({ success: true, post: newPost });
});

// POST /api/community/:id/like - Toggle like
communityRouter.post('/:id/like', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const post = dbStore.communityPosts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Publicação não encontrada.' });
  }

  const key = `${post.id}:${req.user!.sub}`;
  let liked = false;
  if (dbStore.postLikes.has(key)) {
    dbStore.postLikes.delete(key);
    post.likes_count = Math.max(0, post.likes_count - 1);
  } else {
    dbStore.postLikes.add(key);
    post.likes_count += 1;
    liked = true;
  }

  return res.json({ success: true, liked, likes_count: post.likes_count });
});

// POST /api/community/:id/comments - Add comment
communityRouter.post('/:id/comments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const post = dbStore.communityPosts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Publicação não encontrada.' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Comentário não pode ser vazio.' });
  }

  const newComment = {
    id: `comm-${Date.now()}`,
    post_id: post.id,
    user_id: req.user!.sub,
    user_name: req.user!.name,
    user_plan: req.user!.plan,
    content,
    created_at: new Date().toISOString(),
  };

  const comments = dbStore.postComments.get(post.id) || [];
  comments.push(newComment);
  dbStore.postComments.set(post.id, comments);

  return res.status(201).json({ success: true, comment: newComment });
});

// POST /api/community/report - Report post or comment
communityRouter.post('/report', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { target_type, target_id, reason, snippet } = req.body;

  if (!target_type || !target_id || !reason) {
    return res.status(400).json({ error: 'Dados da denúncia incompletos.' });
  }

  const report = {
    id: `rep-${Date.now()}`,
    target_type,
    target_id,
    target_title_or_snippet: snippet || 'Conteúdo reportado por usuário',
    reporter_user_id: req.user!.sub,
    reporter_name: req.user!.name,
    reason,
    status: 'OPEN' as const,
    created_at: new Date().toISOString(),
  };

  dbStore.contentReports.set(report.id, report);

  dbStore.recordAudit(
    req.user!.sub,
    'DENUNCIA_CONTEUDO_REGISTRADA',
    'COMMUNITY',
    target_id,
    { reason, target_type },
    false,
    req.ip || '127.0.0.1'
  );

  return res.status(201).json({ success: true, report });
});
