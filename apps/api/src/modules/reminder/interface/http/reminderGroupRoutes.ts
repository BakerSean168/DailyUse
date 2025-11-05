import { Router, type Router as ExpressRouter } from 'express';
import { ReminderGroupController } from './ReminderGroupController';

/**
 * Reminder Group 路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 */

const router: ExpressRouter = Router();

// ===== 提醒分组管理 =====

/**
 * @swagger
 * /api/reminders/groups:
 *   get:
 *     tags: [Reminder Group]
 *     summary: 获取当前用户的所有分组
 *     description: 从认证 token 中提取用户信息，返回该用户的所有提醒分组
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/', ReminderGroupController.getUserReminderGroupsByToken);

/**
 * @swagger
 * /api/reminders/groups:
 *   post:
 *     tags: [Reminder Group]
 *     summary: 创建提醒分组
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: 分组创建成功
 */
router.post('/', ReminderGroupController.createReminderGroup);

/**
 * @swagger
 * /api/reminders/groups/{uuid}:
 *   get:
 *     tags: [Reminder Group]
 *     summary: 获取分组详情
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:uuid', ReminderGroupController.getReminderGroup);

/**
 * @swagger
 * /api/reminders/groups/{uuid}:
 *   patch:
 *     tags: [Reminder Group]
 *     summary: 更新分组
 *     parameters:
 *       - in: path
 *         name: uuid
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
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.patch('/:uuid', ReminderGroupController.updateReminderGroup);

/**
 * @swagger
 * /api/reminders/groups/{uuid}:
 *   delete:
 *     tags: [Reminder Group]
 *     summary: 删除分组
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:uuid', ReminderGroupController.deleteReminderGroup);

/**
 * @swagger
 * /api/reminders/groups/{uuid}/toggle-status:
 *   post:
 *     tags: [Reminder Group]
 *     summary: 切换分组启用状态
 *     description: 在启用和禁用之间切换分组状态
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 切换成功
 */
router.post('/:uuid/toggle-status', ReminderGroupController.toggleReminderGroupStatus);

/**
 * @swagger
 * /api/reminders/groups/{uuid}/toggle-control-mode:
 *   post:
 *     tags: [Reminder Group]
 *     summary: 切换分组控制模式
 *     description: 在组控制和个体控制之间切换
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 切换成功
 */
router.post('/:uuid/toggle-control-mode', ReminderGroupController.toggleReminderGroupControlMode);

/**
 * @swagger
 * /api/reminders/groups/user/{accountUuid}:
 *   get:
 *     tags: [Reminder Group]
 *     summary: 获取用户的所有分组
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/user/:accountUuid', ReminderGroupController.getUserReminderGroups);

export default router;
