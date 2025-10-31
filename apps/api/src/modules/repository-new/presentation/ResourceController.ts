import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaResourceRepository } from '../infrastructure/PrismaResourceRepository';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { ResourceApplicationService } from '../application/ResourceApplicationService';

const router = Router();
const prisma = new PrismaClient();
const resourceRepo = new PrismaResourceRepository(prisma);
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const resourceService = new ResourceApplicationService(resourceRepo, repositoryRepo);

// Middleware to extract accountUuid from JWT token
const authenticateToken = (req: Request, res: Response, next: Function) => {
  // TODO: 实际项目中应该从 JWT token 中解析 accountUuid
  // 这里暂时从 header 中获取用于测试
  const accountUuid = req.headers['x-account-uuid'] as string;
  if (!accountUuid) {
    return res.status(401).json({ error: 'Missing account UUID' });
  }
  (req as any).accountUuid = accountUuid;
  next();
};

/**
 * MVP: 创建资源 (Markdown)
 * POST /api/v1/resources
 */
router.post('/resources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
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
router.put('/resources/:uuid/content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
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
router.get('/resources/:uuid/content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
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
router.get('/repository-new/:repositoryUuid/resources', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
    const { repositoryUuid } = req.params;
    const { page = '1', pageSize = '20', type, status, category, tags, sortBy, sortOrder } = req.query;

    const result = await resourceService.listResources({
      repositoryUuid,
      accountUuid,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      type: type as string,
      status: status as string,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      sortBy: (sortBy as string) || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
