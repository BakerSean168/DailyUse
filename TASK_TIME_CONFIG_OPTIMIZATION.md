# 任务模板时间配置优化完成报告

## 概述

本次优化解决了任务模板表单中切换时间类型时没有默认值的问题，通过在领域实体中添加专门的业务方法，实现了自动初始化默认时间数据的功能。

## 问题描述

**原始问题**：
- 用户在任务模板表单中切换到"时间点"或"时间段"类型时，输入框为空
- 需要用户手动输入，体验不佳
- UI 层手动构建 TaskTimeConfig，逻辑分散

**改进目标**：
1. 切换时间类型时自动初始化合理的默认时间
2. 使用枚举类型替代字符串字面量，提升类型安全
3. 将业务逻辑封装在领域实体中，符合 DDD 原则

## 实现方案

### 1. 修正枚举定义

**文件**：`packages/contracts/src/modules/task/enums.ts`

**修改**：
```typescript
export enum TimeType {
  ALL_DAY = 'ALL_DAY',
  TIME_POINT = 'TIME_POINT',  // 原: timePoint
  TIME_RANGE = 'TIME_RANGE',  // 原: timeRange
}
```

**理由**：统一使用大写命名规范，与其他枚举保持一致。

### 2. 领域实体增强

**文件**：`packages/domain-client/src/task/aggregates/TaskTemplate.ts`

#### 2.1 导入枚举类型

```typescript
import { TaskType, TimeType, TaskTemplateStatus } from '@dailyuse/contracts';
```

移除了原有的 `type` 别名声明，直接使用 Contracts 包中的枚举类型。

#### 2.2 添加 updateTimeType() 方法

这是核心改进，方法会根据时间类型自动初始化默认时间数据：

```typescript
/**
 * 更新时间类型，并自动初始化对应的时间数据
 */
public updateTimeType(newTimeType: TimeType): void {
  if (!this.canEdit()) {
    throw new Error('Cannot update archived or deleted template');
  }

  const now = Date.now();
  const currentDate = new Date();
  
  switch (newTimeType) {
    case TimeType.ALL_DAY: {
      // 全天：今天到一个月后
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      this._timeConfig = TaskTimeConfig.fromClientDTO({
        timeType: TimeType.ALL_DAY,
        startDate: today.getTime(),
        endDate: oneMonthLater.getTime(),
        timePoint: null,
        timeRange: null,
        // ... 其他字段
      });
      break;
    }

    case TimeType.TIME_POINT: {
      // 时间点：当前时间
      this._timeConfig = TaskTimeConfig.fromClientDTO({
        timeType: TimeType.TIME_POINT,
        startDate: null,
        endDate: null,
        timePoint: now,
        timeRange: null,
        // ... 其他字段
      });
      break;
    }

    case TimeType.TIME_RANGE: {
      // 时间段：当前时间到1小时后
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate.getTime() + 60 * 60 * 1000);

      this._timeConfig = TaskTimeConfig.fromClientDTO({
        timeType: TimeType.TIME_RANGE,
        startDate: null,
        endDate: null,
        timePoint: null,
        timeRange: {
          start: startTime.getTime(),
          end: endTime.getTime(),
        },
        // ... 其他字段
      });
      break;
    }
  }

  this._updatedAt = Date.now();
}
```

#### 2.3 更新静态方法

所有静态工厂方法都更新为使用枚举类型：

```typescript
// forCreate()
taskType: TaskType.ONE_TIME,
status: TaskTemplateStatus.ACTIVE,
timeConfig: TaskTimeConfig.fromClientDTO({
  timeType: TimeType.ALL_DAY,
  // ...
  formattedStartDate: today.toLocaleDateString('zh-CN'),
}),

// create()
taskType: params.taskType || TaskType.ONE_TIME,
status: params.status || TaskTemplateStatus.ACTIVE,

// fromServerDTO()
TaskTimeConfig.fromServerDTO({
  timeType: TimeType.ALL_DAY,  // 移除了 require 动态导入
})
```

