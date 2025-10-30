import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { AccountController } from './AccountController';
import { AccountDeletionController } from './AccountDeletionController';
import { AccountMeController } from './AccountMeController';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware';

const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: 账户管理相关接口
 */

/**
 * @swagger
 * /api/accounts/me:
 *   get:
 *     summary: 获取当前用户资料
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户资料
 *       401:
 *         description: 未认证
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/me', authMiddleware, AccountMeController.getMyProfile);

/**
 * @swagger
 * /api/accounts/me:
 *   put:
 *     summary: 更新当前用户资料
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 资料更新成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/me', authMiddleware, AccountMeController.updateMyProfile);

/**
 * @swagger
 * /api/accounts/me/password:
 *   put:
 *     summary: 修改当前用户密码
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: 新密码（至少8字符，包含大小写字母、数字和特殊字符）
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 新密码不符合强度要求
 *       401:
 *         description: 当前密码错误或未认证
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/me/password', authMiddleware, AccountMeController.changeMyPassword);

/**
 * @swagger
 * /api/accounts/me/sessions:
 *   get:
 *     summary: 获取当前用户的活跃会话
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取会话列表
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/me/sessions', authMiddleware, AccountMeController.getMySessions);

/**
 * @swagger
 * /api/accounts/me/sessions/revoke-others:
 *   post:
 *     summary: 撤销所有其他设备的会话
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功撤销所有其他会话
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post('/me/sessions/revoke-others', authMiddleware, AccountMeController.revokeOtherSessions);

/**
 * @swagger
 * /api/accounts/me/sessions/{sessionUuid}:
 *   delete:
 *     summary: 撤销特定会话（登出特定设备）
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话UUID
 *     responses:
 *       200:
 *         description: 成功撤销会话
 *       401:
 *         description: 未认证或无权撤销此会话
 *       404:
 *         description: 会话不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/me/sessions/:sessionUuid', authMiddleware, AccountMeController.revokeMySession);

/**
 * @swagger
 * /api/accounts/me:
 *   delete:
 *     summary: 删除当前用户账户（软删除）
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmationText
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 密码（二次验证）
 *               confirmationText:
 *                 type: string
 *                 description: 确认文本（必须为"DELETE"）
 *               reason:
 *                 type: string
 *                 description: 注销原因
 *               feedback:
 *                 type: string
 *                 description: 用户反馈
 *     responses:
 *       200:
 *         description: 账户删除成功
 *       400:
 *         description: 验证失败
 *       401:
 *         description: 密码错误或未认证
 *       404:
 *         description: 账户不存在
 *       409:
 *         description: 账户已被删除
 *       500:
 *         description: 服务器错误
 */
router.delete('/me', authMiddleware, AccountMeController.deleteMyAccount);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: 创建账户
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: 账户创建成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', AccountController.createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: 列出所有账户
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 账户状态筛选
 *     responses:
 *       200:
 *         description: 成功获取账户列表
 *       500:
 *         description: 服务器错误
 */
router.get('/', AccountController.listAccounts);

/**
 * @swagger
 * /api/accounts/{uuid}:
 *   get:
 *     summary: 获取账户详情
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功获取账户详情
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:uuid', AccountController.getAccount);

/**
 * @swagger
 * /api/accounts/{uuid}/profile:
 *   patch:
 *     summary: 更新账户资料
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               dateOfBirth:
 *                 type: integer
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: 资料更新成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.patch('/:uuid/profile', AccountController.updateProfile);

/**
 * @swagger
 * /api/accounts/{uuid}/verify-email:
 *   post:
 *     summary: 验证邮箱
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:uuid/verify-email', AccountController.verifyEmail);

/**
 * @swagger
 * /api/accounts/{uuid}/deactivate:
 *   post:
 *     summary: 停用账户
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 账户停用成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/:uuid/deactivate', AccountController.deactivateAccount);

/**
 * @swagger
 * /api/accounts/{uuid}:
 *   delete:
 *     summary: 删除账户（管理员用）
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 账户删除成功
 *       404:
 *         description: 账户不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:uuid', AccountController.deleteAccount);

/**
 * @swagger
 * /api/accounts/delete:
 *   post:
 *     summary: 用户主动注销账户
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountUuid
 *               - password
 *             properties:
 *               accountUuid:
 *                 type: string
 *                 format: uuid
 *                 description: 账户UUID
 *               password:
 *                 type: string
 *                 description: 密码（二次验证）
 *               reason:
 *                 type: string
 *                 description: 注销原因
 *               feedback:
 *                 type: string
 *                 description: 用户反馈
 *               confirmationText:
 *                 type: string
 *                 description: 确认文本（必须为"DELETE"）
 *     responses:
 *       200:
 *         description: 账户注销成功
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
 *                     accountUuid:
 *                       type: string
 *                     deletedAt:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       400:
 *         description: 请求参数错误或验证失败
 *       401:
 *         description: 密码错误
 *       404:
 *         description: 账户不存在
 *       409:
 *         description: 账户已被删除
 *       500:
 *         description: 服务器错误
 */
router.post('/delete', AccountDeletionController.deleteAccount);

export default router;
