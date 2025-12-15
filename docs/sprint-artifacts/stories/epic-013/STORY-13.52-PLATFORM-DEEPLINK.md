# Story 13.52: Platform 模块 - Deep Links

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.52 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 6: 平台集成 |
| 优先级 | P2 (Medium) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Platform |

## 目标

实现 Deep Links 功能，支持 URL Scheme 处理和应用内导航。

## 任务列表

### 1. 创建 Deep Link Handler (2h)
- [ ] DeepLinkHandler 类
- [ ] URL Scheme 注册
- [ ] 路由解析
- [ ] 参数提取

### 2. 创建 Deep Link IPC Client (1h)
- [ ] DeepLinkIPCClient
- [ ] useDeepLink hook

### 3. Deep Link 路由集成 (1h)
- [ ] 路由映射配置
- [ ] 应用内导航

## 技术规范

### Deep Link Handler
```typescript
// main/modules/platform/deep-link-handler.ts
import { ipcMain, app, BrowserWindow } from 'electron';
import { logger } from '@/infrastructure/logger';

export interface DeepLinkRoute {
  pattern: RegExp;
  handler: (params: Record<string, string>, query: Record<string, string>) => DeepLinkAction;
}

export interface DeepLinkAction {
  type: 'navigate' | 'action' | 'open-external';
  path?: string;
  action?: string;
  data?: Record<string, unknown>;
  url?: string;
}

// URL Scheme: dailyuse://
const PROTOCOL = 'dailyuse';

class DeepLinkHandler {
  private mainWindow: BrowserWindow | null = null;
  private pendingDeepLink: string | null = null;
  private routes: DeepLinkRoute[] = [];

  register(): void {
    ipcMain.handle('deep-link:register-routes', this.registerRoutes.bind(this));
    ipcMain.handle('deep-link:get-pending', this.getPending.bind(this));
    ipcMain.handle('deep-link:clear-pending', this.clearPending.bind(this));
    ipcMain.handle('deep-link:create-link', this.createLink.bind(this));

    logger.info('[DeepLinkHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;

    // Process pending deep link when window is ready
    if (this.pendingDeepLink && window.webContents.isLoading()) {
      window.webContents.once('did-finish-load', () => {
        if (this.pendingDeepLink) {
          this.handleDeepLink(this.pendingDeepLink);
          this.pendingDeepLink = null;
        }
      });
    } else if (this.pendingDeepLink) {
      this.handleDeepLink(this.pendingDeepLink);
      this.pendingDeepLink = null;
    }
  }

  initialize(): void {
    // Register protocol handler
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]]);
      }
    } else {
      app.setAsDefaultProtocolClient(PROTOCOL);
    }

    // Handle protocol on macOS
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleIncomingUrl(url);
    });

    // Handle protocol on Windows/Linux (via argv)
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', (event, commandLine) => {
        // Someone tried to run a second instance, we should focus our window.
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }

        // Windows/Linux: the protocol URL is in the command line
        const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
        if (url) {
          this.handleIncomingUrl(url);
        }
      });

      // Handle initial launch URL (Windows/Linux)
      const url = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
      if (url) {
        this.handleIncomingUrl(url);
      }
    }

    // Initialize default routes
    this.initializeDefaultRoutes();

    logger.info('[DeepLinkHandler] Initialized with protocol:', PROTOCOL);
  }

  private initializeDefaultRoutes(): void {
    this.routes = [
      // Task routes
      {
        pattern: /^\/tasks?\/?$/,
        handler: () => ({ type: 'navigate', path: '/tasks' }),
      },
      {
        pattern: /^\/tasks?\/([a-zA-Z0-9-]+)\/?$/,
        handler: (params) => ({
          type: 'navigate',
          path: `/tasks/${params[1]}`,
        }),
      },
      {
        pattern: /^\/tasks?\/new\/?$/,
        handler: (_, query) => ({
          type: 'action',
          action: 'task:create',
          data: { title: query.title, description: query.description },
        }),
      },

      // Goal routes
      {
        pattern: /^\/goals?\/?$/,
        handler: () => ({ type: 'navigate', path: '/goals' }),
      },
      {
        pattern: /^\/goals?\/([a-zA-Z0-9-]+)\/?$/,
        handler: (params) => ({
          type: 'navigate',
          path: `/goals/${params[1]}`,
        }),
      },

      // Focus routes
      {
        pattern: /^\/focus\/?$/,
        handler: () => ({ type: 'navigate', path: '/focus' }),
      },
      {
        pattern: /^\/focus\/start\/?$/,
        handler: (_, query) => ({
          type: 'action',
          action: 'focus:start',
          data: { duration: query.duration ? parseInt(query.duration) : undefined },
        }),
      },

      // Schedule routes
      {
        pattern: /^\/schedule\/?$/,
        handler: () => ({ type: 'navigate', path: '/schedule' }),
      },
      {
        pattern: /^\/schedule\/([0-9]{4}-[0-9]{2}-[0-9]{2})\/?$/,
        handler: (params) => ({
          type: 'navigate',
          path: `/schedule?date=${params[1]}`,
        }),
      },

      // Settings routes
      {
        pattern: /^\/settings?\/?$/,
        handler: () => ({ type: 'navigate', path: '/settings' }),
      },
      {
        pattern: /^\/settings?\/([a-zA-Z-]+)\/?$/,
        handler: (params) => ({
          type: 'navigate',
          path: `/settings/${params[1]}`,
        }),
      },

      // Dashboard
      {
        pattern: /^\/dashboard\/?$/,
        handler: () => ({ type: 'navigate', path: '/dashboard' }),
      },
      {
        pattern: /^\/?$/,
        handler: () => ({ type: 'navigate', path: '/' }),
      },
    ];
  }

  private handleIncomingUrl(url: string): void {
    logger.info('[DeepLinkHandler] Received URL:', url);

    if (!this.mainWindow) {
      // Store for later processing
      this.pendingDeepLink = url;
      return;
    }

    this.handleDeepLink(url);
  }

  private handleDeepLink(url: string): void {
    try {
      const parsed = new URL(url);

      // Validate protocol
      if (parsed.protocol !== `${PROTOCOL}:`) {
        logger.warn('[DeepLinkHandler] Invalid protocol:', parsed.protocol);
        return;
      }

      const path = parsed.pathname || parsed.hostname || '/';
      const query = this.parseQueryParams(parsed.search);

      logger.info('[DeepLinkHandler] Processing:', { path, query });

      // Find matching route
      for (const route of this.routes) {
        const match = path.match(route.pattern);
        if (match) {
          const params: Record<string, string> = {};
          for (let i = 1; i < match.length; i++) {
            params[i] = match[i];
          }

          const action = route.handler(params, query);
          this.executeAction(action);
          return;
        }
      }

      // No matching route - navigate to path directly
      logger.warn('[DeepLinkHandler] No matching route, navigating to:', path);
      this.executeAction({ type: 'navigate', path });
    } catch (error) {
      logger.error('[DeepLinkHandler] Error processing URL:', error);
    }
  }

  private parseQueryParams(search: string): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  private executeAction(action: DeepLinkAction): void {
    // Bring window to front
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }

    // Send action to renderer
    switch (action.type) {
      case 'navigate':
        this.mainWindow?.webContents.send('deep-link:navigate', { path: action.path });
        break;

      case 'action':
        this.mainWindow?.webContents.send('deep-link:action', {
          action: action.action,
          data: action.data,
        });
        break;

      case 'open-external':
        if (action.url) {
          require('electron').shell.openExternal(action.url);
        }
        break;
    }
  }

  // IPC Handlers
  private async registerRoutes(
    _: Electron.IpcMainInvokeEvent,
    routes: Array<{ pattern: string; action: DeepLinkAction }>
  ): Promise<void> {
    for (const route of routes) {
      this.routes.push({
        pattern: new RegExp(route.pattern),
        handler: () => route.action,
      });
    }
  }

  private async getPending(): Promise<string | null> {
    return this.pendingDeepLink;
  }

  private async clearPending(): Promise<void> {
    this.pendingDeepLink = null;
  }

  private async createLink(
    _: Electron.IpcMainInvokeEvent,
    path: string,
    params?: Record<string, string>
  ): Promise<string> {
    let url = `${PROTOCOL}://${path.startsWith('/') ? path.slice(1) : path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return url;
  }
}

