# Story 13.51: Platform 模块 - 应用菜单

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.51 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 6: 平台集成 |
| 优先级 | P2 (Medium) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Platform |

## 目标

实现应用菜单栏功能，包括标准应用菜单和上下文菜单支持。

## 任务列表

### 1. 创建 Menu Handler (2h)
- [ ] MenuHandler 类
- [ ] 应用菜单构建
- [ ] 上下文菜单支持
- [ ] 菜单动态更新

### 2. 创建 Menu IPC Client (1h)
- [ ] MenuIPCClient
- [ ] useContextMenu hook

### 3. 菜单配置管理 (1h)
- [ ] 菜单模板定义
- [ ] 国际化支持

## 技术规范

### Menu Handler
```typescript
// main/modules/platform/menu-handler.ts
import { ipcMain, Menu, MenuItem, BrowserWindow, app, shell } from 'electron';
import { logger } from '@/infrastructure/logger';

export interface MenuItemConfig {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  role?: Electron.MenuItemConstructorOptions['role'];
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: MenuItemConfig[];
}

class MenuHandler {
  private mainWindow: BrowserWindow | null = null;
  private menu: Menu | null = null;

  register(): void {
    ipcMain.handle('menu:show-context-menu', this.showContextMenu.bind(this));
    ipcMain.handle('menu:update-menu-item', this.updateMenuItem.bind(this));
    ipcMain.handle('menu:get-menu-state', this.getMenuState.bind(this));

    logger.info('[MenuHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  initialize(): void {
    this.buildApplicationMenu();
    logger.info('[MenuHandler] Application menu initialized');
  }

  private buildApplicationMenu(): void {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
      // App menu (macOS only)
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about' as const, label: '关于 DailyUse' },
                { type: 'separator' as const },
                {
                  label: '偏好设置...',
                  accelerator: 'CommandOrControl+,',
                  click: () => this.sendAction('app:settings'),
                },
                { type: 'separator' as const },
                { role: 'services' as const },
                { type: 'separator' as const },
                { role: 'hide' as const, label: '隐藏 DailyUse' },
                { role: 'hideOthers' as const, label: '隐藏其他' },
                { role: 'unhide' as const, label: '显示全部' },
                { type: 'separator' as const },
                { role: 'quit' as const, label: '退出 DailyUse' },
              ],
            },
          ]
        : []),

      // File menu
      {
        label: '文件',
        submenu: [
          {
            label: '新建任务',
            accelerator: 'CommandOrControl+N',
            click: () => this.sendAction('task:create'),
          },
          {
            label: '新建目标',
            accelerator: 'CommandOrControl+Shift+N',
            click: () => this.sendAction('goal:create'),
          },
          { type: 'separator' },
          {
            label: '导入数据...',
            click: () => this.sendAction('app:import'),
          },
          {
            label: '导出数据...',
            click: () => this.sendAction('app:export'),
          },
          { type: 'separator' },
          ...(isMac
            ? []
            : [
                {
                  label: '设置',
                  accelerator: 'CommandOrControl+,',
                  click: () => this.sendAction('app:settings'),
                },
                { type: 'separator' as const },
                { role: 'quit' as const, label: '退出' },
              ]),
        ],
      },

      // Edit menu
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          ...(isMac
            ? [
                { role: 'pasteAndMatchStyle' as const, label: '粘贴并匹配样式' },
                { role: 'delete' as const, label: '删除' },
                { role: 'selectAll' as const, label: '全选' },
              ]
            : [
                { role: 'delete' as const, label: '删除' },
                { type: 'separator' as const },
                { role: 'selectAll' as const, label: '全选' },
              ]),
        ],
      },

      // View menu
      {
        label: '视图',
        submenu: [
          {
            label: '仪表盘',
            accelerator: 'CommandOrControl+1',
            click: () => this.sendAction('navigate:/dashboard'),
          },
          {
            label: '任务',
            accelerator: 'CommandOrControl+2',
            click: () => this.sendAction('navigate:/tasks'),
          },
          {
            label: '目标',
            accelerator: 'CommandOrControl+3',
            click: () => this.sendAction('navigate:/goals'),
          },
          {
            label: '日程',
            accelerator: 'CommandOrControl+4',
            click: () => this.sendAction('navigate:/schedule'),
          },
          { type: 'separator' },
          {
            label: '侧边栏',
            accelerator: 'CommandOrControl+B',
            type: 'checkbox',
            checked: true,
            click: (menuItem) => {
              this.sendAction('view:toggle-sidebar', { visible: menuItem.checked });
            },
          },
          { type: 'separator' },
          { role: 'reload', label: '重新加载' },
          { role: 'forceReload', label: '强制重新加载' },
          { role: 'toggleDevTools', label: '开发者工具' },
          { type: 'separator' },
          { role: 'resetZoom', label: '实际大小' },
          { role: 'zoomIn', label: '放大' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '切换全屏' },
        ],
      },

      // Focus menu
      {
        label: '专注',
        submenu: [
          {
            label: '开始专注',
            accelerator: 'CommandOrControl+Shift+F',
            click: () => this.sendAction('focus:start'),
          },
          {
            label: '暂停专注',
            click: () => this.sendAction('focus:pause'),
          },
          {
            label: '结束专注',
            click: () => this.sendAction('focus:stop'),
          },
          { type: 'separator' },
          {
            label: '专注统计',
            click: () => this.sendAction('navigate:/focus/stats'),
          },
        ],
      },

      // Window menu
      {
        label: '窗口',
        submenu: [
          { role: 'minimize', label: '最小化' },
          { role: 'zoom', label: '缩放' },
          ...(isMac
            ? [
                { type: 'separator' as const },
                { role: 'front' as const, label: '全部置于顶层' },
                { type: 'separator' as const },
                { role: 'window' as const },
              ]
            : [{ role: 'close' as const, label: '关闭' }]),
          { type: 'separator' },
          {
            label: '始终置顶',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
              this.mainWindow?.setAlwaysOnTop(menuItem.checked);
              this.sendAction('window:always-on-top', { enabled: menuItem.checked });
            },
          },
        ],
      },

      // Help menu
      {
        role: 'help',
        label: '帮助',
        submenu: [
          {
            label: '使用指南',
            click: () => this.sendAction('help:guide'),
          },
          {
            label: '键盘快捷键',
            click: () => this.sendAction('help:shortcuts'),
          },
          { type: 'separator' },
          {
            label: '反馈问题',
            click: async () => {
              await shell.openExternal('https://github.com/dailyuse/issues');
            },
          },
          {
            label: '访问官网',
            click: async () => {
              await shell.openExternal('https://dailyuse.app');
            },
          },
          { type: 'separator' },
          {
            label: '检查更新',
            click: () => this.sendAction('app:check-update'),
          },
          ...(isMac
            ? []
            : [
                { type: 'separator' as const },
                {
                  label: '关于 DailyUse',
                  click: () => this.sendAction('app:about'),
                },
              ]),
        ],
      },
    ];

    this.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.menu);
  }

  private sendAction(action: string, data?: Record<string, unknown>): void {
    this.mainWindow?.webContents.send('menu:action', { action, data });
  }

  // IPC Handlers
  private async showContextMenu(
    _: Electron.IpcMainInvokeEvent,
    items: MenuItemConfig[]
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const menu = this.buildContextMenuFromConfig(items, resolve);
      menu.popup({ window: this.mainWindow! });
    });
  }

  private buildContextMenuFromConfig(
    items: MenuItemConfig[],
    onSelect: (id: string | null) => void
  ): Menu {
    const menu = new Menu();

    for (const item of items) {
      if (item.type === 'separator') {
        menu.append(new MenuItem({ type: 'separator' }));
      } else if (item.type === 'submenu' && item.submenu) {
        const submenu = this.buildContextMenuFromConfig(item.submenu, onSelect);
        menu.append(
          new MenuItem({
            label: item.label,
            type: 'submenu',
            submenu,
          })
        );
      } else {
        menu.append(
          new MenuItem({
            id: item.id,
            label: item.label,
            type: item.type,
            role: item.role,
            accelerator: item.accelerator,
            enabled: item.enabled ?? true,
            visible: item.visible ?? true,
            checked: item.checked,
            click: () => {
              onSelect(item.id || null);
              this.mainWindow?.webContents.send('menu:context-click', {
                id: item.id,
                checked: item.type === 'checkbox' ? !item.checked : undefined,
              });
            },
          })
        );
      }
    }

    // Handle menu close without selection
    menu.on('menu-will-close', () => {
      setTimeout(() => onSelect(null), 100);
    });

    return menu;
  }

  private async updateMenuItem(
    _: Electron.IpcMainInvokeEvent,
    id: string,
    updates: Partial<MenuItemConfig>
  ): Promise<void> {
    if (!this.menu) return;

    const item = this.menu.getMenuItemById(id);
    if (item) {
      if (updates.enabled !== undefined) {
        item.enabled = updates.enabled;
      }
      if (updates.visible !== undefined) {
        item.visible = updates.visible;
      }
      if (updates.checked !== undefined) {
        item.checked = updates.checked;
      }
      if (updates.label !== undefined) {
        item.label = updates.label;
      }
    }
  }

  private async getMenuState(
    _: Electron.IpcMainInvokeEvent,
    id: string
  ): Promise<Partial<MenuItemConfig> | null> {
    if (!this.menu) return null;

    const item = this.menu.getMenuItemById(id);
    if (item) {
      return {
        id: item.id,
        label: item.label,
        enabled: item.enabled,
        visible: item.visible,
        checked: item.checked,
      };
    }
    return null;
  }
}

export const menuHandler = new MenuHandler();
```

