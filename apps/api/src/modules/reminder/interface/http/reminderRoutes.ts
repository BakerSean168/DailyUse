import { Router, type Router as ExpressRouter } from 'express';
import { ReminderController } from './ReminderController';
import { SmartFrequencyController } from './SmartFrequencyController';

/**
 * Reminder 模块路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 * 4. 路由分组：模板管理、搜索统计、智能频率
 */

const router: ExpressRouter = Router();

// ===== 提醒模板管理 =====

/**
 * @swagger
 * /api/reminders/templates:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取当前用户的所有提醒模板
 *     description: 从认证 token 中提取用户信息，返回该用户的所有提醒模板
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/templates', ReminderController.getUserReminderTemplatesByToken);

/**
 * @swagger
 * /api/reminders/templates:
 *   post:
 *     tags: [Reminder]
 *     summary: 创建提醒模板
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - name
 *               - targetType
 *               - triggerType
 *             properties:
 *               accountUuid:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [TASK, EVENT, GOAL, HABIT, CUSTOM]
 *               triggerType:
 *                 type: string
 *                 enum: [FIXED_TIME, INTERVAL]
 *               advanceMinutes:
 *                 type: number
 *               reminderContent:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 提醒模板创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/templates', ReminderController.createReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取提醒模板详情
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 提醒模板不存在
 */
