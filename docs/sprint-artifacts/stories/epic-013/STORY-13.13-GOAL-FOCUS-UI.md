# Story 13.13: Goal Focus Store & UI 组件

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.13 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 8h |
| 状态 | Backlog |

## 目标

创建 Focus 的 Pinia Store 和完整的 UI 组件，实现专注模式的用户界面。

## 背景

Focus UI 是 DailyUse 桌面端的核心功能之一，需要提供直观、美观的番茄钟界面。

## 任务列表

- [ ] 1. 创建 Focus Store
  - [ ] 状态管理
  - [ ] Actions
  - [ ] 实时更新处理
- [ ] 2. 创建核心 UI 组件
  - [ ] `FocusTimer` - 计时器显示
  - [ ] `FocusControls` - 控制按钮
  - [ ] `FocusProgress` - 进度环
- [ ] 3. 创建功能组件
  - [ ] `FocusGoalSelector` - 目标选择器
  - [ ] `FocusDurationPicker` - 时长选择
  - [ ] `FocusSessionHistory` - 历史记录
  - [ ] `FocusStatistics` - 统计图表
- [ ] 4. 创建 Composables
  - [ ] `useFocusTimer` - 计时逻辑
  - [ ] `useFocusKeyboard` - 快捷键
  - [ ] `useFocusSound` - 音效
- [ ] 5. 创建页面
  - [ ] `FocusPage` - 专注页面
  - [ ] `FocusWidget` - 迷你组件（侧边栏）
- [ ] 6. 样式和动画
- [ ] 7. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/goal/features/focus/
├── store/
│   └── focus.store.ts
├── components/
│   ├── FocusTimer.vue
│   ├── FocusControls.vue
│   ├── FocusProgress.vue
│   ├── FocusGoalSelector.vue
│   ├── FocusDurationPicker.vue
│   ├── FocusSessionHistory.vue
│   └── FocusStatistics.vue
├── composables/
│   ├── useFocusTimer.ts
│   ├── useFocusKeyboard.ts
│   └── useFocusSound.ts
├── pages/
│   ├── FocusPage.vue
│   └── FocusWidget.vue
└── index.ts
```

### Focus Store

```typescript
// renderer/modules/goal/features/focus/store/focus.store.ts
import { defineStore } from 'pinia';
import { container } from '@/shared/infrastructure/di';
import { GOAL_TOKENS } from '../../../di/tokens';
import type { 
  FocusSessionDTO, 
  FocusTickData,
  FocusDailyStatistics,
  StartFocusSessionInput,
} from '../../../infrastructure/ipc/focus/types';

interface FocusState {
  // 当前会话
  currentSession: FocusSessionDTO | null;
  remainingTime: number;
  progress: number;
  
  // 配置
  defaultDuration: number;  // 默认专注时长（分钟）
  breakDuration: number;    // 休息时长（分钟）
  autoStartBreak: boolean;  // 自动开始休息
  soundEnabled: boolean;    // 音效
  
  // 统计
  todayStatistics: FocusDailyStatistics | null;
  
  // UI 状态
  isGoalSelectorOpen: boolean;
  selectedGoalUuid: string | null;
  
  // 加载状态
  loading: boolean;
  error: string | null;
}

