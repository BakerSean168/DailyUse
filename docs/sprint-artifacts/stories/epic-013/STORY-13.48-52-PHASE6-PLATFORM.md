# Stories 13.48-13.52: Phase 6 平台功能

## Story 13.48: Shortcuts 全局快捷键

| 属性 | 值 |
|------|-----|
| Story ID | 13.48 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |

### 目标
实现全局快捷键系统。

### 任务列表
- [ ] ShortcutsIPCClient 实现
- [ ] 全局快捷键注册
- [ ] 快捷键冲突检测
- [ ] 自定义快捷键设置

### 技术设计

```typescript
export class ShortcutsIPCClient extends BaseIPCClient {
  async register(shortcut: ShortcutConfig): Promise<void> {
    return this.invoke(IPC_CHANNELS.SHORTCUTS.REGISTER, shortcut);
  }

  async unregister(id: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.SHORTCUTS.UNREGISTER, { id });
  }

  async getAll(): Promise<ShortcutConfig[]> {
    return this.invoke(IPC_CHANNELS.SHORTCUTS.GET_ALL);
  }

  async checkConflict(accelerator: string): Promise<ConflictInfo | null> {
    return this.invoke(IPC_CHANNELS.SHORTCUTS.CHECK_CONFLICT, { accelerator });
  }

  onTriggered(callback: (shortcutId: string) => void): () => void {
    const handler = (_: any, id: string) => callback(id);
    window.electronAPI.on(IPC_CHANNELS.SHORTCUTS.TRIGGERED, handler);
    return () => window.electronAPI.off(IPC_CHANNELS.SHORTCUTS.TRIGGERED, handler);
  }
}
```

### 默认快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + N` | 新建任务 |
| `Cmd/Ctrl + Shift + N` | 新建目标 |
| `Cmd/Ctrl + F` | 搜索 |
| `Cmd/Ctrl + Shift + F` | 开始专注 |
| `Cmd/Ctrl + ,` | 打开设置 |
| `Cmd/Ctrl + Q` | 退出应用 |

---

## Story 13.49: Window 窗口管理

| 属性 | 值 |
|------|-----|
| Story ID | 13.49 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |

### 目标
实现窗口管理功能。

### 任务列表
- [ ] WindowIPCClient 实现
- [ ] 窗口状态保存/恢复
- [ ] 多窗口管理
- [ ] 窗口置顶
- [ ] 全屏模式

### 技术设计

```typescript
export class WindowIPCClient extends BaseIPCClient {
  async minimize(): Promise<void> {
    return this.invoke(IPC_CHANNELS.WINDOW.MINIMIZE);
  }

  async maximize(): Promise<void> {
    return this.invoke(IPC_CHANNELS.WINDOW.MAXIMIZE);
  }

  async close(): Promise<void> {
    return this.invoke(IPC_CHANNELS.WINDOW.CLOSE);
  }

  async setAlwaysOnTop(value: boolean): Promise<void> {
    return this.invoke(IPC_CHANNELS.WINDOW.SET_ALWAYS_ON_TOP, { value });
  }

  async openNewWindow(route?: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.WINDOW.OPEN_NEW, { route });
  }

  async getWindowState(): Promise<WindowState> {
    return this.invoke(IPC_CHANNELS.WINDOW.GET_STATE);
  }
}
```

---

## Story 13.50: Tray 系统托盘

| 属性 | 值 |
|------|-----|
| Story ID | 13.50 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |

### 目标
实现系统托盘功能。

### 任务列表
- [ ] TrayIPCClient 实现
- [ ] 托盘图标
- [ ] 托盘菜单
- [ ] 托盘气泡通知
- [ ] 专注模式托盘状态

### 技术设计

```typescript
export class TrayIPCClient extends BaseIPCClient {
  async setTooltip(text: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.TRAY.SET_TOOLTIP, { text });
  }

  async setBadge(count: number): Promise<void> {
    return this.invoke(IPC_CHANNELS.TRAY.SET_BADGE, { count });
  }

  async setIcon(icon: 'default' | 'focus' | 'notification'): Promise<void> {
    return this.invoke(IPC_CHANNELS.TRAY.SET_ICON, { icon });
  }

  async showBalloon(title: string, content: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.TRAY.SHOW_BALLOON, { title, content });
  }
}
```

---

## Story 13.51: Update 自动更新

| 属性 | 值 |
|------|-----|
| Story ID | 13.51 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |

### 目标
实现应用自动更新功能。

### 任务列表
- [ ] UpdateIPCClient 实现
- [ ] 检查更新
- [ ] 下载更新
- [ ] 安装更新
- [ ] 更新进度 UI
- [ ] 更新日志显示

### 技术设计

```typescript
export class UpdateIPCClient extends BaseIPCClient {
  async checkForUpdates(): Promise<UpdateInfo | null> {
    return this.invoke(IPC_CHANNELS.UPDATE.CHECK);
  }

  async downloadUpdate(): Promise<void> {
    return this.invoke(IPC_CHANNELS.UPDATE.DOWNLOAD);
  }

  async installUpdate(): Promise<void> {
    return this.invoke(IPC_CHANNELS.UPDATE.INSTALL);
  }

  async getUpdateSettings(): Promise<UpdateSettings> {
    return this.invoke(IPC_CHANNELS.UPDATE.GET_SETTINGS);
  }

  async setUpdateSettings(settings: UpdateSettings): Promise<void> {
    return this.invoke(IPC_CHANNELS.UPDATE.SET_SETTINGS, settings);
  }

  onProgress(callback: (progress: UpdateProgress) => void): () => void {
    const handler = (_: any, p: UpdateProgress) => callback(p);
    window.electronAPI.on(IPC_CHANNELS.UPDATE.PROGRESS, handler);
    return () => window.electronAPI.off(IPC_CHANNELS.UPDATE.PROGRESS, handler);
  }
}
```

---

## Story 13.52: Startup 启动优化

| 属性 | 值 |
|------|-----|
| Story ID | 13.52 |
| 优先级 | P2 (Medium) |
| 预估工时 | 4h |

### 目标
优化应用启动性能和体验。

### 任务列表
- [ ] 启动性能分析
- [ ] 懒加载模块
- [ ] 启动画面
- [ ] 开机自启动设置
- [ ] 启动耗时监控

### 性能目标

| 指标 | 目标值 |
|------|--------|
| 冷启动时间 | < 2s |
| 热启动时间 | < 0.5s |
| 首屏渲染 | < 1s |
| 可交互时间 | < 1.5s |