router.get('/templates/:uuid', ReminderController.getReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   patch:
 *     tags: [Reminder]
 *     summary: 更新提醒模板
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
 *               advanceMinutes:
 *                 type: number
 *               reminderContent:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 提醒模板不存在
 */
router.patch('/templates/:uuid', ReminderController.updateReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}:
 *   delete:
 *     tags: [Reminder]
 *     summary: 删除提醒模板
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
 *         description: 提醒模板不存在
 */
router.delete('/templates/:uuid', ReminderController.deleteReminderTemplate);

/**
 * @swagger
 * /api/reminders/templates/{uuid}/toggle:
 *   post:
 *     tags: [Reminder]
 *     summary: 切换提醒模板启用状态
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 切换成功
 *       404:
 *         description: 提醒模板不存在
 */
router.post('/templates/:uuid/toggle', ReminderController.toggleReminderTemplateStatus);

/**
 * @swagger
 * /api/reminders/templates/{uuid}/move:
 *   post:
 *     tags: [Reminder]
 *     summary: 移动提醒模板到分组
 *     description: 移动提醒模板到指定分组或移出分组（targetGroupUuid 为 null）
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetGroupUuid
 *             properties:
 *               targetGroupUuid:
 *                 type: string
 *                 nullable: true
 *                 description: 目标分组 UUID，null 表示移出分组
 *     responses:
 *       200:
 *         description: 移动成功
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 提醒模板或目标分组不存在
 */
router.post('/templates/:uuid/move', ReminderController.moveTemplateToGroup);

// ===== 查询和统计 =====

/**
 * @swagger
 * /api/reminders/templates/user/{accountUuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取用户的所有提醒模板
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
router.get('/templates/user/:accountUuid', ReminderController.getUserReminderTemplates);

/**
 * @swagger
 * /api/reminders/templates/search:
 *   get:
 *     tags: [Reminder]
 *     summary: 搜索提醒模板
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
router.get('/templates/search', ReminderController.searchReminderTemplates);

/**
 * @swagger
 * /api/reminders/statistics/{accountUuid}:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取提醒统计
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
router.get('/statistics/:accountUuid', ReminderController.getReminderStatistics);

// ===== 即将到来的提醒和调度状态 =====

/**
 * @swagger
 * /api/reminders/upcoming:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取即将到来的提醒（基于调度计算）
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: 未来多少天
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: 返回数量限制
 *       - in: query
 *         name: importanceLevel
 *         schema:
 *           type: string
 *         description: 按重要程度筛选
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 按类型筛选
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/upcoming', ReminderController.getUpcomingReminders);

/**
 * @swagger
 * /api/reminders/templates/{uuid}/schedule-status:
 *   get:
 *     tags: [Reminder]
 *     summary: 获取模板的调度状态
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 提醒模板不存在
 */
router.get('/templates/:uuid/schedule-status', ReminderController.getTemplateScheduleStatus);

// ===== 智能频率调整 =====

/**
 * @swagger
 * /api/reminders/smart-frequency/effectiveness-report/{accountUuid}:
 *   get:
 *     tags: [Smart Frequency]
 *     summary: 获取账户的效果分析报告
 *     description: 分析账户下所有提醒模板的效果,包括高效和低效提醒列表
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户 UUID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accountUuid:
 *                   type: string
 *                 totalTemplates:
 *                   type: number
 *                 avgClickRate:
 *                   type: number
 *                 avgEffectivenessScore:
 *                   type: number
 *                 highEffective:
 *                   type: array
 *                   items:
 *                     type: object
 *                 lowEffective:
 *                   type: array
 *                   items:
 *                     type: object
 *                 analyzedAt:
 *                   type: number
 */
router.get(
  '/smart-frequency/effectiveness-report/:accountUuid',
  SmartFrequencyController.getEffectivenessReport,
);

/**
 * @swagger
 * /api/reminders/smart-frequency/analyze/{templateId}:
 *   post:
 *     tags: [Smart Frequency]
 *     summary: 分析单个提醒模板的效果
 *     description: 分析指定提醒模板的响应指标并计算效果评分
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lookbackDays:
 *                 type: number
 *                 default: 30
 *                 description: 回溯分析天数
 *     responses:
 *       200:
 *         description: 分析成功
 *       400:
 *         description: 数据不足(需要至少10条响应记录)
 */
router.post('/smart-frequency/analyze/:templateId', SmartFrequencyController.analyzeTemplate);

/**
 * @swagger
 * /api/reminders/smart-frequency/suggestion/{templateId}:
 *   get:
 *     tags: [Smart Frequency]
 *     summary: 获取频率调整建议
 *     description: 基于效果分析生成频率调整建议
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 needsAdjustment:
 *                   type: boolean
 *                 suggestion:
 *                   type: object
 *                   properties:
 *                     originalInterval:
 *                       type: number
 *                     adjustedInterval:
 *                       type: number
 *                     reason:
 *                       type: string
 */
router.get(
  '/smart-frequency/suggestion/:templateId',
  SmartFrequencyController.getAdjustmentSuggestion,
);

/**
 * @swagger
 * /api/reminders/smart-frequency/accept-adjustment/{templateId}:
 *   post:
 *     tags: [Smart Frequency]
 *     summary: 接受频率调整建议
 *     description: 用户确认并应用频率调整建议
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     responses:
 *       200:
 *         description: 调整已接受并应用
 *       400:
 *         description: 没有待确认的调整建议
 */
router.post(
  '/smart-frequency/accept-adjustment/:templateId',
  SmartFrequencyController.acceptAdjustment,
);

/**
 * @swagger
 * /api/reminders/smart-frequency/reject-adjustment/{templateId}:
 *   post:
 *     tags: [Smart Frequency]
 *     summary: 拒绝频率调整建议
 *     description: 用户拒绝频率调整建议,保持原频率不变
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     responses:
 *       200:
 *         description: 调整已拒绝
 *       400:
 *         description: 没有待确认的调整建议
 */
router.post(
  '/smart-frequency/reject-adjustment/:templateId',
  SmartFrequencyController.rejectAdjustment,
);

/**
 * @swagger
 * /api/reminders/smart-frequency/toggle/{templateId}:
 *   post:
 *     tags: [Smart Frequency]
 *     summary: 切换智能频率功能
 *     description: 启用或禁用指定提醒模板的智能频率调整功能
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: 是否启用智能频率
 *     responses:
 *       200:
 *         description: 切换成功
 */
router.post('/smart-frequency/toggle/:templateId', SmartFrequencyController.toggleSmartFrequency);

/**
 * @swagger
 * /api/reminders/smart-frequency/record-response:
 *   post:
 *     tags: [Smart Frequency]
 *     summary: 记录用户响应行为
 *     description: 记录用户对提醒的响应行为(点击/忽略/延迟等),用于后续分析
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - action
 *             properties:
 *               templateId:
 *                 type: string
 *                 description: 提醒模板 UUID
 *               action:
 *                 type: string
 *                 enum: [clicked, ignored, snoozed, dismissed, completed]
 *                 description: 响应行为类型
 *               responseTime:
 *                 type: number
 *                 description: 响应时间(秒)
 *     responses:
 *       200:
 *         description: 响应已记录
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 提醒模板不存在
 */
router.post('/smart-frequency/record-response', SmartFrequencyController.recordResponse);

/**
 * @swagger
 * /api/reminders/smart-frequency/response-stats/{templateId}:
 *   get:
 *     tags: [Smart Frequency]
 *     summary: 获取响应统计
 *     description: 获取指定提醒模板的响应统计信息
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提醒模板 UUID
 *       - in: query
 *         name: lookbackDays
 *         schema:
 *           type: number
 *           default: 30
 *         description: 回溯天数
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 clicked:
 *                   type: number
 *                 ignored:
 *                   type: number
 *                 snoozed:
 *                   type: number
 *                 dismissed:
 *                   type: number
 *                 completed:
 *                   type: number
 *                 avgResponseTime:
 *                   type: number
 */
router.get(
  '/smart-frequency/response-stats/:templateId',
  SmartFrequencyController.getResponseStats,
);

export default router;
