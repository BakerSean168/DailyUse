/**
 * Dashboard Routes
 * Dashboard 模块路由配置
 */

import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { DashboardStatisticsController } from './controllers/DashboardStatisticsController';
import { DashboardConfigController } from './controllers/DashboardConfigController';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/index';

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: 仪表盘统计聚合接口
 */

const router: ExpressRouter = Router();

/**
 * @swagger
 * /dashboard/statistics:
 *   get:
 *     tags: [Dashboard]
 *     summary: 获取仪表盘统计数据
 *     description: |
 *       获取聚合的仪表盘统计数据，包含 Task、Goal、Reminder、Schedule 四个模块的统计信息。
 *
 *       **缓存策略:**
 *       - 缓存有效期: 5 分钟 (300 秒)
 *       - 缓存命中时响应时间: ~1-5ms
 *       - 缓存未命中时响应时间: ~50-100ms
 *
 *       **自动失效:**
 *       当任何模块的统计数据更新时，缓存会自动失效
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回仪表盘统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   type: object
 *                   description: 任务模块统计
 *                   properties:
 *                     totalTaskTemplates:
 *                       type: number
 *                       description: 总任务模板数
 *                       example: 25
 *                     activeTaskTemplates:
 *                       type: number
 *                       description: 活跃任务模板数
 *                       example: 18
 *                     completionRate:
 *                       type: number
 *                       description: 完成率 (0-100)
 *                       example: 72.5
 *                     totalInstances:
 *                       type: number
 *                       description: 总实例数
 *                       example: 150
 *                     completedInstances:
 *                       type: number
 *                       description: 已完成实例数
 *                       example: 108
 *                 goal:
 *                   type: object
 *                   description: 目标模块统计
 *                   properties:
 *                     totalGoals:
 *                       type: number
 *                       description: 总目标数
 *                       example: 12
 *                     activeGoals:
 *                       type: number
 *                       description: 活跃目标数
 *                       example: 8
 *                     completionRate:
 *                       type: number
 *                       description: 完成率 (0-100)
 *                       example: 66.7
 *                     avgProgress:
 *                       type: number
 *                       description: 平均进度 (0-100)
 *                       example: 55.3
 *                 reminder:
 *                   type: object
 *                   description: 提醒模块统计
 *                   properties:
 *                     totalReminders:
 *                       type: number
 *                       description: 总提醒数
 *                       example: 30
 *                     activeReminders:
 *                       type: number
 *                       description: 活跃提醒数
 *                       example: 25
 *                     completionRate:
 *                       type: number
 *                       description: 响应率 (0-100)
 *                       example: 85.0
 *                     totalTriggers:
 *                       type: number
 *                       description: 总触发次数
 *                       example: 120
 *                 schedule:
 *                   type: object
 *                   description: 调度模块统计
 *                   properties:
 *                     totalTasks:
 *                       type: number
 *                       description: 总调度任务数
 *                       example: 45
 *                     activeTasks:
 *                       type: number
 *                       description: 活跃任务数
 *                       example: 35
 *                     completionRate:
 *                       type: number
 *                       description: 执行成功率 (0-100)
 *                       example: 92.3
 *                     totalExecutions:
 *                       type: number
 *                       description: 总执行次数
 *                       example: 500
 *                 overall:
 *                   type: object
 *                   description: 总体统计
 *                   properties:
 *                     completionRate:
 *                       type: number
 *                       description: 总体完成率 (加权平均, 0-100)
 *                       example: 79.1
 *             examples:
 *               success:
 *                 summary: 成功响应示例
 *                 value:
 *                   task:
 *                     totalTaskTemplates: 25
 *                     activeTaskTemplates: 18
 *                     completionRate: 72.5
 *                     totalInstances: 150
 *                     completedInstances: 108
 *                   goal:
 *                     totalGoals: 12
 *                     activeGoals: 8
 *                     completionRate: 66.7
 *                     avgProgress: 55.3
 *                   reminder:
 *                     totalReminders: 30
 *                     activeReminders: 25
 *                     completionRate: 85.0
 *                     totalTriggers: 120
 *                   schedule:
 *                     totalTasks: 45
 *                     activeTasks: 35
 *                     completionRate: 92.3
 *                     totalExecutions: 500
 *                   overall:
 *                     completionRate: 79.1
 *       401:
 *         description: 未授权 - 缺少或无效的 JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/statistics', authMiddleware, DashboardStatisticsController.getStatistics);

/**
 * @swagger
 * /dashboard/statistics/invalidate:
 *   post:
 *     tags: [Dashboard]
 *     summary: 手动失效仪表盘缓存
 *     description: |
 *       手动使当前用户的仪表盘统计缓存失效。
 *
 *       **使用场景:**
 *       - 用户手动刷新统计数据
 *       - 测试缓存失效机制
 *       - 强制获取最新数据
 *
 *       **注意:**
 *       通常不需要手动调用，系统会在统计数据更新时自动失效缓存
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 缓存失效成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cache invalidated successfully
 *             examples:
 *               success:
 *                 summary: 成功响应
 *                 value:
 *                   message: Cache invalidated successfully
 *       401:
 *         description: 未授权 - 缺少或无效的 JWT token
 *       500:
 *         description: 服务器内部错误
 */
