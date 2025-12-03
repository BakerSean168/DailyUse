import { Router } from 'express';
import { SettingController } from './SettingController';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

/**
 * Setting 模块路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 *
 * 注意：
 * - /defaults 无需认证（公开路由）
 * - /me, /reset 需要认证
 */

const router: Router = Router();

// ===== 公开路由 (无需认证) =====

/**
 * @swagger
 * /api/v1/settings/defaults:
 *   get:
 *     tags: [Setting]
 *     summary: 获取默认设置
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/defaults', SettingController.getDefaultSettings);

// ===== 需要认证的路由 =====

/**
 * @swagger
 * /api/v1/settings/me:
 *   get:
 *     tags: [Setting]
 *     summary: 获取当前用户设置
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/me', authMiddleware, SettingController.getCurrentSettings);

/**
 * @swagger
 * /api/v1/settings/me:
 *   put:
 *     tags: [Setting]
 *     summary: 更新当前用户设置
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserSettingDTO'
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未授权
 */
router.put('/me', authMiddleware, SettingController.updateSettings);

/**
 * @swagger
 * /api/v1/settings/reset:
 *   post:
 *     tags: [Setting]
 *     summary: 重置用户设置为默认值
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 重置成功
 *       401:
 *         description: 未授权
 */
router.post('/reset', authMiddleware, SettingController.resetSettings);

// ===== 导入/导出路由 =====

/**
 * @swagger
 * /api/v1/settings/export:
 *   get:
 *     tags: [Setting]
 *     summary: 导出用户设置为 JSON 文件
 *     description: 将当前用户的所有设置导出为 JSON 格式的文件，用于备份或迁移
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 导出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *                 accountUuid:
 *                   type: string
 *                 settings:
 *                   type: object
 *       401:
 *         description: 未授权
 */
router.get('/export', authMiddleware, SettingController.exportSettings);

/**
 * @swagger
 * /api/v1/settings/import:
 *   post:
 *     tags: [Setting]
 *     summary: 导入用户设置
 *     description: 从导出的 JSON 文件导入设置，可选择合并或完全替换现有设置
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: 导出的设置数据
 *                 properties:
 *                   version:
 *                     type: string
 *                   exportedAt:
 *                     type: string
 *                   settings:
 *                     type: object
 *               options:
 *                 type: object
 *                 properties:
 *                   merge:
 *                     type: boolean
 *                     description: 是否合并现有设置（false=完全替换，true=合并）
 *                     default: false
 *                   validate:
 *                     type: boolean
 *                     description: 是否验证导入数据
 *                     default: true
 *     responses:
 *       200:
 *         description: 导入成功
 *       400:
 *         description: 导入数据无效
 *       401:
 *         description: 未授权
 */
router.post('/import', authMiddleware, SettingController.importSettings);

// ===== 云同步路由 =====

/**
 * @swagger
 * /api/v1/settings/sync/save-version:
 *   post:
 *     tags: [Setting Sync]
 *     summary: 保存设置版本快照
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               deviceName:
 *                 type: string
 *               snapshot:
 *                 type: object
 *     responses:
 *       200:
 *         description: 版本保存成功
 *       401:
 *         description: 未授权
 */
router.post('/sync/save-version', authMiddleware, SettingController.saveSettingVersion);

/**
 * @swagger
 * /api/v1/settings/sync/history:
 *   get:
 *     tags: [Setting Sync]
 *     summary: 获取设置版本历史
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: 最多返回多少条记录 (默认10)
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/sync/history', authMiddleware, SettingController.getSettingHistory);

/**
 * @swagger
 * /api/v1/settings/sync/restore:
 *   post:
 *     tags: [Setting Sync]
 *     summary: 恢复设置版本
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               versionUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 版本恢复成功
 *       401:
 *         description: 未授权
 */
router.post('/sync/restore', authMiddleware, SettingController.restoreSettingVersion);

/**
 * @swagger
 * /api/v1/settings/sync/resolve-conflict:
 *   post:
 *     tags: [Setting Sync]
 *     summary: 解决设置冲突
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               local:
 *                 type: object
 *               remote:
 *                 type: object
 *               strategy:
 *                 type: string
 *                 enum: [local, remote, merge]
 *     responses:
 *       200:
 *         description: 冲突解决成功
 *       401:
 *         description: 未授权
 */
router.post('/sync/resolve-conflict', authMiddleware, SettingController.resolveConflict);

/**
 * @swagger
 * /api/v1/settings/sync/status:
 *   get:
 *     tags: [Setting Sync]
 *     summary: 获取同步状态
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/sync/status', authMiddleware, SettingController.getSyncStatus);

/**
 * @swagger
 * /api/v1/settings/sync/cleanup:
 *   delete:
 *     tags: [Setting Sync]
 *     summary: 清理旧版本
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: keepCount
 *         in: query
 *         schema:
 *           type: integer
 *         description: 保留多少条版本记录 (默认10)
 *     responses:
 *       200:
 *         description: 清理成功
 *       401:
 *         description: 未授权
 */
router.delete('/sync/cleanup', authMiddleware, SettingController.cleanupVersions);

export default router;
