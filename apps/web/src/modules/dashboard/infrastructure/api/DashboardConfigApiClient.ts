import type { WidgetConfig, DashboardConfigClientDTO, WidgetDefinition } from '@dailyuse/contracts/dashboard';
import { apiClient } from '@/shared/api';

type WidgetConfig = WidgetConfigDTO;

/**
 * Dashboard Widget 配置 API 端点
 */
const API_BASE = '/dashboard';

/**
 * API 响应类型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Dashboard Widget 配置 API Client
 *
 * 提供与后端 Widget Configuration API 的通信接口
 */
export class DashboardConfigApiClient {
  /**
   * 获取用户的 Widget 配置
   *
   * @returns Widget 配置数据
   * @throws Error 如果 API 调用失败
   *
   * @example
   * ```typescript
   * const config = await client.getWidgetConfig();
   * // {
   * //   'task-stats': { visible: true, order: 1, size: 'medium' },
   * //   ...
   * // }
   * ```
   */
  static async getWidgetConfig(): Promise<WidgetConfigData> {
    const startTime = performance.now();
    try {
      console.log('[DashboardConfigApi] 开始请求 widget-config...');

      const data = await apiClient.get<WidgetConfigData>(`${API_BASE}/widget-config`);

      const duration = performance.now() - startTime;
      console.log(`[DashboardConfigApi] Widget config 加载成功，耗时: ${duration.toFixed(2)}ms`);

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[DashboardConfigApi] Widget config 加载失败，耗时: ${duration.toFixed(2)}ms`,
        error,
      );
      throw new Error('获取 Widget 配置失败');
    }
  }

  /**
   * 更新 Widget 配置 (部分更新)
   *
   * @param configs 要更新的 Widget 配置 (支持部分更新)
   * @returns 更新后的完整配置
   * @throws Error 如果 API 调用失败
   *
   * @example
   * ```typescript
   * // 隐藏某个 Widget
   * const updated = await client.updateWidgetConfig({
   *   'reminder-stats': { visible: false }
   * });
   *
   * // 重新排序
   * const reordered = await client.updateWidgetConfig({
   *   'task-stats': { order: 3 },
   *   'goal-stats': { order: 1 }
   * });
   *
   * // 改变尺寸
   * const resized = await client.updateWidgetConfig({
   *   'schedule-stats': { size: 'large' }
   * });
   * ```
   */
  static async updateWidgetConfig(
    configs: Partial<Record<string, Partial<WidgetConfig>>>,
  ): Promise<WidgetConfigData> {
    try {
      const data = await apiClient.put<WidgetConfigData>(`${API_BASE}/widget-config`, { configs });
      return data;
    } catch (error) {
      console.error('[DashboardConfigApi] Failed to update widget config:', error);
      throw new Error('更新 Widget 配置失败');
    }
  }

  /**
   * 重置 Widget 配置为系统默认值
   *
   * @returns 默认配置
   * @throws Error 如果 API 调用失败
   *
   * @example
   * ```typescript
   * const defaultConfig = await client.resetWidgetConfig();
   * // 恢复到系统默认的 4 个 Widget 配置
   * ```
   */
  static async resetWidgetConfig(): Promise<WidgetConfigData> {
    try {
      const data = await apiClient.post<WidgetConfigData>(`${API_BASE}/widget-config/reset`);
      return data;
    } catch (error) {
      console.error('[DashboardConfigApi] Failed to reset widget config:', error);
      throw new Error('重置 Widget 配置失败');
    }
  }
}

