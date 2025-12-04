/**
 * Create Notification
 *
 * 创建通知用例
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationApiClient,
  CreateNotificationRequest,
} from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '../NotificationContainer';

/**
 * Create Notification Input
 */
export type CreateNotificationInput = CreateNotificationRequest;

/**
 * Create Notification
 */
export class CreateNotification {
  private static instance: CreateNotification;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): CreateNotification {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getNotificationApiClient();
    CreateNotification.instance = new CreateNotification(client);
    return CreateNotification.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateNotification {
    if (!CreateNotification.instance) {
      CreateNotification.instance = CreateNotification.createInstance();
    }
    return CreateNotification.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateNotification.instance = undefined as unknown as CreateNotification;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateNotificationInput): Promise<NotificationClientDTO> {
    return this.apiClient.createNotification(input);
  }
}

/**
 * 便捷函数
 */
export const createNotification = (input: CreateNotificationInput): Promise<NotificationClientDTO> =>
  CreateNotification.getInstance().execute(input);
