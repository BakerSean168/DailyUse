import { Router } from 'express';
import { RepositoryController } from '../controllers';
import { SearchController } from '../controllers/SearchController';
import { TagsController } from '../controllers/TagsController';

const router: Router = Router();
const searchController = new SearchController();
const tagsController = new TagsController();

/**
 * @route GET /api/repositories
 * @desc 获取用户的所有仓储
 */
router.get('/', RepositoryController.listRepositories);

/**
 * @route GET /api/repositories/:uuid/tree
 * @desc 获取仓储文件树（文件夹 + 资源统一结构）
 * Story 11.1: File Tree Unified Rendering
 */
router.get('/:uuid/tree', RepositoryController.getFileTree);

/**
 * @route GET /api/repositories/:uuid/search
 * @desc 搜索仓储内容（Obsidian 风格）
 * Story 11.2: Obsidian Style Search
 * Query params: query, mode, caseSensitive, useRegex, page, pageSize
 */
router.get('/:uuid/search', searchController.search);

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

/**
 * @route GET /api/tags/statistics/:repositoryUuid
 * @desc 获取仓储的标签统计信息
 * Story 11.5: Tags (标签系统)
 */
router.get('/tags/statistics/:repositoryUuid', tagsController.getStatistics);

export default router;
