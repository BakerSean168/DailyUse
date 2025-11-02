# 代码优化建议

## 📅 日期
2025-11-02

## 🎯 优化范围

基于刚完成的模块优化工作，以下是进一步改进代码质量和性能的建议。

---

## 1. 测试相关优化

### 1.1 E2E 测试改进

#### 当前状态
- ✅ 已创建基础 CRUD 测试
- ⚠️ 缺少边界测试
- ⚠️ 缺少错误处理测试

#### 建议优化

**A. 添加测试配置文件**

```typescript
// apps/web/e2e/config/test-helpers.ts
export const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  testUser: {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'test123456',
  },
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
  },
};

export async function loginAs(page: Page, role: 'admin' | 'user' = 'user') {
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  await page.fill('input[type="email"]', TEST_CONFIG.testUser.email);
  await page.fill('input[type="password"]', TEST_CONFIG.testUser.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`);
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      return typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
    },
    { timeout: TEST_CONFIG.timeouts.long }
  );
}
```

**B. 添加边界测试用例**

```typescript
// apps/web/e2e/task/task-template-validation.spec.ts
test.describe('Task Template Validation', () => {
  test('should prevent creating task with empty title', async ({ page }) => {
    await page.click('button:has-text("创建")');
    // 不填写标题
    await page.click('button:has-text("保存")');
    // 验证错误提示
    await expect(page.locator('text=标题不能为空')).toBeVisible();
  });

  test('should prevent creating task with title exceeding max length', async ({ page }) => {
    await page.click('button:has-text("创建")');
    const longTitle = 'A'.repeat(256); // 假设限制是 255
    await page.fill('input[name="title"]', longTitle);
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=标题长度不能超过')).toBeVisible();
  });

  test('should validate date range', async ({ page }) => {
    await page.click('button:has-text("创建")');
    await page.fill('input[name="startDate"]', '2025-12-31');
    await page.fill('input[name="endDate"]', '2025-01-01');
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=结束日期不能早于开始日期')).toBeVisible();
  });
});
```

**C. 添加性能测试**

```typescript
// apps/web/e2e/task/task-template-performance.spec.ts
test.describe('Task Template Performance', () => {
  test('should load task list within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${baseUrl}/task`);
    await page.waitForSelector('[data-testid="task-list"]');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle 100 tasks without lag', async ({ page }) => {
    // 创建 100 个任务
    for (let i = 0; i < 100; i++) {
      await createTestTemplate(page, `Task ${i}`);
    }
    // 测试滚动性能
    const startTime = Date.now();
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(500);
    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(1000);
  });
});
```

---

## 2. 组件优化

### 2.1 对话框组件抽象

#### 问题
四个模块的对话框有很多重复代码（登录逻辑、表单验证、加载状态等）。

#### 建议：创建基础对话框组件

```typescript
// packages/ui/src/components/BaseDialog.vue
<script setup lang="ts" generic="T extends object">
import { ref, computed } from 'vue';

interface Props {
  title?: string;
  width?: string | number;
  persistent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: 600,
  persistent: false,
});

const visible = ref(false);
const editingData = ref<T | null>(null);
const isLoading = ref(false);
const isEditing = computed(() => editingData.value !== null);

function openForCreate() {
  editingData.value = null;
  visible.value = true;
}

function openForEdit(data: T) {
  editingData.value = { ...data };
  visible.value = true;
}

function close() {
  visible.value = false;
  setTimeout(() => {
    editingData.value = null;
    isLoading.value = false;
  }, 300);
}

async function handleSave(saveCallback: (data: T) => Promise<void>) {
  isLoading.value = true;
  try {
    await saveCallback(editingData.value as T);
    close();
  } catch (error) {
    console.error('Save failed:', error);
    // 显示错误提示
  } finally {
    isLoading.value = false;
  }
}

defineExpose({
  openForCreate,
  openForEdit,
  close,
});
</script>

<template>
  <v-dialog
    v-model="visible"
    :width="width"
    :persistent="persistent || isLoading"
  >
    <v-card>
      <v-card-title>
        {{ isEditing ? `编辑${title}` : `创建${title}` }}
      </v-card-title>
      
      <v-card-text>
        <slot
          :data="editingData"
          :isEditing="isEditing"
          :isLoading="isLoading"
        />
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="isLoading"
          @click="close"
        >
          取消
        </v-btn>
        <slot name="actions" :isLoading="isLoading" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

#### 使用示例

```vue
<!-- CreateTaskDialog.vue -->
<script setup lang="ts">
import BaseDialog from '@dailyuse/ui/components/BaseDialog.vue';
import type { TaskTemplate } from '@dailyuse/contracts';

const dialogRef = ref<InstanceType<typeof BaseDialog>>();
const form = ref<Partial<TaskTemplate>>({});

async function handleSave() {
  // 保存逻辑
}

defineExpose({
  openForCreate: () => dialogRef.value?.openForCreate(),
  openForEdit: (data: TaskTemplate) => dialogRef.value?.openForEdit(data),
});
</script>

<template>
  <BaseDialog
    ref="dialogRef"
    title="任务模板"
    :width="800"
  >
    <template #default="{ data, isEditing, isLoading }">
      <v-text-field
        v-model="form.title"
        label="标题"
        :disabled="isLoading"
      />
      <!-- 更多表单字段 -->
    </template>
    
    <template #actions="{ isLoading }">
      <v-btn
        color="primary"
        :loading="isLoading"
        @click="handleSave"
      >
        保存
      </v-btn>
    </template>
  </BaseDialog>
</template>
```