### 3. 前端组件更新

**文件**：`apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/TimeConfigSection.vue`

#### 3.1 导入和类型定义

```typescript
import { TaskTemplate, TaskTimeConfig } from '@dailyuse/domain-client';
import { TaskContracts } from '@dailyuse/contracts';
import { TimeType } from '@dailyuse/contracts';

const timeType = ref<TimeType>(TimeType.ALL_DAY);
```

#### 3.2 模板更新

```vue
<v-radio-group v-model="timeType" label="时间类型" @update:model-value="handleTimeTypeChange">
  <v-radio label="全天" :value="TimeType.ALL_DAY"></v-radio>
  <v-radio label="时间点" :value="TimeType.TIME_POINT"></v-radio>
  <v-radio label="时间段" :value="TimeType.TIME_RANGE"></v-radio>
</v-radio-group>

<!-- 时间点输入：改为 datetime-local 支持完整日期时间选择 -->
<v-row v-if="timeType === TimeType.TIME_POINT">
  <v-col cols="12">
    <v-text-field
      v-model="timePoint"
      label="具体时间"
      type="datetime-local"
      variant="outlined"
      density="comfortable"
      @update:model-value="handleTimePointChange"
    ></v-text-field>
  </v-col>
</v-row>

<!-- 时间段输入：同样改为 datetime-local -->
<v-row v-if="timeType === TimeType.TIME_RANGE">
  <v-col cols="12" md="6">
    <v-text-field
      v-model="timeRangeStart"
      label="开始时间"
      type="datetime-local"
      variant="outlined"
      density="comfortable"
      @update:model-value="handleTimeRangeChange"
    ></v-text-field>
  </v-col>
  <v-col cols="12" md="6">
    <v-text-field
      v-model="timeRangeEnd"
      label="结束时间"
      type="datetime-local"
      variant="outlined"
      density="comfortable"
      @update:model-value="handleTimeRangeChange"
    ></v-text-field>
  </v-col>
</v-row>
```

#### 3.3 添加格式化函数

```typescript
/**
 * 格式化时间戳为 input[type=datetime-local] 格式
 */
const formatDateTimeToInput = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * 解析 datetime-local 输入为时间戳
 */
const parseDateTimeInput = (datetimeStr: string): number | null => {
  if (!datetimeStr) return null;
  return new Date(datetimeStr).getTime();
};
```

#### 3.4 修改初始化方法

```typescript
const initializeFormData = () => {
  const config = props.modelValue.timeConfig;
  
  // ...
  
  // 时间点
  if (config.timeType === TimeType.TIME_POINT && config.timePoint) {
    timePoint.value = formatDateTimeToInput(config.timePoint);
  }

  // 时间段
  if (config.timeType === TimeType.TIME_RANGE && config.timeRange) {
    timeRangeStart.value = formatDateTimeToInput(config.timeRange.start);
    timeRangeEnd.value = formatDateTimeToInput(config.timeRange.end);
  }
};
```

#### 3.5 重写时间类型变更处理

**关键改进**：直接调用实体方法，不再手动构建 TaskTimeConfig

```typescript
/**
 * 处理时间类型变更
 */
const handleTimeTypeChange = () => {
  try {
    validationError.value = '';
    
    // 直接调用实体方法，自动初始化默认时间
    const updated = props.modelValue.clone();
    updated.updateTimeType(timeType.value);
    emit('update:modelValue', updated);
    
    // 更新表单显示
    initializeFormData();
    
    // 验证通过
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间类型失败:', error);
    validationError.value = error instanceof Error ? error.message : '更新失败';
    emit('update:validation', false);
  }
};
```

#### 3.6 更新其他方法

`updateTimeConfig()` 方法保留用于处理用户手动修改具体时间值的情况：

