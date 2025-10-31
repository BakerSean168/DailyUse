# Story 8-2 性能优化指南 - 防抖与节流

**创建时间**: 2025-10-31  
**优化目标**: LinkSuggestion 搜索防抖 + BacklinkPanel 刷新节流

---

## 📋 优化方案对比

### 方案 1: VueUse (推荐 ⭐⭐⭐⭐⭐)

**优势**:
- ✅ **已安装** - 项目中已有 `@vueuse/core: 14.0.0`
- ✅ **Vue 3 原生支持** - 专为 Composition API 设计
- ✅ **TypeScript 友好** - 完整类型定义
- ✅ **响应式集成** - 与 Vue ref/reactive 无缝配合
- ✅ **零额外体积** - 无需新增依赖

**可用函数**:
- `useDebounceFn` - 防抖函数
- `useThrottleFn` - 节流函数
- `useDebounce` - 防抖响应式值
- `useThrottle` - 节流响应式值

### 方案 2: Lodash

**优势**:
- ✅ 成熟稳定 - 业界标准
- ✅ 功能丰富 - 提供更多配置选项
- ✅ 通用性强 - 可在任何 JS 项目使用

**劣势**:
- ❌ 需要安装 `lodash-es` (ES Module 版本)
- ❌ 体积较大 (如果全量引入)
- ❌ 需要手动处理 Vue 响应式

**安装命令**:
```bash
pnpm add lodash-es
pnpm add -D @types/lodash-es
```

---

## ✅ 已完成优化

### LinkSuggestion.vue - 搜索防抖

**文件**: `apps/web/src/modules/editor/presentation/components/LinkSuggestion.vue`

#### 实现代码

```typescript
import { useDebounceFn } from '@vueuse/core';

// 原始搜索实现
async function searchDocumentsImpl(query: string) {
  if (!query || query.length < 1) {
    documents.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await documentApiClient.searchDocuments(query, 10);
    documents.value = results;
    selectedIndex.value = 0;
  } catch (error) {
    console.error('Search documents failed:', error);
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

// 使用 VueUse 防抖，延迟 300ms 执行搜索
const searchDocuments = useDebounceFn(searchDocumentsImpl, 300);
```

#### 效果

**优化前**:
- 每次按键都触发 API 请求
- 用户输入 "测试文档" (4个字) = 4 次 API 请求

**优化后**:
- 用户停止输入 300ms 后才触发请求
- 用户输入 "测试文档" (4个字) = 1 次 API 请求
- **节省 75% API 调用**

---

## 🚀 待优化项

### 1. BacklinkPanel.vue - 刷新节流

**文件**: `apps/web/src/modules/editor/presentation/components/BacklinkPanel.vue`

#### 优化目标

防止用户快速多次点击刷新按钮导致重复请求。

#### 实现方案

**VueUse 方案** (推荐):

```typescript
import { useThrottleFn } from '@vueuse/core';

// 原始加载函数
async function loadBacklinksImpl() {
  if (!props.documentUuid) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await documentApiClient.getBacklinks(props.documentUuid);
    backlinks.value = response.backlinks;
  } catch (err: any) {
    console.error('Load backlinks failed:', err);
    error.value = err.message || '加载反向链接失败';
  } finally {
    loading.value = false;
  }
}

// 节流版本：1秒内最多执行1次
const loadBacklinks = useThrottleFn(loadBacklinksImpl, 1000);
```

**Lodash 方案** (备选):

```typescript
import { throttle } from 'lodash-es';

const loadBacklinks = throttle(loadBacklinksImpl, 1000, {
  leading: true,   // 首次立即执行
  trailing: false  // 结束后不再执行
});
```

---

## 📊 性能对比

### 防抖 vs 节流

| 场景 | 防抖 (Debounce) | 节流 (Throttle) |
|------|----------------|----------------|
| **定义** | 事件停止触发 N 秒后执行 | 每隔 N 秒最多执行一次 |
| **搜索框** | ✅ 适用 | ❌ 不适用 |
| **滚动事件** | ❌ 不适用 | ✅ 适用 |
| **按钮点击** | ✅ 适用 | ✅ 适用 |
| **窗口 resize** | ✅ 适用 | ✅ 适用 |

### 示例对比

**防抖 (300ms)**:
```
用户输入: t -> e -> s -> t (间隔 < 300ms)
API 调用: 无 -> 无 -> 无 -> [等待 300ms] -> 调用一次 "test"
```

**节流 (1000ms)**:
```
用户点击: 0ms -> 200ms -> 500ms -> 800ms -> 1200ms
API 调用: ✅执行 -> ❌跳过 -> ❌跳过 -> ❌跳过 -> ✅执行
```

---

## 🎯 VueUse 完整示例

### 基础用法

```typescript
import { useDebounceFn, useThrottleFn } from '@vueuse/core';

// 1. 防抖函数
const debouncedFn = useDebounceFn(() => {
  console.log('执行防抖函数');
}, 500);

// 2. 节流函数
const throttledFn = useThrottleFn(() => {
  console.log('执行节流函数');
}, 1000);

// 3. 防抖响应式值
import { useDebounce } from '@vueuse/core';
const input = ref('');
const debouncedInput = useDebounce(input, 500);

watch(debouncedInput, (value) => {
  console.log('防抖后的值:', value);
});
```