export const useFocusStore = defineStore('focus', {
  state: (): FocusState => ({
    currentSession: null,
    remainingTime: 0,
    progress: 0,
    
    defaultDuration: 25,
    breakDuration: 5,
    autoStartBreak: true,
    soundEnabled: true,
    
    todayStatistics: null,
    
    isGoalSelectorOpen: false,
    selectedGoalUuid: null,
    
    loading: false,
    error: null,
  }),

  getters: {
    isActive: (state) => state.currentSession?.status === 'ACTIVE',
    isPaused: (state) => state.currentSession?.status === 'PAUSED',
    hasSession: (state) => state.currentSession !== null,
    
    formattedTime: (state) => {
      const minutes = Math.floor(state.remainingTime / 60);
      const seconds = state.remainingTime % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    
    progressPercent: (state) => Math.round(state.progress),
    
    todayTotalMinutes: (state) => state.todayStatistics?.totalMinutes ?? 0,
    todaySessionCount: (state) => state.todayStatistics?.totalSessions ?? 0,
  },

  actions: {
    // 获取 IPC Clients
    getFocusClient() {
      return container.resolve<GoalFocusIPCClient>(GOAL_TOKENS.FOCUS_IPC_CLIENT);
    },

    getStatsClient() {
      return container.resolve<GoalFocusStatisticsIPCClient>(
        GOAL_TOKENS.FOCUS_STATISTICS_IPC_CLIENT
      );
    },

    // 初始化 - 设置事件监听
    async initialize() {
      const client = this.getFocusClient();

      // 订阅计时更新
      client.onTick((data: FocusTickData) => {
        this.remainingTime = Math.floor(data.remainingTime);
        this.progress = data.progress;
      });

      // 订阅会话完成
      client.onCompleted((session: FocusSessionDTO) => {
        this.currentSession = session;
        this.handleSessionComplete();
      });

      // 获取当前会话状态（可能是恢复的）
      await this.fetchCurrentSession();
      
      // 获取今日统计
      await this.fetchTodayStatistics();
    },

    // 获取当前会话
    async fetchCurrentSession() {
      try {
        const client = this.getFocusClient();
        this.currentSession = await client.getCurrentSession();
        
        if (this.currentSession) {
          this.remainingTime = Math.floor(this.currentSession.remainingTime);
          this.progress = this.currentSession.progress;
        }
      } catch (e) {
        this.error = formatError(e);
      }
    },

    // 开始专注
    async startFocus(goalUuid?: string, duration?: number) {
      this.loading = true;
      this.error = null;
      
      try {
        const client = this.getFocusClient();
        const input: StartFocusSessionInput = {
          accountUuid: this.getAccountUuid(),
          goalUuid: goalUuid ?? this.selectedGoalUuid ?? undefined,
          duration: duration ?? this.defaultDuration,
        };
        
        this.currentSession = await client.startSession(input);
        this.remainingTime = this.currentSession.remainingTime;
        this.progress = 0;
        
        // 播放开始音效
        if (this.soundEnabled) {
          this.playSound('start');
        }
      } catch (e) {
        this.error = formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // 暂停
    async pauseFocus() {
      try {
        const client = this.getFocusClient();
        this.currentSession = await client.pauseSession();
      } catch (e) {
        this.error = formatError(e);
        throw e;
      }
    },

    // 继续
    async resumeFocus() {
      try {
        const client = this.getFocusClient();
        this.currentSession = await client.resumeSession();
      } catch (e) {
        this.error = formatError(e);
        throw e;
      }
    },

    // 停止
    async stopFocus() {
      try {
        const client = this.getFocusClient();
        await client.stopSession();
        this.currentSession = null;
        this.remainingTime = 0;
        this.progress = 0;
      } catch (e) {
        this.error = formatError(e);
        throw e;
      }
    },

    // 处理会话完成
    async handleSessionComplete() {
      // 播放完成音效
      if (this.soundEnabled) {
        this.playSound('complete');
      }
      
      // 刷新今日统计
      await this.fetchTodayStatistics();
      
      // 自动开始休息
      if (this.autoStartBreak) {
        // 可以启动一个休息倒计时
        this.startBreakTimer();
      }
    },

    // 获取今日统计
    async fetchTodayStatistics() {
      try {
        const client = this.getStatsClient();
        const today = new Date().toISOString().split('T')[0];
        this.todayStatistics = await client.getDailyStatistics(today);
      } catch (e) {
        console.error('Failed to fetch today statistics:', e);
      }
    },

    // 音效播放
    playSound(type: 'start' | 'complete' | 'tick') {
      // 使用 AudioContext 或预加载的 Audio 元素
      const sounds = {
        start: '/sounds/focus-start.mp3',
        complete: '/sounds/focus-complete.mp3',
        tick: '/sounds/tick.mp3',
      };
      
      const audio = new Audio(sounds[type]);
      audio.play().catch(() => {
        // 忽略自动播放限制错误
      });
    },

    // 休息计时器
    startBreakTimer() {
      // 实现休息提醒逻辑
    },

    // 辅助方法
    getAccountUuid(): string {
      // 从 auth store 获取
      const authStore = useAuthStore();
      return authStore.currentAccount?.uuid ?? '';
    },

    // 选择目标
    selectGoal(goalUuid: string | null) {
      this.selectedGoalUuid = goalUuid;
      this.isGoalSelectorOpen = false;
    },

    // 更新设置
    updateSettings(settings: Partial<FocusState>) {
      if (settings.defaultDuration !== undefined) {
        this.defaultDuration = settings.defaultDuration;
      }
      if (settings.breakDuration !== undefined) {
        this.breakDuration = settings.breakDuration;
      }
      if (settings.autoStartBreak !== undefined) {
        this.autoStartBreak = settings.autoStartBreak;
      }
      if (settings.soundEnabled !== undefined) {
        this.soundEnabled = settings.soundEnabled;
      }
    },

    // 清理
    dispose() {
      const client = this.getFocusClient();
      client.dispose();
    },
  },
});
```

### FocusTimer 组件

```vue
<!-- renderer/modules/goal/features/focus/components/FocusTimer.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useFocusStore } from '../store/focus.store';
import FocusProgress from './FocusProgress.vue';
import FocusControls from './FocusControls.vue';

const focusStore = useFocusStore();

const statusText = computed(() => {
  if (focusStore.isActive) return '专注中';
  if (focusStore.isPaused) return '已暂停';
  return '准备开始';
});

const statusColor = computed(() => {
  if (focusStore.isActive) return 'text-green-500';
  if (focusStore.isPaused) return 'text-yellow-500';
  return 'text-gray-500';
});
</script>

<template>
  <div class="focus-timer">
    <!-- 进度环 -->
    <FocusProgress 
      :progress="focusStore.progressPercent"
      :is-active="focusStore.isActive"
    >
      <!-- 时间显示 -->
      <div class="timer-display">
        <span class="time">{{ focusStore.formattedTime }}</span>
        <span :class="['status', statusColor]">{{ statusText }}</span>
      </div>
    </FocusProgress>

    <!-- 控制按钮 -->
    <FocusControls 
      :is-active="focusStore.isActive"
      :is-paused="focusStore.isPaused"
      :has-session="focusStore.hasSession"
      @start="focusStore.startFocus()"
      @pause="focusStore.pauseFocus()"
      @resume="focusStore.resumeFocus()"
      @stop="focusStore.stopFocus()"
    />

    <!-- 今日统计 -->
    <div class="today-stats">
      <span>今日: {{ focusStore.todayTotalMinutes }} 分钟</span>
      <span>{{ focusStore.todaySessionCount }} 次专注</span>
    </div>
  </div>
</template>

<style scoped>
.focus-timer {
  @apply flex flex-col items-center gap-6 p-8;
}

.timer-display {
  @apply flex flex-col items-center;
}

.time {
  @apply text-6xl font-bold font-mono;
}

.status {
  @apply text-lg mt-2;
}

.today-stats {
  @apply flex gap-4 text-sm text-gray-500;
}
</style>
```

### FocusProgress 组件

```vue
<!-- renderer/modules/goal/features/focus/components/FocusProgress.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  progress: number;
  isActive: boolean;
  size?: number;
  strokeWidth?: number;
}>();

const size = computed(() => props.size ?? 280);
const strokeWidth = computed(() => props.strokeWidth ?? 12);
const radius = computed(() => (size.value - strokeWidth.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => {
  return circumference.value * (1 - props.progress / 100);
});

const progressColor = computed(() => {
  if (props.progress >= 100) return '#10B981'; // green-500
  if (props.progress >= 75) return '#22C55E';  // green-400
  if (props.progress >= 50) return '#84CC16';  // lime-500
  return '#3B82F6'; // blue-500
});
</script>

<template>
  <div class="focus-progress" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="progress-ring">
      <!-- 背景圆 -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        class="progress-bg"
      />
      
      <!-- 进度圆 -->
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        class="progress-bar"
        :class="{ 'animate-pulse': isActive }"
      />
    </svg>
    
    <!-- 中心内容插槽 -->
    <div class="progress-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.focus-progress {
  @apply relative;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-bg {
  @apply stroke-gray-200 dark:stroke-gray-700;
}

.progress-bar {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-content {
  @apply absolute inset-0 flex items-center justify-center;
}
</style>
```

### FocusControls 组件

```vue
<!-- renderer/modules/goal/features/focus/components/FocusControls.vue -->
<script setup lang="ts">
import { Button } from '@dailyuse/ui';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/vue/24/solid';

defineProps<{
  isActive: boolean;
  isPaused: boolean;
  hasSession: boolean;
}>();

const emit = defineEmits<{
  start: [];
  pause: [];
  resume: [];
  stop: [];
}>();
</script>

<template>
  <div class="focus-controls">
    <!-- 未开始状态 -->
    <template v-if="!hasSession">
      <Button 
        size="lg" 
        variant="primary"
        @click="emit('start')"
      >
        <PlayIcon class="w-6 h-6 mr-2" />
        开始专注
      </Button>
    </template>

    <!-- 进行中状态 -->
    <template v-else-if="isActive">
      <Button 
        size="lg" 
        variant="secondary"
        @click="emit('pause')"
      >
        <PauseIcon class="w-6 h-6 mr-2" />
        暂停
      </Button>
      <Button 
        size="lg" 
        variant="danger"
        @click="emit('stop')"
      >
        <StopIcon class="w-6 h-6 mr-2" />
        停止
      </Button>
    </template>

    <!-- 暂停状态 -->
    <template v-else-if="isPaused">
      <Button 
        size="lg" 
        variant="primary"
        @click="emit('resume')"
      >
        <PlayIcon class="w-6 h-6 mr-2" />
        继续
      </Button>
      <Button 
        size="lg" 
        variant="danger"
        @click="emit('stop')"
      >
        <StopIcon class="w-6 h-6 mr-2" />
        放弃
      </Button>
    </template>
  </div>
</template>

<style scoped>
.focus-controls {
  @apply flex gap-4;
}
</style>
```

### useFocusKeyboard Composable

```typescript
// renderer/modules/goal/features/focus/composables/useFocusKeyboard.ts
import { onMounted, onUnmounted } from 'vue';
import { useFocusStore } from '../store/focus.store';

export function useFocusKeyboard() {
  const focusStore = useFocusStore();

  const handleKeydown = (e: KeyboardEvent) => {
    // 检查是否在输入框中
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ': // Space - 开始/暂停/继续
        e.preventDefault();
        if (!focusStore.hasSession) {
          focusStore.startFocus();
        } else if (focusStore.isActive) {
          focusStore.pauseFocus();
        } else if (focusStore.isPaused) {
          focusStore.resumeFocus();
        }
        break;

      case 'Escape': // Escape - 停止
        if (focusStore.hasSession) {
          focusStore.stopFocus();
        }
        break;

      case 's': // S - 快速开始 (Ctrl/Cmd + S)
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (!focusStore.hasSession) {
            focusStore.startFocus();
          }
        }
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
}
```

## 验收标准

- [ ] Focus Store 功能完整
- [ ] 实时计时更新正常
- [ ] 所有控制操作（开始、暂停、继续、停止）正常
- [ ] 进度环动画流畅
- [ ] 目标选择功能正常
- [ ] 今日统计显示正确
- [ ] 快捷键操作正常
- [ ] 音效播放正常（可关闭）
- [ ] 响应式设计适配
- [ ] 暗色模式支持
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/goal/features/focus/store/focus.store.ts` | 新建 | Focus Store |
| `renderer/modules/goal/features/focus/components/FocusTimer.vue` | 新建 | 计时器组件 |
| `renderer/modules/goal/features/focus/components/FocusProgress.vue` | 新建 | 进度环组件 |
| `renderer/modules/goal/features/focus/components/FocusControls.vue` | 新建 | 控制按钮组件 |
| `renderer/modules/goal/features/focus/components/FocusGoalSelector.vue` | 新建 | 目标选择器 |
| `renderer/modules/goal/features/focus/components/FocusDurationPicker.vue` | 新建 | 时长选择 |
| `renderer/modules/goal/features/focus/components/FocusSessionHistory.vue` | 新建 | 历史记录 |
| `renderer/modules/goal/features/focus/components/FocusStatistics.vue` | 新建 | 统计图表 |
| `renderer/modules/goal/features/focus/composables/useFocusTimer.ts` | 新建 | 计时逻辑 |
| `renderer/modules/goal/features/focus/composables/useFocusKeyboard.ts` | 新建 | 快捷键 |
| `renderer/modules/goal/features/focus/composables/useFocusSound.ts` | 新建 | 音效 |
| `renderer/modules/goal/features/focus/pages/FocusPage.vue` | 新建 | 专注页面 |
| `renderer/modules/goal/features/focus/pages/FocusWidget.vue` | 新建 | 迷你组件 |
| `public/sounds/focus-start.mp3` | 新建 | 开始音效 |
| `public/sounds/focus-complete.mp3` | 新建 | 完成音效 |

## 依赖关系

- **前置依赖**: Story 13.12 (Focus IPC Client)
- **后续依赖**: 无

## 设计参考

- 参考 Forest、Pomofocus 等番茄钟应用
- 保持与 DailyUse 整体设计风格一致
- 重点：简洁、直观、减少干扰