### Menu IPC Client
```typescript
// renderer/modules/platform/infrastructure/ipc/menu-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

export interface MenuItemConfig {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  role?: string;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: MenuItemConfig[];
}

class MenuIPCClient extends BaseIPCClient {
  constructor() {
    super('menu');
  }

  async showContextMenu(items: MenuItemConfig[]): Promise<string | null> {
    return this.invoke<string | null>('show-context-menu', items);
  }

  async updateMenuItem(id: string, updates: Partial<MenuItemConfig>): Promise<void> {
    return this.invoke<void>('update-menu-item', id, updates);
  }

  async getMenuState(id: string): Promise<Partial<MenuItemConfig> | null> {
    return this.invoke<Partial<MenuItemConfig> | null>('get-menu-state', id);
  }

  onAction(callback: (data: { action: string; data?: Record<string, unknown> }) => void): () => void {
    return this.on('action', callback);
  }

  onContextClick(callback: (data: { id: string; checked?: boolean }) => void): () => void {
    return this.on('context-click', callback);
  }
}

export const menuIPCClient = new MenuIPCClient();
```

### useContextMenu Hook
```typescript
// renderer/modules/platform/infrastructure/ipc/use-context-menu.ts
import { useCallback, useEffect, useRef } from 'react';
import { menuIPCClient, type MenuItemConfig } from './menu-ipc-client';

interface UseContextMenuOptions {
  items: MenuItemConfig[];
  onSelect?: (id: string | null) => void;
}

export function useContextMenu({ items, onSelect }: UseContextMenuOptions) {
  const show = useCallback(async () => {
    const selectedId = await menuIPCClient.showContextMenu(items);
    onSelect?.(selectedId);
    return selectedId;
  }, [items, onSelect]);

  return { show };
}

// Hook to bind context menu to an element
export function useContextMenuTrigger(
  ref: React.RefObject<HTMLElement>,
  options: UseContextMenuOptions
) {
  const { show } = useContextMenu(options);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      show();
    };

    element.addEventListener('contextmenu', handleContextMenu);
    return () => {
      element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [ref, show]);
}

// Hook to handle menu actions from application menu
export function useMenuActions(handlers: Record<string, (data?: Record<string, unknown>) => void>) {
  useEffect(() => {
    const unsubscribe = menuIPCClient.onAction(({ action, data }) => {
      // Handle navigation
      if (action.startsWith('navigate:')) {
        const path = action.replace('navigate:', '');
        // Use your router navigation here
        window.history.pushState({}, '', `#${path}`);
        return;
      }

      const handler = handlers[action];
      if (handler) {
        handler(data);
      }
    });

    return () => unsubscribe();
  }, [handlers]);
}
```

### Context Menu Component
```typescript
// renderer/modules/platform/presentation/components/ContextMenu.tsx
import React, { useRef } from 'react';
import { useContextMenuTrigger, type MenuItemConfig } from '../../infrastructure/ipc';

