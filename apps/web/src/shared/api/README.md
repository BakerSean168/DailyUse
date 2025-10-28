# 前端API客户端使用指南

## 概述

这是一套完整的前端API解决方案，基于Axios构建，提供类型安全、自动重试、缓存管理、错误处理等企业级功能。

## 特性

✅ **类型安全** - 完整的TypeScript类型定义  
✅ **统一响应格式** - 与后端响应系统保持一致  
✅ **自动认证** - JWT令牌自动管理  
✅ **智能重试** - 网络错误和5xx错误自动重试  
✅ **请求缓存** - GET请求结果缓存  
✅ **错误处理** - 统一的错误处理和状态码映射  
✅ **文件上传** - 支持进度回调和类型验证  
✅ **Vue集成** - 提供Composition API风格的hooks  
✅ **环境配置** - 多环境配置管理  
✅ **日志记录** - 可配置的请求日志

## 快速开始

### 1. 基础用法

```typescript
import api from '@/shared/api';

// GET请求
const user = await api.get('/users/123');

// POST请求
const result = await api.post('/users', {
  name: 'John',
  email: 'john@example.com',
});

// 上传文件
const uploadResult = await api.upload('/upload', file, {
  onUploadProgress: ({ progress }) => {
    console.log(`上传进度: ${progress}%`);
  },
});
```

### 2. 使用业务服务

```typescript
import { AuthService, AccountService } from '@/shared/api';

// 用户登录
const loginResult = await AuthService.login({
  username: 'admin',
  password: 'password123',
});

// 获取账户信息
const account = await AccountService.getAccountById('user-123');
```

### 3. Vue Composition API

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <h1>欢迎, {{ user?.username }}</h1>
      <button @click="logout">登出</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/shared/api';

const { user, loading, error, logout } = useAuth();
</script>
```

## API 客户端使用指南

## 📚 概述

本项目提供了一个强大且灵活的 API 客户端，支持多种响应提取策略，可以根据业务需求选择最合适的方式。

---

## 🎯 响应提取策略

### 1️⃣ **自动提取模式（默认）** - `'auto'`

**适用场景**：大多数简单的数据获取场景，只需要数据本身。

```typescript
// 直接得到数据，无需嵌套访问
const users = await apiClient.get<User[]>('/users');
console.log(users); // User[]

const user = await apiClient.post<User>('/users', { name: 'John' });
console.log(user.name); // 'John'
```

**优点**：
- ✅ 代码简洁，减少嵌套
- ✅ 类型推断准确
- ✅ 向后兼容旧代码

**缺点**：
- ❌ 丢失 message、timestamp 等元数据
- ❌ 无法显示后端返回的提示信息

---

### 2️⃣ **完整响应模式** - 使用 `WithMessage` 方法（推荐）

**适用场景**：需要显示后端返回的提示信息、错误详情或其他元数据。

```typescript
// 注册接口 - 需要显示后端返回的提示消息
const response = await apiClient.postWithMessage<{ account: Account }>('/auth/register', {
  username: 'john',
  email: 'john@example.com',
  password: 'Password123!',
});

