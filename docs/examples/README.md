---
tags:
  - examples
  - code-samples
  - api-usage
  - tutorial
description: 示例代码索引 - 可运行的代码示例帮助快速上手API使用
created: 2025-11-23T17:55:00
updated: 2025-11-23T17:55:00
---

# 💡 示例代码索引 - Examples Index

> 可运行的代码示例，帮助快速理解和使用DailyUse API

## 📋 目录

- [快速开始示例](#快速开始示例)
- [目标管理示例](#目标管理示例)
- [任务管理示例](#任务管理示例)
- [日程调度示例](#日程调度示例)
- [通知提醒示例](#通知提醒示例)
- [认证授权示例](#认证授权示例)

---

## 🚀 快速开始示例

### 完整的CRUD操作示例

```typescript
// examples/quick-start/complete-crud.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
let authToken: string;

// 1. 用户注册与登录
async function authenticate() {
  // 注册
  const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
    email: 'demo@example.com',
    password: 'SecurePassword123!',
    name: '示例用户',
  });
  
  console.log('✅ 注册成功:', registerResponse.data.user);
  
  // 登录获取Token
  const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'demo@example.com',
    password: 'SecurePassword123!',
  });
  
  authToken = loginResponse.data.accessToken;
  console.log('✅ 登录成功，获取Token');
}

// 2. 创建目标
async function createGoal() {
  const response = await axios.post(
    `${API_BASE_URL}/goals`,
    {
      title: '完成项目开发',
      description: '在12月前完成所有核心功能',
      startDate: '2025-11-23',
      endDate: '2025-12-31',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log('✅ 创建目标:', response.data);
  return response.data.id;
}

// 3. 创建任务
async function createTask(goalId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/tasks`,
    {
      title: '实现用户认证模块',
      description: '包含JWT、OAuth等功能',
      goalId,
      priority: 'high',
      dueDate: '2025-11-30',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log('✅ 创建任务:', response.data);
  return response.data.id;
}

// 4. 开始任务
async function startTask(taskId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/tasks/${taskId}/start`,
    {},
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log('✅ 开始任务:', response.data);
}

// 5. 完成任务
async function completeTask(taskId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/tasks/${taskId}/complete`,
    {},
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log('✅ 完成任务:', response.data);
}

// 6. 查看目标进度
async function checkGoalProgress(goalId: string) {
  const response = await axios.get(
    `${API_BASE_URL}/goals/${goalId}/progress`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  
  console.log('📊 目标进度:', response.data);
}

// 运行示例
async function main() {
  try {
    await authenticate();
    const goalId = await createGoal();
    const taskId = await createTask(goalId);
    await startTask(taskId);
    await completeTask(taskId);
    await checkGoalProgress(goalId);
    
    console.log('🎉 示例运行完成！');
  } catch (error: any) {
    console.error('❌ 错误:', error.response?.data || error.message);
  }
}

main();
```

**运行示例**:

```bash
# 安装依赖
pnpm install axios typescript ts-node

# 运行示例
npx ts-node examples/quick-start/complete-crud.ts
```

---

## 🎯 目标管理示例

### 创建OKR目标

```typescript
// examples/goal/create-okr.ts
import { goalApi } from '@/api/goal.api';

async function createOKRGoal() {
  // 创建Objective（目标）
  const objective = await goalApi.create({
    title: 'Q4 产品增长目标',
    description: '提升用户增长和产品体验',
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    type: 'objective',
  });

  console.log('✅ 创建Objective:', objective);

  // 创建Key Results（关键结果）
  const kr1 = await goalApi.createKeyResult(objective.id, {
    title: '新增用户达到10000人',
    targetValue: 10000,
    currentValue: 0,
    unit: '人',
  });

  const kr2 = await goalApi.createKeyResult(objective.id, {
    title: '用户活跃度提升30%',
    targetValue: 30,
    currentValue: 0,
    unit: '%',
  });

  const kr3 = await goalApi.createKeyResult(objective.id, {
    title: '客户满意度达到4.5分',
    targetValue: 4.5,
    currentValue: 0,
    unit: '分',
  });

  console.log('✅ 创建Key Results:', [kr1, kr2, kr3]);

  // 更新KR进度
  await goalApi.updateKeyResult(objective.id, kr1.id, {
    currentValue: 3500,
  });

  // 查看目标完成度
  const progress = await goalApi.getProgress(objective.id);
  console.log('📊 目标完成度:', `${progress.percentage}%`);
}
```

### 目标层级关系

```typescript
// examples/goal/goal-hierarchy.ts
async function createGoalHierarchy() {
  // 1. 创建年度目标（Level 0）
  const annualGoal = await goalApi.create({
    title: '2025年度目标：成为行业领先产品',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  });

  // 2. 创建季度目标（Level 1）
  const q1Goal = await goalApi.create({
    title: 'Q1: 产品核心功能完善',
    parentId: annualGoal.id,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
  });

  const q2Goal = await goalApi.create({
    title: 'Q2: 市场推广与用户增长',
    parentId: annualGoal.id,
    startDate: '2025-04-01',
    endDate: '2025-06-30',
  });

  // 3. 创建月度目标（Level 2）
  const januaryGoal = await goalApi.create({
    title: '1月: 用户认证系统上线',
    parentId: q1Goal.id,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  });

  // 4. 查看目标树
  const goalTree = await goalApi.getHierarchy(annualGoal.id);
  console.log('🌳 目标层级:', goalTree);
}
```

---

## ✅ 任务管理示例

### GTD工作流

```typescript
// examples/task/gtd-workflow.ts
import { taskApi } from '@/api/task.api';

async function gtdWorkflow() {
  // 1. 收集阶段 - 创建任务
  const tasks = await Promise.all([
    taskApi.create({ title: '回复客户邮件', context: 'email' }),
    taskApi.create({ title: '准备下周会议PPT', context: 'work' }),
    taskApi.create({ title: '学习Vue 3新特性', context: 'learning' }),
    taskApi.create({ title: '修复生产环境Bug', priority: 'urgent' }),
  ]);

  console.log('📥 收集任务:', tasks.length);

  // 2. 处理阶段 - 分类任务
  const urgentTask = tasks[3];
  await taskApi.update(urgentTask.id, {
    priority: 'urgent',
    tags: ['bug', 'production'],
    dueDate: new Date().toISOString(),
  });

  // 3. 组织阶段 - 设置上下文
  await taskApi.update(tasks[0].id, {
    context: 'email',
    estimatedMinutes: 30,
  });

  await taskApi.update(tasks[1].id, {
    context: 'work',
    estimatedMinutes: 120,
    dueDate: '2025-11-28',
  });

  // 4. 执行阶段 - 开始任务
  await taskApi.start(urgentTask.id);
  
  // 模拟工作...
  console.log('🔨 正在修复Bug...');
  
  // 完成任务
  await taskApi.complete(urgentTask.id);
  console.log('✅ Bug已修复');

  // 5. 回顾阶段 - 查看已完成任务
  const completedTasks = await taskApi.getAll({
    status: 'completed',
    completedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  console.log('📊 本周完成:', completedTasks.length, '个任务');
}
```

### 番茄工作法

```typescript
// examples/task/pomodoro.ts
async function pomodoroTechnique(taskId: string) {
  console.log('🍅 开始番茄工作法');

  // 开始任务
  await taskApi.start(taskId);
  console.log('⏰ 开始25分钟专注时间');

  // 模拟25分钟工作（实际应该是真实的25分钟）
  await sleep(25 * 60 * 1000);

  // 暂停任务
  await taskApi.pause(taskId);
  console.log('☕ 休息5分钟');

  // 休息5分钟
  await sleep(5 * 60 * 1000);

  // 继续任务
  await taskApi.resume(taskId);
  console.log('🍅 继续下一个番茄钟');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 📅 日程调度示例

### 创建重复事件

```typescript
// examples/schedule/recurring-event.ts
import { scheduleApi } from '@/api/schedule.api';

async function createRecurringEvents() {
  // 每日站会（工作日）
  const dailyStandup = await scheduleApi.create({
    title: '每日站会',
    startTime: '09:00',
    duration: 15,
    recurrence: {
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5], // 周一到周五
      endDate: '2025-12-31',
    },
  });

  // 每周评审会（周五下午）
  const weeklyReview = await scheduleApi.create({
    title: '每周评审会',
    startTime: '15:00',
    duration: 60,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [5], // 周五
    },
  });

  // 每月复盘（每月最后一个工作日）
  const monthlyRetrospective = await scheduleApi.create({
    title: '月度复盘',
    startTime: '14:00',
    duration: 120,
    recurrence: {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: -1, // 最后一天
    },
  });

  console.log('✅ 创建重复事件:', {
    dailyStandup,
    weeklyReview,
    monthlyRetrospective,
  });
}
```

### 日历视图查询

```typescript
// examples/schedule/calendar-view.ts
async function getCalendarView(year: number, month: number) {
  // 获取月度日历
  const calendar = await scheduleApi.getMonthView(year, month);

  console.log(`📅 ${year}年${month}月日历:`);

  calendar.weeks.forEach((week, weekIndex) => {
    console.log(`\n第${weekIndex + 1}周:`);
    
    week.days.forEach(day => {
      if (day.events.length > 0) {
        console.log(`  ${day.date}: ${day.events.length}个事件`);
        day.events.forEach(event => {
          console.log(`    - ${event.startTime} ${event.title}`);
        });
      }
    });
  });
}

// 获取当天日程
async function getTodaySchedule() {
  const today = new Date().toISOString().split('T')[0];
  const events = await scheduleApi.getByDateRange(today, today);

  console.log('📋 今日日程:');
  events.forEach(event => {
    console.log(`${event.startTime} - ${event.title}`);
  });
}
```

---

## 🔔 通知提醒示例

### 创建智能提醒

```typescript
// examples/reminder/smart-reminders.ts
import { reminderApi } from '@/api/reminder.api';

async function createSmartReminders() {
  // 任务截止提醒（提前1天）
  const taskReminder = await reminderApi.create({
    type: 'task',
    entityId: 'task-123',
    triggerAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    channels: ['notification', 'email'],
    message: '任务即将到期，请及时完成',
  });

  // 会议提醒（提前15分钟）
  const meetingReminder = await reminderApi.create({
    type: 'schedule',
    entityId: 'event-456',
    offsetMinutes: -15,
    channels: ['notification', 'push'],
    message: '会议将在15分钟后开始',
  });

  // 目标检查提醒（每周提醒）
  const goalCheckReminder = await reminderApi.create({
    type: 'goal',
    entityId: 'goal-789',
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: [1], // 每周一
    },
    channels: ['notification'],
    message: '请更新目标进度',
  });

  console.log('✅ 创建提醒:', {
    taskReminder,
    meetingReminder,
    goalCheckReminder,
  });
}
```

### SSE实时通知

```vue
<!-- examples/notification/sse-realtime.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const notifications = ref<Notification[]>([]);
let eventSource: EventSource | null = null;

onMounted(() => {
  // 建立SSE连接
  const token = localStorage.getItem('accessToken');
  eventSource = new EventSource(
    `http://localhost:3000/api/notifications/stream?token=${token}`
  );

  // 监听新通知
  eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data);
    notifications.value.unshift(notification);
    
    // 显示浏览器通知
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
      });
    }
  });

  // 错误处理
  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error);
    eventSource?.close();
  };
});

