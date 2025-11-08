/**
 * Server-Sent Events (SSE) 客户端
 * @description 连接后端 SSE 端点，接收实时调度事件
 * @note 由于原生 EventSource 不支持自定义请求头，我们将 token 作为 URL 参数传递
 */

import { eventBus } from '@dailyuse/utils';
import { AuthManager } from '@/shared/api/core/interceptors';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * SSE 客户端管理器
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private isConnecting = false;
  private isDestroyed = false;

  constructor(private baseUrl: string = 'http://localhost:3888') {}

  /**
   * 连接到 SSE 端点
   * @description 后端将从 URL 参数中的 token 提取用户信息
   * @description 此方法会立即返回，连接在后台异步建立，不会阻塞应用初始化
   */
  connect(): Promise<void> {
    // 不阻塞初始化，立即返回，连接在后台进行
    if (this.eventSource || this.isConnecting) {
      console.log('[SSE Client] 连接已存在或正在连接中');
      return Promise.resolve();
    }

    // 在后台异步建立连接
    this.connectInBackground();
    return Promise.resolve();
  }

  /**
   * 在后台建立 SSE 连接
   */
  private connectInBackground(): void {
    if (this.eventSource || this.isConnecting) {
      return;
    }

    // 获取认证 token
    const token = AuthManager.getAccessToken();
    if (!token) {
      console.error('[SSE Client] 缺少认证 token，无法建立 SSE 连接');
      // 1秒后重试
      setTimeout(() => this.connectInBackground(), 1000);
      return;
    }

    this.isConnecting = true;
    // 将 token 作为 URL 参数传递（因为 EventSource 不支持自定义请求头）
    const url = `${this.baseUrl}/api/v1/sse/notifications/events?token=${encodeURIComponent(token)}`;

    console.log('[SSE Client] 连接到:', this.baseUrl + '/api/v1/sse/notifications/events');

    try {
      this.eventSource = new EventSource(url);
      console.log('[SSE Client] EventSource 已创建, readyState:', this.eventSource.readyState);

      // 连接成功
      this.eventSource.onopen = () => {
        console.log(
          '[SSE Client] ✅ onopen 触发 - 连接成功, readyState:',
          this.eventSource?.readyState,
        );
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      // 接收消息
      this.eventSource.onmessage = (event) => {
        console.log('[SSE Client] 收到默认消息:', event.data);
        this.handleMessage('message', event.data);
      };

      // 连接建立事件
      this.eventSource.addEventListener('connected', (event) => {
        console.log('[SSE Client] 🔗 连接建立事件触发:', event.data);
        this.handleMessage('connected', event.data);
      });

      // 心跳事件
      this.eventSource.addEventListener('heartbeat', (event) => {
        console.log('[SSE Client] 💓 心跳:', event.data);
      });

      // 通知事件
      this.eventSource.addEventListener('notification:created', (event) => {
        console.log('[SSE Client] 📩 通知创建事件:', event.data);
        this.handleNotificationEvent('created', event.data);
      });

      this.eventSource.addEventListener('notification:sent', (event) => {
        console.log('[SSE Client] 📤 通知发送事件:', event.data);
        this.handleNotificationEvent('sent', event.data);
      });

      this.eventSource.addEventListener('notification:popup-reminder', (event) => {
        console.log('[SSE Client] 🔔 弹窗提醒事件:', event.data);
        this.handleNotificationEvent('popup-reminder', event.data);
      });

      this.eventSource.addEventListener('notification:sound-reminder', (event) => {
        console.log('[SSE Client] 🔊 声音提醒事件:', event.data);
        this.handleNotificationEvent('sound-reminder', event.data);
      });

      this.eventSource.addEventListener('notification:system-notification', (event) => {
        console.log('[SSE Client] 📢 系统通知事件:', event.data);
        this.handleNotificationEvent('system-notification', event.data);
      });

      this.eventSource.addEventListener('notification:reminder-triggered', (event) => {
        console.log('[SSE Client] 📨 Reminder 触发事件:', event.data);
        this.handleNotificationEvent('reminder-triggered', event.data);
      });

      this.eventSource.addEventListener('notification:task-executed', (event) => {
        console.log('[SSE Client] ⚡ 任务执行事件:', event.data);
        this.handleNotificationEvent('task-executed', event.data);
      });

      // 连接错误
      this.eventSource.onerror = (error) => {
        console.error('[SSE Client] ❌ onerror 触发, readyState:', this.eventSource?.readyState);
        console.error('[SSE Client] Error event:', error);
        this.isConnecting = false;

        // EventSource 会在连接过程中触发 error，但会自动重试
        // 只有在 CLOSED 状态时才是真正失败了
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.log('[SSE Client] 连接已彻底关闭，尝试重连');
          this.eventSource = null;
          // 延迟后自动重连，不阻塞应用
          this.attemptReconnect();
        }
        // 如果是 CONNECTING 状态，说明正在重试，不做处理
      };
    } catch (error) {
      console.error('[SSE Client] 创建连接失败:', error);
      this.isConnecting = false;
      // 尝试重连，不抛出错误阻塞应用
      setTimeout(() => this.connectInBackground(), 2000);
    }
  }

  /**
   * 处理通用消息
   */
  private handleMessage(type: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      eventBus.emit(`sse:${type}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 解析消息失败:', error);
    }
  }

  /**
   * 处理通知事件
   */
  private handleNotificationEvent(eventType: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      console.log(`[SSE Client] 处理通知事件 ${eventType}:`, parsedData);

      // 根据事件类型转发到前端事件总线
      switch (eventType) {
        case 'created':
          eventBus.emit('notification:created', parsedData.data);
          break;

        case 'sent':
          eventBus.emit('notification:sent', parsedData.data);
          break;

        case 'popup-reminder':
          // 转发为前端通知事件
          eventBus.emit('ui:show-popup-reminder', parsedData.data);
          break;

        case 'sound-reminder':
          eventBus.emit('ui:play-reminder-sound', parsedData.data);
          break;

        case 'system-notification':
          eventBus.emit('system:show-notification', parsedData.data);
          break;

        case 'reminder-triggered':
          eventBus.emit('reminder-triggered', parsedData.data);
          break;

        case 'task-executed':
          eventBus.emit('schedule:task-executed', parsedData.data);
          break;

        default:
          console.warn('[SSE Client] 未知通知事件类型:', eventType);
      }

      // 同时发送通用的 SSE 事件
      eventBus.emit(`sse:notification:${eventType}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 处理通知事件失败:', error, data);
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SSE Client] 停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // 最大30秒

    console.log(`[SSE Client] 第 ${this.reconnectAttempts} 次重连尝试，延迟 ${delay}ms`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.disconnect();
        this.connect()
          .then(() => {
            console.log('[SSE Client] 重连尝试完成');
          })
          .catch((error) => {
            console.error('[SSE Client] 重连失败:', error);
          });
      }
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('[SSE Client] 断开连接');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    console.log('[SSE Client] 销毁客户端');
    this.isDestroyed = true;
    this.disconnect();
  }

  /**
   * 获取连接状态
   */
  getStatus(): { connected: boolean; readyState: number | null; reconnectAttempts: number } {
    return {
      connected: this.eventSource?.readyState === EventSource.OPEN,
      readyState: this.eventSource?.readyState || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// 创建全局实例
export const sseClient = new SSEClient();