interface ContextMenuTriggerProps {
  children: React.ReactNode;
  items: MenuItemConfig[];
  onSelect?: (id: string | null) => void;
  className?: string;
}

export const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({
  children,
  items,
  onSelect,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useContextMenuTrigger(ref, { items, onSelect });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// Example usage with tasks
export const TaskContextMenu: React.FC<{
  taskId: string;
  children: React.ReactNode;
  onAction: (action: string) => void;
}> = ({ taskId, children, onAction }) => {
  const items: MenuItemConfig[] = [
    { id: 'edit', label: '编辑任务' },
    { id: 'duplicate', label: '复制任务' },
    { type: 'separator' },
    { id: 'mark-complete', label: '标记完成', type: 'checkbox', checked: false },
    { id: 'mark-important', label: '标记重要', type: 'checkbox', checked: false },
    { type: 'separator' },
    {
      id: 'move-to',
      label: '移动到',
      type: 'submenu',
      submenu: [
        { id: 'move-today', label: '今天' },
        { id: 'move-tomorrow', label: '明天' },
        { id: 'move-next-week', label: '下周' },
      ],
    },
    { type: 'separator' },
    { id: 'delete', label: '删除任务' },
  ];

  const handleSelect = (id: string | null) => {
    if (id) {
      onAction(id);
    }
  };

  return (
    <ContextMenuTrigger items={items} onSelect={handleSelect}>
      {children}
    </ContextMenuTrigger>
  );
};
```

### Menu Actions Handler
```typescript
// renderer/modules/platform/presentation/hooks/use-app-menu.ts
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuActions } from '../../infrastructure/ipc';
import { useTaskStore } from '@/modules/task/stores';
import { useGoalStore } from '@/modules/goal/stores';
import { useFocusStore } from '@/modules/goal/stores';
import { useSettingsStore } from '@/modules/settings/stores';

export function useAppMenu() {
  const navigate = useNavigate();
  const { openCreateModal: openTaskModal } = useTaskStore();
  const { openCreateModal: openGoalModal } = useGoalStore();
  const { start: startFocus, pause: pauseFocus, stop: stopFocus } = useFocusStore();
  const { toggleSidebar } = useSettingsStore();

  const handlers = useMemo(
    () => ({
      'task:create': () => openTaskModal(),
      'goal:create': () => openGoalModal(),
      'app:settings': () => navigate('/settings'),
      'app:import': () => navigate('/settings/import'),
      'app:export': () => navigate('/settings/export'),
      'app:about': () => navigate('/about'),
      'app:check-update': () => {
        // Check for updates
      },
      'focus:start': () => startFocus(),
      'focus:pause': () => pauseFocus(),
      'focus:stop': () => stopFocus(),
      'view:toggle-sidebar': (data?: { visible?: boolean }) => {
        toggleSidebar(data?.visible);
      },
      'help:guide': () => navigate('/help/guide'),
      'help:shortcuts': () => navigate('/settings/shortcuts'),
    }),
    [navigate, openTaskModal, openGoalModal, startFocus, pauseFocus, stopFocus, toggleSidebar]
  );

  useMenuActions(handlers);
}
```

## 验收标准

- [ ] 应用菜单正确显示（macOS/Windows）
- [ ] 菜单快捷键正常工作
- [ ] 上下文菜单正确显示
- [ ] 菜单项点击响应正确
- [ ] 菜单状态更新正常
- [ ] checkbox/radio 类型正确切换
- [ ] 子菜单正确显示
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/platform/menu-handler.ts`
- `renderer/modules/platform/infrastructure/ipc/menu-ipc-client.ts`
- `renderer/modules/platform/infrastructure/ipc/use-context-menu.ts`
- `renderer/modules/platform/presentation/components/ContextMenu.tsx`
- `renderer/modules/platform/presentation/hooks/use-app-menu.ts`
