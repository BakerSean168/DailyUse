import { Router } from 'express';
import { GoalFolderController } from './GoalFolderController';

/**
 * GoalFolder 路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. 路由分组：基本CRUD、文件夹树、移动操作
 */

const router: Router = Router();

// ===== 基本 CRUD =====

/**
 * @swagger
 * /api/goal-folders:
 *   post:
 *     tags: [GoalFolder]
 *     summary: 创建文件夹
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - name
 *             properties:
 *               accountUuid:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               parentFolderUuid:
 *                 type: string
 *     responses:
 *       201:
 *         description: 文件夹创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', GoalFolderController.createFolder);

/**
 * @swagger
 * /api/goal-folders:
 *   get:
 *     tags: [GoalFolder]
 *     summary: 查询文件夹列表
 *     parameters:
 *       - name: accountUuid
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: parentFolderUuid
 *         in: query
 *         schema:
 *           type: string
 *       - name: includeSystemFolders
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [name, createdAt, sortOrder]
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/', GoalFolderController.queryFolders);

/**
 * @swagger
 * /api/goal-folders/{uuid}:
 *   get:
 *     tags: [GoalFolder]
 *     summary: 获取文件夹详情
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文件夹不存在
 */
router.get('/:uuid', GoalFolderController.getFolder);

/**
 * @swagger
 * /api/goal-folders/{uuid}:
 *   patch:
 *     tags: [GoalFolder]
 *     summary: 更新文件夹
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               parentFolderUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 文件夹不存在
 */
router.patch('/:uuid', GoalFolderController.updateFolder);

/**
 * @swagger
 * /api/goal-folders/{uuid}:
 *   delete:
 *     tags: [GoalFolder]
 *     summary: 删除文件夹
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 文件夹不存在
 */
router.delete('/:uuid', GoalFolderController.deleteFolder);

export default router;
