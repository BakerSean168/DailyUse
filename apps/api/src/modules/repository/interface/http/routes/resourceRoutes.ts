/**
 * Resource Routes
 * Resource 路由定义 - Story 10-2
 * 使用单例模式的控制器静态方法
 */
import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { authMiddleware } from '@/shared/middlewares/authMiddleware';

const router: RouterType = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// Resource CRUD 路由 - 使用静态方法
router.post('/resources', ResourceController.createResource);
router.get('/resources/:uuid', ResourceController.getResourceById);
router.get('/repositories/:repositoryUuid/resources', ResourceController.getResourcesByRepository);
router.put('/resources/:uuid/content', ResourceController.updateMarkdownContent);
router.delete('/resources/:uuid', ResourceController.deleteResource);

export default router;
