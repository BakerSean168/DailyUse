import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { RepositoryApplicationService } from '../application/RepositoryApplicationService';

const router = Router();
const prisma = new PrismaClient();
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const repositoryService = new RepositoryApplicationService(repositoryRepo);

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
 * MVP: 创建仓库
 * POST /api/v1/repository-new
 */
router.post('/repository-new', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
    const { name, type, path, description, config } = req.body;

    const repository = await repositoryService.createRepository({
      accountUuid,
      name,
      type: type || 'LOCAL',
      path: path || '/documents',
      description,
      config,
    });

    res.status(201).json(repository);
  } catch (error: any) {
    console.error('Error creating repository:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * MVP: 查询所有仓库
 * GET /api/v1/repository-new
 */
router.get('/repository-new', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
    const repositories = await repositoryService.listRepositories(accountUuid);

    res.json(repositories);
  } catch (error: any) {
    console.error('Error listing repositories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * MVP: 获取单个仓库
 * GET /api/v1/repository-new/:uuid
 */
router.get('/repository-new/:uuid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const accountUuid = (req as any).accountUuid;
    const { uuid } = req.params;

    const repository = await repositoryService.getRepository(uuid, accountUuid);

    res.json(repository);
  } catch (error: any) {
    console.error('Error getting repository:', error);
    res.status(404).json({ error: error.message });
  }
});

export default router;
