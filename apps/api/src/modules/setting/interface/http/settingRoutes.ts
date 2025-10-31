import { Router } from 'express';
import { SettingController } from './SettingController';

/**
 * Setting 模块路由
 *
 * 路由规范：
 * 1. RESTful API 设计
 * 2. 统一的错误处理
 * 3. Swagger/OpenAPI 文档
 */

const router: Router = Router();

// ===== 用户设置 CRUD =====

/**
 * @swagger
 * /api/settings/me:
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
router.get('/me', SettingController.getCurrentSettings);

/**
 * @swagger
 * /api/settings/me:
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
router.put('/me', SettingController.updateSettings);

/**
 * @swagger
 * /api/settings/reset:
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
router.post('/reset', SettingController.resetSettings);

/**
 * @swagger
 * /api/settings/defaults:
 *   get:
 *     tags: [Setting]
 *     summary: 获取默认设置
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/defaults', SettingController.getDefaultSettings);

export default router;
