/**
 * AI Conversation Routes
 * AI 对话相关路由
 *
 * RESTful API 设计：
 * - POST /api/ai/chat - 发送消息（普通响应）
 * - POST /api/ai/chat/stream - 发送消息（流式响应）
 * - GET /api/ai/conversations - 获取对话历史
 * - GET /api/ai/conversations/:id - 获取特定对话
 * - GET /api/ai/quota - 获取配额状态
 */

import { Router } from 'express';
import { AIConversationController } from './AIConversationController';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const router: Router = Router();

// 所有 AI 对话路由需要认证
router.use(authMiddleware);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [AI Conversation]
 *     summary: 发送聊天消息（普通响应）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户消息内容
 *               conversationUuid:
 *                 type: string
 *                 description: 对话ID（可选，不提供则创建新对话）
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词（可选）
 *               maxTokens:
 *                 type: number
 *                 description: 最大token数（可选）
 *               temperature:
 *                 type: number
 *                 description: 温度参数（可选，0-2）
 *     responses:
 *       200:
 *         description: 消息发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationUuid:
 *                   type: string
 *                 userMessageUuid:
 *                   type: string
 *                 assistantMessageUuid:
 *                   type: string
 *                 content:
 *                   type: string
 *                 tokensUsed:
 *                   type: number
 *                 quotaRemaining:
 *                   type: number
 *       400:
 *         description: 参数验证失败
 *       401:
 *         description: 未授权
 *       429:
 *         description: 配额超限
 */
router.post('/chat', AIConversationController.sendMessage);

/**
 * @swagger
 * /api/ai/chat/stream:
 *   post:
 *     tags: [AI Conversation]
 *     summary: 发送聊天消息（流式响应 SSE）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户消息内容
 *               conversationUuid:
 *                 type: string
 *                 description: 对话ID（可选）
 *               systemPrompt:
 *                 type: string
 *                 description: 系统提示词（可选）
 *               maxTokens:
 *                 type: number
 *                 description: 最大token数（可选）
 *               temperature:
 *                 type: number
 *                 description: 温度参数（可选，0-2）
 *     responses:
 *       200:
 *         description: Server-Sent Events 流
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   type: string
 *                   enum: [connected, start, chunk, complete, error]
 *                 data:
 *                   type: object
 *       400:
 *         description: 参数验证失败
 *       401:
 *         description: 未授权
 *       429:
 *         description: 配额超限
 */
router.post('/chat/stream', AIConversationController.sendMessageStream);

/**
 * @swagger
 * /api/ai/conversations:
 *   post:
 *     tags: [AI Conversation]
 *     summary: 创建新对话
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 对话标题（可选，默认"New Chat"）
 *     responses:
 *       201:
 *         description: 对话创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: number
 *       401:
 *         description: 未授权
 */
router.post('/conversations', AIConversationController.createConversation);

/**
 * @swagger
 * /api/ai/conversations:
 *   get:
 *     tags: [AI Conversation]
 *     summary: 获取用户的对话历史列表（分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: 页码（默认1）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 每页数量（默认20）
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uuid:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       messageCount:
 *                         type: number
 *                       lastMessageAt:
 *                         type: number
 *                       createdAt:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *       401:
 *         description: 未授权
 */
router.get('/conversations', AIConversationController.getConversations);

/**
 * @swagger
 * /api/ai/conversations/{id}:
 *   get:
 *     tags: [AI Conversation]
 *     summary: 获取特定对话的详细信息（包含消息）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 对话ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                 messageCount:
 *                   type: number
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权访问
 *       404:
 *         description: 对话不存在
 */
router.get('/conversations/:id', AIConversationController.getConversation);

/**
 * @swagger
 * /api/ai/conversations/{id}:
 *   delete:
 *     tags: [AI Conversation]
 *     summary: 删除对话（软删除）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 对话ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *                 conversationUuid:
 *                   type: string
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权访问
 *       404:
 *         description: 对话不存在
 */
router.delete('/conversations/:id', AIConversationController.deleteConversation);

/**
 * @swagger
 * /api/ai/quota:
 *   get:
 *     tags: [AI Conversation]
 *     summary: 获取用户当前的配额状态
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
 *                 remainingQuota:
 *                   type: number
 *                 quotaLimit:
 *                   type: number
 *                 currentUsage:
 *                   type: number
 *                 usagePercentage:
 *                   type: number
 *                 nextResetAt:
 *                   type: number
 *                 isExceeded:
 *                   type: boolean
 *       401:
 *         description: 未授权
 */
router.get('/quota', AIConversationController.getQuotaStatus);

/**
 * @swagger
 * /api/ai/generate/key-results:
 *   post:
 *     tags: [AI Generation]
 *     summary: 生成关键结果（Key Results）
 *     description: 基于目标信息，使用AI生成3-5个SMART的关键结果建议
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
 *               - startDate
 *               - endDate
 *             properties:
 *               goalTitle:
 *                 type: string
 *                 description: 目标标题
 *                 example: "Improve Product Quality"
 *               goalDescription:
 *                 type: string
 *                 description: 目标描述（可选）
 *                 example: "Reduce bugs and improve user satisfaction"
 *               startDate:
 *                 type: number
 *                 description: 目标开始日期时间戳
 *                 example: 1704067200000
 *               endDate:
 *                 type: number
 *                 description: 目标结束日期时间戳
 *                 example: 1719792000000
 *               goalContext:
 *                 type: string
 *                 description: 额外上下文信息（可选）
 *                 example: "SaaS product with 10k users"
 *     responses:
 *       200:
 *         description: 关键结果生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keyResults:
 *                   type: array
 *                   description: 生成的关键结果列表（3-5个）
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: 关键结果标题
 *                       description:
 *                         type: string
 *                         description: 关键结果描述
 *                       valueType:
 *                         type: string
 *                         enum: [INCREMENTAL, ABSOLUTE, PERCENTAGE, BINARY]
 *                       targetValue:
 *                         type: number
 *                         description: 目标值
 *                       currentValue:
 *                         type: number
 *                         description: 当前值
 *                       unit:
 *                         type: string
 *                         description: 单位
 *                       weight:
 *                         type: number
 *                         description: 权重（0-100）
 *                       aggregationMethod:
 *                         type: string
 *                         enum: [SUM, AVERAGE, MAX, MIN, LAST]
 *                 tokenUsage:
 *                   type: object
 *                   properties:
 *                     promptTokens:
 *                       type: number
 *                     completionTokens:
 *                       type: number
 *                     totalTokens:
 *                       type: number
 *                 generatedAt:
 *                   type: number
 *                   description: 生成时间戳
 *       400:
 *         description: 参数验证失败
 *       401:
 *         description: 未授权
 *       429:
 *         description: 配额超限
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "QUOTA_EXCEEDED"
 *       504:
 *         description: AI生成超时（10秒）
 *       500:
 *         description: AI生成失败
 */
router.post('/generate/key-results', AIConversationController.generateKeyResults);

export default router;
