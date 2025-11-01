import { Router } from 'express';
import type { AuthenticatedRequest } from '../../../shared/middlewares/authMiddleware';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaResourceRepository } from '../infrastructure/PrismaResourceRepository';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { ResourceApplicationService } from '../application/ResourceApplicationService';

const router = Router();
const prisma = new PrismaClient();
const resourceRepo = new PrismaResourceRepository(prisma);
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const resourceService = new ResourceApplicationService(resourceRepo, repositoryRepo);

/**
 * MVP: 创建资源 (Markdown)
 * POST /api/v1/resources
 */
router.post('/resources', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { repositoryUuid, name, path, content, type } = req.body;

    // 计算内容大小
    const size = content ? Buffer.byteLength(content, 'utf8') : 0;

    const resource = await resourceService.createResource(
      {
        repositoryUuid,
        name,
        type: type || 'markdown',
        path: path || '/',
        size,
        metadata: { content: content || '' },
      },
      accountUuid,
    );

    res.status(201).json(resource);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * MVP: 更新 Markdown 内容
 * PUT /api/v1/resources/:uuid/content
 */
router.put('/resources/:uuid/content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;
    const { content } = req.body;

    const resource = await resourceService.updateMarkdownContent(uuid, accountUuid, content);

    res.json(resource);
  } catch (error: any) {
    console.error('Error updating resource content:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * MVP: 获取 Markdown 内容
 * GET /api/v1/resources/:uuid/content
 */
router.get('/resources/:uuid/content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const content = await resourceService.getMarkdownContent(uuid, accountUuid);

    res.json({ content });
  } catch (error: any) {
    console.error('Error getting resource content:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * MVP: 查询仓库中的资源
 * GET /api/v1/repository-new/:repositoryUuid/resources
 */
router.get('/repository-new/:repositoryUuid/resources', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { repositoryUuid } = req.params;
    const { page = '1', pageSize = '20', type, status, category, tags, sortBy, sortOrder } = req.query;

    const result = await resourceService.listResources({
      repositoryUuid,
      accountUuid,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      type: type as any,
      status: status as string,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      sortBy: (sortBy as any) || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取单个资源详情
 * GET /api/v1/resources/:uuid
 */
router.get('/resources/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const resource = await resourceService.getResource(uuid, accountUuid);

    res.json(resource);
  } catch (error: any) {
    console.error('Error getting resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 更新资源（通用字段）
 * PUT /api/v1/resources/:uuid
 */
router.put('/resources/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;
    const { name, description, category, tags } = req.body;

    const resource = await resourceService.updateResource(uuid, accountUuid, {
      name,
      description,
      category,
      tags,
    });

    res.json(resource);
  } catch (error: any) {
    console.error('Error updating resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 删除资源（软删除）
 * DELETE /api/v1/resources/:uuid
 */
router.delete('/resources/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    await resourceService.deleteResource(uuid, accountUuid);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 移动资源到新路径
 * POST /api/v1/resources/:uuid/move
 */
router.post('/resources/:uuid/move', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;
    const { newPath } = req.body;

    if (!newPath) {
      res.status(400).json({ error: 'Missing newPath in request body' });
      return;
    }

    const resource = await resourceService.moveResource(uuid, accountUuid, newPath);

    res.json(resource);
  } catch (error: any) {
    console.error('Error moving resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 收藏/取消收藏资源
 * POST /api/v1/resources/:uuid/favorite
 */
router.post('/resources/:uuid/favorite', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const resource = await resourceService.toggleFavorite(uuid, accountUuid);

    res.json(resource);
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 发布资源
 * POST /api/v1/resources/:uuid/publish
 */
router.post('/resources/:uuid/publish', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const resource = await resourceService.publishResource(uuid, accountUuid);

    res.json(resource);
  } catch (error: any) {
    console.error('Error publishing resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 归档资源
 * POST /api/v1/resources/:uuid/archive
 */
router.post('/resources/:uuid/archive', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const resource = await resourceService.archiveResource(uuid, accountUuid);

    res.json(resource);
  } catch (error: any) {
    console.error('Error archiving resource:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

export default router;
