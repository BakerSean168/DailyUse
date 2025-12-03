# DailyUse UI Package

一个基于 Vue 3 + Vuetify 的可重用UI组件库，专为 DailyUse monorepo 项目设计。

## 🚀 特性

- 🎨 **现代化设计** - 基于 Vuetify Material Design 3
- 📱 **响应式** - 完美支持移动端和桌面端
- 🔧 **TypeScript** - 完整的类型定义和智能提示
- 🧩 **组合式API** - 利用 Vue 3 Composition API 的强大功能
- 📦 **按需导入** - 支持 Tree Shaking，只打包使用的组件
- 🎯 **专业表单** - 内置表单验证和用户体验优化
- 🔒 **安全优先** - 密码强度检测和安全建议

## 📦 安装

由于这是 monorepo 内部包，通过 pnpm workspace 管理：

```bash
# 在需要使用UI组件的应用中添加依赖
pnpm add @dailyuse/ui
```

## 🔧 配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@dailyuse/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@dailyuse/ui": ["../../packages/ui/src"]
    }
  }
}
```

## 📚 组件文档

### 账户相关组件

#### `DuAvatar` - 头像组件

功能齐全的头像组件，支持图片、文字、状态指示器。

```vue
<template>
  <DuAvatar
    :src="user.avatar"
    :username="user.username"
    status="online"
    size="64"
    :editable="true"
    @edit="handleAvatarEdit"
  />
</template>

<script setup>
import { DuAvatar } from '@dailyuse/ui';

const handleAvatarEdit = () => {
  // 处理头像编辑
};
</script>
```

**Props:**

- `src?: string` - 头像图片地址
- `username: string` - 用户名（用于生成首字母头像）
- `status?: 'online' | 'busy' | 'away' | 'offline'` - 在线状态
- `size?: string | number` - 头像尺寸
- `editable?: boolean` - 是否可编辑

#### `DuLoginForm` - 登录表单

完整的登录表单组件，支持用户名/邮箱登录和第三方登录。

```vue
<template>
  <DuLoginForm
    :loading="isLoading"
    :error="error"
    @submit="handleLogin"
    @forgot-password="handleForgotPassword"
    @register="handleRegister"
    @social-login="handleSocialLogin"
  />
</template>

<script setup>
import { DuLoginForm } from '@dailyuse/ui';

const handleLogin = (data) => {
  console.log('Login data:', data);
  // { username, password, remember }
};
</script>
```

#### `DuRegistrationForm` - 注册表单

功能完整的用户注册表单，支持密码强度检测。

```vue
<template>
  <DuRegistrationForm
    :loading="isLoading"
    :error="error"
    :show-personal-info="true"
    @submit="handleRegister"
    @reset="handleReset"
  />
</template>
```

#### `DuProfileForm` - 用户资料表单

用户资料编辑表单，支持头像上传和完整的个人信息编辑。

```vue
<template>
  <DuProfileForm
    :user-data="currentUser"
    :loading="isLoading"
    @submit="handleProfileUpdate"
    @avatar-upload="handleAvatarUpload"
  />
</template>
```

#### `DuPasswordResetForm` - 密码重置表单

分步骤的密码重置流程，支持邮箱/短信验证。

```vue
<template>
  <DuPasswordResetForm
    :loading="isLoading"
    @send-code="handleSendCode"
    @verify-code="handleVerifyCode"
    @reset-password="handleResetPassword"
  />
</template>
```

### 通用组件

#### `DuDialog` - 对话框组件

可定制的对话框组件，支持标题图标和自定义动作按钮。

```vue
<template>
  <DuDialog v-model="showDialog" title="确认操作" title-icon="mdi-help-circle" max-width="400px">
    <p>您确定要执行此操作吗？</p>

    <template #actions>
      <v-btn @click="showDialog = false">取消</v-btn>
      <v-btn color="primary" @click="confirm">确认</v-btn>
    </template>
  </DuDialog>
</template>
```

#### `DuConfirmDialog` - 确认对话框

专用的确认对话框组件。

```vue
<template>
  <DuConfirmDialog
    v-model="showConfirm"
    title="删除确认"
    message="此操作不可撤销，确定要删除吗？"
    confirm-text="删除"
    confirm-color="error"
    @confirm="handleDelete"
  />
</template>
```

#### `DuSnackbar` - 通知组件

消息通知组件，支持不同类型和自动消失。

```vue
<template>
  <DuSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
  />
</template>

<script setup>
import { useSnackbar } from '@dailyuse/ui';

const { snackbar, showSuccess, showError, showWarning } = useSnackbar();

showSuccess('操作成功！');
showError('操作失败，请重试');
</script>
```

#### `DuTextField` - 增强文本字段

增强的文本输入组件，支持密码强度检测。

```vue
<template>
  <DuTextField
    v-model="password"
    label="密码"
    type="password"
    :rules="passwordRules"
    :show-password-strength="true"
    required
  />
</template>
```

## 🔧 Composables

### `useSnackbar` - 通知管理

```typescript
import { useSnackbar } from '@dailyuse/ui';

const { snackbar, showSuccess, showError, showWarning, showInfo } = useSnackbar();

// 显示不同类型的通知
showSuccess('操作成功！');
showError('操作失败');
showWarning('请注意');
showInfo('提示信息');
```

### `useFormRules` - 表单验证规则

```typescript
import { useFormRules } from '@dailyuse/ui';

const { usernameRules, passwordRules, emailRules, phoneRules } = useFormRules();
```

### `usePasswordStrength` - 密码强度检测

```typescript
import { usePasswordStrength } from '@dailyuse/ui';

const password = ref('');
const { strength, strengthPercentage, suggestions, isStrong, isValid } =
  usePasswordStrength(password);
```

## 🎨 主题定制

组件库基于 Vuetify，支持完整的主题定制：

```typescript
// main.ts
import { createVuetify } from 'vuetify';

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          // ... 更多颜色配置
        },
      },
    },
  },
});
```

## 📦 构建和发布

```bash
# 构建组件库
pnpm run build

# 类型检查
pnpm run type-check

# 代码格式化
pnpm run format
```

## 🤝 开发指南

### 添加新组件

1. 在 `src/components/` 下创建组件目录
2. 编写组件并添加 TypeScript 类型
3. 在 `src/index.ts` 中导出组件
4. 更新此 README 文档

### 代码规范

- 使用 TypeScript 编写所有代码
- 遵循 Vue 3 Composition API 最佳实践
- 组件名使用 `Du` 前缀避免命名冲突
- 提供完整的 Props 和 Emits 类型定义

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [Vuetify 3 文档](https://vuetifyjs.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)
