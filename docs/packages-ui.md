# @dailyuse/ui 包文档

> **生成时间**: 2025-10-28  
> **包版本**: 0.0.1  
> **文档类型**: Vue 3 组件库文档

---

## 📋 包概述

**@dailyuse/ui** 是 DailyUse 项目的**共享 UI 组件库**，基于 **Vue 3 + Vuetify 3** 构建。提供了一套可复用、类型安全、符合 Material Design 风格的业务组件，用于 Web 和 Desktop 应用。

### 核心职责

- 🎨 **通用 UI 组件**: 对话框、表单、反馈组件
- 👤 **账户组件**: 登录、注册、密码重置、个人资料
- 🔧 **Composables**: 可复用的逻辑钩子
- 📦 **类型定义**: 完整的 TypeScript 支持
- 🎭 **主题定制**: 基于 Vuetify 的主题系统

---

## 🏗️ 组件架构

```
@dailyuse/ui/
├── components/
│   ├── account/              # 账户相关组件
│   │   ├── DuLoginForm.vue
│   │   ├── DuRegistrationForm.vue
│   │   ├── DuPasswordResetForm.vue
│   │   ├── DuProfileForm.vue
│   │   └── DuAvatar.vue
│   ├── form/                 # 表单组件
│   │   └── DuTextField.vue
│   ├── dialog/               # 对话框组件
│   │   ├── DuDialog.vue
│   │   └── DuConfirmDialog.vue
│   └── feedback/             # 反馈组件
│       ├── DuSnackbar.vue
│       ├── DuLoadingOverlay.vue
│       └── DuMessageProvider.vue
├── composables/              # 可复用逻辑
│   ├── useMessage.ts
│   ├── useLoading.ts
│   ├── useSnackbar.ts
│   ├── useFormValidation.ts
│   └── usePasswordStrength.ts
├── types/                    # TypeScript 类型
│   └── index.ts
└── index.ts                  # 导出入口
```

---

## 📦 技术栈

### 核心依赖 (Peer Dependencies)

| 依赖 | 版本 | 用途 |
|------|------|------|
| **Vue** | ^3.4.0 | 前端框架 |
| **Vuetify** | ^3.7.0 | UI 组件库 |
| **@mdi/font** | ^7.0.0 | Material Design Icons |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | ^5.8.3 | 类型系统 |
| **Vite** | ^5.1.6 | 构建工具 |
| **vue-tsc** | ^2.2.0 | Vue TypeScript 编译 |

---

## 🎯 组件详解

### 1. 账户组件 👤

#### DuLoginForm - 登录表单

统一的登录表单组件，包含邮箱/密码输入、记住我选项、表单验证。

**使用示例**:

```vue
<template>
  <DuLoginForm
    :loading="isLoading"
    @submit="handleLogin"
  />
</template>

<script setup lang="ts">
import { DuLoginForm } from '@dailyuse/ui';

const isLoading = ref(false);

const handleLogin = async (credentials: { email: string; password: string }) => {
  isLoading.value = true;
  try {
    await authService.login(credentials);
  } finally {
    isLoading.value = false;
  }
};
</script>
```

**Props**:
- `loading?: boolean` - 加载状态
- `initialEmail?: string` - 预填邮箱

**Events**:
- `@submit` - 提交表单，payload: `{ email: string; password: string; rememberMe: boolean }`

---

#### DuRegistrationForm - 注册表单

用户注册表单组件，包含邮箱、用户名、密码、确认密码、密码强度指示器。

**使用示例**:

```vue
<template>
  <DuRegistrationForm
    :loading="isLoading"
    @submit="handleRegister"
  />
</template>

<script setup lang="ts">
import { DuRegistrationForm } from '@dailyuse/ui';

const handleRegister = async (data: RegisterData) => {
  // data: { email, username, password }
  await authService.register(data);
};
</script>
```

**特性**:
- ✅ 实时密码强度检测
- ✅ 密码确认匹配验证
- ✅ 邮箱格式验证
- ✅ 用户名唯一性检查（可选）

---

#### DuPasswordResetForm - 密码重置表单

密码重置流程的表单组件。

**使用示例**:

```vue
<template>
  <DuPasswordResetForm
    @submit="handleReset"
  />
</template>

<script setup lang="ts">
const handleReset = async (email: string) => {
  await authService.requestPasswordReset(email);
};
</script>
```

---

#### DuProfileForm - 个人资料表单

用户个人资料编辑表单。

**使用示例**:

```vue
<template>
  <DuProfileForm
    :user="currentUser"
    :loading="isSaving"
    @submit="handleProfileUpdate"
  />
</template>

<script setup lang="ts">
const handleProfileUpdate = async (profile: ProfileData) => {
  await userService.updateProfile(profile);
};
</script>
```

---

#### DuAvatar - 用户头像