export const deepLinkHandler = new DeepLinkHandler();
```

### Deep Link IPC Client
```typescript
// renderer/modules/platform/infrastructure/ipc/deep-link-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

export interface DeepLinkAction {
  type: 'navigate' | 'action' | 'open-external';
  path?: string;
  action?: string;
  data?: Record<string, unknown>;
  url?: string;
}

class DeepLinkIPCClient extends BaseIPCClient {
  constructor() {
    super('deep-link');
  }

  async registerRoutes(
    routes: Array<{ pattern: string; action: DeepLinkAction }>
  ): Promise<void> {
    return this.invoke<void>('register-routes', routes);
  }

  async getPending(): Promise<string | null> {
    return this.invoke<string | null>('get-pending');
  }

  async clearPending(): Promise<void> {
    return this.invoke<void>('clear-pending');
  }

  async createLink(path: string, params?: Record<string, string>): Promise<string> {
    return this.invoke<string>('create-link', path, params);
  }

  onNavigate(callback: (data: { path: string }) => void): () => void {
    return this.on('navigate', callback);
  }

  onAction(callback: (data: { action: string; data?: Record<string, unknown> }) => void): () => void {
    return this.on('action', callback);
  }
}

export const deepLinkIPCClient = new DeepLinkIPCClient();
```

### useDeepLink Hook
```typescript
// renderer/modules/platform/infrastructure/ipc/use-deep-link.ts
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deepLinkIPCClient } from './deep-link-ipc-client';

