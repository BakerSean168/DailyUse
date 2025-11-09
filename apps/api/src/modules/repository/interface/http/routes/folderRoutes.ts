import { Router } from 'express';
import { FolderController } from '../controllers';

const router: Router = Router();

/**
 * @route POST /api/repositories/:repositoryUuid/folders
 * @desc 创建文件夹
 */
router.post('/repositories/:repositoryUuid/folders', FolderController.createFolder);

/**
 * @route GET /api/repositories/:repositoryUuid/folders/tree
 * @desc 获取文件夹树
 */
router.get('/repositories/:repositoryUuid/folders/tree', FolderController.getFolderTree);

/**
 * @route GET /api/folders/:uuid
 * @desc 获取文件夹详情
 */
router.get('/folders/:uuid', FolderController.getFolder);

/**
 * @route PATCH /api/folders/:uuid/rename
 * @desc 重命名文件夹
 */
router.patch('/folders/:uuid/rename', FolderController.renameFolder);

/**
 * @route PATCH /api/folders/:uuid/move
 * @desc 移动文件夹
 */
router.patch('/folders/:uuid/move', FolderController.moveFolder);

/**
 * @route DELETE /api/folders/:uuid
 * @desc 删除文件夹
 */
router.delete('/folders/:uuid', FolderController.deleteFolder);

export default router;
