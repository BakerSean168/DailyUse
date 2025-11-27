/**
 * AI Routes (Unified)
 * AI 模块统一路由
 *
 * RESTful API 设计：
 *
 * === AI Provider 配置 ===
 * - POST /api/ai/providers - 创建 AI Provider 配置
 * - GET /api/ai/providers - 获取用户的 AI Provider 列表
 * - GET /api/ai/providers/:uuid - 获取特定 Provider 详情
 * - PUT /api/ai/providers/:uuid - 更新 Provider 配置
 * - DELETE /api/ai/providers/:uuid - 删除 Provider 配置
 * - POST /api/ai/providers/:uuid/test - 测试 Provider 连接
 * - POST /api/ai/providers/:uuid/set-default - 设为默认 Provider
 *
 * === AI 生成相关 ===
 * - POST /api/ai/generate/goal - 生成 Goal（从用户想法）
 * - POST /api/ai/generate/key-results - 生成关键结果
 * - POST /api/ai/generate/tasks - 生成任务模板
 * - POST /api/ai/generate/task-template - 生成任务模板（旧版）
 * - POST /api/ai/generate/knowledge-document - 生成知识文档
 * - POST /api/ai/generate/knowledge-series - 创建知识系列生成任务
 *
 * === AI 对话相关 ===
 * - POST /api/ai/chat - 发送消息（普通响应）
 * - POST /api/ai/chat/stream - 发送消息（流式响应）
 * - POST /api/ai/conversations - 创建对话
 * - GET /api/ai/conversations - 获取对话历史
 * - GET /api/ai/conversations/:id - 获取特定对话
 * - DELETE /api/ai/conversations/:id - 删除对话
 *
 * === 其他 ===
 * - GET /api/ai/quota - 获取配额状态
 * - POST /api/ai/summarize - 文档摘要
 * - GET /api/ai/generation-tasks/:taskUuid - 获取生成任务状态
 * - GET /api/ai/generation-tasks/:taskUuid/documents - 获取生成的文档列表
 */

import { Router } from 'express';
import { AIGenerationController } from './AIGenerationController';
import { AIConversationController } from './AIConversationController';
import { AIProviderController } from './AIProviderController';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const router: Router = Router();

// 所有 AI 路由需要认证
router.use(authMiddleware);

// ==================== AI Provider 配置路由 ====================

/**
 * @swagger
 * /api/ai/providers:
 *   post:
 *     tags: [AI Provider]
 *     summary: 创建 AI Provider 配置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - providerType
 *               - apiKey
 *             properties:
 *               name:
 *                 type: string
 *               providerType:
 *                 type: string
 *                 enum: [OPENAI, ANTHROPIC, QINIU, DEEPSEEK, AZURE_OPENAI, CUSTOM]
 *               baseUrl:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               models:
 *                 type: array
 *                 items:
 *                   type: object
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Provider 创建成功
 */
router.post('/providers', AIProviderController.createProvider);

/**
 * @swagger
 * /api/ai/providers:
 *   get:
 *     tags: [AI Provider]
 *     summary: 获取用户的 AI Provider 列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/providers', AIProviderController.getProviders);

/**
 * @swagger
 * /api/ai/providers/{uuid}:
 *   get:
 *     tags: [AI Provider]
 *     summary: 获取特定 Provider 详情
 *     security:
 *       - bearerAuth: []
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
router.get('/providers/:uuid', AIProviderController.getProvider);

/**
 * @swagger
 * /api/ai/providers/{uuid}:
 *   put:
 *     tags: [AI Provider]
 *     summary: 更新 Provider 配置
 *     security:
 *       - bearerAuth: []
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
 *               baseUrl:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               models:
 *                 type: array
 *               isDefault:
 *                 type: boolean
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/providers/:uuid', AIProviderController.updateProvider);

/**
 * @swagger
 * /api/ai/providers/{uuid}:
 *   delete:
 *     tags: [AI Provider]
 *     summary: 删除 Provider 配置
 *     security:
 *       - bearerAuth: []
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
router.delete('/providers/:uuid', AIProviderController.deleteProvider);

/**
 * @swagger
 * /api/ai/providers/{uuid}/test:
 *   post:
 *     tags: [AI Provider]
 *     summary: 测试 Provider 连接
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 测试成功
 */
