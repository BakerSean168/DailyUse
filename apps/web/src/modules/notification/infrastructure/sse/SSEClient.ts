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
  private maxReconnectAttempts = 10; // 增加重连次数
  private reconnectDelay = 1000; // 1秒
  private isConnecting = false;
  private isDestroyed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null; // 连接超时定时器
  private readonly connectionTimeout = 10000; // 10秒连接超时

  constructor(private baseUrl: string = '') {
    // 开发环境使用空字符串（通过 Vite 代理）
    // 生产环境可以从环境变量读取
    if (!baseUrl && typeof window !== 'undefined') {
      // 使用相对路径，通过 Vite 代理访问 API
      this.baseUrl = import.meta.env.VITE_API_URL || '';
    }

    // 监听页面可见性变化，页面重新可见时检查连接
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !this.isDestroyed) {
          console.log('[SSE Client] 页面重新可见，检查连接状态');
          this.checkAndReconnect();
        }
      });
    }

    // 监听 token 刷新事件，token 刷新后自动重连
    this.setupTokenRefreshListener();
  }

  /**
   * 连接到 SSE 端点
   * @description 后端将从 URL 参数中的 token 提取用户信息
   * @description 此方法会立即返回，连接在后台异步建立，不会阻塞应用初始化
   * @param force 是否强制重新连接（关闭现有连接）
   */
  connect(force: boolean = false): Promise<void> {
    console.log('[SSE Client] connect() 被调用，当前状态:', {
      hasEventSource: !!this.eventSource,
      isConnecting: this.isConnecting,
      isDestroyed: this.isDestroyed,
      readyState: this.eventSource?.readyState,
      force,
    });

    // 如果已销毁，重置状态以允许重新连接
    if (this.isDestroyed) {
      console.log('[SSE Client] 重置销毁状态，允许重新连接');
      this.isDestroyed = false;
      this.reconnectAttempts = 0;
    }

    // 如果强制重连，先关闭现有连接
    if (force) {
      console.log('[SSE Client] 强制重连，关闭现有连接');
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.connectTimeout) {
        clearTimeout(this.connectTimeout);
        this.connectTimeout = null;
      }
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }

    // 如果已经有活跃连接，直接返回
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('[SSE Client] 连接已存在且活跃');
      return Promise.resolve();
    }

    // 如果正在连接中，直接返回（除非是强制重连）
    if (this.isConnecting && !force) {
      console.log('[SSE Client] 正在连接中，等待完成');
      return Promise.resolve();
    }

    // 在后台异步建立连接
    this.connectInBackground();
    return Promise.resolve();
  }

  /**
   * 检查连接状态并在需要时重连
   */
  private checkAndReconnect(): void {
    const status = this.getStatus();
    console.log('[SSE Client] 检查连接状态:', status);

    // ✅ 只有在已登录（有 token）时才尝试重连
    const hasToken = AuthManager.isAuthenticated();
    if (!hasToken) {
      console.log('[SSE Client] 用户未登录，跳过重连');
      return;
    }

    if (!status.connected && !this.isDestroyed && !this.isConnecting) {
      console.log('[SSE Client] 连接已断开，尝试重新连接');
      this.connect();
    }
  }

  /**
   * 在后台建立 SSE 连接
   */
  private connectInBackground(): void {
    console.log('[SSE Client] connectInBackground() 被调用');

    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('[SSE Client] 已有活跃连接，跳过');
      return;
    }

    if (this.isConnecting) {
      console.log('[SSE Client] 正在连接中，跳过');
      return;
    }

    // 如果已有连接但状态不是 OPEN，先关闭它
    if (this.eventSource) {
      console.log('[SSE Client] 关闭现有连接，readyState:', this.eventSource.readyState);
      this.eventSource.close();
      this.eventSource = null;
    }

    // 获取认证 token（确保是最新的）
    const token = AuthManager.getAccessToken();
    if (!token) {
      console.warn('[SSE Client] 缺少认证 token，无法建立 SSE 连接（等待用户登录）');
      // ✅ 不再自动重试，等待用户登录后主动调用 connect()
      return;
    }

    // 🔍 验证 token 是否过期
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      
      if (exp && exp < now) {
        console.warn('[SSE Client] ⚠️ Access token 已过期，需要刷新');
        // Token 过期，等待自动刷新后再重连
        this.scheduleTokenRefreshReconnect();
        return;
      }
      
      const timeUntilExpiry = exp ? exp - now : 0;
      console.log(`[SSE Client] 🔑 Token 有效期剩余: ${timeUntilExpiry}秒`);
    } catch (e) {
      console.warn('[SSE Client] ⚠️ 无法解析 token，继续尝试连接');
    }

    this.isConnecting = true;

    // 设置连接超时：如果 10 秒内没有成功连接，强制重置
    this.connectTimeout = setTimeout(() => {
      console.warn('[SSE Client] ⏱️ 连接超时（10秒），强制重置');
      if (this.eventSource && this.eventSource.readyState !== EventSource.OPEN) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.isConnecting = false;

      // 尝试重连
      if (!this.isDestroyed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    }, this.connectionTimeout);

    // 将 token 作为 URL 参数传递（因为 EventSource 不支持自定义请求头）
    const url = `${this.baseUrl}/api/v1/sse/notifications/events?token=${encodeURIComponent(token)}`;

    console.log('[SSE Client] 🚀 正在建立连接到:', url.substring(0, url.indexOf('?token=') + 10) + '...');
    console.log('[SSE Client] 🔑 Token (前20字符):', token.substring(0, 20) + '...');

    try {
      this.eventSource = new EventSource(url);
      console.log('[SSE Client] EventSource 已创建, readyState:', this.eventSource.readyState);
      console.log('[SSE Client] 📊 EventSource 详细信息:', {
        url: this.eventSource.url,
        readyState: this.eventSource.readyState,
        withCredentials: this.eventSource.withCredentials,
      });

      // 添加通用事件监听器（调试用）
      const originalAddEventListener = this.eventSource.addEventListener.bind(this.eventSource);
      (this.eventSource as any).addEventListener = (type: string, listener: any, options?: any) => {
        console.log('[SSE Client] 📝 注册事件监听器:', type);
        return originalAddEventListener(
          type,
          (event: any) => {
            console.log(`[SSE Client] 🔔 事件触发: ${type}`, event);
            return listener(event);
          },
          options,
        );
      };

      // 连接成功
      this.eventSource.onopen = () => {
        console.log(
          '[SSE Client] ✅ onopen 触发 - 连接成功, readyState:',
          this.eventSource?.readyState,
        );
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        // 清除连接超时定时器
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
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

        // 如果 onopen 没有触发，connected 事件也应该清除超时
        if (this.connectTimeout) {
          console.log('[SSE Client] 💡 通过 connected 事件清除连接超时');
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
        if (this.isConnecting) {
          console.log('[SSE Client] 💡 通过 connected 事件重置连接状态');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
        }
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

        // 清除连接超时定时器
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }

        // EventSource 会在连接过程中触发 error，但会自动重试
        // 只有在 CLOSED 状态时才是真正失败了
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.log('[SSE Client] 连接已彻底关闭，尝试重连');
          this.eventSource.close(); // 确保关闭
          this.eventSource = null;
          // 延迟后自动重连，不阻塞应用
          if (!this.isDestroyed) {
            this.attemptReconnect();
          }
        } else if (this.eventSource?.readyState === EventSource.CONNECTING) {
          console.log('[SSE Client] 连接中遇到错误，EventSource 会自动重试');
        }
      };
    } catch (error) {
      console.error('[SSE Client] 创建连接失败:', error);
      this.isConnecting = false;
      // 尝试重连，不抛出错误阻塞应用
      if (!this.isDestroyed) {
        this.reconnectTimer = setTimeout(() => this.connectInBackground(), 2000);
      }
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
          eventBus.emit('notification:created', parsedData);
          break;

        case 'sent':
          eventBus.emit('notification:sent', parsedData);
          break;

        case 'popup-reminder':
          // 转发为前端通知事件
          console.log('[SSE Client] 🔔 转发 popup-reminder 事件到 ui:show-popup-reminder');
          eventBus.emit('ui:show-popup-reminder', parsedData);
          break;

        case 'sound-reminder':
          console.log('[SSE Client] 🔊 转发 sound-reminder 事件到 ui:play-reminder-sound');
          eventBus.emit('ui:play-reminder-sound', parsedData);
          break;

        case 'system-notification':
          console.log('[SSE Client] 📢 转发 system-notification 事件到 system:show-notification');
          eventBus.emit('system:show-notification', parsedData);
          break;

        case 'reminder-triggered':
          eventBus.emit('reminder-triggered', parsedData);
          break;

        case 'task-executed':
          eventBus.emit('schedule:task-executed', parsedData);
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
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`[SSE Client] 已达到最大重连次数 (${this.maxReconnectAttempts})，停止重连`);
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // 最大30秒

    console.log(
      `[SSE Client] 🔄 第 ${this.reconnectAttempts}/${this.maxReconnectAttempts} 次重连尝试，延迟 ${delay}ms`,
    );

    // 清除之前的定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.disconnect();
        this.connectInBackground();
      }
    }, delay);
  }

  /**
   * 在 token 刷新后重新连接
   * @description 当检测到 token 过期时，放弃连接，等待 auth:token-refreshed 事件触发重连
   */
  private scheduleTokenRefreshReconnect(): void {
    console.log('[SSE Client] 📝 Token 已过期，等待系统自动刷新后重连（监听 auth:token-refreshed 事件）');
    
    // 🔥 不再自动重试！等待 auth:token-refreshed 事件触发重连
    // 清除现有连接
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
    
    // 清除定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
  }

  /**
   * 监听 token 刷新事件
   * @description 当 AuthManager 刷新 token 后，自动重连 SSE
   */
  private setupTokenRefreshListener(): void {
    window.addEventListener('auth:token-refreshed', () => {
      console.log('[SSE Client] 🔔 检测到 token 刷新事件，重新连接 SSE');
      if (this.eventSource && !this.isDestroyed) {
        // 强制重连
        this.connect(true);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[SSE Client] 🔌 断开连接');

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 清除连接超时定时器
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }

    if (this.eventSource) {
      console.log('[SSE Client] 关闭 EventSource, readyState:', this.eventSource.readyState);
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    console.log('[SSE Client] 🗑️ 销毁客户端');
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