router.post(
  '/statistics/invalidate',
  authMiddleware,
  DashboardStatisticsController.invalidateCache,
);

/**
 * @swagger
 * /dashboard/cache/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: 获取缓存统计信息 (管理员)
 *     description: |
 *       获取 Redis 缓存的内存使用统计信息。
 *
 *       **管理员功能** - 用于监控和调试
 *
 *       **返回信息:**
 *       - used_memory: 已使用内存 (字节)
 *       - used_memory_human: 已使用内存 (人类可读格式)
 *       - connected_clients: 连接的客户端数量
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回缓存统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 used_memory:
 *                   type: string
 *                   description: 已使用内存 (字节)
 *                   example: "1048576"
 *                 used_memory_human:
 *                   type: string
 *                   description: 已使用内存 (人类可读)
 *                   example: "1.00M"
 *                 connected_clients:
 *                   type: string
 *                   description: 连接的客户端数
 *                   example: "5"
 *             examples:
 *               success:
 *                 summary: 成功响应示例
 *                 value:
 *                   used_memory: "2097152"
 *                   used_memory_human: "2.00M"
 *                   connected_clients: "3"
 *       401:
 *         description: 未授权 - 缺少或无效的 JWT token
 *       503:
 *         description: Redis 服务不可用
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Cache service unavailable
 */
router.get('/cache/stats', authMiddleware, DashboardStatisticsController.getCacheStats);

/**
 * @swagger
 * /dashboard/widget-config:
 *   get:
 *     tags: [Dashboard]
 *     summary: 获取 Widget 配置
 *     description: |
 *       获取当前用户的 Dashboard Widget 配置。
 *       如果用户未配置，返回默认配置。
 *       
 *       **配置项说明:**
 *       - visible: Widget 是否可见
 *       - order: Widget 显示顺序 (数字越小越靠前)
 *       - size: Widget 尺寸 (small/medium/large)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回 Widget 配置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   visible:
 *                     type: boolean
 *                     description: Widget 是否可见
 *                   order:
 *                     type: number
 *                     description: 显示顺序
 *                   size:
 *                     type: string
 *                     enum: [small, medium, large]
 *                     description: Widget 尺寸
 *             examples:
 *               default:
 *                 summary: 默认配置示例
 *                 value:
 *                   task-stats:
 *                     visible: true
 *                     order: 1
 *                     size: medium
 *                   goal-stats:
 *                     visible: true
 *                     order: 2
 *                     size: medium
 *                   reminder-stats:
 *                     visible: true
 *                     order: 3
 *                     size: small
 *                   schedule-stats:
 *                     visible: true
 *                     order: 4
 *                     size: small
 *       401:
 *         description: 未授权
 *   put:
 *     tags: [Dashboard]
 *     summary: 更新 Widget 配置
 *     description: |
 *       更新用户的 Widget 配置（部分更新）。
 *       
 *       **使用场景:**
 *       - 隐藏/显示某个 Widget
 *       - 调整 Widget 显示顺序
 *       - 修改 Widget 尺寸
 *       
 *       **注意:** 只需要传递要更新的配置项，未传递的项保持不变
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - configs
 *             properties:
 *               configs:
 *                 type: object
 *                 description: 要更新的 Widget 配置
 *                 additionalProperties:
 *                   type: object
 *                   properties:
 *                     visible:
 *                       type: boolean
 *                     order:
 *                       type: number
 *                     size:
 *                       type: string
 *                       enum: [small, medium, large]
 *           examples:
 *             hide_reminder:
 *               summary: 隐藏提醒 Widget
 *               value:
 *                 configs:
 *                   reminder-stats:
 *                     visible: false
 *             reorder:
 *               summary: 调整顺序
 *               value:
 *                 configs:
 *                   task-stats:
 *                     order: 2
 *                   goal-stats:
 *                     order: 1
 *             resize:
 *               summary: 调整尺寸
 *               value:
 *                 configs:
 *                   task-stats:
 *                     size: large
 *     responses:
 *       200:
 *         description: 更新成功，返回完整配置
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
router.get('/widget-config', authMiddleware, DashboardConfigController.getWidgetConfig);
router.put('/widget-config', authMiddleware, DashboardConfigController.updateWidgetConfig);

/**
 * @swagger
 * /dashboard/widget-config/reset:
 *   post:
 *     tags: [Dashboard]
 *     summary: 重置 Widget 配置为默认值
 *     description: |
 *       将用户的 Widget 配置重置为系统默认值。
 *       
 *       **使用场景:**
 *       - 用户误操作后恢复默认
 *       - 清除所有自定义配置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 重置成功，返回默认配置
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器内部错误
 */
router.post('/widget-config/reset', authMiddleware, DashboardConfigController.resetWidgetConfig);

export default router;
