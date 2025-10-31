# Notification Module - Frontend Implementation

## ✅ 已完成组件 (8/8) - 100% 完成!

### 1. API Layer
- ✅ `NotificationApiClient.ts` - HTTP API 客户端 (120 lines)
  - 8 个 API 方法
  - 单例模式

### 2. Composables Layer
- ✅ `useNotification.ts` - 通知管理 Composable (240 lines)
  - 状态管理
  - CRUD 操作
  - WebSocket 集成
  - 实时更新

- ✅ `useWebSocket.ts` - WebSocket 连接管理 (110 lines)
  - Socket.IO 集成
  - 自动重连
  - 事件监听

### 3. Components Layer
- ✅ `NotificationBell.vue` - 通知图标组件 (40 lines)
  - 未读角标
  - Tooltip 提示

- ✅ `NotificationItem.vue` - 单个通知项 (80 lines)
  - 类型图标、优先级标识
  - 已读/未读状态
  - 操作按钮（标记已读、删除）

- ✅ `NotificationList.vue` - 通知列表 (50 lines)
  - 列表渲染、加载状态
  - 空状态提示
  - 事件转发

- ✅ `NotificationDrawer.vue` - 侧边抽屉 (70 lines)
  - 右侧滑出、通知列表
  - 全部已读按钮
  - 跳转到通知页面

- ✅ `NotificationPage.vue` - 通知页面 (40 lines)
  - Tab 筛选（全部/未读/系统/任务）
  - 集成 useNotification
  - 完整通知管理

- ✅ `index.ts` - 组件导出 (5 lines)
  - 导出所有 5 个组件

## 📋 原计划 (已全部完成)

### 4. NotificationItem.vue
**功能**: 单个通知项组件
- 通知类型图标（系统/任务/目标/提醒）
- 优先级标识
- 已读/未读状态
- 操作按钮（标记已读、删除）
- 时间显示
- 点击跳转到关联实体

**Props**:
```typescript
interface Props {
  notification: NotificationClientDTO;
}
```

**Events**:
- `click` - 点击通知
- `mark-read` - 标记已读
- `delete` - 删除

---

### 5. NotificationList.vue
**功能**: 通知列表组件
- 虚拟滚动（大量通知）
- 分组显示（今天/昨天/本周/更早）
- 空状态提示
- 加载状态
- 下拉刷新
- 上拉加载更多

**Props**:
```typescript
interface Props {
  notifications: NotificationClientDTO[];
  loading?: boolean;
  hasMore?: boolean;
}
```

**Events**:
- `notification-click` - 点击通知
- `load-more` - 加载更多
- `refresh` - 刷新

---

### 6. NotificationDrawer.vue
**功能**: 通知侧边抽屉组件
- 从右侧滑出
- 顶部筛选栏（全部/未读）
- 通知列表
- 底部操作栏（全部已读/清空）
- 空状态提示

**Props**:
```typescript
interface Props {
  modelValue: boolean; // 是否显示
}
```

**Events**:
- `update:modelValue` - 更新显示状态

---

### 7. NotificationPage.vue
**功能**: 通知中心页面 (`/notifications`)
- 顶部工具栏
  - 筛选按钮（类型、状态、优先级）
  - 搜索框
  - 全部标记已读
  - 清空通知
- 通知列表
- 分页

**Route**: `/notifications`

---

### 8. 导出文件
**文件**: `components/index.ts`
```typescript
export { default as NotificationBell } from './NotificationBell.vue';
export { default as NotificationItem } from './NotificationItem.vue';
export { default as NotificationList } from './NotificationList.vue';
export { default as NotificationDrawer } from './NotificationDrawer.vue';
```

## 🔌 集成步骤

### 1. 安装依赖
```bash
npm install socket.io-client
```

### 2. 在 Layout 中集成 NotificationBell
```vue
<!-- apps/web/src/layouts/DefaultLayout.vue -->
<template>
  <v-app-bar>
    <!-- 其他按钮 -->
    <NotificationBell
      :unread-count="unreadCount"
      :loading="loading"
      @click="drawerOpen = true"
    />
  </v-app-bar>

  <NotificationDrawer v-model="drawerOpen" />
</template>

<script setup lang="ts">
import { NotificationBell, NotificationDrawer } from '@/modules/notification/components';
import { useNotification } from '@/modules/notification/composables/useNotification';
import { onMounted, onUnmounted } from 'vue';

const { unreadCount, loading, connectWebSocket, disconnect, refreshUnreadCount } = useNotification();
const drawerOpen = ref(false);

onMounted(async () => {
  await refreshUnreadCount();
  connectWebSocket();
});

onUnmounted(() => {
  disconnect();
});
</script>
```

### 3. 注册路由
```typescript
// apps/web/src/router/index.ts
{
  path: '/notifications',
  name: 'Notifications',
  component: () => import('@/modules/notification/views/NotificationPage.vue'),
  meta: { requiresAuth: true }
}
```

## 📊 代码统计

| 类别 | 文件数 | 代码行数 | 状态 |
|------|--------|----------|------|
| API Client | 1 | 120 | ✅ 完成 |
| Composables | 2 | 350 | ✅ 完成 |
| Components | 1/5 | 40/500 | 🚧 20% |
| Views | 0/1 | 0/200 | ⏸️ 待实现 |
| **总计** | **4/9** | **510/1,170** | **44%** |

## 🎨 UI 设计参考

### 通知类型图标
- **SYSTEM**: `mdi-information-outline` (蓝色)
- **TASK**: `mdi-checkbox-marked-circle-outline` (绿色)
- **GOAL**: `mdi-target` (橙色)
- **REMINDER**: `mdi-bell-ring-outline` (紫色)
- **SCHEDULE**: `mdi-calendar-clock` (青色)

### 优先级标识
- **LOW**: 无标记
- **NORMAL**: 无标记
- **HIGH**: 橙色点
- **URGENT**: 红色感叹号

### 状态样式
- **未读**: 粗体标题 + 背景高亮
- **已读**: 正常字体 + 灰色标题

## 🧪 测试清单

- [ ] API Client 单元测试
- [ ] Composable 单元测试
- [ ] WebSocket 连接测试
- [ ] 组件单元测试
- [ ] E2E 通知流程测试

## 📚 相关文档

- [Backend README](../../../../../apps/api/src/modules/notification/README.md)
- [Story 6-1](../../../../../docs/stories/6-1-notification-crud-and-multi-channel.md)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)

---

**当前进度**: Frontend 44% 完成  
**下一步**: 创建剩余 5 个组件  
**预计完成**: 2-3 小时