可自定义的用户头像组件，支持图片和首字母模式。

**使用示例**:

```vue
<template>
  <DuAvatar
    :src="user.avatarUrl"
    :name="user.username"
    size="large"
  />
</template>
```

**Props**:
- `src?: string` - 头像图片 URL
- `name: string` - 用户名（用于生成首字母）
- `size?: 'small' | 'medium' | 'large'` - 尺寸
- `color?: string` - 背景颜色

---

### 2. 表单组件 🔧

#### DuTextField - 增强文本输入框

基于 Vuetify VTextField 的增强版本，集成常用验证和样式。

**使用示例**:

```vue
<template>
  <DuTextField
    v-model="email"
    label="Email"
    type="email"
    :rules="[rules.required, rules.email]"
    hint="Enter your email address"
  />
</template>
```

---

### 3. 对话框组件 💬

#### DuDialog - 通用对话框

基础对话框组件，支持标题、内容、操作按钮。

**使用示例**:

```vue
<template>
  <DuDialog
    v-model="isOpen"
    title="Create Goal"
    max-width="600"
  >
    <template #content>
      <GoalForm />
    </template>
    
    <template #actions>
      <v-btn @click="isOpen = false">Cancel</v-btn>
      <v-btn color="primary" @click="handleSave">Save</v-btn>
    </template>
  </DuDialog>
</template>
```

**Props**:
- `modelValue: boolean` - 显示状态
- `title?: string` - 标题
- `maxWidth?: string | number` - 最大宽度
- `persistent?: boolean` - 禁止点击外部关闭

---

#### DuConfirmDialog - 确认对话框

确认操作的对话框，用于删除、取消等不可逆操作。

**使用示例**:

```vue
<template>
  <DuConfirmDialog
    v-model="showConfirm"
    title="Delete Goal"
    message="Are you sure you want to delete this goal? This action cannot be undone."
    confirmText="Delete"
    confirmColor="error"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
  />
</template>
```

**Props**:
- `title: string` - 标题
- `message: string` - 确认消息
- `confirmText?: string` - 确认按钮文本
- `cancelText?: string` - 取消按钮文本
- `confirmColor?: string` - 确认按钮颜色

**Events**:
- `@confirm` - 确认操作
- `@cancel` - 取消操作

---

### 4. 反馈组件 ��

#### DuSnackbar - 消息提示条

底部消息提示组件，支持多种类型（success, error, warning, info）。

**使用示例**:

```vue
<template>
  <div>
    <v-btn @click="showMessage">Show Message</v-btn>
    <DuSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :type="snackbar.type"
    />
  </div>
</template>

<script setup lang="ts">
const snackbar = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'warning' | 'info',
});

const showMessage = () => {
  snackbar.message = 'Operation completed successfully';
  snackbar.type = 'success';
  snackbar.show = true;
};
</script>
```

---

#### DuLoadingOverlay - 加载遮罩

全屏或局部加载遮罩组件。

**使用示例**:

```vue
<template>
  <div class="relative">
    <DataTable :data="data" />
    <DuLoadingOverlay :loading="isLoading" />
  </div>
</template>
```

---

#### DuMessageProvider - 全局消息管理器

提供全局消息管理功能，通过 composable 调用。

**使用示例**:

```vue
<template>
  <DuMessageProvider>
    <RouterView />
  </DuMessageProvider>
</template>

<script setup lang="ts">
// 在子组件中使用
import { useMessage } from '@dailyuse/ui';

const { success, error, warning, info } = useMessage();

const saveData = async () => {
  try {
    await api.save();
    success('Data saved successfully');
  } catch (err) {
    error('Failed to save data');
  }
};
</script>
```

---

## 🎣 Composables 详解

### useMessage - 消息提示

```typescript
import { useMessage } from '@dailyuse/ui';

const { success, error, warning, info } = useMessage();

// 显示成功消息
success('Goal created successfully');

// 显示错误消息
error('Failed to create goal');

// 显示警告消息
warning('Unsaved changes will be lost');

// 显示信息消息
info('Loading data...');
```

---

### useLoading - 加载状态管理

```typescript
import { useLoading } from '@dailyuse/ui';

const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

// 手动控制
const fetchData = async () => {
  startLoading();
  try {
    await api.getData();
  } finally {
    stopLoading();
  }
};

// 自动包装
const fetchDataAuto = withLoading(async () => {
  await api.getData();
});
```

---

### useFormValidation - 表单验证

```typescript
import { useFormValidation } from '@dailyuse/ui';

const { rules, validate, validateField } = useFormValidation();

// 使用内置规则
const emailRules = [rules.required, rules.email];
const passwordRules = [rules.required, rules.minLength(8)];

// 自定义验证规则
const customRule = (value: string) => {
  return value.startsWith('prefix') || 'Must start with prefix';
};
```

---

### usePasswordStrength - 密码强度检测

