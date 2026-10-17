import { Router, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../lib/auth.ts';
import { ArticleCategory, ArticleStatus } from '../../src/types/index.ts';

export const articlesRouter = Router();

// GET /api/articles - List articles
articlesRouter.get('/', (req, res) => {
  const includeDrafts = req.query.drafts === 'true';
  const audience = req.query.audience as string | undefined;
  let list = Array.from(dbStore.articles.values()).filter((a) => !a.deleted_at);

  if (!includeDrafts) {
    list = list.filter((a) => a.status === 'PUBLISHED');
  }

  if (audience) {
    list = list.filter((a) => {
      if (!a.audience || a.audience === 'ALL') return true;
      if (a.audience === audience) return true;
      if (Array.isArray(a.target_audience) && (a.target_audience.includes(audience as any) || a.target_audience.length === 2)) return true;
      return false;
    });
  }

  // Sort by created_at desc
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json(list);
});

// GET /api/articles/:slug - Read single article and increment views
articlesRouter.get('/:slug', (req, res) => {
  const article = Array.from(dbStore.articles.values()).find(
    (a) => a.slug === req.params.slug && !a.deleted_at
  );

  if (!article) {
    return res.status(404).json({ error: 'Artigo não encontrado.' });
  }

  article.views_count += 1;
  return res.json(article);
});

// POST /api/articles - Create article (ADMIN or SUPER_ADMIN)
articlesRouter.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const { title, content, category, status, summary, audience, target_audience, cover_image_url } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Título, conteúdo e categoria são obrigatórios.' });
    }

    // Generate auto slug
    const cleanSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${cleanSlug}-${Math.random().toString(36).substr(2, 4)}`;

    const newArticle = {
      id: `art-${Date.now()}`,
      author_user_id: req.user!.sub,
      author_name: req.user!.name,
      title,
      slug,
      content,
      summary: summary || (content.length > 180 ? content.slice(0, 180) + '...' : content),
      category: category as ArticleCategory,
      status: (status as ArticleStatus) || 'PUBLISHED',
      audience: audience || (Array.isArray(target_audience) && target_audience.length === 2 ? 'ALL' : target_audience?.[0] || 'ALL'),
      target_audience: target_audience || (audience === 'ALL' ? ['DRIVER', 'WORKSHOP_OWNER'] : [audience || 'DRIVER']),
      cover_image_url: cover_image_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
      views_count: 0,
      created_at: new Date().toISOString(),
    };

    dbStore.articles.set(newArticle.id, newArticle as any);

    dbStore.recordAudit(
      req.user!.sub,
      'ARTIGO_CRIADO',
      'ARTICLE',
      newArticle.id,
      { title, category, status: newArticle.status, audience: newArticle.audience },
      false,
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({ success: true, article: newArticle });
  }
);

// PUT /api/articles/:id - Update article
articlesRouter.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const article = dbStore.articles.get(req.params.id);
    if (!article || article.deleted_at) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    const { title, content, category, status, summary, audience, target_audience, cover_image_url } = req.body;
    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (status) article.status = status;
    if (summary !== undefined) article.summary = summary;
    if (audience !== undefined) article.audience = audience;
    if (target_audience !== undefined) article.target_audience = target_audience;
    if (cover_image_url !== undefined) article.cover_image_url = cover_image_url;

    dbStore.recordAudit(
      req.user!.sub,
      'ARTIGO_ATUALIZADO',
      'ARTICLE',
      article.id,
      { title: article.title },
      false,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, article });
  }
);

// DELETE /api/articles/:id - Soft delete
articlesRouter.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const article = dbStore.articles.get(req.params.id);
    if (!article || article.deleted_at) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    article.deleted_at = new Date().toISOString();

    dbStore.recordAudit(
      req.user!.sub,
      'ARTIGO_EXCLUIDO_LOGICO',
      'ARTICLE',
      article.id,
      { title: article.title, author: article.author_name },
      false,
      req.ip || '127.0.0.1'
    );

    return res.json({ success: true, message: 'Artigo movido para a lixeira.' });
  }
);