onUnmounted(() => {
  eventSource?.close();
});

async function markAsRead(id: string) {
  await notificationApi.markAsRead(id);
  const notification = notifications.value.find(n => n.id === id);
  if (notification) {
    notification.isRead = true;
  }
}
</script>

<template>
  <div class="notifications">
    <h3>实时通知 ({{ notifications.length }})</h3>
    
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="['notification-item', { unread: !notification.isRead }]"
      @click="markAsRead(notification.id)"
    >
      <div class="notification-title">{{ notification.title }}</div>
      <div class="notification-message">{{ notification.message }}</div>
      <div class="notification-time">{{ notification.createdAt }}</div>
    </div>
  </div>
</template>
```

---

## 🔐 认证授权示例

### 完整认证流程

```typescript
// examples/auth/complete-flow.ts
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

async function completeAuthFlow() {
  const authStore = useAuthStore();

  // 1. 注册
  console.log('📝 注册新用户...');
  await authStore.register({
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    name: '新用户',
  });

  // 2. 邮箱验证（模拟点击验证链接）
  console.log('📧 验证邮箱...');
  await authApi.verifyEmail('verification-token-123');

  // 3. 登录
  console.log('🔑 登录...');
  await authStore.login({
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
  });

  // 4. 访问受保护资源
  console.log('🔒 访问受保护资源...');
  const user = await authApi.getCurrentUser();
  console.log('当前用户:', user);

  // 5. 修改密码
  console.log('🔐 修改密码...');
  await authApi.changePassword({
    currentPassword: 'SecurePassword123!',
    newPassword: 'NewPassword456!',
  });

  // 6. 登出
  console.log('👋 登出...');
  await authStore.logout();
}
```

### 权限检查

```vue
<!-- examples/auth/permission-check.vue -->
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

