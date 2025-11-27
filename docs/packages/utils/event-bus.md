# 事件总线系统文档

> **模块**: @dailyuse/utils/event-bus  
> **版本**: 1.0  
> **类型**: 通信工具库

---

## 📋 概述

提供跨组件、跨模块甚至跨进程（Electron）的通信机制。

### 核心组件

- **UnifiedEventBus**: 统一的内存事件总线，基于 `mitt`。
- **CrossPlatformEventBus**: 跨平台事件总线，支持 Electron 主进程与渲染进程通信。

---

## 💻 使用指南

### 内存事件总线

```typescript
import { UnifiedEventBus } from '@dailyuse/utils';

// 定义事件映射
type Events = {
  'user:login': { userId: string };
  'data:sync': void;
};

const bus = new UnifiedEventBus<Events>();

// 订阅
bus.on('user:login', ({ userId }) => {
  console.log(`User ${userId} logged in`);
});

// 发布
bus.emit('user:login', { userId: '123' });
```

### 跨平台事件总线 (Electron)

```typescript
import { CrossPlatformEventBus } from '@dailyuse/utils';

const bus = new CrossPlatformEventBus();

// 渲染进程发送
bus.emit('window:close', { id: 1 });

// 主进程接收
bus.on('window:close', ({ id }) => {
  closeWindow(id);
});
```

---

## 📝 最佳实践

1.  **类型安全**: 始终定义事件类型映射接口，享受 TypeScript 的类型检查。
2.  **资源清理**: 在组件销毁时（如 React `useEffect` cleanup），务必调用 `off` 取消订阅，防止内存泄漏。
3.  **命名规范**: 使用 `resource:action` 格式命名事件（如 `goal:created`）。
