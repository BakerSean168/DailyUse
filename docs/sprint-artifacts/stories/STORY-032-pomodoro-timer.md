# STORY-032: 番茄钟计时器

## 📋 Story 概述

**Story ID**: STORY-032  
**Epic**: EPIC-007 (Pomodoro & Focus Mode)  
**优先级**: P1 (核心价值)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: EPIC-002 ✅ (Desktop Native Features)

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 有一个番茄钟计时器帮助我保持专注工作节奏  
**以便于** 科学管理我的注意力，提高工作效率

---

## 📋 验收标准

### 功能验收 - 计时器核心

- [ ] 默认配置：25 分钟工作 + 5 分钟短休息 + 15 分钟长休息
- [ ] 4 个番茄后自动进入长休息
- [ ] 开始/暂停/重置控制
- [ ] 跳过当前阶段（工作/休息）
- [ ] 自动进入下一阶段（可配置）

### 功能验收 - 自定义设置

- [ ] 工作时长可配置（15-60 分钟）
- [ ] 短休息时长可配置（3-15 分钟）
- [ ] 长休息时长可配置（10-30 分钟）
- [ ] 长休息间隔可配置（2-6 个番茄）
- [ ] 设置实时生效

### 功能验收 - 桌面集成

- [ ] 系统托盘显示剩余时间
- [ ] 阶段结束时系统通知
- [ ] 通知声音（可关闭）
- [ ] 全局快捷键控制（可配置）

### 功能验收 - 任务关联

- [ ] 可关联当前专注的任务
- [ ] 番茄完成后记录到任务
- [ ] 显示任务累计专注番茄数
- [ ] 无任务时也可独立使用

### 技术验收

- [ ] 计时精度 ±1 秒
- [ ] 最小化后继续计时
- [ ] 重启应用恢复进行中的计时
- [ ] 内存占用增加 < 10MB

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/focus/
interface PomodoroSession {
  id: string;
  taskId?: string;          // 关联的任务
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;         // 设定时长（秒）
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

interface PomodoroSettings {
  workDuration: number;      // 默认 25 分钟
  shortBreakDuration: number; // 默认 5 分钟
  longBreakDuration: number;  // 默认 15 分钟
  longBreakInterval: number;  // 默认 4 个番茄
  autoStartBreak: boolean;
  autoStartWork: boolean;
  notificationSound: boolean;
  globalHotkey: string;       // 默认 'Alt+P'
}
```

### 服务层

```typescript
// packages/application-client/src/focus/services/PomodoroService.ts
export class PomodoroService {
  // 计时器控制
  start(taskId?: string): void;
  pause(): void;
  resume(): void;
  reset(): void;
  skip(): void;
  
  // 状态查询
  getCurrentSession(): PomodoroSession | null;
  getRemainingTime(): number;  // 秒
  getCompletedPomodoros(): number;  // 今日完成数
  
  // 设置
  updateSettings(settings: Partial<PomodoroSettings>): void;
  getSettings(): PomodoroSettings;
  
  // 事件
  onTick: (remainingSeconds: number) => void;
  onPhaseComplete: (phase: PomodoroPhase) => void;
  onSessionComplete: (session: PomodoroSession) => void;
}
```

### UI 组件

```
┌─────────────────────────────────────────────────────┐
│                   🍅 番茄钟                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│                    ┌───────┐                         │
│                    │ 24:37 │                         │
│                    └───────┘                         │
│                                                      │
│                   工作中 🔴                          │
│                                                      │
│  当前任务: 编写 STORY-032 技术方案                   │
│                                                      │
│     [▶️ 开始]  [⏸ 暂停]  [⏭ 跳过]  [🔄 重置]       │
│                                                      │
├─────────────────────────────────────────────────────┤
│  今日: 🍅🍅🍅🍅 4 个番茄 | 1小时40分钟               │
├─────────────────────────────────────────────────────┤
│  [⚙️ 设置]                                          │
└─────────────────────────────────────────────────────┘
```

### 系统托盘集成

```typescript
// apps/desktop/src/main/tray/PomodoroTray.ts
export class PomodoroTray {
  updateTimer(remainingSeconds: number, phase: PomodoroPhase): void;
  // 托盘图标显示: 🍅 24:37 或 ☕ 04:12
  
  showNotification(title: string, body: string): void;
  // 阶段结束时显示系统通知
}
```

### IPC 通道

```typescript
// 新增 IPC 通道
'pomodoro:start'        // 开始计时
'pomodoro:pause'        // 暂停
'pomodoro:resume'       // 继续
'pomodoro:skip'         // 跳过
'pomodoro:reset'        // 重置
'pomodoro:get-state'    // 获取当前状态
'pomodoro:tick'         // 每秒广播 (主进程 → 渲染进程)
'pomodoro:phase-change' // 阶段变化广播
```

---

## 📁 文件变更清单

### 新增文件

```
packages/domain-client/src/focus/
  ├── aggregates/PomodoroSession.ts
  ├── value-objects/PomodoroSettings.ts
  └── index.ts

packages/application-client/src/focus/
  ├── services/PomodoroService.ts
  └── index.ts

apps/desktop/src/main/services/
  └── PomodoroMainService.ts

apps/desktop/src/main/tray/
  └── PomodoroTray.ts

apps/desktop/src/renderer/components/pomodoro/
  ├── PomodoroTimer.tsx
  ├── PomodoroControls.tsx
  ├── PomodoroSettings.tsx
  └── PomodoroStats.tsx

apps/desktop/src/renderer/hooks/
  └── usePomodoro.ts

apps/desktop/src/preload/channels/
  └── pomodoroChannels.ts
```

### 修改文件

```
apps/desktop/src/preload/preload.ts
  └── 添加 pomodoro:* 通道白名单

apps/desktop/src/main/main.ts
  └── 初始化 PomodoroMainService

apps/desktop/src/renderer/components/Layout.tsx
  └── 在侧边栏添加番茄钟入口
```

---

## 🧪 测试要点

### 单元测试

- 计时器精度测试
- 阶段切换逻辑
- 设置持久化

### 集成测试

- 主进程 ↔ 渲染进程同步
- 任务关联计数
- 应用重启恢复

### E2E 测试

- 完整番茄周期
- 跳过休息继续工作
- 设置修改生效

---

## 📝 注意事项

1. **计时准确性**：使用 `setInterval` + 时间戳校准
2. **后台运行**：主进程负责计时，避免渲染进程最小化影响
3. **持久化**：进行中的番茄保存到 localStorage，重启恢复
4. **性能**：每秒 tick 只更新必要的 UI 元素