```typescript
const updateTimeConfig = () => {
  try {
    validationError.value = '';

    const newConfig: TaskContracts.TaskTimeConfigClientDTO = {
      timeType: timeType.value,
      startDate: parseDateInput(startDate.value),
      endDate: parseDateInput(endDate.value),
      timePoint: timeType.value === TimeType.TIME_POINT ? parseDateTimeInput(timePoint.value) : null,
      timeRange:
        timeType.value === TimeType.TIME_RANGE && timeRangeStart.value && timeRangeEnd.value
          ? {
            start: parseDateTimeInput(timeRangeStart.value)!,
            end: parseDateTimeInput(timeRangeEnd.value)!,
          }
          : null,
      // ... 其他字段
    };

    // 验证
    if (timeType.value === TimeType.TIME_POINT && !newConfig.timePoint) {
      validationError.value = '请输入具体时间';
      emit('update:validation', false);
      return;
    }

    if (timeType.value === TimeType.TIME_RANGE && !newConfig.timeRange) {
      validationError.value = '请输入完整的时间段';
      emit('update:validation', false);
      return;
    }
    
    if (
      timeType.value === TimeType.TIME_RANGE &&
      newConfig.timeRange &&
      newConfig.timeRange.start >= newConfig.timeRange.end
    ) {
      validationError.value = '结束时间必须晚于开始时间';
      emit('update:validation', false);
      return;
    }

    const newTimeConfig = TaskTimeConfig.fromClientDTO(newConfig);
    props.modelValue.updateTimeConfig(newTimeConfig);
    emit('update:validation', true);
  } catch (error) {
    console.error('更新时间配置失败:', error);
    validationError.value = error instanceof Error ? error.message : '更新失败';
    emit('update:validation', false);
  }
};
```

## 技术亮点

### 1. DDD 最佳实践

**封装业务逻辑**：
- 时间类型切换的默认值初始化逻辑封装在 `TaskTemplate.updateTimeType()` 方法中
- UI 层只需调用实体方法，不需要了解业务细节
- 符合"胖领域模型，瘦应用层"原则

### 2. 类型安全提升

**使用枚举替代字符串**：
- 所有时间类型使用 `TimeType` 枚举
- 编译时类型检查，避免拼写错误
- IDE 自动补全和重构支持

### 3. 用户体验改进

**自动初始化默认值**：
- 全天：今天到一个月后的日期范围
- 时间点：当前时间
- 时间段：当前时间到1小时后

**更好的输入控件**：
- 使用 `datetime-local` 输入类型
- 支持完整的日期和时间选择
- 原生浏览器日期时间选择器

### 4. 代码质量

**统一枚举命名**：
- 所有枚举值使用大写下划线命名
- `TIME_POINT`, `TIME_RANGE` 替代 `timePoint`, `timeRange`

**移除代码异味**：
- 移除 `type` 别名声明，直接使用导入的枚举
- 移除动态 `require` 导入
- 移除字符串字面量 + `as` 类型断言

## 验证方法

### 手动测试场景

**场景1：时间类型切换**
1. 打开任务模板表单
2. 默认"全天"类型，查看日期范围是否有默认值（今天到一个月后）
3. 切换到"时间点"，查看是否自动填充当前时间
4. 切换到"时间段"，查看是否自动填充当前时间到1小时后
5. 来回切换，验证每次都能正确初始化

**场景2：手动修改时间**
1. 选择"时间点"类型
2. 手动修改日期和时间
3. 保存任务模板
4. 重新打开，验证保存的时间正确

**场景3：验证逻辑**
1. 选择"时间段"类型
2. 设置结束时间早于开始时间
3. 应显示错误提示
4. 修正后错误消失

**场景4：datetime-local 输入**
1. 点击时间点输入框
2. 应弹出原生日期时间选择器
3. 可以同时选择日期和时间
4. 选择后正确显示和保存

### 编译验证

