/**
 * AI Generation Routes
 * AI 生成相关路由
 *
 * RESTful API 设计：
 * - POST /api/ai/generate/key-results - 生成关键结果
 * - POST /api/ai/generate/task-template - 生成任务模板
 * - POST /api/ai/generate/knowledge-document - 生成知识文档
 * - GET /api/ai/quota - 获取配额状态
 */

import { Router } from 'express';
import { AIGenerationController } from './AIGenerationController';
import { AIConversationController } from './AIConversationController';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const router: Router = Router();

// 所有 AI 路由需要认证
router.use(authMiddleware);

/**
 * @swagger
 * /api/ai/generate/key-results:
 *   post:
 *     tags: [AI]
 *     summary: 生成关键结果（Key Results）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalTitle
 *             properties:
 *               goalTitle:
 *                 type: string
 *                 description: 目标标题
 *               goalDescription:
 *                 type: string
 *                 description: 目标描述
 *               category:
 *                 type: string
 *                 description: 分类
 *               importance:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               urgency:
 *                 type: string
 *                 enum: [NONE, LOW, MEDIUM, HIGH, EMERGENCY]
 *     responses:
 *       200:
 *         description: 生成成功
 *       401:
 *         description: 未授权
 *       422:
 *         description: 参数验证失败
 *       429:
 *         description: 配额超限
 */
router.post('/generate/key-results', AIGenerationController.generateKeyResults);

/**
 * @swagger
 * /api/ai/generate/tasks:
 *   post:
 *     tags: [AI]
 *     summary: 生成任务模板（Tasks）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyResultTitle
 *               - targetValue
 *               - currentValue
 *               - timeRemaining
 *             properties:
 *               keyResultTitle:
 *                 type: string
 *                 description: Key Result 标题
 *                 example: "增加月活用户到 10000"
 *               keyResultDescription:
 *                 type: string
 *                 description: Key Result 描述
 *                 example: "通过优化用户体验和营销活动"
 *               targetValue:
 *                 type: number
 *                 description: 目标值
 *                 example: 10000
 *               currentValue:
 *                 type: number
 *                 description: 当前值
 *                 example: 2000
 *               unit:
 *                 type: string
 *                 description: 单位（可选）
 *                 example: "users"
 *               timeRemaining:
 *                 type: number
 *                 description: 剩余天数
 *                 example: 90
 *     responses:
 *       200:
 *         description: 生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Tasks generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           estimatedHours:
 *                             type: number
 *                           priority:
 *                             type: string
 *                             enum: [HIGH, MEDIUM, LOW]
 *                           dependencies:
 *                             type: array
 *                             items:
 *                               type: number
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                     tokenUsage:
 *                       type: object
 *                       properties:
 *                         promptTokens:
 *                           type: number
 *                         completionTokens:
 *                           type: number
 *                         totalTokens:
 *                           type: number
 *                     generatedAt:
 *                       type: number
 *       401:
 *         description: 未授权
 *       400:
 *         description: 参数验证失败
 *       429:
 *         description: 配额超限
 */
router.post('/generate/tasks', AIConversationController.generateTasks);

/**
 * @swagger
 * /api/ai/generate/task-template:
 *   post:
 *     tags: [AI]
 *     summary: 生成任务模板
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - krTitle
 *               - targetValue
 *               - unit
 *             properties:
 *               krTitle:
 *                 type: string
 *                 description: 关键结果标题
 *               krDescription:
 *                 type: string
 *                 description: 关键结果描述
 *               targetValue:
 *                 type: number
 *                 description: 目标值
 *               unit:
 *                 type: string
 *                 description: 单位
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/generate/task-template', AIGenerationController.generateTaskTemplate);

/**
 * @swagger
 * /api/ai/generate/knowledge-document:
 *   post:
 *     tags: [AI]
 *     summary: 生成知识文档
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - templateType
 *             properties:
 *               topic:
 *                 type: string
 *                 description: 主题
 *               context:
 *                 type: string
 *                 description: 上下文
 *               templateType:
 *                 type: string
 *                 enum: [OVERVIEW, ACTION_GUIDE, BEST_PRACTICE, DATA_ANALYSIS, FAQ]
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/generate/knowledge-document', AIGenerationController.generateKnowledgeDocument);

/**
 * @swagger
 * /api/ai/quota:
 *   get:
 *     tags: [AI]
 *     summary: 获取用户配额状态
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: number
 *                 used:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 usagePercentage:
 *                   type: number
 *                 resetAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/quota', AIGenerationController.getQuotaStatus);

export default router;
