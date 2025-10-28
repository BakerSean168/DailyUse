import { Router } from 'express';
import { GoalController } from './GoalController';
import goalStatisticsRoutes from './goalStatisticsRoutes';

/**
 * Goal 模块路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 * 4. 路由分组：基本CRUD、关键结果、搜索统计
 */

const router: Router = Router();

// ===== 基本 CRUD =====

/**
 * @swagger
 * /api/goals:
 *   get:
 *     tags: [Goal]
 *     summary: 获取当前用户的所有目标
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 返回的最大目标数量
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: 页码
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *         description: 是否包含子目标
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/', GoalController.getUserGoalsByToken);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     tags: [Goal]
 *     summary: 创建目标
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - name
 *               - importance
 *               - urgency
 *             properties:
 *               accountUuid:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               importance:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               urgency:
 *                 type: string
 *                 enum: [NONE, LOW, MEDIUM, HIGH, EMERGENCY]
 *               parentGoalUuid:
 *                 type: string
 *               folderUuid:
 *                 type: string
 *               startDate:
 *                 type: number
 *               deadline:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 目标创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', GoalController.createGoal);

/**
 * @swagger
 * /api/goals/{uuid}:
 *   get:
 *     tags: [Goal]
 *     summary: 获取目标详情
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 目标不存在
 */
router.get('/:uuid', GoalController.getGoal);

/**
 * @swagger
 * /api/goals/{uuid}:
 *   patch:
 *     tags: [Goal]
 *     summary: 更新目标
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               importance:
 *                 type: string
 *               urgency:
 *                 type: string
 *               deadline:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 目标不存在
 */
router.patch('/:uuid', GoalController.updateGoal);

/**
 * @swagger
 * /api/goals/{uuid}:
 *   delete:
 *     tags: [Goal]
 *     summary: 删除目标
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 目标不存在
 */
router.delete('/:uuid', GoalController.deleteGoal);

// ===== 状态管理 =====

/**
 * @swagger
 * /api/goals/{uuid}/activate:
 *   post:
 *     tags: [Goal]
 *     summary: 激活目标
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 激活成功
 */
router.post('/:uuid/activate', GoalController.activateGoal);

/**
 * @swagger
 * /api/goals/{uuid}/complete:
 *   post:
 *     tags: [Goal]
 *     summary: 完成目标
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 完成成功
 */
router.post('/:uuid/complete', GoalController.completeGoal);

/**
 * @swagger
 * /api/goals/{uuid}/archive:
 *   post:
 *     tags: [Goal]
 *     summary: 归档目标
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 归档成功
 */
router.post('/:uuid/archive', GoalController.archiveGoal);

// ===== 关键结果管理 =====

/**
 * @swagger
 * /api/goals/{uuid}/key-results:
 *   post:
 *     tags: [Goal]
 *     summary: 添加关键结果
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - valueType
 *               - targetValue
 *             properties:
 *               name:
 *                 type: string
 *               valueType:
 *                 type: string
 *                 enum: [BOOLEAN, PERCENTAGE, NUMBER]
 *               targetValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               unit:
 *                 type: string
 *               weight:
 *                 type: number
 *     responses:
 *       201:
 *         description: 关键结果添加成功
 */
router.post('/:uuid/key-results', GoalController.addKeyResult);

/**
 * @swagger
 * /api/goals/{uuid}/key-results/{keyResultUuid}/progress:
 *   patch:
 *     tags: [Goal]
 *     summary: 更新关键结果进度
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: keyResultUuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentValue
 *             properties:
 *               currentValue:
 *                 type: number
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 进度更新成功
 */
router.patch('/:uuid/key-results/:keyResultUuid/progress', GoalController.updateKeyResultProgress);

/**
 * @swagger
 * /api/goals/{uuid}/key-results/{keyResultUuid}:
 *   delete:
 *     tags: [Goal]
 *     summary: 删除关键结果
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: keyResultUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:uuid/key-results/:keyResultUuid', GoalController.deleteKeyResult);

/**
 * @swagger
 * /api/goals/{uuid}/reviews:
 *   post:
 *     tags: [Goal]
 *     summary: 添加目标回顾
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - reviewType
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               reviewType:
 *                 type: string
 *               rating:
 *                 type: number
 *               achievements:
 *                 type: string
 *               challenges:
 *                 type: string
 *               nextActions:
 *                 type: string
 *     responses:
 *       201:
 *         description: 回顾添加成功
 */
router.post('/:uuid/reviews', GoalController.addReview);

// ===== 查询和统计 =====

/**
 * @swagger
 * /api/goals/user/{accountUuid}:
 *   get:
 *     tags: [Goal]
 *     summary: 获取用户的所有目标
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeChildren
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/user/:accountUuid', GoalController.getUserGoals);

/**
 * @swagger
 * /api/goals/search:
 *   get:
 *     tags: [Goal]
 *     summary: 搜索目标
 *     parameters:
 *       - in: query
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/search', GoalController.searchGoals);

// ===== 统计路由（新架构 - 事件驱动） =====
// 挂载 Goal 统计路由（使用独立的 Controller 和路由文件）
router.use('', goalStatisticsRoutes);

/**
 * @deprecated 旧统计接口（已废弃）
 * 请使用 GET /api/goals/statistics 替代
 *
 * @swagger
 * /api/goals/statistics/{accountUuid}:
 *   get:
 *     tags: [Goal]
 *     summary: 获取目标统计（已废弃）
 *     deprecated: true
 *     description: 此接口已废弃，请使用 GET /api/goals/statistics（从 token 提取 accountUuid）
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
router.get('/statistics/:accountUuid', GoalController.getGoalStatistics);

export default router;