### 高级配置

```typescript
// 配置选项
const debouncedFn = useDebounceFn(
  () => { /* ... */ }, 
  500,
  {
    maxWait: 2000  // 最长等待时间，防止一直不执行
  }
);

const throttledFn = useThrottleFn(
  () => { /* ... */ },
  1000,
  {
    leading: true,   // 首次触发时立即执行
    trailing: false  // 最后一次触发后不再执行
  }
);
```

---

## 📝 优化清单

### 已完成 ✅

- [x] LinkSuggestion.vue 搜索防抖 (VueUse, 300ms)

### 待执行 ⏸️

- [ ] BacklinkPanel.vue 刷新节流 (VueUse, 1000ms)
- [ ] LinkGraphView.vue 深度切换防抖 (可选, 300ms)
- [ ] EditorView.vue 窗口 resize 节流 (可选, 200ms)

### 可选优化 🔮

- [ ] 添加 `useLocalStorage` 缓存最近搜索
- [ ] 使用 `useAsyncQueue` 优化多个 API 并发
- [ ] 使用 `useInfiniteScroll` 优化反向链接列表

---

## 🛠️ 实现步骤

### 1. BacklinkPanel 刷新节流

**编辑文件**: `apps/web/src/modules/editor/presentation/components/BacklinkPanel.vue`

**步骤**:

1. 导入 `useThrottleFn`:
   ```typescript
   import { useThrottleFn } from '@vueuse/core';
   ```

2. 重命名原函数:
   ```typescript
   async function loadBacklinksImpl() {
     // 原有逻辑
   }
   ```

3. 创建节流版本:
   ```typescript
   const loadBacklinks = useThrottleFn(loadBacklinksImpl, 1000);
   ```

4. 暴露节流版本:
   ```typescript
   defineExpose({ 
     refresh: loadBacklinks  // 使用节流版本
   });
   ```

### 2. 测试验证

**手动测试**:
1. 快速连续点击反向链接刷新按钮
2. 验证 Network 面板只有 1 次请求
3. 验证 1 秒后可以再次触发

**预期结果**:
- ✅ 1秒内多次点击只触发1次请求
- ✅ Loading 状态正确显示
- ✅ 1秒后可以再次刷新

---

## 📚 VueUse 文档参考

- [useDebounceFn](https://vueuse.org/shared/useDebounceFn/)
- [useThrottleFn](https://vueuse.org/shared/useThrottleFn/)
- [useDebounce](https://vueuse.org/shared/useDebounce/)
- [useThrottle](https://vueuse.org/shared/useThrottle/)

---

## 💡 为什么选择 VueUse？

### 与 Lodash 对比

| 特性 | VueUse | Lodash |
|------|--------|--------|
| Vue 3 集成 | ⭐⭐⭐⭐⭐ 原生支持 | ⭐⭐⭐ 需要手动处理 |
| TypeScript | ⭐⭐⭐⭐⭐ 完整类型 | ⭐⭐⭐⭐ 需要 @types |
| 体积 | ⭐⭐⭐⭐⭐ 按需引入 | ⭐⭐⭐⭐ lodash-es |
| 响应式 | ⭐⭐⭐⭐⭐ 原生支持 | ⭐⭐ 需要手动 watch |
| 维护 | ⭐⭐⭐⭐⭐ 活跃 | ⭐⭐⭐⭐⭐ 成熟 |
| 学习成本 | ⭐⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 低 |

### 实际项目建议

**使用 VueUse**:
- ✅ Vue 3 项目
- ✅ 需要响应式集成
- ✅ 已经使用 VueUse 其他功能

**使用 Lodash**:
- ✅ 多框架共享代码
- ✅ 需要 Lodash 其他工具函数
- ✅ 团队更熟悉 Lodash

**本项目结论**: 
**使用 VueUse** ⭐ - 已安装，更适合 Vue 3 Composition API

---

## 🎉 优化效果预估

### LinkSuggestion 搜索防抖

**场景**: 用户搜索 "测试文档项目管理"

| 指标 | 优化前 | 优化后 | 提升 |
|------|-------|-------|------|
| API 请求数 | 10 次 | 1 次 | **90%** ↓ |
| 网络流量 | ~50KB | ~5KB | **90%** ↓ |
| 服务器负载 | 高 | 低 | **90%** ↓ |
| 用户体验 | 卡顿 | 流畅 | ⭐⭐⭐⭐⭐ |

### BacklinkPanel 刷新节流

**场景**: 用户快速点击刷新按钮 5 次

| 指标 | 优化前 | 优化后 | 提升 |
|------|-------|-------|------|
| API 请求数 | 5 次 | 1 次 | **80%** ↓ |
| 重复加载 | 是 | 否 | ✅ 消除 |
| 按钮响应 | 混乱 | 清晰 | ⭐⭐⭐⭐⭐ |

---

**文档创建时间**: 2025-10-31  
**创建者**: GitHub Copilot  
**Story**: 8-2 双向链接功能性能优化  
**状态**: ✅ LinkSuggestion 已优化，BacklinkPanel 待优化
