# 任务时间标签优化完成

## ✅ 优化完成

**完成时间**：2025-11-16  
**优化目标**：简化任务实例和模板卡片的时间信息显示

---

## 📋 优化内容

### 问题分析

**优化前的问题**：
1. ❌ TaskInstanceCard 显示完整日期时间（`2025/11/16 14:37:30`），信息冗余
2. ❌ TaskTemplateCard 使用 `template.timeDisplayText`，格式不统一
3. ❌ 任务实例界面已经有日期选择器，无需在卡片中重复显示日期

**优化目标**：
- ✅ 只根据时间类型显示关键信息
- ✅ 统一格式：`全天` / `HH:mm` / `HH:mm - HH:mm`
- ✅ 减少视觉噪音，提升可读性

---

## 🔧 具体修改

### 1. **TaskInstanceCard.vue**

#### 修改标题显示
```typescript
// ❌ 之前：显示重复信息
任务实例 {{ task.instanceDateFormatted }}

// ✅ 现在：显示任务名称（从模板获取）
const taskTitle = computed(() => {
  const template = taskStore.getTaskTemplateByUuid(props.task.templateUuid);
  return template?.title || '未知任务';
});
```

#### 优化时间标签
```typescript
/**
 * 根据时间类型生成时间标签
 * - ALL_DAY: 全天
 * - TIME_POINT: HH:mm
 * - TIME_RANGE: HH:mm - HH:mm
 */
const timeLabel = computed(() => {
  const timeConfig = props.task.timeConfig;
  
  if (timeConfig.timeType === 'ALL_DAY') {
    return '全天';
  }
  
  if (timeConfig.timeType === 'TIME_POINT' && timeConfig.timePoint !== null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (timeConfig.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;
    
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }
  
  return '全天';
});
```

#### 优化完成时间显示
```typescript
// ❌ 之前：完成于 2025-11-16 14:37:30
const formatCompletionTime = computed(() => {
  return props.task.actualEndTime 
    ? format(props.task.actualEndTime, 'yyyy-MM-dd HH:mm:ss') 
    : '';
});

// ✅ 现在：完成于 14:37（只显示时间）
const formatCompletionTime = computed(() => {
  return props.task.actualEndTime 
    ? format(props.task.actualEndTime, 'HH:mm') 
    : '';
});
```

---

### 2. **TaskTemplateCard.vue**

#### 优化时间标签
```typescript
// ❌ 之前：使用 template.timeDisplayText
<span class="meta-text">
  {{ template.timeDisplayText }}
</span>

// ✅ 现在：统一格式化
<span class="meta-text">
  {{ timeLabel }}
</span>
```

```typescript
/**
 * 根据时间类型生成时间标签
 * - ALL_DAY: 全天
 * - TIME_POINT: HH:mm
 * - TIME_RANGE: HH:mm - HH:mm
 */
const timeLabel = computed(() => {
  const timeConfig = props.template.timeConfig;
  
  if (timeConfig.timeType === 'ALL_DAY') {
    return '全天';
  }
  
  if (timeConfig.timeType === 'TIME_POINT' && timeConfig.timePoint !== null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (timeConfig.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;
    
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }
  
  return '全天';
});
```

---

## 📊 优化效果对比

### TaskInstanceCard

#### 优化前
```
┌─────────────────────────────────┐
│ ○ 任务实例 2025/11/16           │
│   ⏰ 2025-11-16 14:37:30        │
└─────────────────────────────────┘
```

#### 优化后
```
┌─────────────────────────────────┐
│ ○ 擦速度                        │
│   ⏰ 14:37                      │
└─────────────────────────────────┘
```
或
```
┌─────────────────────────────────┐
│ ○ 早期                          │
│   ⏰ 全天                       │
└─────────────────────────────────┘
```
或
```
┌─────────────────────────────────┐
│ ○ 是的                          │
│   ⏰ 08:00 - 18:00              │
└─────────────────────────────────┘
```

