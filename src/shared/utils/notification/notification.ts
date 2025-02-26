interface NotificationOptions {
  title: string
  body: string
  icon?: string
  urgency?: 'normal' | 'critical' | 'low'
  actions?: Array<{
    text: string
    type: 'confirm' | 'cancel' | 'action'
  }>
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationCount = 0;

  private constructor() {
    // 添加空值检查
    if (!window.shared?.ipcRenderer) {
      console.error('Electron IPC Renderer is not available');
      return;
    }
    // 监听通知动作
    window.shared.ipcRenderer.on('notification-action', (_event: any, id: string, action: any) => {
      console.log('Notification action:', id, action);
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private generateId(): string {
    const id = `notification-${Date.now()}-${this.notificationCount++}`;
    console.log('生成通知 ID:', id);
    return id;
  }

  /**
   * 显示桌面通知，关键 show 函数
   * @param options 通知选项
   */
  public async show(options: NotificationOptions): Promise<string> {
    const id = this.generateId();
    try {
      const result = await window.shared.ipcRenderer.invoke('show-notification', {
        id,
        ...options
      });
      return result;
    } catch (error) {
      console.error('显示通知失败:', error);
      return id;
    }
  }

  /**
   * 显示简单通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showSimple(title: string, message: string): Promise<string> {
    return await this.show({
      title,
      body: message,
      urgency: 'normal'
    });
  }

  /**
   * 显示警告通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showWarning(title: string, message: string): Promise<string> {
    return await this.show({
      title,
      body: message,
      urgency: 'critical',
      actions: [
        { text: '我知道了', type: 'confirm' }
      ]
    });
  }
}

// 导出单例实例
export const notification = NotificationService.getInstance();