```bash
# 检查类型错误
npx nx run domain-client:type-check
npx nx run web:type-check

# 运行单元测试（如果有）
npx nx run domain-client:test
```

## 架构设计

### 领域驱动设计 (DDD)

```
┌─────────────────────────────────────────┐
│           UI Layer (Vue)                │
│  ┌─────────────────────────────────┐    │
│  │  TimeConfigSection.vue          │    │
│  │                                 │    │
│  │  handleTimeTypeChange() {       │    │
│  │    template.updateTimeType()    │◄───┼─── 调用领域方法
│  │  }                              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Domain Layer                     │
│  ┌─────────────────────────────────┐    │
│  │  TaskTemplate (实体)            │    │
│  │                                 │    │
│  │  updateTimeType(type) {         │    │
│  │    switch(type) {               │    │
│  │      case ALL_DAY:              │◄───┼─── 封装业务逻辑
│  │        // 初始化日期范围        │    │
│  │      case TIME_POINT:           │    │
│  │        // 初始化时间点          │    │
│  │      case TIME_RANGE:           │    │
│  │        // 初始化时间段          │    │
│  │    }                            │    │
│  │  }                              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 类型系统

```
┌──────────────────────────────┐
│   @dailyuse/contracts        │
│                              │
│   export enum TimeType {     │
│     ALL_DAY,                 │
│     TIME_POINT,              │
│     TIME_RANGE               │
│   }                          │
└──────────────────────────────┘
            │
            │ import
            ▼
┌──────────────────────────────┐
│   @dailyuse/domain-client    │
│                              │
│   import { TimeType } from   │
│     '@dailyuse/contracts'    │
│                              │
│   class TaskTemplate {       │
│     updateTimeType(          │
│       newType: TimeType      │◄─── 强类型参数
│     )                        │
│   }                          │
└──────────────────────────────┘
            │
            │ import
            ▼
┌──────────────────────────────┐
│   Vue Component              │
│                              │
│   import { TimeType } from   │
│     '@dailyuse/contracts'    │
│                              │
│   const timeType =           │
│     ref<TimeType>(...)       │◄─── 强类型状态
└──────────────────────────────┘
```

## 文件变更清单

### 修改的文件

1. **packages/contracts/src/modules/task/enums.ts**
   - 修正 TimeType 枚举命名

2. **packages/domain-client/src/task/aggregates/TaskTemplate.ts**
   - 导入枚举类型
   - 添加 `updateTimeType()` 方法
   - 更新所有静态方法使用枚举

3. **apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/TimeConfigSection.vue**
   - 更新导入和类型定义
   - 修改模板使用正确的枚举名
   - 改为 `datetime-local` 输入类型
   - 添加 `formatDateTimeToInput()` 和 `parseDateTimeInput()` 函数
   - 重写 `handleTimeTypeChange()` 方法
   - 更新 `initializeFormData()` 方法
   - 更新 `updateTimeConfig()` 方法

### 无需修改的文件

所有使用 TimeType 的其他文件因为使用了命名空间导入 (`TaskContracts.TimeType`) 或类型推断，所以不需要修改。

## 后续建议

### 1. 添加更多快捷选项

可以考虑在时间配置中添加快捷按钮：

```vue
<v-btn-group>
  <v-btn @click="setTimeToToday">今天</v-btn>
  <v-btn @click="setTimeToTomorrow">明天</v-btn>
  <v-btn @click="setTimeToNextWeek">下周</v-btn>
  <v-btn @click="setTimeToNextMonth">下月</v-btn>