export function useDeepLink() {
  const navigate = useNavigate();

  // Handle navigation deep links
  useEffect(() => {
    const unsubscribe = deepLinkIPCClient.onNavigate(({ path }) => {
      navigate(path);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Create a deep link
  const createLink = useCallback(async (path: string, params?: Record<string, string>) => {
    return deepLinkIPCClient.createLink(path, params);
  }, []);

  // Copy deep link to clipboard
  const copyLink = useCallback(async (path: string, params?: Record<string, string>) => {
    const link = await createLink(path, params);
    await navigator.clipboard.writeText(link);
    return link;
  }, [createLink]);

  return {
    createLink,
    copyLink,
  };
}

// Hook for handling deep link actions
export function useDeepLinkActions(
  handlers: Record<string, (data?: Record<string, unknown>) => void>
) {
  useEffect(() => {
    const unsubscribe = deepLinkIPCClient.onAction(({ action, data }) => {
      const handler = handlers[action];
      if (handler) {
        handler(data);
      }
    });

    return () => unsubscribe();
  }, [handlers]);
}

// Initialize deep links on app start
export function useDeepLinkInitialization() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for pending deep link from app launch
    const checkPending = async () => {
      const pending = await deepLinkIPCClient.getPending();
      if (pending) {
        // The main process will handle routing
        await deepLinkIPCClient.clearPending();
      }
    };

    checkPending();
  }, [navigate]);
}
```

### Deep Link Provider
```typescript
// renderer/modules/platform/presentation/providers/DeepLinkProvider.tsx
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeepLinkActions, useDeepLinkInitialization } from '../../infrastructure/ipc';
import { useTaskStore } from '@/modules/task/stores';
import { useGoalStore } from '@/modules/goal/stores';
import { useFocusStore } from '@/modules/goal/stores';

interface DeepLinkProviderProps {
  children: React.ReactNode;
}

export const DeepLinkProvider: React.FC<DeepLinkProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { openCreateModal: openTaskModal, setQuickAddData } = useTaskStore();
  const { openCreateModal: openGoalModal } = useGoalStore();
  const { start: startFocus } = useFocusStore();

  // Initialize deep link handling
  useDeepLinkInitialization();

  // Define action handlers
  const actionHandlers = useMemo(
    () => ({
      'task:create': (data?: Record<string, unknown>) => {
        if (data) {
          setQuickAddData({
            title: data.title as string,
            description: data.description as string,
          });
        }
        openTaskModal();
      },
      'goal:create': () => {
        openGoalModal();
      },
      'focus:start': (data?: Record<string, unknown>) => {
        const duration = data?.duration as number | undefined;
        startFocus({ duration });
      },
    }),
    [openTaskModal, openGoalModal, startFocus, setQuickAddData]
  );

  // Handle deep link actions
  useDeepLinkActions(actionHandlers);

  return <>{children}</>;
};
```

### Share Link Components
```typescript
// renderer/modules/platform/presentation/components/ShareLink.tsx
import React, { useState } from 'react';
import { useDeepLink } from '../../infrastructure/ipc';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@dailyuse/ui';
import { Link, Check, Copy } from 'lucide-react';

interface ShareLinkButtonProps {
  path: string;
  params?: Record<string, string>;
  className?: string;
  tooltipText?: string;
}

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  path,
  params,
  className,
  tooltipText = '复制链接',
}) => {
  const { copyLink } = useDeepLink();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyLink(path, params);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleCopy} className={className}>
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Link className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? '已复制' : tooltipText}</TooltipContent>
    </Tooltip>
  );
};

// Component to display the deep link
interface DeepLinkDisplayProps {
  path: string;
  params?: Record<string, string>;
  className?: string;
}

export const DeepLinkDisplay: React.FC<DeepLinkDisplayProps> = ({
  path,
  params,
  className,
}) => {
  const { createLink, copyLink } = useDeepLink();
  const [link, setLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    createLink(path, params).then(setLink);
  }, [path, params, createLink]);

  const handleCopy = async () => {
    await copyLink(path, params);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <code className="flex-1 px-3 py-2 bg-muted rounded text-sm truncate">
        {link}
      </code>
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
```

### Usage Examples
```typescript
// Example: Share task link
const TaskShareButton: React.FC<{ taskId: string }> = ({ taskId }) => {
  return <ShareLinkButton path={`/tasks/${taskId}`} tooltipText="复制任务链接" />;
};

// Example: Quick add task URL
// dailyuse://tasks/new?title=Buy%20groceries&description=Milk%2C%20eggs

// Example: Navigate to date
// dailyuse://schedule/2024-01-15

// Example: Start focus with duration
// dailyuse://focus/start?duration=25
```

## 验收标准

- [ ] URL Scheme 正确注册
- [ ] Deep Link 正确解析
- [ ] 导航类链接正常工作
- [ ] 动作类链接正常执行
- [ ] 查询参数正确提取
- [ ] 应用启动时处理链接正常
- [ ] 链接创建和复制功能正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/platform/deep-link-handler.ts`
- `renderer/modules/platform/infrastructure/ipc/deep-link-ipc-client.ts`
- `renderer/modules/platform/infrastructure/ipc/use-deep-link.ts`
- `renderer/modules/platform/presentation/providers/DeepLinkProvider.tsx`
- `renderer/modules/platform/presentation/components/ShareLink.tsx`
