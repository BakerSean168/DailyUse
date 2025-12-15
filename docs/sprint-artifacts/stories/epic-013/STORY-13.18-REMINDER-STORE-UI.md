# Story 13.18: Reminder Store 重构 & 通知 UI

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.18 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

重构 Reminder Store 并创建提醒通知 UI 组件。

## 任务列表

- [ ] 1. 重构 Reminder Store
- [ ] 2. 创建提醒通知组件
  - [ ] `ReminderPopup` - 弹窗通知
  - [ ] `ReminderToast` - Toast 通知
  - [ ] `ReminderList` - 提醒列表
- [ ] 3. 实现稍后提醒功能
- [ ] 4. 添加单元测试

## 技术设计

### Reminder Store

```typescript
// renderer/modules/reminder/store/reminder.store.ts
import { defineStore } from 'pinia';
import { container } from '@/shared/infrastructure/di';
import { REMINDER_TOKENS } from '../di/tokens';

interface ReminderState {
  reminders: ReminderClientDTO[];
  upcomingReminders: ReminderClientDTO[];
  activeReminder: ReminderClientDTO | null;  // 当前触发的提醒
  loading: boolean;
  error: string | null;
}

export const useReminderStore = defineStore('reminder', {
  state: (): ReminderState => ({
    reminders: [],
    upcomingReminders: [],
    activeReminder: null,
    loading: false,
    error: null,
  }),

  getters: {
    hasActiveReminder: (state) => state.activeReminder !== null,
    upcomingCount: (state) => state.upcomingReminders.length,
  },

  actions: {
    getReminderClient() {
      return container.resolve<ReminderIPCClient>(REMINDER_TOKENS.REMINDER_IPC_CLIENT);
    },

    async initialize() {
      const client = this.getReminderClient();
      
      // 订阅提醒触发
      client.onTrigger((reminder) => {
        this.activeReminder = reminder;
        this.showReminderNotification(reminder);
      });

      await this.fetchUpcoming();
    },

    async fetchReminders(filter?: ListRemindersFilter) {
      this.loading = true;
      try {
        this.reminders = await this.getReminderClient().list(filter);
      } finally {
        this.loading = false;
      }
    },

    async fetchUpcoming() {
      try {
        this.upcomingReminders = await this.getReminderClient().getUpcoming(10);
      } catch (e) {
        console.error('Failed to fetch upcoming reminders:', e);
      }
    },

    async createReminder(input: CreateReminderInput) {
      const reminder = await this.getReminderClient().create(input);
      this.reminders.push(reminder);
      await this.fetchUpcoming();
      return reminder;
    },

    async snoozeReminder(uuid: string, minutes: number) {
      await this.getReminderClient().snooze(uuid, minutes);
      this.activeReminder = null;
      await this.fetchUpcoming();
    },

    async dismissReminder(uuid: string) {
      await this.getReminderClient().dismiss(uuid);
      this.activeReminder = null;
    },

    showReminderNotification(reminder: ReminderClientDTO) {
      // 触发 UI 通知
      // 可以使用 event bus 或直接控制组件状态
    },
  },
});
```

### ReminderPopup 组件

```vue
<!-- renderer/modules/reminder/components/ReminderPopup.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useReminderStore } from '../store/reminder.store';
import { Button, Dialog } from '@dailyuse/ui';

const reminderStore = useReminderStore();

const isOpen = computed(() => reminderStore.hasActiveReminder);
const reminder = computed(() => reminderStore.activeReminder);

const snoozeOptions = [
  { label: '5 分钟', value: 5 },
  { label: '15 分钟', value: 15 },
  { label: '30 分钟', value: 30 },
  { label: '1 小时', value: 60 },
];

async function handleSnooze(minutes: number) {
  if (reminder.value) {
    await reminderStore.snoozeReminder(reminder.value.uuid, minutes);
  }
}

async function handleDismiss() {
  if (reminder.value) {
    await reminderStore.dismissReminder(reminder.value.uuid);
  }
}
</script>

<template>
  <Dialog :open="isOpen" @close="handleDismiss">
    <div class="reminder-popup" v-if="reminder">
      <div class="reminder-icon">🔔</div>
      <h3 class="reminder-title">{{ reminder.title }}</h3>
      <p class="reminder-description" v-if="reminder.description">
        {{ reminder.description }}
      </p>
      
      <div class="reminder-actions">
        <div class="snooze-options">
          <span>稍后提醒:</span>
          <Button 
            v-for="option in snoozeOptions"
            :key="option.value"
            size="sm"
            variant="secondary"
            @click="handleSnooze(option.value)"
          >
            {{ option.label }}
          </Button>
        </div>
        
        <Button variant="primary" @click="handleDismiss">
          知道了
        </Button>
      </div>
    </div>
  </Dialog>
</template>
```

## 验收标准

- [ ] Store 重构完成
- [ ] 提醒触发时显示通知
- [ ] 稍后提醒功能正常
- [ ] 关闭提醒功能正常
- [ ] UI 组件美观易用

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/reminder/store/reminder.store.ts` | 修改 | 重构 Store |
| `renderer/modules/reminder/components/ReminderPopup.vue` | 新建 | 弹窗组件 |
| `renderer/modules/reminder/components/ReminderToast.vue` | 新建 | Toast 组件 |
| `renderer/modules/reminder/components/ReminderList.vue` | 新建 | 列表组件 |

## 依赖关系

- **前置依赖**: Story 13.17 (Reminder IPC & DI)
- **后续依赖**: 无
