import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationController');

// ==================== 输入验证 Schemas ====================

/**
 * 登录请求验证
 */
const loginSchema = z.object({
  identifier: z.string().min(3).max(100), // 支持用户名或邮箱
  password: z.string().min(8).max(100),
  deviceInfo: z.object({
    deviceId: z.string(),
    deviceName: z.string(),
    deviceType: z.enum(['WEB', 'MOBILE', 'DESKTOP', 'TABLET', 'OTHER']),
    platform: z.string(),
    browser: z.string().optional(),
    osVersion: z.string().optional(),
  }),
  ipAddress: z.string(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

/**
 * 修改密码请求验证
 */
const changePasswordSchema = z.object({
  accountUuid: z.string().uuid(),
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

/**
 * 验证密码请求验证
 */
const verifyPasswordSchema = z.object({
  accountUuid: z.string().uuid(),
  hashedPassword: z.string(),
});

/**
 * 创建会话请求验证
 */
const createSessionSchema = z.object({
  accountUuid: z.string().uuid(),
  accessToken: z.string(),
  refreshToken: z.string(),
  deviceInfo: z.object({
    deviceId: z.string(),
    deviceName: z.string(),
    deviceType: z.enum(['WEB', 'MOBILE', 'DESKTOP', 'TABLET', 'OTHER']),
    platform: z.string(),
    browser: z.string().optional(),
    osVersion: z.string().optional(),
  }),
  ipAddress: z.string(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

/**
 * 启用双因素认证请求验证
 */
const enableTwoFactorSchema = z.object({
  accountUuid: z.string().uuid(),
  method: z.enum(['TOTP', 'SMS', 'EMAIL', 'AUTHENTICATOR_APP']),
  secret: z.string().optional(),
  verificationCode: z.string().length(6).optional(),
});

/**
 * 生成 API Key 请求验证
 */
const generateApiKeySchema = z.object({
  accountUuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
  scopes: z.array(z.string()).optional(),
});

/**
 * Authentication 控制器
 */
export class AuthenticationController {
  private static authService: AuthenticationApplicationService | null = null;
  private static responseBuilder = createResponseBuilder();

  private static async getAuthService(): Promise<AuthenticationApplicationService> {
    if (!AuthenticationController.authService) {
      AuthenticationController.authService = await AuthenticationApplicationService.getInstance();
    }
    return AuthenticationController.authService;
  }

  /**
   * 用户登录
   * @route POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Login request received', {
        identifier: req.body.identifier,
        ipAddress: req.ip,
      });

      // ===== 步骤 1: 验证输入 =====
      const validatedData = loginSchema.parse(req.body);

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AuthenticationController.getAuthService();
      const result = await service.login({
        identifier: validatedData.identifier,
        password: validatedData.password,
        deviceInfo: validatedData.deviceInfo,
        ipAddress: req.ip || validatedData.ipAddress,
        location: validatedData.location,
      });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AuthenticationController] Login successful', {
        accountUuid: result.account.uuid,
      });

      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        {
          accessToken: result.session.accessToken,
          refreshToken: result.session.refreshToken,
          expiresAt: result.session.expiresAt,
          user: result.account,
        },
        result.message,
        200,
      );
    } catch (error) {
      logger.error('[AuthenticationController] Login failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // ===== 步骤 4: 处理错误 =====
      if (error instanceof z.ZodError) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            code: 'VALIDATION_ERROR',
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('Invalid username or password')) {
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.UNAUTHORIZED,
            message: error.message,
          });
        }

        if (error.message.includes('locked')) {
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: error.message,
          });
        }
      }

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Login failed',
      });
    }
  }

  /**
   * 登出（单设备）
   * @route POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Logout request received');

      // ===== 步骤 1: 提取 accessToken =====
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Access token is required',
        });
      }

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AuthenticationController.getAuthService();
      const result = await service.logout({ accessToken });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AuthenticationController] Logout successful');

      return AuthenticationController.responseBuilder.sendSuccess(res, result, result.message);
    } catch (error) {
      logger.error('[AuthenticationController] Logout failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('already logged out')) {
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }
      }

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Logout failed',
      });
    }
  }

  /**
   * 登出（全设备）
   * @route POST /api/auth/logout-all
   */
  static async logoutAll(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Logout all request received');

      // ===== 步骤 1: 提取参数 =====
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { accountUuid } = req.body;

      if (!accessToken) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Access token is required',
        });
      }

      if (!accountUuid) {
        return AuthenticationController.responseBuilder.sendError(res, {
          code: ResponseCode.VALIDATION_ERROR,
          message: 'Account UUID is required',
        });
      }

      // ===== 步骤 2: 调用 ApplicationService =====
      const service = await AuthenticationController.getAuthService();
      const result = await service.logoutAll({ accountUuid, accessToken });

      // ===== 步骤 3: 返回成功响应 =====
      logger.info('[AuthenticationController] Logout all successful', {
        revokedCount: result.revokedSessionsCount,
      });

      return AuthenticationController.responseBuilder.sendSuccess(res, result, result.message);
    } catch (error) {
      logger.error('[AuthenticationController] Logout all failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.NOT_FOUND,
            message: error.message,
          });
        }

        if (error.message.includes('does not belong')) {
          return AuthenticationController.responseBuilder.sendError(res, {
            code: ResponseCode.FORBIDDEN,
            message: error.message,
          });
        }
      }

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Logout all failed',
      });
    }
  }

  /**
   * 刷新会话
   * @route POST /api/auth/refresh
   * @description 使用 refresh token 刷新 access token
   * @todo 需要使用 SessionManagementApplicationService
   */
  static async refreshSession(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Refresh session request received');

      // TODO: 使用 SessionManagementApplicationService.refreshSession()
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Session refresh - Implementation pending',
      );
    } catch (error) {
      logger.error('[AuthenticationController] Session refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Session refresh failed',
      });
    }
  }

  /**
   * 修改密码
   * @route PUT /api/auth/password/change
   * @description 修改用户密码
   * @todo 需要使用 PasswordManagementApplicationService
   */
  static async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Change password request received');

      // TODO: 验证输入 changePasswordSchema
      // TODO: 使用 PasswordManagementApplicationService.changePassword()
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Password change - Implementation pending',
      );
    } catch (error) {
      logger.error('[AuthenticationController] Password change failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Password change failed',
      });
    }
  }

  /**
   * 启用双因素认证
   * @route POST /api/auth/two-factor/enable
   * @description 为账户启用双因素认证
   * @todo 需要使用 TwoFactorApplicationService
   */
  static async enableTwoFactor(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Enable 2FA request received');

      // TODO: 验证输入 enableTwoFactorSchema
      // TODO: 使用 TwoFactorApplicationService.enableTwoFactor()
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Enable 2FA - Implementation pending',
      );
    } catch (error) {
      logger.error('[AuthenticationController] Enable 2FA failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Enable 2FA failed',
      });
    }
  }

  /**
   * 生成 API 密钥
   * @route POST /api/auth/api-keys
   * @description 为账户生成新的 API 密钥
   * @todo 需要使用 ApiKeyApplicationService
   */
  static async generateApiKey(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('[AuthenticationController] Generate API key request received');

      // TODO: 验证输入 generateApiKeySchema
      // TODO: 使用 ApiKeyApplicationService.generateApiKey()
      return AuthenticationController.responseBuilder.sendSuccess(
        res,
        null,
        'Generate API key - Implementation pending',
        201,
      );
    } catch (error) {
      logger.error('[AuthenticationController] Generate API key failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return AuthenticationController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Generate API key failed',
      });
    }
  }
}