```typescript
import { usePasswordStrength } from '@dailyuse/ui';

const { strength, color, message, score } = usePasswordStrength(password);

// strength: 'weak' | 'fair' | 'good' | 'strong'
// score: 0-4
// color: 颜色代码
// message: 强度描述文本
```

---

### useSnackbar - 消息提示条

```typescript
import { useSnackbar } from '@dailyuse/ui';

const { show, hide } = useSnackbar();

show({
  message: 'Operation successful',
  type: 'success',
  duration: 3000,
});
```

---

## 📁 目录结构

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── account/
│   │   │   ├── DuAvatar.vue
│   │   │   ├── DuLoginForm.vue
│   │   │   ├── DuPasswordResetForm.vue
│   │   │   ├── DuProfileForm.vue
│   │   │   └── DuRegistrationForm.vue
│   │   ├── dialog/
│   │   │   ├── DuConfirmDialog.vue
│   │   │   └── DuDialog.vue
│   │   ├── feedback/
│   │   │   ├── DuLoadingOverlay.vue
│   │   │   ├── DuMessageProvider.vue
│   │   │   └── DuSnackbar.vue
│   │   └── form/
│   │       └── DuTextField.vue
│   ├── composables/
│   │   ├── useFormValidation.ts
│   │   ├── useLoading.ts
│   │   ├── useMessage.ts
│   │   ├── usePasswordStrength.ts
│   │   └── useSnackbar.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── dist/                     # 构建输出
│   ├── index.js
│   ├── index.d.ts
│   └── style.css
├── package.json
├── project.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 使用指南

### 安装

```bash
pnpm add @dailyuse/ui
```

### 配置 Peer Dependencies

```bash
pnpm add vue@^3.4.0 vuetify@^3.7.0 @mdi/font@^7.0.0
```

### 在项目中使用

```typescript
// main.ts
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import '@dailyuse/ui/style'; // UI 组件样式

const vuetify = createVuetify();
const app = createApp(App);

app.use(vuetify);
app.mount('#app');
```

### 导入组件

```typescript
// 按需导入
import { DuLoginForm, DuSnackbar, useMessage } from '@dailyuse/ui';

// 或全部导入
import * as DailyUseUI from '@dailyuse/ui';
```

---

## 📊 统计信息

- **组件数量**: 12 个 Vue 组件
- **Composables**: 5 个可复用钩子
- **TypeScript**: 100% 类型覆盖
- **UI 框架**: Vuetify 3 (Material Design)
- **构建工具**: Vite + vue-tsc

---

## 🎨 主题定制

### 自定义 Vuetify 主题

```typescript
// vuetify.config.ts
import { createVuetify } from 'vuetify';

export default createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          success: '#4CAF50',
        },
      },
    },
  },
});
```

---

## 🔗 相关文档

- [项目概览](./project-overview.md)
- [@dailyuse/utils 包文档](./packages-utils.md)
- [@dailyuse/contracts 包文档](./packages-contracts.md)
- [Vuetify 官方文档](https://vuetifyjs.com)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

## 📝 最佳实践

### 1. 组件命名约定

所有组件以 `Du` 前缀命名，避免与 Vuetify 原生组件冲突：

```vue
✅ 推荐
<DuLoginForm />
<DuAvatar />
<DuDialog />

❌ 避免
<LoginForm />  // 可能与其他库冲突
```

### 2. 表单验证

使用 `useFormValidation` composable 统一验证逻辑：

```typescript
✅ 推荐
const { rules } = useFormValidation();
const emailRules = [rules.required, rules.email];

❌ 避免
const emailRules = [(v) => !!v || 'Required', (v) => /.+@.+/.test(v) || 'Invalid'];
```

### 3. 消息提示

优先使用 `useMessage` composable：

```typescript
✅ 推荐
const { success, error } = useMessage();
success('Saved successfully');

❌ 避免
// 手动管理 snackbar 状态
snackbar.value = { show: true, message: '...', type: 'success' };
```

---

**文档维护**: BMAD Agent  
**最后更新**: 2025-12-03

---

## 🚀 架构演进计划（2025-12 更新）

### 目标架构：Headless UI 模式

采用多包架构实现框架无关的 UI 组件：

```
packages/
├── ui-core/          # 框架无关的核心逻辑
├── ui-vue/           # Vue 适配层
├── ui-vuetify/       # Vuetify 样式组件（当前 @dailyuse/ui）
└── ui-react/         # React 适配层（未来）
```

### 核心原则

1. **Headless 核心**：业务逻辑不依赖任何 UI 框架
2. **适配器模式**：每个框架有对应的适配层
3. **组合式组件**：样式组件使用适配器，保持简洁

### 相关文档

- [ADR-005: UI 包多框架支持架构](./architecture/adr/ADR-005-ui-package-multi-framework.md)
