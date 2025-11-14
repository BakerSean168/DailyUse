/**
 * Repository Module Routes (Epic 10 - 完整版)
 * 仓储模块统一路由入口
 * 整合：Repository + Resource + Folder + Search + Tags
 */
import { Router } from 'express';
import { RepositoryController } from '../controllers';
import { ResourceController } from '../controllers/ResourceController';
import { FolderController } from '../controllers';
import { SearchController } from '../controllers/SearchController';
import { TagsController } from '../controllers/TagsController';

const router: Router = Router();
const searchController = new SearchController();
const tagsController = new TagsController();

// ==================== Repository 仓储管理 ====================

/**
 * @route GET /api/v1/repositories
 * @desc 获取用户的所有仓储
 */
router.get('/', RepositoryController.listRepositories);

/**
 * @route POST /api/v1/repositories
 * @desc 创建仓储
 */
router.post('/', RepositoryController.createRepository);

/**
 * @route GET /api/v1/repositories/:uuid
 * @desc 获取仓储详情
 */
router.get('/:uuid', RepositoryController.getRepository);

/**
 * @route PATCH /api/v1/repositories/:uuid/config
 * @desc 更新仓储配置
 */
router.patch('/:uuid/config', RepositoryController.updateConfig);

/**
 * @route POST /api/v1/repositories/:uuid/archive
 * @desc 归档仓储
 */
router.post('/:uuid/archive', RepositoryController.archiveRepository);

/**
 * @route POST /api/v1/repositories/:uuid/archive
 * @desc 归档仓储
 */
router.post('/:uuid/archive', RepositoryController.archiveRepository);

/**
 * @route POST /api/v1/repositories/:uuid/activate
 * @desc 激活仓储
 */
router.post('/:uuid/activate', RepositoryController.activateRepository);

/**
 * @route DELETE /api/v1/repositories/:uuid
 * @desc 删除仓储
 */
router.delete('/:uuid', RepositoryController.deleteRepository);

/**
 * @route GET /api/v1/repositories/:uuid/tree
 * @desc 获取仓储文件树（文件夹 + 资源统一结构）
 * Story 11.1: File Tree Unified Rendering
 */
router.get('/:uuid/tree', RepositoryController.getFileTree);

/**
 * @route GET /api/v1/repositories/:uuid/search
 * @desc 搜索仓储内容（Obsidian 风格）
 * Story 11.2: Obsidian Style Search
 * Query params: query, mode, caseSensitive, useRegex, page, pageSize
 */
router.get('/:uuid/search', searchController.search);

// ==================== Resource 资源管理 (Epic 10 Story 10-2) ====================

/**
 * @route POST /api/v1/repositories/resources
 * @desc 创建资源
 */
router.post('/resources', ResourceController.createResource);

/**
 * @route GET /api/v1/repositories/resources/:uuid
 * @desc 获取资源详情
 */
router.get('/resources/:uuid', ResourceController.getResourceById);

/**
 * @route GET /api/v1/repositories/:repositoryUuid/resources
 * @desc 获取仓储下的所有资源
 */
router.get('/:repositoryUuid/resources', ResourceController.getResourcesByRepository);

/**
 * @route PUT /api/v1/repositories/resources/:uuid/content
 * @desc 更新资源 Markdown 内容
 */
router.put('/resources/:uuid/content', ResourceController.updateMarkdownContent);

/**
 * @route DELETE /api/v1/repositories/resources/:uuid
 * @desc 删除资源
 */
router.delete('/resources/:uuid', ResourceController.deleteResource);

// ==================== Folder 文件夹管理 ====================

/**
 * @route POST /api/v1/repositories/:repositoryUuid/folders
 * @desc 创建文件夹
 */
router.post('/:repositoryUuid/folders', FolderController.createFolder);

/**
 * @route GET /api/v1/repositories/:repositoryUuid/folders/tree
 * @desc 获取文件夹树
 */
router.get('/:repositoryUuid/folders/tree', FolderController.getFolderTree);

/**
 * @route GET /api/v1/repositories/folders/:uuid
 * @desc 获取文件夹详情
 */
router.get('/folders/:uuid', FolderController.getFolder);

/**
 * @route PATCH /api/v1/repositories/folders/:uuid/rename
 * @desc 重命名文件夹
 */
router.patch('/folders/:uuid/rename', FolderController.renameFolder);

/**
 * @route PATCH /api/v1/repositories/folders/:uuid/move
 * @desc 移动文件夹
 */
router.patch('/folders/:uuid/move', FolderController.moveFolder);

/**
 * @route DELETE /api/v1/repositories/folders/:uuid
 * @desc 删除文件夹
 */
router.delete('/folders/:uuid', FolderController.deleteFolder);

// ==================== Tags 标签管理 (Story 11.5) ====================

/**
 * @route GET /api/v1/repositories/tags/statistics/:repositoryUuid
 * @desc 获取仓储的标签统计信息
 * Story 11.5: Tags (标签系统)
 */
router.get('/tags/statistics/:repositoryUuid', tagsController.getStatistics);

export default router;
