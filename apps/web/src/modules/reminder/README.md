# Reminder Module - 前端架构说明

## 📐 DDD 架构分层

本模块严格遵循 DDD（领域驱动设计）架构，与 Goal 模块保持一致的结构规范。

```
reminder/
├── application/          # 应用层
│   └── services/         # 应用服务（协调领域逻辑和基础设施）
│       ├── ReminderStatisticsApplicationService.ts
│       ├── ReminderTemplateApplicationService.ts
│       └── index.ts
│
├── domain/               # 领域层
│   └── entities/         # 领域实体（前端领域模型）
│
├── infrastructure/       # 基础设施层
│   └── api/              # HTTP 请求封装
│       └── reminderApiClient.ts
│
├── presentation/         # 展示层
│   ├── components/       # UI 组件
│   │   ├── cards/        # 卡片组件
│   │   ├── dialogs/      # 对话框组件
│   │   └── ...
│   ├── composables/      # Composition API 逻辑复用
│   │   └── useReminder.ts
│   ├── stores/           # Pinia 状态管理
│   │   └── reminderStore.ts
│   └── views/            # 页面级组件
│       ├── ReminderDesktopView.vue
│       └── ReminderView.vue
│
└── index.ts              # 模块导出入口
```

---

## 🏛️ 各层职责

### 1. Application Layer（应用层）
**职责**: 协调领域服务和基础设施，处理业务用例

**文件**:
- `ReminderTemplateApplicationService.ts` - 提醒模板应用服务
- `ReminderStatisticsApplicationService.ts` - 统计应用服务

**特点**:
- 不包含业务逻辑
- 委托给领域服务或直接调用基础设施层
- 处理跨层协调

---

### 2. Domain Layer（领域层）
**职责**: 领域模型和业务规则

**文件**:
- `entities/` - 前端领域实体（待补充）

**特点**:
- 纯 TypeScript 类/接口
- 不依赖 Vue、Vuetify
- 领域逻辑独立

---

### 3. Infrastructure Layer（基础设施层）
**职责**: 外部系统交互（HTTP、LocalStorage、WebSocket）

**文件**:
- `api/reminderApiClient.ts` - HTTP 请求封装

**特点**:
- 与后端 API 交互
- 类型安全的请求/响应
- 统一错误处理

**示例**:
```typescript
export const reminderApiClient = {
  async createTemplate(data: CreateReminderTemplateRequestDTO) {
    return apiClient.post<ReminderTemplateClientDTO>('/reminders/templates', data);
  },
  // ...
};
```

---

### 4. Presentation Layer（展示层）
**职责**: UI 展示和用户交互

#### 4.1 Composables（组合式函数）
**职责**: 状态管理和业务逻辑复用

**文件**:
- `useReminder.ts` - Reminder CRUD 逻辑

**特点**:
- Vue 3 Composition API
- 响应式状态管理
- 封装 API 调用
- 缓存管理（Map 结构）

**示例**:
```typescript
export function useReminder() {
  const templates = ref<Map<string, ReminderTemplateClientDTO>>(new Map());
  const isLoading = ref(false);
  
  async function loadUserTemplates(accountUuid: string) {
    // ...
  }
  
  return { templates, isLoading, loadUserTemplates };
}
```

#### 4.2 Views（视图）
**职责**: 页面级组件

**文件**:
- `ReminderDesktopView.vue` - **主界面**（手机桌面风格网格布局）

**特点**:
- 页面路由入口（`/reminders` 的默认视图）
- 网格拖拽布局（Grid Layout）
- 手机桌面风格交互（图标+文件夹）
- 右键上下文菜单
- 底部工具栏（Dock）
- 组合多个 Components（Cards、Dialogs、Sidebar）

#### 4.3 Components（组件）
**职责**: 可复用 UI 组件

**文件夹**:
- `cards/` - 卡片组件
- `dialogs/` - 对话框组件
- `grid/` - 网格组件

**特点**:
- 单一职责
- Props + Emits 通信
- Vuetify 3 组件库

#### 4.4 Stores（状态管理）
**职责**: 全局状态管理（Pinia）

**文件**:
- `reminderStore.ts` - Reminder 全局状态

**特点**:
- Pinia Store
- 跨组件共享状态
- 持久化支持

---

## 📊 数据流向

```
User Interaction (View)
    ↓
Composable (useReminder)
    ↓
Infrastructure (reminderApiClient)
    ↓
Backend API
    ↓
Response → Composable → View
```

---

## 🔄 Story 5-1 实现清单

### ✅ 已完成
- Infrastructure: `reminderApiClient.ts` (8个 API 方法)
- Presentation: `useReminder.ts` (状态管理 + 8个业务方法)
- Presentation: `ReminderDesktopView.vue` (**主界面** - 手机桌面风格)
- Presentation: 已有组件（TemplateDialog, GroupDialog, TemplateDesktopCard 等）
- Presentation: `reminderStore.ts` (Pinia 状态管理)
- Application: 应用服务（ReminderWebApplicationService）
- Module: `index.ts` (统一导出)

### ⏳ 待增强（Story 5-2+）
- Presentation: 拖拽排序功能（目前为静态网格）
- Presentation: 分组展开详情视图
- Presentation: 提醒实例详细管理
- Domain: 前端领域实体类（目前使用 domain-client）
- Infrastructure: 更多 API 方法（批量操作、高级搜索）

---

## 🚀 使用示例

### 在组件中使用 Composable
```vue
<script setup lang="ts">
import { useReminder } from '@/modules/reminder';

const {
  reminderTemplates,
  isLoading,
  initialize,
  refreshAll,
  deleteTemplate,
} = useReminder();

onMounted(async () => {
  await initialize();
});
</script>
```

### 主界面结构 (ReminderDesktopView.vue)
```vue
<template>
  <!-- 手机桌面风格布局 -->
  <div class="phone-desktop">
    <!-- 网格布局 -->
    <div class="desktop-grid">
      <!-- 模板图标 (App Icon) -->
      <div class="app-icon" @click="handleTemplateClick(template)">
        <div class="icon-circle">
          <v-icon>mdi-bell</v-icon>
        </div>
        <div class="app-name">{{ template.name }}</div>
      </div>
      
      <!-- 分组文件夹 (Folder Icon) -->
      <div class="folder-icon" @click="handleGroupClick(group)">
        <div class="folder-circle">
          <v-icon>mdi-folder</v-icon>
          <div class="folder-badge">{{ count }}</div>
        </div>
        <div class="folder-name">{{ group.name }}</div>
      </div>
    </div>
    
    <!-- 底部工具栏 (Dock) -->
    <div class="bottom-dock">
      <v-btn icon @click="createTemplate">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
  </div>
</template>
```

### 直接调用 API Client
```typescript
import { reminderApiClient } from '@/modules/reminder';

const response = await reminderApiClient.createTemplate({
  accountUuid: 'xxx',
  title: '每天晨会',
  type: 'TASK',
  // ...
});
```

---

## 📖 参考模块

- **Goal Module** - `/apps/web/src/modules/goal/` (完整的 DDD 架构参考)
- **Task Module** - `/apps/web/src/modules/task/` (另一个参考实现)

---

**维护者**: BMad Master  
**最后更新**: 2025-10-30  
**架构版本**: v1.0 (DDD)
