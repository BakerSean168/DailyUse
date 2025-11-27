/**
 * AI Provider Config Application Service
 * AI 服务提供商配置应用服务
 *
 * 职责（DDD 应用服务层）：
 * - 协调 Provider 配置的 CRUD 操作
 * - 处理 API 连接测试
 * - 管理默认 Provider 状态
 * - DTO 转换
 */

import type { IAIProviderConfigRepository } from '@dailyuse/domain-server';
import { AIProviderConfigServer } from '@dailyuse/domain-server';
import type { AIContracts } from '@dailyuse/contracts';
import { AIProviderType } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';
import { AIAdapterFactory } from '../../infrastructure/adapters/AIAdapterFactory';

type AIProviderConfigClientDTO = AIContracts.AIProviderConfigClientDTO;
type AIProviderConfigServerDTO = AIContracts.AIProviderConfigServerDTO;
type CreateAIProviderRequest = AIContracts.CreateAIProviderRequest;
type UpdateAIProviderRequest = AIContracts.UpdateAIProviderRequest;
type TestAIProviderConnectionRequest = AIContracts.TestAIProviderConnectionRequest;
type TestAIProviderConnectionResponse = AIContracts.TestAIProviderConnectionResponse;
type AIModelInfo = AIContracts.AIModelInfo;

const logger = createLogger('AIProviderConfigService');

/**
 * AI Provider Config Application Service
 */
export class AIProviderConfigService {
  constructor(private readonly providerRepository: IAIProviderConfigRepository) {}

  /**
   * 创建新的 AI Provider 配置
   */
  async createProvider(
    accountUuid: string,
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    // 1. 检查名称唯一性
    const existing = await this.providerRepository.findByAccountUuidAndName(
      accountUuid,
      request.name,
    );
    if (existing) {
      throw new Error(`Provider with name "${request.name}" already exists`);
    }

    // 2. 如果设置为默认，先清除其他默认
    if (request.setAsDefault) {
      await this.providerRepository.clearDefaultForAccount(accountUuid);
    }

    // 3. 创建聚合根
    const provider = AIProviderConfigServer.create({
      accountUuid,
      name: request.name,
      providerType: request.providerType,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
      defaultModel: request.defaultModel,
      isDefault: request.setAsDefault ?? false,
    });

    // 4. 持久化
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('AI Provider created', {
      accountUuid,
      providerName: request.name,
      providerType: request.providerType,
    });

    return provider.toClientDTO();
  }

