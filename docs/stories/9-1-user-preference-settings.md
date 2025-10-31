# Story 9-1: 用户偏好设置管理

**Story ID**: 9-1  
**Story 标题**: User Preference Settings (用户偏好设置管理)  
**Epic**: Epic 9 - Setting Module  
**优先级**: P0  
**Story Points**: 5  
**状态**: Ready for Dev  
**创建时间**: 2025-10-31

---

## 📋 Story 概述

实现用户偏好设置功能，允许用户自定义界面主题、语言、通知偏好、快捷键等个性化配置，并支持设置的持久化存储和跨设备同步。

---

## 🎯 用户故事

**As a** 用户  
**I want to** 自定义我的应用偏好设置  
**So that** 我可以获得个性化的使用体验

---

## ✅ 验收标准

### AC1: 查看当前设置
```gherkin
Given 用户已登录
When 用户打开设置页面
Then 系统显示所有设置分类
And 显示当前设置值
And 提供修改入口
```

### AC2: 修改主题设置
```gherkin
Given 用户在设置页面
When 用户切换主题从"浅色"到"深色"
Then 系统立即应用深色主题
And 保存设置到数据库
And 显示保存成功提示
```

### AC3: 修改语言设置
```gherkin
Given 用户在设置页面
When 用户切换语言从"中文"到"English"
Then 系统立即切换界面语言
And 保存语言偏好
And 下次登录自动使用选择的语言
```

### AC4: 修改通知偏好
```gherkin
Given 用户在设置页面
When 用户关闭"邮件通知"
And 开启"站内通知"
Then 系统保存通知偏好
And 后续只发送站内通知
```

### AC5: 自定义快捷键
```gherkin
Given 用户在设置页面的快捷键区域
When 用户修改"新建任务"快捷键为 "Ctrl+N"
And 快捷键没有冲突
Then 系统保存快捷键配置
And 立即生效
```

### AC6: 重置为默认设置
```gherkin
Given 用户修改了多项设置
When 用户点击"恢复默认"
And 确认操作
Then 系统重置所有设置为默认值
And 立即应用默认设置
```

### AC7: 设置数据持久化
```gherkin
Given 用户修改了设置
When 用户刷新页面
Then 系统保持用户的设置
```

---

## 🏗️ 技术实现

### 后端实现

#### 1. 数据模型 (Prisma Schema)

**文件**: `apps/api/prisma/schema.prisma`

```prisma
model UserSetting {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 界面设置
  theme     String   @default("light")  // light, dark, auto
  language  String   @default("zh-CN")  // zh-CN, en-US
  fontSize  String   @default("medium") // small, medium, large
  
  // 通知偏好
  emailNotification   Boolean @default(true)
  pushNotification    Boolean @default(true)
  inAppNotification   Boolean @default(true)
  notificationSound   Boolean @default(true)
  
  // 编辑器设置
  editorTheme         String  @default("default")  // default, monokai, github
  editorFontSize      Int     @default(14)
  editorTabSize       Int     @default(2)
  editorWordWrap      Boolean @default(true)
  editorLineNumbers   Boolean @default(true)
  editorMinimap       Boolean @default(true)
  
  // 快捷键设置 (JSON)
  shortcuts   Json    @default("{}")
  
  // 其他偏好
  startPage   String  @default("dashboard")  // dashboard, goals, tasks
  sidebarCollapsed Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_settings")
}
```

#### 2. DTO 定义

**文件**: `packages/contracts/src/modules/setting/setting.contracts.ts`