console.log(response.message);      // "注册成功！请登录以继续。"
console.log(response.data.account); // Account 对象
console.log(response.timestamp);    // 1234567890
console.log(response.code);         // 200
```

**优点**：
- ✅ 保留所有元数据（message、timestamp、code）
- ✅ 可以显示友好的提示信息
- ✅ 便于调试和日志记录

---

## 💡 实战示例

### 示例1：用户注册（需要显示后端消息）

```typescript
// ✅ 正确方式：使用 postWithMessage
const response = await apiClient.postWithMessage<{ account: Account }>('/auth/register', data);
showSuccess(response.message); // 显示后端返回的友好提示
console.log(response.data.account);
```

### 示例2：获取用户列表（只需要数据）

```typescript
// ✅ 使用默认客户端即可
const users = await apiClient.get<User[]>('/users');
users.forEach(user => console.log(user.name));
```

### 示例3：删除操作（需要确认消息）

```typescript
// ✅ 使用 deleteWithMessage
const response = await apiClient.deleteWithMessage<void>('/users/123');
showSuccess(response.message); // "用户删除成功"
```

---

## 🔧 API 方法总览

### 标准方法（自动提取 data）

```typescript
apiClient.get<T>(url, options?)           // GET 请求
apiClient.post<T>(url, data?, options?)   // POST 请求
apiClient.put<T>(url, data?, options?)    // PUT 请求
apiClient.delete<T>(url, options?)        // DELETE 请求
apiClient.patch<T>(url, data?, options?)  // PATCH 请求
```

### 完整响应方法（返回 SuccessResponse<T>）

```typescript
apiClient.getWithMessage<T>(url, options?)           // GET + 完整响应
apiClient.postWithMessage<T>(url, data?, options?)   // POST + 完整响应
apiClient.putWithMessage<T>(url, data?, options?)    // PUT + 完整响应
apiClient.deleteWithMessage<T>(url, options?)        // DELETE + 完整响应
```

---

## 📦 响应数据结构

### SuccessResponse 结构

```typescript
interface SuccessResponse<T> {
  code: number;           // 业务状态码（200）
  success: true;          // 成功标识
  data: T;                // 实际数据
  message: string;        // 提示消息
  timestamp: number;      // 时间戳
  pagination?: {          // 分页信息（可选）
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 🎨 最佳实践

### ✅ 推荐做法

1. **默认使用标准方法**，代码简洁：
   ```typescript
   const users = await apiClient.get<User[]>('/users');
   ```

2. **需要 message 时使用 WithMessage 方法**：
   ```typescript
   const response = await apiClient.postWithMessage('/auth/register', data);
   showSuccess(response.message);
   ```

---

## 💬 常见问题

**Q: 什么时候应该使用 `WithMessage` 方法？**

A: 当你需要显示后端返回的提示信息时，例如：
- 注册、登录、登出操作
- 删除、更新等重要操作
- 需要显示操作结果反馈的场景

**Q: 默认策略会丢失 message，会影响错误处理吗？**

A: 不会。错误响应由拦截器统一处理，会自动提取并抛出包含 message 的错误。`extractData` 只影响成功响应。

### 主要实例

- `api` - 默认API客户端，需要认证
- `publicApiClient` - 公共API客户端，无需认证
- `uploadClient` - 文件上传专用客户端
- `adminApiClient` - 管理员API客户端

```typescript
import { api, publicApiClient, uploadClient } from '@/shared/api';

// 需要认证的请求
const userProfile = await api.get('/profile');

// 无需认证的请求
const publicData = await publicApiClient.get('/public/data');

// 文件上传
const uploadResult = await uploadClient.upload('/files', file);
```

## 组合式API (Composables)

### useAuth - 认证管理

```typescript
import { useAuth } from '@/shared/api';

const {
  isAuthenticated, // 是否已认证
  user, // 当前用户信息
  loading, // 加载状态
  error, // 错误信息
  login, // 登录方法
  logout, // 登出方法
  hasPermission, // 权限检查
  hasRole, // 角色检查
} = useAuth();

// 登录
await login({
  username: 'admin',
  password: 'password123',
});

// 权限检查
if (hasPermission('user:create')) {
  // 有创建用户权限
}
```

### useRequest - 通用请求

```typescript
import { useRequest } from '@/shared/api';
import { AccountService } from '@/shared/api';

const {
  data, // 响应数据
  loading, // 加载状态
  error, // 错误信息
  execute, // 执行请求
  reset, // 重置状态
} = useRequest(AccountService.getAccountById);

// 执行请求
await execute('user-123');
```

### usePagination - 分页管理

```typescript
import { usePagination } from '@/shared/api';
import { AccountService } from '@/shared/api';

const {
  items, // 当前页数据
  loading, // 加载状态
  page, // 当前页码
  total, // 总记录数
  totalPages, // 总页数
  hasNext, // 是否有下一页
  hasPrev, // 是否有上一页
  goToPage, // 跳转页面
  nextPage, // 下一页
  prevPage, // 上一页
  changePageSize, // 改变页面大小
} = usePagination(AccountService.getAccounts);

// 跳转到第2页
await goToPage(2);

// 改变页面大小
await changePageSize(20);
```

## 环境配置

### 环境变量

在`.env`文件中配置：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:3000/api/v1

# 上传服务URL
VITE_UPLOAD_BASE_URL=http://localhost:3000/api/v1/upload

# 请求超时时间(毫秒)
VITE_API_TIMEOUT=10000

# 是否启用Mock
VITE_ENABLE_MOCK=false

# 日志级别: debug | info | warn | error | silent
VITE_LOG_LEVEL=debug
```

### 自定义配置

```typescript
import { createApiClient } from '@/shared/api';

const customClient = createApiClient({
  baseURL: 'https://api.custom.com',
  timeout: 5000,
  enableAuth: false,
  retryCount: 2,
});
```

## 错误处理

### 全局错误处理

```typescript
import { createApiClient } from '@/shared/api';

const apiClient = createApiClient({
  errorHandler: (error) => {
    // 全局错误处理
    console.error('API Error:', error);

    // 显示错误通知
    showErrorNotification(error.message);
  },

  authFailHandler: () => {
    // 认证失败处理
    router.push('/login');
  },
});
```

### 请求级错误处理

```typescript
try {
  const data = await api.get('/data');
} catch (error) {
  if (error.status === 'error') {
    console.error('业务错误:', error.message);

    // 处理验证错误
    if (error.errors) {
      error.errors.forEach((err) => {
        console.error(`字段 ${err.field}: ${err.message}`);
      });
    }
  }
}
```

## 文件操作

### 文件上传

```typescript
import { api } from '@/shared/api';

// 基础上传
const result = await api.upload('/upload', file);

// 带进度回调的上传
const result = await api.upload('/upload', file, {
  onUploadProgress: ({ loaded, total, progress }) => {
    console.log(`已上传: ${loaded}/${total} (${progress}%)`);
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png'],
});
```

### 文件下载

```typescript
import { api } from '@/shared/api';

// 下载文件
await api.download('/files/123', 'document.pdf');
```

## 缓存管理

### 启用缓存

```typescript
// 全局启用缓存
const apiClient = createApiClient({
  enableCache: true,
  cacheTimeout: 300000, // 5分钟
});

// 单个请求启用缓存
const data = await api.get('/data', {
  enableCache: true,
});
```

### 清除缓存

```typescript
// 清除所有缓存
apiClient.clearCache();

// 清除匹配模式的缓存
apiClient.clearCache('/users');
```

## 最佳实践

### 1. 使用TypeScript类型

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// 为API响应定义类型
const user = await api.get<User>('/users/123');
```

### 2. 业务服务封装

```typescript
// services/userService.ts
export class UserService {
  static async getProfile(): Promise<UserProfile> {
    return api.get('/profile');
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<void> {
    return api.put('/profile', data);
  }
}
```

### 3. 组合式API模式

```typescript
// composables/useUsers.ts
export function useUsers() {
  const { items, loading, refresh } = usePagination(UserService.getUsers);

  const deleteUser = async (id: string) => {
    await UserService.deleteUser(id);
    await refresh(); // 刷新列表
  };

  return {
    users: items,
    loading,
    deleteUser,
    refresh,
  };
}
```

### 4. 错误边界处理

```vue
<template>
  <div>
    <ErrorBoundary v-if="error" :error="error" @retry="retry" />
    <UserList v-else :users="users" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { useRequest } from '@/shared/api';

const {
  data: users,
  loading,
  error,
  execute: retry,
} = useRequest(UserService.getUsers, { immediate: true });
</script>
```

## 迁移指南

### 从旧的axios配置迁移

#### 旧方式

```typescript
// 旧的配置方式
import axios from 'axios';

const oldClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const response = await oldClient.get('/users');
const data = response.data;
```

#### 新方式

```typescript
// 新的API客户端
import { api } from '@/shared/api';

// 自动处理认证和响应数据提取
const data = await api.get('/users');
```

### 组件重构示例

#### 旧组件

```vue
<script setup lang="ts">
import axios from 'axios';

const loading = ref(false);
const users = ref([]);
const error = ref(null);

const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await axios.get('/api/users');
    users.value = response.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>
```

#### 新组件

```vue
<script setup lang="ts">
import { UserService, useRequest } from '@/shared/api';

const { data: users, loading, error } = useRequest(UserService.getUsers, { immediate: true });
</script>
```

## 故障排除

### 常见问题

1. **401认证错误**
   - 检查令牌是否过期
   - 确认API需要认证
   - 查看authFailHandler是否正确处理

2. **网络请求失败**
   - 检查网络连接
   - 确认API服务器是否运行
   - 查看浏览器控制台CORS错误

3. **类型错误**
   - 确保响应数据结构匹配类型定义
   - 检查API响应格式是否正确

4. **缓存问题**
   - 清除浏览器缓存
   - 调用`clearCache()`方法
   - 检查缓存过期时间

### 调试技巧

```typescript
// 启用详细日志
const apiClient = createApiClient({
  enableLogging: true,
  logLevel: 'debug',
});

// 查看请求详情
const response = await apiClient.getInstance().get('/debug', {
  validateStatus: () => true, // 不抛出错误
});
console.log('Full response:', response);
```