  /**
   * 获取用户的所有 Provider 配置
   */
  async getProviders(accountUuid: string): Promise<AIProviderConfigClientDTO[]> {
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);
    return providers.map((dto) => AIProviderConfigServer.fromServerDTO(dto).toClientDTO());
  }

  /**
   * 获取单个 Provider 配置
   */
  async getProvider(
    accountUuid: string,
    providerUuid: string,
  ): Promise<AIProviderConfigClientDTO | null> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      return null;
    }
    return AIProviderConfigServer.fromServerDTO(provider).toClientDTO();
  }

  /**
   * 获取用户的默认 Provider
   */
  async getDefaultProvider(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    return this.providerRepository.findDefaultByAccountUuid(accountUuid);
  }

  /**
   * 更新 Provider 配置
   */
  async updateProvider(
    accountUuid: string,
    providerUuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    // 1. 获取现有配置
    const existingDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!existingDTO || existingDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 重建聚合根
    const provider = AIProviderConfigServer.fromServerDTO(existingDTO);

    // 3. 应用更新
    if (request.name !== undefined) {
      // 检查名称唯一性
      const nameConflict = await this.providerRepository.findByAccountUuidAndName(
        accountUuid,
        request.name,
      );
      if (nameConflict && nameConflict.uuid !== providerUuid) {
        throw new Error(`Provider with name "${request.name}" already exists`);
      }
      provider.updateName(request.name);
    }

    if (request.baseUrl !== undefined) {
      provider.updateBaseUrl(request.baseUrl);
    }

    if (request.apiKey !== undefined) {
      provider.updateApiKey(request.apiKey);
    }

    if (request.defaultModel !== undefined) {
      provider.setDefaultModel(request.defaultModel);
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        provider.activate();
      } else {
        provider.deactivate();
      }
    }

    // 4. 持久化
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('AI Provider updated', {
      accountUuid,
      providerUuid,
    });

    return provider.toClientDTO();
  }

  /**
   * 删除 Provider 配置
   */
  async deleteProvider(accountUuid: string, providerUuid: string): Promise<void> {
    // 1. 验证权限
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 删除
    await this.providerRepository.delete(providerUuid);

    logger.info('AI Provider deleted', {
      accountUuid,
      providerUuid,
    });
  }

  /**
   * 设置默认 Provider
   */
  async setDefaultProvider(accountUuid: string, providerUuid: string): Promise<void> {
    // 1. 获取 Provider
    const providerDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!providerDTO || providerDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    const provider = AIProviderConfigServer.fromServerDTO(providerDTO);

    // 2. 清除其他默认
    await this.providerRepository.clearDefaultForAccount(accountUuid);

    // 3. 设置新默认
    provider.setAsDefault();
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('Default AI Provider set', {
      accountUuid,
      providerUuid,
    });
  }

  /**
   * 测试 Provider 连接（保存前测试）
   */
  async testConnection(
    request: TestAIProviderConnectionRequest,
  ): Promise<TestAIProviderConnectionResponse> {
    const startTime = Date.now();

    try {
      const result = await AIAdapterFactory.testConnection({
        providerType: request.providerType,
        baseUrl: request.baseUrl,
        apiKey: request.apiKey,
      });

      // 如果连接成功，尝试获取模型列表
      let models: AIModelInfo[] = [];
      if (result.success) {
        models = await this.fetchModels(request.providerType, request.baseUrl, request.apiKey);
      }

      return {
        success: result.success,
        message: result.success ? 'Connection successful' : result.message,
        models: models.map((m) => ({ id: m.id, name: m.name, description: m.description })),
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Provider connection test failed', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * 测试已保存的 Provider
   */
  async testSavedProvider(
    accountUuid: string,
    providerUuid: string,
  ): Promise<TestAIProviderConnectionResponse> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    return this.testConnection({
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
    });
  }

  /**
   * 刷新 Provider 的模型列表
   */
  async refreshModels(
    accountUuid: string,
    providerUuid: string,
  ): Promise<{ models: AIModelInfo[]; updatedAt: number }> {
    // 1. 获取 Provider
    const providerDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!providerDTO || providerDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 获取模型列表
    const models = await this.fetchModels(
      providerDTO.providerType,
      providerDTO.baseUrl,
      providerDTO.apiKey,
    );

    // 3. 更新 Provider
    const provider = AIProviderConfigServer.fromServerDTO(providerDTO);
    provider.updateAvailableModels(models);
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('Provider models refreshed', {
      accountUuid,
      providerUuid,
      modelCount: models.length,
    });

    return {
      models,
      updatedAt: Date.now(),
    };
  }

  /**
   * 获取 Provider 的模型列表
   * 注意：这是一个简化实现，不同 Provider 可能有不同的 API
   */
  private async fetchModels(
    providerType: AIProviderType,
    baseUrl: string,
    apiKey: string,
  ): Promise<AIModelInfo[]> {
    try {
      // OpenAI 兼容 API 的 /models 端点
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn('Failed to fetch models', {
          status: response.status,
          providerType,
        });
        return this.getDefaultModels(providerType);
      }

      const data = await response.json();
      const models = data.data || data.models || [];

      return models.map((m: any) => ({
        id: m.id,
        name: m.id, // OpenAI API 通常只有 id
        description: m.description || undefined,
        contextWindow: m.context_length || m.context_window || undefined,
      }));
    } catch (error) {
      logger.warn('Failed to fetch models, using defaults', { error, providerType });
      return this.getDefaultModels(providerType);
    }
  }

  /**
   * 获取默认模型列表（当 API 不可用时）
   */
  private getDefaultModels(providerType: AIProviderType): AIModelInfo[] {
    switch (providerType) {
      case AIProviderType.OPENAI:
        return [
          { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        ];
      case AIProviderType.QINIU:
        return [
          { id: 'deepseek-v3', name: 'DeepSeek V3' },
          { id: 'deepseek-chat', name: 'DeepSeek Chat' },
          { id: 'qwen-plus', name: 'Qwen Plus' },
        ];
      case AIProviderType.ANTHROPIC:
        return [
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
      default:
        return [{ id: 'default', name: 'Default Model' }];
    }
  }
}
