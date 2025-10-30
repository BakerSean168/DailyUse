import { apiClient } from '@/shared/api/instances';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * FocusMode API Client
 * 专注周期模式 API 客户端
 *
 * 职责：
 * - 封装 FocusMode 相关的 HTTP 请求
 * - 处理请求参数和响应数据
 * - 统一错误处理（由 apiClient 拦截器处理）
 */
export class FocusModeApiClient {
  private readonly baseUrl = '/goals/focus-mode';

  /**
   * 启用专注模式
   *
   * @param request - 启用专注模式请求参数
   * @returns 专注周期 DTO
   */
  async activateFocusMode(
    request: GoalContracts.ActivateFocusModeRequest,
  ): Promise<GoalContracts.FocusModeClientDTO> {
    const data = await apiClient.post<GoalContracts.FocusModeClientDTO>(this.baseUrl, request);
    return data;
  }

  /**
   * 关闭专注模式（手动失效）
   *
   * @param uuid - 专注周期 UUID
   * @returns 失效后的专注周期 DTO
   */
  async deactivateFocusMode(uuid: string): Promise<GoalContracts.FocusModeClientDTO> {
    const data = await apiClient.delete<GoalContracts.FocusModeClientDTO>(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 延期专注模式
   *
   * @param uuid - 专注周期 UUID
   * @param request - 延期请求参数
   * @returns 延期后的专注周期 DTO
   */
  async extendFocusMode(
    uuid: string,
    request: GoalContracts.ExtendFocusModeRequest,
  ): Promise<GoalContracts.FocusModeClientDTO> {
    const data = await apiClient.patch<GoalContracts.FocusModeClientDTO>(
      `${this.baseUrl}/${uuid}/extend`,
      request,
    );
    return data;
  }

  /**
   * 获取当前活跃的专注周期
   *
   * @returns 活跃的专注周期 DTO，不存在则返回 null
   */
  async getActiveFocusMode(): Promise<GoalContracts.FocusModeClientDTO | null> {
    const data = await apiClient.get<GoalContracts.FocusModeClientDTO | null>(
      `${this.baseUrl}/active`,
    );
    return data;
  }

  /**
   * 获取专注周期历史
   *
   * @returns 专注周期 DTO 列表（按创建时间倒序）
   */
  async getFocusModeHistory(): Promise<GoalContracts.FocusModeClientDTO[]> {
    const data = await apiClient.get<GoalContracts.FocusModeClientDTO[]>(
      `${this.baseUrl}/history`,
    );
    return data;
  }
}

/**
 * 导出单例实例
 */
export const focusModeApiClient = new FocusModeApiClient();
