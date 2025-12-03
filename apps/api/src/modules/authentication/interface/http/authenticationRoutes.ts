import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { AuthenticationController } from './AuthenticationController';
import { SessionManagementController } from './SessionManagementController';
import { RegistrationController } from '../../../account/interface/http/RegistrationController';
import { deviceInfoMiddleware } from '../../../../shared/infrastructure/http/middlewares/index';

const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 认证相关接口
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名 (3-20 字符，字母数字下划线)
 *               email:
 *                 type: string
 *                 description: 邮箱地址
 *               password:
 *                 type: string
 *                 description: 密码 (至少 8 字符，包含大小写字母和数字)
 *               profile:
 *                 type: object
 *                 properties:
 *                   nickname:
 *                     type: string
 *                     description: 昵称
 *                   avatarUrl:
 *                     type: string
 *                     description: 头像 URL
 *                   bio:
 *                     type: string
 *                     description: 个人简介
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: object
 *                       description: 账户信息
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *       400:
 *         description: 请求参数错误或验证失败
 *       409:
 *         description: 用户名或邮箱已存在
 *       500:
 *         description: 服务器错误
 */
router.post('/register', deviceInfoMiddleware, RegistrationController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - deviceInfo
 *               - ipAddress
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               deviceInfo:
 *                 type: object
 *               ipAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 用户名或密码错误
 *       403:
 *         description: 账户已锁定
 *       500:
 *         description: 服务器错误
 */
router.post('/login', deviceInfoMiddleware, AuthenticationController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出（单设备）
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 会话不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/logout', AuthenticationController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: 用户登出（全设备）
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *             properties:
 *               accountUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 全设备登出成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 禁止访问
 *       500:
 *         description: 服务器错误
 */
router.post('/logout-all', AuthenticationController.logoutAll);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用 refresh token 刷新 access token。不需要在 Authorization header 中传递 token，refresh token 在请求体中传递。
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionUuid:
 *                       type: string
 *                       description: 会话 UUID
 *                     accessToken:
 *                       type: string
 *                       description: 新的访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: 新的刷新令牌
 *                     expiresAt:
 *                       type: number
 *                       description: 访问令牌过期时间戳
 *                 message:
 *                   type: string
 *                   example: Session refreshed successfully
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: Refresh Token 无效或已过期
 *       404:
 *         description: Session 不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/refresh', SessionManagementController.refreshSession);

// ==================== 以下路由暂未实现，后续补充 ====================

// router.post('/credentials/password', AuthenticationController.createPasswordCredential);
// router.post('/verify-password', AuthenticationController.verifyPassword);

// router.put('/password', AuthenticationController.changePassword);
// router.post('/sessions', AuthenticationController.createSession);
// router.get('/sessions/active/:accountUuid', AuthenticationController.getActiveSessions);
// router.delete('/sessions/:sessionUuid', AuthenticationController.revokeSession);

/**
 * @swagger
 * /api/auth/two-factor/enable:
 *   post:
 *     summary: 启用双因素认证
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - method
 *             properties:
 *               accountUuid:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [TOTP, SMS, EMAIL, AUTHENTICATOR_APP]
 *     responses:
 *       200:
 *         description: 双因素认证已启用
 *       500:
 *         description: 服务器错误
 */
router.post('/two-factor/enable', AuthenticationController.enableTwoFactor);

/**
 * @swagger
 * /api/auth/api-keys:
 *   post:
 *     summary: 生成 API 密钥
 *     tags: [Authentication]
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
 *               expiresInDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: API 密钥生成成功
 *       500:
 *         description: 服务器错误
 */
router.post('/api-keys', AuthenticationController.generateApiKey);

export default router;