```typescript
export namespace SettingContracts {
  // 查询 DTO
  export interface UserSettingDTO {
    id: string;
    userId: string;
    
    // 界面设置
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    
    // 通知偏好
    emailNotification: boolean;
    pushNotification: boolean;
    inAppNotification: boolean;
    notificationSound: boolean;
    
    // 编辑器设置
    editorTheme: string;
    editorFontSize: number;
    editorTabSize: number;
    editorWordWrap: boolean;
    editorLineNumbers: boolean;
    editorMinimap: boolean;
    
    // 快捷键
    shortcuts: Record<string, string>;
    
    // 其他
    startPage: string;
    sidebarCollapsed: boolean;
    
    createdAt: string;
    updatedAt: string;
  }
  
  // 更新 DTO
  export interface UpdateUserSettingDTO {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    fontSize?: 'small' | 'medium' | 'large';
    
    emailNotification?: boolean;
    pushNotification?: boolean;
    inAppNotification?: boolean;
    notificationSound?: boolean;
    
    editorTheme?: string;
    editorFontSize?: number;
    editorTabSize?: number;
    editorWordWrap?: boolean;
    editorLineNumbers?: boolean;
    editorMinimap?: boolean;
    
    shortcuts?: Record<string, string>;
    
    startPage?: string;
    sidebarCollapsed?: boolean;
  }
  
  // 默认设置
  export interface DefaultSettingsDTO {
    theme: string;
    language: string;
    fontSize: string;
    // ... 所有默认值
  }
}
```

#### 3. REST API 设计

**文件**: `apps/api/src/modules/setting/presentation/setting.controller.ts`

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/settings/me` | 获取当前用户设置 | - | UserSettingDTO |
| PUT | `/api/settings/me` | 更新用户设置 | UpdateUserSettingDTO | UserSettingDTO |
| POST | `/api/settings/reset` | 重置为默认设置 | - | UserSettingDTO |
| GET | `/api/settings/defaults` | 获取默认设置 | - | DefaultSettingsDTO |

#### 4. 领域层实现

**目录结构**:
```
apps/api/src/modules/setting/
├── domain/
│   └── user-setting.aggregate.ts
├── application/
│   └── user-setting.service.ts
├── infrastructure/
│   └── user-setting.repository.ts
└── presentation/
    └── setting.controller.ts
```

---

### 前端实现

#### 1. 页面结构

**文件**: `apps/web/src/modules/setting/presentation/views/SettingView.vue`

```vue
<template>
  <v-container>
    <v-row>
      <!-- 左侧导航 -->
      <v-col cols="3">
        <v-list density="compact">
          <v-list-item @click="activeTab = 'appearance'" :active="activeTab === 'appearance'">
            <v-icon>mdi-palette</v-icon> 外观
          </v-list-item>
          <v-list-item @click="activeTab = 'notifications'" :active="activeTab === 'notifications'">
            <v-icon>mdi-bell</v-icon> 通知
          </v-list-item>
          <v-list-item @click="activeTab = 'editor'" :active="activeTab === 'editor'">
            <v-icon>mdi-file-document-edit</v-icon> 编辑器
          </v-list-item>
          <v-list-item @click="activeTab = 'shortcuts'" :active="activeTab === 'shortcuts'">
            <v-icon>mdi-keyboard</v-icon> 快捷键
          </v-list-item>
        </v-list>
      </v-col>
      
      <!-- 右侧设置面板 -->
      <v-col cols="9">
        <!-- 外观设置 -->
        <AppearanceSettings v-if="activeTab === 'appearance'" />
        
        <!-- 通知设置 -->
        <NotificationSettings v-if="activeTab === 'notifications'" />
        
        <!-- 编辑器设置 -->
        <EditorSettings v-if="activeTab === 'editor'" />
        
        <!-- 快捷键设置 -->
        <ShortcutSettings v-if="activeTab === 'shortcuts'" />
      </v-col>
    </v-row>
  </v-container>
</template>
```

#### 2. 设置组件

**AppearanceSettings.vue** - 外观设置
- 主题选择 (浅色/深色/自动)
- 语言选择 (中文/English)
- 字体大小 (小/中/大)

**NotificationSettings.vue** - 通知设置
- 邮件通知开关
- 推送通知开关
- 站内通知开关
- 通知声音开关

**EditorSettings.vue** - 编辑器设置
- 编辑器主题
- 字体大小
- Tab 大小
- 自动换行
- 行号显示
- Minimap 显示

**ShortcutSettings.vue** - 快捷键设置
- 快捷键列表
- 自定义快捷键
- 冲突检测
- 重置默认

#### 3. API Client

**文件**: `apps/web/src/modules/setting/api/SettingApiClient.ts`

```typescript
export class SettingApiClient {
  async getCurrentSettings(): Promise<UserSettingDTO> {
    return apiClient.get('/api/settings/me');
  }
  
