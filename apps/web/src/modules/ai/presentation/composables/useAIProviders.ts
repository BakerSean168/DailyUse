/**
 * useAIProviders Composable
 * AI 服务提供商配置 Composable
 *
 * 职责：
 * - 管理 AI Provider 配置列表
 * - 提供 CRUD 操作
 * - 连接测试
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { aiProviderApiClient } from '../../infrastructure/api/aiProviderApiClient';
import type { AIContracts } from '@dailyuse/contracts';

type AIProviderConfigClientDTO = AIContracts.AIProviderConfigClientDTO;
type CreateAIProviderRequest = AIContracts.CreateAIProviderRequest;
type UpdateAIProviderRequest = AIContracts.UpdateAIProviderRequest;

interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

interface UseAIProvidersReturn {
  // 状态
  providers: Ref<AIProviderConfigClientDTO[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  testingProviderUuid: Ref<string | null>;

  // 计算属性
  defaultProvider: ComputedRef<AIProviderConfigClientDTO | null>;
  activeProviders: ComputedRef<AIProviderConfigClientDTO[]>;
  hasProviders: ComputedRef<boolean>;

  // 方法
  loadProviders: () => Promise<void>;
  createProvider: (request: CreateAIProviderRequest) => Promise<AIProviderConfigClientDTO | null>;
  updateProvider: (uuid: string, request: UpdateAIProviderRequest) => Promise<boolean>;
  deleteProvider: (uuid: string) => Promise<boolean>;
  testConnection: (uuid: string) => Promise<TestConnectionResult>;
  setDefaultProvider: (uuid: string) => Promise<boolean>;
  getProviderByUuid: (uuid: string) => AIProviderConfigClientDTO | undefined;
}

/**
 * AI Provider 管理 Composable
 */
export function useAIProviders(): UseAIProvidersReturn {
  // ===== 状态 =====
  const providers: Ref<AIProviderConfigClientDTO[]> = ref([]);
  const loading = ref(false);
  const error: Ref<string | null> = ref(null);
  const testingProviderUuid: Ref<string | null> = ref(null);

  // ===== 计算属性 =====
  const defaultProvider = computed(() => {
    return providers.value.find((p) => p.isDefault) || null;
  });

  const activeProviders = computed(() => {
    return providers.value.filter((p) => p.isActive);
  });

  const hasProviders = computed(() => {
    return providers.value.length > 0;
  });

  // ===== 方法 =====

  /**
   * 加载 Provider 列表
   */
  async function loadProviders(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await aiProviderApiClient.getProviders();
      providers.value = response.providers;
    } catch (err: any) {
      error.value = err.message || '加载 AI Provider 失败';
      console.error('Failed to load AI providers:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建 Provider
   */
  async function createProvider(
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await aiProviderApiClient.createProvider(request);
      providers.value.push(response.provider);
      return response.provider;
    } catch (err: any) {
      error.value = err.message || '创建 AI Provider 失败';
      console.error('Failed to create AI provider:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新 Provider
   */
  async function updateProvider(uuid: string, request: UpdateAIProviderRequest): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await aiProviderApiClient.updateProvider(uuid, request);
      const index = providers.value.findIndex((p) => p.uuid === uuid);
      if (index !== -1) {
        providers.value[index] = response.provider;
      }
      return true;
    } catch (err: any) {
      error.value = err.message || '更新 AI Provider 失败';
      console.error('Failed to update AI provider:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除 Provider
   */
  async function deleteProvider(uuid: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await aiProviderApiClient.deleteProvider(uuid);
      providers.value = providers.value.filter((p) => p.uuid !== uuid);
      return true;
    } catch (err: any) {
      error.value = err.message || '删除 AI Provider 失败';
      console.error('Failed to delete AI provider:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 测试连接
   */
  async function testConnection(uuid: string): Promise<TestConnectionResult> {
    testingProviderUuid.value = uuid;
    error.value = null;

    try {
      const response = await aiProviderApiClient.testConnection(uuid);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || '连接测试失败';
      error.value = errorMsg;
      console.error('Failed to test AI provider connection:', err);
      return { success: false, error: errorMsg };
    } finally {
      testingProviderUuid.value = null;
    }
  }

  /**
   * 设为默认 Provider
   */
  async function setDefaultProvider(uuid: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await aiProviderApiClient.setDefaultProvider(uuid);
      // 更新本地状态
      providers.value.forEach((p) => {
        p.isDefault = p.uuid === uuid;
      });
      return true;
    } catch (err: any) {
      error.value = err.message || '设置默认 Provider 失败';
      console.error('Failed to set default AI provider:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取单个 Provider
   */
  function getProviderByUuid(uuid: string): AIProviderConfigClientDTO | undefined {
    return providers.value.find((p) => p.uuid === uuid);
  }

  return {
    // 状态
    providers,
    loading,
    error,
    testingProviderUuid,

    // 计算属性
    defaultProvider,
    activeProviders,
    hasProviders,

    // 方法
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    setDefaultProvider,
    getProviderByUuid,
  };
}