router.post('/providers/:uuid/test', AIProviderController.testConnection);

/**
 * @swagger
 * /api/ai/providers/{uuid}/set-default:
 *   post:
 *     tags: [AI Provider]
 *     summary: 设为默认 Provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 设置成功
 */
router.post('/providers/:uuid/set-default', AIProviderController.setDefaultProvider);

// ==================== AI 生成路由 ====================

/**
 * @swagger
 * /api/ai/generate/goal:
 *   post:
 *     tags: [AI Generation]
 *     summary: 从用户想法生成 Goal（包含 Key Results）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idea
 *             properties:
 *               idea:
 *                 type: string
 *                 description: 用户的原始想法
 *               context:
 *                 type: string
 *                 description: 额外上下文（可选）
 *               providerUuid:
 *                 type: string
 *                 description: 指定使用的 AI Provider（可选，默认使用默认 Provider）
 *     responses:
 *       200:
 *         description: 生成成功，返回 Goal 预览
 */
router.post('/generate/goal', AIGenerationController.generateGoal);

/**
 * @swagger
 * /api/ai/generate/key-results:
 *   post:
 *     tags: [AI Generation]
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
 *               - startDate
 *               - endDate
 *             properties:
 *               goalTitle:
 *                 type: string
 *               goalDescription:
 *                 type: string
 *               startDate:
 *                 type: number
 *               endDate:
 *                 type: number
 *               goalContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/generate/key-results', AIGenerationController.generateKeyResults);

/**
 * @swagger
 * /api/ai/generate/tasks:
 *   post:
 *     tags: [AI Generation]
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
 *               targetValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               timeRemaining:
 *                 type: number
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/generate/tasks', AIConversationController.generateTasks);

/**
 * @swagger
 * /api/ai/generate/task-template:
 *   post:
 *     tags: [AI Generation]
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
 *               targetValue:
 *                 type: number
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: 生成成功
 */
router.post('/generate/task-template', AIGenerationController.generateTaskTemplate);

/**
 * @swagger
 * /api/ai/generate/knowledge-document:
 *   post:
 *     tags: [AI Generation]
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
 *               context:
 *                 type: string
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
 * /api/ai/generate/knowledge-series:
 *   post:
 *     tags: [AI Generation]
 *     summary: 创建知识系列生成任务
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
 *             properties:
 *               topic:
 *                 type: string
 *               documentCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: 任务创建成功
 */
router.post('/generate/knowledge-series', AIConversationController.createKnowledgeGenerationTask);

// ==================== AI 对话路由 ====================

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
 *               conversationUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 发送成功
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
 *               conversationUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Server-Sent Events 流
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
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
 *     responses:
 *       201:
 *         description: 对话创建成功
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: 获取成功
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
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/conversations/:id', AIConversationController.getConversation);

/**
 * @swagger
 * /api/ai/conversations/{id}:
 *   delete:
 *     tags: [AI Conversation]
 *     summary: 软删除对话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/conversations/:id', AIConversationController.deleteConversation);

// ==================== 其他功能路由 ====================

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
 */
router.get('/quota', AIConversationController.getQuotaStatus);

/**
 * @swagger
 * /api/ai/summarize:
 *   post:
 *     tags: [AI]
 *     summary: 文档摘要
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               maxLength:
 *                 type: number
 *     responses:
 *       200:
 *         description: 摘要生成成功
 */
router.post('/summarize', AIConversationController.summarizeDocument);

/**
 * @swagger
 * /api/ai/generation-tasks/{taskUuid}:
 *   get:
 *     tags: [AI Generation]
 *     summary: 获取生成任务状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/generation-tasks/:taskUuid', AIConversationController.getKnowledgeGenerationTask);

/**
 * @swagger
 * /api/ai/generation-tasks/{taskUuid}/documents:
 *   get:
 *     tags: [AI Generation]
 *     summary: 获取生成的文档列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/generation-tasks/:taskUuid/documents', AIConversationController.getGeneratedDocuments);

export default router;
