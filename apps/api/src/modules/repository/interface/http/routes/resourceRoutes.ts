/**
 * Resource Routes
 * Resource 路由定义 - Story 10-2
 */
import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { ResourceApplicationService } from '../../../application/services/ResourceApplicationService';
import { PrismaResourceRepository } from '../../../infrastructure/repositories/PrismaResourceRepository';
import { prisma } from '../../../../../infrastructure/database/prisma';
import { authenticate } from '../../../../../middleware/authenticate';

const router = Router();

// 初始化依赖
const resourceRepository = new PrismaResourceRepository(prisma);
const resourceService = new ResourceApplicationService(resourceRepository);
const resourceController = new ResourceController(resourceService);

// 所有路由都需要认证
router.use(authenticate);

// Resource CRUD 路由
router.post('/resources', resourceController.createResource);
router.get('/resources/:uuid', resourceController.getResourceById);
router.get('/repositories/:repositoryUuid/resources', resourceController.getResourcesByRepository);
router.put('/resources/:uuid/content', resourceController.updateMarkdownContent);
router.delete('/resources/:uuid', resourceController.deleteResource);

export default router;
