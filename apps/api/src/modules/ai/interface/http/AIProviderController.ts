/**
 * AI Provider Controller
 * AI 服务提供商配置控制器
 *
 * 职责：
 * - 处理 Provider 配置相关的 HTTP 请求
 * - 调用 AIProviderConfigService 处理业务逻辑
 * - 格式化响应
 * - 错误处理
 */

import type { Response } from 'express';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { AIProviderType } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../shared/middlewares/authMiddleware';
import { AIContainer } from '../../infrastructure/di/AIContainer';

const logger = createLogger('AIProviderController');

/**
 * AI Provider Controller
 */
export class AIProviderController {
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取 Provider Service
   */
  private static getService() {
    return AIContainer.getInstance().getProviderConfigService();
  }

  /**
   * 创建新的 AI Provider 配置
   * POST /api/ai/providers
   */
  static async createProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { name, providerType, baseUrl, apiKey, defaultModel, setAsDefault } = req.body;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      // 验证必需参数
      if (!name || !providerType || !baseUrl || !apiKey) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'name, providerType, baseUrl, and apiKey are required',
            ),
          );
        return;
      }

      // 验证 providerType
      if (!Object.values(AIProviderType).includes(providerType)) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              `Invalid providerType. Must be one of: ${Object.values(AIProviderType).join(', ')}`,
            ),
          );
        return;
      }

      logger.info('Creating AI Provider', { accountUuid, name, providerType });

      const service = AIProviderController.getService();
      const provider = await service.createProvider(accountUuid, {
        name,
        providerType,
        baseUrl,
        apiKey,
        defaultModel,
        setAsDefault,
      });

      res
        .status(201)
        .json(
          AIProviderController.responseBuilder.success(provider, 'Provider created successfully'),
        );
    } catch (error) {
      logger.error('Failed to create AI Provider', { error });
      res
        .status(500)
        .json(
          AIProviderController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 获取用户的所有 Provider 配置
   * GET /api/ai/providers
   */
  static async getProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      const service = AIProviderController.getService();
      const providers = await service.getProviders(accountUuid);

      res
        .status(200)
        .json(
          AIProviderController.responseBuilder.success(
            providers,
            'Providers retrieved successfully',
          ),
        );
    } catch (error) {
      logger.error('Failed to get AI Providers', { error });
      res
        .status(500)
        .json(
          AIProviderController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 获取单个 Provider 配置
   * GET /api/ai/providers/:uuid
   */
  static async getProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      const service = AIProviderController.getService();
      const provider = await service.getProvider(accountUuid, uuid);

      if (!provider) {
        res
          .status(404)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.NOT_FOUND,
              'Provider not found',
            ),
          );
        return;
      }

      res
        .status(200)
        .json(
          AIProviderController.responseBuilder.success(provider, 'Provider retrieved successfully'),
        );
    } catch (error) {
      logger.error('Failed to get AI Provider', { error });
      res
        .status(500)
        .json(
          AIProviderController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 更新 Provider 配置
   * PUT /api/ai/providers/:uuid
   */
  static async updateProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;
      const { name, baseUrl, apiKey, defaultModel, isActive } = req.body;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      logger.info('Updating AI Provider', { accountUuid, uuid });

      const service = AIProviderController.getService();
      const provider = await service.updateProvider(accountUuid, uuid, {
        name,
        baseUrl,
        apiKey,
        defaultModel,
        isActive,
      });

      res
        .status(200)
        .json(
          AIProviderController.responseBuilder.success(provider, 'Provider updated successfully'),
        );
    } catch (error) {
      logger.error('Failed to update AI Provider', { error });
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(
          AIProviderController.responseBuilder.error(
            statusCode === 404 ? ResponseCode.NOT_FOUND : ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 删除 Provider 配置
   * DELETE /api/ai/providers/:uuid
   */
  static async deleteProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      logger.info('Deleting AI Provider', { accountUuid, uuid });

      const service = AIProviderController.getService();
      await service.deleteProvider(accountUuid, uuid);

      res
        .status(200)
        .json(AIProviderController.responseBuilder.success(null, 'Provider deleted successfully'));
    } catch (error) {
      logger.error('Failed to delete AI Provider', { error });
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(
          AIProviderController.responseBuilder.error(
            statusCode === 404 ? ResponseCode.NOT_FOUND : ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 测试 Provider 连接（保存前测试）
   * POST /api/ai/providers/test
   */
  static async testConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { providerType, baseUrl, apiKey } = req.body;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!providerType || !baseUrl || !apiKey) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'providerType, baseUrl, and apiKey are required',
            ),
          );
        return;
      }

      logger.info('Testing AI Provider connection', { accountUuid, providerType });

      const service = AIProviderController.getService();
      const result = await service.testConnection({
        providerType,
        baseUrl,
        apiKey,
      });

      res.status(200).json(AIProviderController.responseBuilder.success(result, 'Test completed'));
    } catch (error) {
      logger.error('Failed to test AI Provider connection', { error });
      res
        .status(500)
        .json(
          AIProviderController.responseBuilder.error(
            ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 测试已保存的 Provider
   * POST /api/ai/providers/:uuid/test
   */
  static async testSavedProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      logger.info('Testing saved AI Provider', { accountUuid, uuid });

      const service = AIProviderController.getService();
      const result = await service.testSavedProvider(accountUuid, uuid);

      res.status(200).json(AIProviderController.responseBuilder.success(result, 'Test completed'));
    } catch (error) {
      logger.error('Failed to test saved AI Provider', { error });
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(
          AIProviderController.responseBuilder.error(
            statusCode === 404 ? ResponseCode.NOT_FOUND : ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 获取 Provider 的模型列表
   * GET /api/ai/providers/:uuid/models
   */
  static async getModels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      logger.info('Refreshing AI Provider models', { accountUuid, uuid });

      const service = AIProviderController.getService();
      const result = await service.refreshModels(accountUuid, uuid);

      res
        .status(200)
        .json(
          AIProviderController.responseBuilder.success(result, 'Models retrieved successfully'),
        );
    } catch (error) {
      logger.error('Failed to get AI Provider models', { error });
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(
          AIProviderController.responseBuilder.error(
            statusCode === 404 ? ResponseCode.NOT_FOUND : ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }

  /**
   * 设置默认 Provider
   * POST /api/ai/providers/:uuid/set-default
   */
  static async setDefaultProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accountUuid = req.user?.accountUuid;
      const { uuid } = req.params;

      if (!accountUuid) {
        res
          .status(401)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.UNAUTHORIZED,
              'Authentication required',
            ),
          );
        return;
      }

      if (!uuid) {
        res
          .status(400)
          .json(
            AIProviderController.responseBuilder.error(
              ResponseCode.VALIDATION_ERROR,
              'Provider UUID is required',
            ),
          );
        return;
      }

      logger.info('Setting default AI Provider', { accountUuid, uuid });

      const service = AIProviderController.getService();
      await service.setDefaultProvider(accountUuid, uuid);

      res
        .status(200)
        .json(
          AIProviderController.responseBuilder.success(null, 'Default provider set successfully'),
        );
    } catch (error) {
      logger.error('Failed to set default AI Provider', { error });
      const statusCode = (error as Error).message === 'Provider not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(
          AIProviderController.responseBuilder.error(
            statusCode === 404 ? ResponseCode.NOT_FOUND : ResponseCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  }
}