const canCreateGoal = authStore.hasPermission('goal:create');
const canDeleteGoal = authStore.hasPermission('goal:delete');
const isAdmin = authStore.isAdmin;
</script>

<template>
  <div>
    <v-btn v-if="canCreateGoal" @click="createGoal">
      创建目标
    </v-btn>
    
    <v-btn v-if="canDeleteGoal" color="error" @click="deleteGoal">
      删除目标
    </v-btn>
    
    <v-btn v-if="isAdmin" @click="openAdminPanel">
      管理后台
    </v-btn>
  </div>
</template>
```

---

## 📚 更多示例

### 在线示例

访问在线示例平台查看更多交互式示例：

- **Stackblitz**: https://stackblitz.com/github/BakerSean168/DailyUse-examples
- **CodeSandbox**: https://codesandbox.io/s/dailyuse-examples

### 完整示例项目

克隆示例项目仓库：

```bash
git clone https://github.com/BakerSean168/DailyUse-examples.git
cd DailyUse-examples
pnpm install
pnpm dev
```

---

## 📚 相关文档

- [[reference/api/README|API参考]]
- [[modules/goal/README|目标模块]]
- [[modules/task/README|任务模块]]
- [[modules/schedule/README|日程模块]]
- [[guides/development/testing|测试指南]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
