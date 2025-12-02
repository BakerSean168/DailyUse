/**
 * Focus Mode Application Service
 * 专注模式应用服务 - 负责 FocusMode 的管理和操作
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 */

import type {
  FocusModeClientDTO,
  ActivateFocusModeRequest,
  ExtendFocusModeRequest,
} from '@dailyuse/contracts/goal';
import { focusModeApiClient } from '../../infrastructure/api/focusModeApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('FocusModeApplicationService');

export class FocusModeApplicationService {
  private static instance: FocusModeApplicationService;

  private constructor() {}

  static getInstance(): FocusModeApplicationService {
    if (!FocusModeApplicationService.instance) {
      FocusModeApplicationService.instance = new FocusModeApplicationService();
    }
    return FocusModeApplicationService.instance;
  }

  /**
   * 启用专注模式
   * @param request - 启用专注模式请求参数
   * @returns 专注周期 DTO
   */
  async activateFocusMode(request: ActivateFocusModeRequest): Promise<FocusModeClientDTO> {
    logger.info('Activating focus mode', { goalCount: request.focusedGoalUuids.length });
    
    const focusMode = await focusModeApiClient.activateFocusMode(request);
    
    logger.info('Focus mode activated', { uuid: focusMode.uuid });
    return focusMode;
  }

  /**
   * 关闭专注模式（手动失效）
   * @param uuid - 专注周期 UUID
   * @returns 失效后的专注周期 DTO
   */
  async deactivateFocusMode(uuid: string): Promise<FocusModeClientDTO> {
    logger.info('Deactivating focus mode', { uuid });
    
    const focusMode = await focusModeApiClient.deactivateFocusMode(uuid);
    
    logger.info('Focus mode deactivated', { uuid });
    return focusMode;
  }

  /**
   * 延期专注模式
   * @param uuid - 专注周期 UUID
   * @param request - 延期请求参数
   * @returns 延期后的专注周期 DTO
   */
  async extendFocusMode(
    uuid: string,
    request: ExtendFocusModeRequest,
  ): Promise<FocusModeClientDTO> {
    logger.info('Extending focus mode', { uuid, newEndTime: request.newEndTime });
    
    const focusMode = await focusModeApiClient.extendFocusMode(uuid, request);
    
    logger.info('Focus mode extended', { uuid });
    return focusMode;
  }

  /**
   * 获取当前活跃的专注周期
   * @returns 活跃的专注周期 DTO，不存在则返回 null
   */
  async getActiveFocusMode(): Promise<FocusModeClientDTO | null> {
    logger.info('Fetching active focus mode');
    
    const focusMode = await focusModeApiClient.getActiveFocusMode();
    
    logger.info('Active focus mode fetched', { hasActive: focusMode !== null });
    return focusMode;
  }

  /**
   * 获取专注周期历史
   * @returns 专注周期 DTO 列表（按创建时间倒序）
   */
  async getFocusModeHistory(): Promise<FocusModeClientDTO[]> {
    logger.info('Fetching focus mode history');
    
    const history = await focusModeApiClient.getFocusModeHistory();
    
    logger.info('Focus mode history fetched', { count: history.length });
    return history;
  }
}

export const focusModeApplicationService = FocusModeApplicationService.getInstance();