### TaskTemplateCard

#### 优化前
```
┌─────────────────────────────────┐
│ 📋 2222                         │
│ ...                             │
│ ⏰ 2025-11-16 全天              │
└─────────────────────────────────┘
```

#### 优化后
```
┌─────────────────────────────────┐
│ 📋 2222                         │
│ ...                             │
│ ⏰ 全天                         │
└─────────────────────────────────┘
```
或
```
┌─────────────────────────────────┐
│ 📋 擦速度                       │
│ ...                             │
│ ⏰ 14:30                        │
└─────────────────────────────────┘
```
或
```
┌─────────────────────────────────┐
│ 📋 是的                         │
│ ...                             │
│ ⏰ 09:00 - 17:00                │
└─────────────────────────────────┘
```

---

## 🎨 设计原则

### 1. **信息密度优化**
- ✅ 任务实例界面已有日期信息（周选择器 + 日期选择器）
- ✅ 卡片中只显示关键的时间信息（HH:mm）
- ✅ 避免重复显示日期（减少视觉噪音）

### 2. **格式统一**
- ✅ 全天任务：`全天`
- ✅ 时间点任务：`HH:mm`（如：`14:30`）
- ✅ 时间段任务：`HH:mm - HH:mm`（如：`09:00 - 17:00`）

### 3. **上下文相关**
- ✅ 未完成任务：显示计划时间（`⏰ 14:30`）
- ✅ 已完成任务：显示完成时间（`✓ 完成于 14:37`）

---

## 🔍 技术细节

### TaskTimeConfig 数据结构

```typescript
interface TaskTimeConfig {
  timeType: 'ALL_DAY' | 'TIME_POINT' | 'TIME_RANGE';
  startDate: number | null;       // 开始日期（时间戳）
  timePoint: number | null;        // 时间点（分钟数，如 870 = 14:30）
  timeRange: {                     // 时间段
    start: number;                 // 开始时间（分钟数，如 540 = 09:00）
    end: number;                   // 结束时间（分钟数，如 1020 = 17:00）
  } | null;
}
```

### 分钟转时间格式

```typescript
// 870 分钟 = 14 小时 30 分钟
const hours = Math.floor(870 / 60);        // 14
const minutes = 870 % 60;                   // 30
const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
// 结果：'14:30'
```

---

## ✅ 验收标准

- [x] TaskInstanceCard 显示任务标题（从模板获取）
- [x] TaskInstanceCard 显示简化时间标签（全天 / HH:mm / HH:mm - HH:mm）
- [x] TaskInstanceCard 完成时间只显示 HH:mm
- [x] TaskTemplateCard 显示统一格式的时间标签
- [x] 所有时间格式统一，易于阅读
- [x] 减少信息冗余，提升用户体验
- [x] 代码无 TypeScript 错误

---

## 📚 相关文件

- **TaskInstanceCard**：`apps/web/src/modules/task/presentation/components/cards/TaskInstanceCard.vue`
- **TaskTemplateCard**：`apps/web/src/modules/task/presentation/components/cards/TaskTemplateCard.vue`
- **TaskTimeConfig**：`packages/domain-client/src/task/value-objects/TaskTimeConfig.ts`

---

## 🚀 用户体验提升

### 视觉层面
- ✅ 信息更简洁，一目了然
- ✅ 减少视觉噪音（去除重复的日期信息）
- ✅ 统一格式，提升专业感

### 功能层面
- ✅ 任务名称清晰可见（之前显示"任务实例 2025/11/16"）
- ✅ 时间信息关键且精准（只显示用户需要的信息）
- ✅ 完成时间更易读（14:37 vs 2025-11-16 14:37:30）

### 性能层面
- ✅ 减少字符串长度（渲染更快）
- ✅ 统一格式化逻辑（便于维护）

---

**优化完成时间**：2025-11-16  
**优化人员**：AI Assistant  
**测试状态**：✅ 已通过编译检查
