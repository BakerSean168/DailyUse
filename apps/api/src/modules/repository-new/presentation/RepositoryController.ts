import { Router } from 'express';
import type { AuthenticatedRequest } from '../../../shared/middlewares/authMiddleware';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaRepositoryRepository } from '../infrastructure/PrismaRepositoryRepository';
import { RepositoryApplicationService } from '../application/RepositoryApplicationService';

const router = Router();
const prisma = new PrismaClient();
const repositoryRepo = new PrismaRepositoryRepository(prisma);
const repositoryService = new RepositoryApplicationService(repositoryRepo);

/**
 * MVP: 创建仓库
 * POST /api/v1/repository-new
 */
router.post('/repository-new', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
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
router.get('/repository-new', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
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
router.get('/repository-new/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    const repository = await repositoryService.getRepository(uuid, accountUuid);

    res.json(repository);
  } catch (error: any) {
    console.error('Error getting repository:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 更新仓库
 * PUT /api/v1/repository-new/:uuid
 */
router.put('/repository-new/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;
    const { name, path, description, config } = req.body;

    const repository = await repositoryService.updateRepository(uuid, accountUuid, {
      name,
      path,
      description,
      config,
    });

    res.json(repository);
  } catch (error: any) {
    console.error('Error updating repository:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * 删除仓库
 * DELETE /api/v1/repository-new/:uuid
 */
router.delete('/repository-new/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accountUuid = req.accountUuid!;
    const { uuid } = req.params;

    await repositoryService.deleteRepository(uuid, accountUuid);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting repository:', error);
    const statusCode = error.message.includes('not found') ? 404 : error.message.includes('denied') ? 403 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

export default router;
