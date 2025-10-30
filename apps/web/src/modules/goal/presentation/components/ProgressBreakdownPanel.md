# ProgressBreakdownPanel 组件使用指南

## 概述

`ProgressBreakdownPanel` 是一个用于展示目标进度分解详情的 Vue 组件，它显示目标的总进度以及每个关键结果（KR）的贡献度。

## 功能特性

- ✅ 展示目标总进度（加权平均计算）
- ✅ 列出所有关键结果及其贡献度
- ✅ 可视化进度条
- ✅ 显示计算公式
- ✅ 自动加载数据
- ✅ 错误处理和重试
- ✅ 加载状态指示

## 组件 API

### Props

| 名称 | 类型 | 必填 | 说明 |
|------|------|------|------|
| goalUuid | `string` | ✅ | 目标的 UUID |

### Events

| 名称 | 参数 | 说明 |
|------|------|------|
| close | - | 关闭面板时触发 |

## 使用示例

### 1. 在对话框中使用

```vue
<template>
  <div>
    <!-- 触发按钮 -->
    <v-btn @click="showProgressBreakdown = true">
      <v-icon left>mdi-chart-pie</v-icon>
      查看进度详情
    </v-btn>

    <!-- 对话框 -->
    <v-dialog v-model="showProgressBreakdown" max-width="700">
      <ProgressBreakdownPanel
        :goal-uuid="currentGoalUuid"
        @close="showProgressBreakdown = false"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProgressBreakdownPanel from './ProgressBreakdownPanel.vue';

const showProgressBreakdown = ref(false);
const currentGoalUuid = ref('your-goal-uuid');
</script>
```

### 2. 在抽屉中使用

```vue
<template>
  <div>
    <!-- 触发按钮 -->
    <v-btn icon @click="drawer = true">
      <v-icon>mdi-information</v-icon>
    </v-btn>

    <!-- 抽屉 -->
    <v-navigation-drawer v-model="drawer" location="right" temporary width="650">
      <ProgressBreakdownPanel
        :goal-uuid="goalUuid"
        @close="drawer = false"
      />
    </v-navigation-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProgressBreakdownPanel from './ProgressBreakdownPanel.vue';

const drawer = ref(false);
const goalUuid = ref('your-goal-uuid');
</script>
```

### 3. 在目标详情页中集成（推荐）

在 `GoalDetailView.vue` 中添加进度详情按钮：

```vue
<template>
  <div class="goal-detail-view">
    <!-- 目标进度卡片 -->
    <v-card>
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-1">目标进度</span>
          <!-- 添加查看详情按钮 -->
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="showProgressBreakdown = true"
          >
            <v-icon left size="small">mdi-chart-pie</v-icon>
            查看详情
          </v-btn>
        </div>
        <v-progress-linear
          :model-value="goal.overallProgress"
          color="primary"
          height="20"
          rounded
        >
          <template #default="{ value }">
            <strong>{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </v-card-text>
    </v-card>

    <!-- 进度分解对话框 -->
    <v-dialog v-model="showProgressBreakdown" max-width="700">
      <ProgressBreakdownPanel
        :goal-uuid="goalUuid"
        @close="showProgressBreakdown = false"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProgressBreakdownPanel from '../components/ProgressBreakdownPanel.vue';

const showProgressBreakdown = ref(false);
const goalUuid = ref('your-goal-uuid');
const goal = ref({ overallProgress: 65 }); // 从 store 获取
</script>
```

## 数据结构

组件期望的数据结构（由后端 API 返回）：

```typescript
interface ProgressBreakdown {
  totalProgress: number;          // 目标总进度 (0-100)
  calculationMode: 'weighted_average';  // 计算模式
  krContributions: Array<{
    keyResultUuid: string;        // 关键结果 UUID
    keyResultName: string;        // 关键结果名称
    progress: number;             // KR 进度 (0-100)
    weight: number;               // KR 权重 (0-100)
    contribution: number;         // 对总进度的贡献度 (0-100)
  }>;
  lastUpdateTime: number;         // 最后更新时间（时间戳）
  updateTrigger: string;          // 更新触发方式
}
```

## API 端点

组件会自动调用以下 API 端点获取数据：

```
GET /api/goals/:uuid/progress-breakdown
```

## 样式定制

组件使用 Vuetify 3 的样式系统，你可以通过以下方式定制样式：

```vue
<ProgressBreakdownPanel
  :goal-uuid="goalUuid"
  class="custom-breakdown-panel"
  @close="handleClose"
/>

<style scoped>
:deep(.custom-breakdown-panel) {
  /* 自定义样式 */
}
</style>
```

## 错误处理

组件内置错误处理：

1. **加载失败**：显示错误信息和重试按钮
2. **网络错误**：显示 Snackbar 提示（由 composable 处理）
3. **数据为空**：不显示内容区域

## 性能优化

- 组件使用 `onMounted` 钩子加载数据
- 加载状态使用 loading spinner 指示
- 数据缓存在 composable 层处理

## 依赖

- `@dailyuse/contracts` - TypeScript 类型定义
- `dayjs` - 时间格式化
- `useGoal` composable - 数据获取

## 注意事项

1. 确保传入的 `goalUuid` 有效
2. 确保目标包含关键结果（否则列表为空）
3. 组件需要在 Pinia store 初始化后使用
4. 需要用户已登录并有目标访问权限

## 未来改进

- [ ] 添加导出为图片功能
- [ ] 添加历史进度对比
- [ ] 支持不同的计算模式展示
- [ ] 添加动画效果
