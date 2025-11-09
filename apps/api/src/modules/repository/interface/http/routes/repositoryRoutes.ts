import { Router } from 'express';
import { RepositoryController } from '../controllers';

const router: Router = Router();

/**
 * @route GET /api/repositories
 * @desc 获取用户的所有仓储
 */
router.get('/', RepositoryController.listRepositories);

/**
 * @route GET /api/repositories/:uuid
 * @desc 获取仓储详情
 */
router.get('/:uuid', RepositoryController.getRepository);

/**
 * @route POST /api/repositories
 * @desc 创建仓储
 */
router.post('/', RepositoryController.createRepository);

/**
 * @route PATCH /api/repositories/:uuid/config
 * @desc 更新仓储配置
 */
router.patch('/:uuid/config', RepositoryController.updateConfig);

/**
 * @route POST /api/repositories/:uuid/archive
 * @desc 归档仓储
 */
router.post('/:uuid/archive', RepositoryController.archiveRepository);

/**
 * @route POST /api/repositories/:uuid/activate
 * @desc 激活仓储
 */
router.post('/:uuid/activate', RepositoryController.activateRepository);

/**
 * @route DELETE /api/repositories/:uuid
 * @desc 删除仓储
 */
router.delete('/:uuid', RepositoryController.deleteRepository);

export default router;