  async updateSettings(dto: UpdateUserSettingDTO): Promise<UserSettingDTO> {
    return apiClient.put('/api/settings/me', dto);
  }
  
  async resetSettings(): Promise<UserSettingDTO> {
    return apiClient.post('/api/settings/reset');
  }
  
  async getDefaults(): Promise<DefaultSettingsDTO> {
    return apiClient.get('/api/settings/defaults');
  }
}
```

#### 4. Pinia Store

**文件**: `apps/web/src/stores/settingStore.ts`

```typescript
export const useSettingStore = defineStore('setting', () => {
  const settings = ref<UserSettingDTO | null>(null);
  const loading = ref(false);
  
  async function loadSettings() {
    loading.value = true;
    try {
      settings.value = await settingApiClient.getCurrentSettings();
      applySettings(settings.value);
    } finally {
      loading.value = false;
    }
  }
  
  async function updateSetting(updates: UpdateUserSettingDTO) {
    settings.value = await settingApiClient.updateSettings(updates);
    applySettings(settings.value);
  }
  
  function applySettings(s: UserSettingDTO) {
    // 应用主题
    if (s.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    // 应用语言
    // ...
  }
  
  return { settings, loading, loadSettings, updateSetting };
}, {
  persist: true  // 持久化到 localStorage
});
```

---

## 📊 实现清单

### Backend (预估 2-3 小时)

- [ ] 创建 Prisma Schema (UserSetting model)
- [ ] 运行数据库迁移
- [ ] 创建 Contracts (DTO 定义)
- [ ] 实现 Domain Layer (UserSetting Aggregate)
- [ ] 实现 Repository Layer
- [ ] 实现 Application Service
- [ ] 实现 REST Controller
- [ ] 编写单元测试
- [ ] 编写集成测试

### Frontend (预估 3-4 小时)

- [ ] 创建 SettingView 主页面
- [ ] 创建 AppearanceSettings 组件
- [ ] 创建 NotificationSettings 组件
- [ ] 创建 EditorSettings 组件
- [ ] 创建 ShortcutSettings 组件
- [ ] 创建 API Client
- [ ] 创建 Pinia Store
- [ ] 实现设置持久化
- [ ] 实现主题切换逻辑
- [ ] 实现语言切换逻辑
- [ ] 编写组件测试

### 集成测试 (预估 1 小时)

- [ ] 端到端设置流程测试
- [ ] 主题切换测试
- [ ] 语言切换测试
- [ ] 重置设置测试

---

## 🎯 验收标准总结

1. ✅ 用户可以查看所有设置项
2. ✅ 用户可以修改主题、语言、字体大小
3. ✅ 用户可以配置通知偏好
4. ✅ 用户可以自定义编辑器设置
5. ✅ 用户可以自定义快捷键（无冲突）
6. ✅ 设置修改后立即生效
7. ✅ 设置持久化存储
8. ✅ 页面刷新后设置保持
9. ✅ 可以重置为默认设置

---

## 📝 技术亮点

1. **Pinia 持久化**: 使用 pinia-plugin-persistedstate 本地缓存
2. **实时应用**: 设置修改后立即应用到界面
3. **冲突检测**: 快捷键设置支持冲突检测
4. **默认值管理**: 统一管理所有设置的默认值
5. **类型安全**: 全程使用 TypeScript 强类型

---

## 🔗 相关文档

- [Epic 9 Context](../epic-9-context.md)
- [PRD - Setting Module](../PRD-PRODUCT-REQUIREMENTS.md#10-setting-设置模块)
- [Feature Spec - User Preferences](../modules/setting/features/01-user-preferences.md)

---

**创建时间**: 2025-10-31  
**预计完成时间**: 6-8 小时  
**Story Points**: 5  
**状态**: Ready for Dev
