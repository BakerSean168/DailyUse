# KeyResult InitialValue 设计说明

## 设计决策

**保留 `initialValue` 字段，但设为可选，默认为 0**

## 理由

### 1. 灵活性
某些关键结果可能需要记录原始基线值，例如：
- **场景 A**：用户从 10K 增长到 20K
  - `initialValue = 10000`
  - `targetValue = 20000`
  - 语义：当前有 10K 用户，目标是达到 20K
  
- **场景 B**：增长 10K 用户（推荐）
  - `initialValue = 0`（默认）
  - `targetValue = 10000`
  - 语义：从现在开始，增长 10K 用户

### 2. 两种表述方式都合理
- **绝对值表述**（场景 A）：更直观地反映实际数据
- **增量表述**（场景 B）：更关注目标达成的进度

体重示例：
- 绝对值：从 60kg 减到 50kg → `initialValue = 60, targetValue = 50`
- 增量值：减重 10kg → `initialValue = 0, targetValue = 10`

### 3. 向后兼容
- 已有的 KeyResult 可能已经记录了非零起始值
- 可选字段不会破坏现有数据
- 默认值为 0，保持简单使用场景的简洁性

## 进度计算公式

```typescript
const start = initialValue ?? 0;
const range = targetValue - start;
const percentage = ((currentValue - start) / range) * 100;
```

**示例**：
- 场景 A（10K → 20K）：当前 15K → `(15000 - 10000) / (20000 - 10000) * 100 = 50%`
- 场景 B（增长 10K）：当前增长 5K → `(5000 - 0) / (10000 - 0) * 100 = 50%`

## 实现细节

### Contracts 定义
```typescript
export interface IKeyResultProgressServer {
  /**
   * 起始值（可选，默认为 0）
   * 用于计算进度百分比：(currentValue - initialValue) / (targetValue - initialValue)
   */
  initialValue?: number;
  targetValue: number;
  currentValue: number;
  // ...
}
```

### 持久化 DTO
```typescript
export interface KeyResultProgressPersistenceDTO {
  initial_value?: number;  // 数据库字段使用 snake_case
  target_value: number;
  current_value: number;
  // ...
}
```

### Domain 层
- **domain-server**: `readonly initialValue?: number`（不可变值对象）
- **domain-client**: `private _initialValue?: number`（可变值对象）

## API 接口

### UpdateKeyResultRequest
```typescript
export interface UpdateKeyResultRequest {
  startValue?: number;  // 对应 initialValue
  targetValue?: number;
  currentValue?: number;
  // ...
}
```

## 数据库 Schema

需要在 `key_results` 表的 `progress` JSON 字段中包含 `initial_value`：

```json
{
  "initial_value": 0,
  "current_value": 5000,
  "target_value": 10000,
  "valueType": "INCREMENTAL",
  "aggregation_method": "SUM"
}
```

## UI 显示建议

### 创建 KeyResult 时
- 提供切换选项："绝对值模式" vs "增量模式"
- 绝对值模式：显示 `initialValue` 和 `targetValue` 输入框
- 增量模式：只显示 `targetValue` 输入框，`initialValue` 自动设为 0

### 进度显示
- 增量模式（`initialValue = 0`）：显示 "5000 / 10000"
- 绝对值模式（`initialValue = 10000`）：显示 "15000 / 20000（起始：10000）"

### Tooltip 显示
```typescript
tooltip: {
  formatter: (params) => {
    const kr = keyResults[params.dataIndex];
    const initial = kr.progress.initialValue ?? 0;
    return `
      ${kr.title}
      起始值: ${initial}
      当前值: ${kr.progress.currentValue}
      目标值: ${kr.progress.targetValue}
      进度: ${kr.progress.progressPercentage}%
    `;
  }
}
```

## 构建状态

✅ 所有包已重新构建：
- `@dailyuse/contracts` - 674.61 KB
- `@dailyuse/domain-client` - 140.26 KB  
- `@dailyuse/domain-server` - 356.63 KB

## 后续工作

- [ ] 数据库迁移：添加 `initial_value` 支持（目前 JSON 字段已支持）
- [ ] API 层：更新 Controller 和 Service 以处理 `startValue` 参数
- [ ] UI 层：在 KeyResultDialog 中添加"绝对值/增量"模式切换
- [ ] 测试：验证不同 `initialValue` 场景下的进度计算

## 结论

保留 `initialValue` 字段作为可选参数（默认 0）是最优方案：
- ✅ 支持两种表述方式（绝对值/增量）
- ✅ 默认简单使用（大多数场景用增量）
- ✅ 向后兼容现有数据
- ✅ 灵活应对复杂需求

如果未来发现所有 KeyResult 都使用 `initialValue = 0`，可以考虑移除该字段，但目前保留是更安全的选择。