</v-btn-group>
```

### 2. 添加单元测试

为 `TaskTemplate.updateTimeType()` 方法添加单元测试：

```typescript
describe('TaskTemplate.updateTimeType()', () => {
  it('should initialize date range for ALL_DAY type', () => {
    const template = TaskTemplate.forCreate(/* ... */);
    template.updateTimeType(TimeType.ALL_DAY);
    
    const config = template.timeConfig;
    expect(config.timeType).toBe(TimeType.ALL_DAY);
    expect(config.startDate).toBeTruthy();
    expect(config.endDate).toBeTruthy();
    // 验证日期范围是今天到一个月后
  });

  it('should initialize current time for TIME_POINT type', () => {
    const template = TaskTemplate.forCreate(/* ... */);
    const beforeTime = Date.now();
    template.updateTimeType(TimeType.TIME_POINT);
    const afterTime = Date.now();
    
    const config = template.timeConfig;
    expect(config.timeType).toBe(TimeType.TIME_POINT);
    expect(config.timePoint).toBeGreaterThanOrEqual(beforeTime);
    expect(config.timePoint).toBeLessThanOrEqual(afterTime);
  });

  it('should initialize time range for TIME_RANGE type', () => {
    const template = TaskTemplate.forCreate(/* ... */);
    template.updateTimeType(TimeType.TIME_RANGE);
    
    const config = template.timeConfig;
    expect(config.timeType).toBe(TimeType.TIME_RANGE);
    expect(config.timeRange).toBeTruthy();
    expect(config.timeRange!.end).toBeGreaterThan(config.timeRange!.start);
    // 验证时间差约为1小时
  });

  it('should throw error when template is archived', () => {
    const template = TaskTemplate.forCreate(/* ... */);
    template.archive();
    
    expect(() => {
      template.updateTimeType(TimeType.TIME_POINT);
    }).toThrow('Cannot update archived or deleted template');
  });
});
```

### 3. 添加 E2E 测试

验证用户在浏览器中的完整操作流程：

```typescript
test('should auto-initialize time when switching time type', async ({ page }) => {
  // 1. 打开任务模板对话框
  await page.click('[data-testid="create-task-template"]');
  
  // 2. 默认全天类型，验证有日期范围
  const startDate = await page.inputValue('[data-testid="start-date"]');
  expect(startDate).toBeTruthy();
  
  // 3. 切换到时间点
  await page.click('text=时间点');
  const timePoint = await page.inputValue('[data-testid="time-point"]');
  expect(timePoint).toBeTruthy();
  
  // 4. 切换到时间段
  await page.click('text=时间段');
  const rangeStart = await page.inputValue('[data-testid="time-range-start"]');
  const rangeEnd = await page.inputValue('[data-testid="time-range-end"]');
  expect(rangeStart).toBeTruthy();
  expect(rangeEnd).toBeTruthy();
  
  // 5. 验证时间段的结束时间晚于开始时间
  const startTime = new Date(rangeStart).getTime();
  const endTime = new Date(rangeEnd).getTime();
  expect(endTime).toBeGreaterThan(startTime);
});
```

### 4. 考虑时区处理

如果应用需要支持多时区，需要：

1. 在 `TaskTimeConfig` 中添加时区字段
2. `updateTimeType()` 方法使用用户的本地时区
3. 服务端存储 UTC 时间
4. 前端显示转换为用户时区

### 5. 性能优化

如果时间配置频繁变更，考虑：

1. 防抖处理用户输入
2. 使用 `computed` 计算派生状态
3. 避免不必要的 `clone()` 操作

## 总结

本次优化通过以下方式显著改善了任务模板时间配置的用户体验和代码质量：

### 用户体验提升
✅ 切换时间类型时自动填充合理的默认值  
✅ 使用 `datetime-local` 提供原生日期时间选择器  
✅ 减少用户手动输入操作

### 代码质量改进
✅ 使用枚举类型提升类型安全  
✅ 业务逻辑封装在领域实体中  
✅ UI 层保持简单，只负责展示和调用  
✅ 统一枚举命名规范

### 架构设计
✅ 符合 DDD 原则，领域模型知道如何处理业务规则  
✅ 清晰的关注点分离  
✅ 易于测试和维护

这是一个典型的通过 DDD 最佳实践提升代码质量的案例。