---

## 3. 性能优化

### 3.1 虚拟滚动

#### 问题
当任务、日程、提醒数量较多时，渲染所有项目会导致性能问题。

#### 建议：使用虚拟滚动

```vue
<!-- TaskList.vue -->
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core';
import type { TaskTemplate } from '@dailyuse/contracts';

const props = defineProps<{
  tasks: TaskTemplate[];
}>();

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.tasks),
  {
    itemHeight: 80, // 每个任务项的高度
    overscan: 10,   // 预渲染的额外项数
  }
);
</script>

<template>
  <div v-bind="containerProps" class="task-list">
    <div v-bind="wrapperProps">
      <TaskItem
        v-for="{ data, index } in list"
        :key="data.uuid"
        :task="data"
        :style="{ height: '80px' }"
      />
    </div>
  </div>
</template>

<style scoped>
.task-list {
  height: 600px;
  overflow-y: auto;
}
</style>
```

### 3.2 懒加载图片

```vue
<template>
  <v-img
    :src="imageUrl"
    :lazy-src="placeholderUrl"
    loading="lazy"
  >
    <template #placeholder>
      <v-skeleton-loader type="image" />
    </template>
  </v-img>
</template>
```

### 3.3 防抖和节流

```typescript
// composables/useDebounce.ts
import { ref, watch } from 'vue';

export function useDebounce<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timeoutId: NodeJS.Timeout;

  watch(value, (newValue) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

// 使用示例
const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 500);

watch(debouncedQuery, (query) => {
  // 执行搜索
});
```

---

## 4. 代码质量改进

### 4.1 统一错误处理

```typescript
// utils/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public meta?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message);
  }
  
  return new AppError('UNKNOWN_ERROR', '未知错误');
}

// 全局错误处理器
export function setupGlobalErrorHandler(app: App) {
  app.config.errorHandler = (err, instance, info) => {
    const appError = handleError(err);
    console.error('[Global Error]', appError);
    
    // 显示用户友好的错误提示
    useNotification().error({
      title: '操作失败',
      message: appError.message,
    });
  };
}
```

### 4.2 类型安全的事件总线

```typescript
// utils/event-bus.ts
import mitt, { Emitter } from 'mitt';

// 定义所有事件类型
type Events = {
  'task:created': { task: TaskTemplate };
  'task:updated': { task: TaskTemplate };
  'task:deleted': { uuid: string };
  'schedule:created': { schedule: ScheduleClientDTO };
  // ... 其他事件
};

const emitter: Emitter<Events> = mitt<Events>();

export const eventBus = {
  on: emitter.on,
  off: emitter.off,
  emit: emitter.emit,
};

// 使用示例
eventBus.on('task:created', ({ task }) => {
  console.log('New task created:', task);
});

eventBus.emit('task:created', { task: newTask });
```

### 4.3 统一的 API 客户端

```typescript
// utils/api-client.ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // 跳转到登录页
          window.location.href = '/login';
        }
        return Promise.reject(handleError(error));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL);
```

---

## 5. 可访问性改进

### 5.1 键盘导航

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

function handleKeydown(event: KeyboardEvent) {
  // Ctrl+K: 打开命令面板
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault();
    openCommandPalette();
  }
  
  // Ctrl+N: 创建新项
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault();
    openCreateDialog();
  }
  
  // Esc: 关闭对话框
  if (event.key === 'Escape') {
    closeAllDialogs();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
```

### 5.2 ARIA 标签

```vue
<template>
  <button
    aria-label="创建新任务"
    aria-describedby="create-task-hint"
    @click="createTask"
  >
    <v-icon>mdi-plus</v-icon>
  </button>
  <span id="create-task-hint" class="sr-only">
    按 Ctrl+N 快速创建任务
  </span>
</template>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

---

## 6. 文档改进

### 6.1 Storybook 集成

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../packages/ui/src/**/*.stories.ts'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
};

export default config;
```

```typescript
// packages/ui/src/components/BaseDialog.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import BaseDialog from './BaseDialog.vue';

const meta: Meta<typeof BaseDialog> = {
  title: 'Components/BaseDialog',
  component: BaseDialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BaseDialog>;

export const Default: Story = {
  args: {
    title: '示例对话框',
    width: 600,
  },
};
```

---

## 7. 优先级建议

### P0 (立即执行)
1. ✅ 启动开发服务器进行测试
2. ✅ 修复测试中发现的问题
3. ✅ 添加测试配置文件

### P1 (本周完成)
1. 创建 BaseDialog 组件
2. 添加边界测试用例
3. 统一错误处理

### P2 (下周完成)
1. 实现虚拟滚动
2. 添加性能测试
3. 改进可访问性

### P3 (本月完成)
1. Storybook 集成
2. 完善文档
3. 添加更多工具函数

---

## 总结

这些优化建议将帮助：

- 📈 **提升性能**: 虚拟滚动、懒加载、防抖节流
- 🛡️ **增强稳定性**: 统一错误处理、类型安全的事件总线
- ♿ **改善可访问性**: 键盘导航、ARIA 标签
- 🧪 **提高测试覆盖**: 边界测试、性能测试
- 📚 **完善文档**: Storybook、组件示例

优先完成 P0 和 P1 项，这些将带来最大的价值提升。

---

**文档版本**: 1.0.0  
**创建日期**: 2025-11-02  
**维护人**: AI Assistant  
**状态**: 建议中
