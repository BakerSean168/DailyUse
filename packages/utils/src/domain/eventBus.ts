import { CrossPlatformEventBus, type IUnifiedEvent } from './CrossPlatformEventBus';

// ===================== 兼容性类型定义 =====================

export interface DomainEvent<T = unknown> {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  accountUuid?: string;
  payload: T;
}

/**
 * 领域事件处理器类型
 */
type EventHandler<T extends DomainEvent = DomainEvent<unknown>> = (event: T) => Promise<void>;

// ===================== 全局事件总线类 =====================

/**
 * 全局事件总线实例
 * 基于跨平台事件系统实现，提供全局单例访问
 * 向后兼容旧的 EventBus 接口
 */
class EventBus extends CrossPlatformEventBus {
  private static instance: EventBus | null = null;

  private constructor() {
    super();
    console.log('🚀 [EventBus] 初始化全局事件总线（基于 CrossPlatformEventBus）');
  }

  /**
   * 获取全局事件总线单例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 重置事件总线实例（主要用于测试）
   */
  static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.destroy();
      EventBus.instance = null;
    }
  }

  // ===================== 兼容性方法 =====================

  /**
   * 订阅事件（兼容旧接口）
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  subscribeEvent<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    console.log(`📝 [EventBus] 订阅事件: ${eventType}`);
    this.on(eventType, async (event) => await handler(event));
  }

  /**
   * 取消订阅事件（兼容旧接口）
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  unsubscribeEvent(eventType: string, handler?: EventHandler): void {
    console.log(`🗑️ [EventBus] 取消订阅事件: ${eventType}`);
    this.off(eventType, handler as any);
  }

  /**
   * 发布多个事件（兼容旧接口）
   * @param events 事件数组
   */
  async publishMany(events: DomainEvent[]): Promise<void> {
    console.log(`📦 [EventBus] 批量发布 ${events.length} 个事件`);

    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * 清除所有订阅（兼容旧接口）
   */
  clear(): void {
    console.log(`🧹 [EventBus] 清除所有事件订阅`);
    this.removeAllListeners();
  }

  /**
   * 获取已订阅的事件类型（兼容旧接口）
   */
  getSubscribedEventTypes(): string[] {
    return this.getRegisteredEvents();
  }

  // ===================== 扩展功能 =====================

  /**
   * 批量发送事件
   * @param events 事件数组
   */
  async publishBatch(events: IUnifiedEvent[]): Promise<void> {
    console.log(`📦 [EventBus] 批量发布 ${events.length} 个事件`);

    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * 发送延迟事件
   * @param event 事件对象
   * @param delay 延迟时间（毫秒）
   */
  async publishDelayed(event: IUnifiedEvent, delay: number): Promise<void> {
    console.log(`⏰ [EventBus] 延迟 ${delay}ms 发布事件: ${event.eventType}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.publish(event).then(resolve);
      }, delay);
    });
  }

  /**
   * 条件事件发送
   * @param event 事件对象
   * @param condition 条件函数
   */
  async publishConditional(
    event: IUnifiedEvent,
    condition: () => boolean | Promise<boolean>,
  ): Promise<void> {
    const shouldPublish = await condition();
    if (shouldPublish) {
      console.log(`✅ [EventBus] 条件满足，发布事件: ${event.eventType}`);
      await this.publish(event);
    } else {
      console.log(`❌ [EventBus] 条件不满足，跳过事件: ${event.eventType}`);
    }
  }

  /**
   * 事件重试机制
   * @param requestType 请求类型
   * @param payload 请求载荷
   * @param maxRetries 最大重试次数
   * @param retryDelay 重试延迟
   */
  async invokeWithRetry<TResponse = any>(
    requestType: string,
    payload?: any,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): Promise<TResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [EventBus] 请求尝试 ${attempt}/${maxRetries}: ${requestType}`);
        return await this.invoke<TResponse>(requestType, payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          console.warn(`⚠️ [EventBus] 请求失败，${retryDelay}ms 后重试: ${lastError.message}`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // 指数退避
        }
      }
    }

    console.error(`❌ [EventBus] 请求最终失败，已重试 ${maxRetries} 次: ${requestType}`);
    throw lastError;
  }

  /**
   * 获取增强的统计信息
   */
  getEnhancedStats(): {
    handlersCount: number;
    listenersCount: number;
    pendingRequestsCount: number;
    registeredHandlers: string[];
    registeredEvents: string[];
    uptime: number;
    memoryUsage: any;
  } {
    const baseStats = this.getStats();

    return {
      ...baseStats,
      uptime:
        typeof (globalThis as any).process !== 'undefined'
          ? (globalThis as any).process.uptime()
          : Date.now(),
      memoryUsage:
        typeof (globalThis as any).process !== 'undefined'
          ? (globalThis as any).process.memoryUsage()
          : {},
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      handlersRegistered: boolean;
      pendingRequestsNormal: boolean;
      memoryUsageNormal: boolean;
      uptime: number;
    };
  }> {
    const stats = this.getEnhancedStats();
    const memoryUsageMB = stats.memoryUsage.heapUsed / 1024 / 1024;

    const details = {
      handlersRegistered: stats.handlersCount > 0,
      pendingRequestsNormal: stats.pendingRequestsCount < 1000, // 阈值可调整
      memoryUsageNormal: memoryUsageMB < 512, // 512MB 阈值
      uptime: stats.uptime,
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!details.handlersRegistered || !details.memoryUsageNormal) {
      status = 'degraded';
    }

    if (!details.pendingRequestsNormal) {
      status = 'unhealthy';
    }

    // console.log(`🏥 [EventBus] 健康检查: ${status}`, details);

    return { status, details };
  }
}

// ===================== 导出 =====================

/**
 * 便捷的全局事件总线实例
 */
export const eventBus = EventBus.getInstance();

// 导出类供测试使用
export { EventBus };

// 导出跨平台事件系统相关类和类型
export { CrossPlatformEventBus } from './CrossPlatformEventBus';
export type {
  IUnifiedEvent,
  IRequestResponse,
  IEventHandler,
  IRequestHandler,
} from './CrossPlatformEventBus';

// 导出工具函数
export { createEvent, sendTypedEvent, invokeTypedRequest } from './CrossPlatformEventBus';
