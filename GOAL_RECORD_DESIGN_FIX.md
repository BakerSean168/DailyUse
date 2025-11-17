# Goal Record 数据模型设计修复方案

## 📋 当前设计的问题

### 问题 1：字段语义混淆

**当前设计**（❌ 错误）：
```typescript
export class GoalRecord {
  private _previousValue: number;  // 上一次的累计值
  private _newValue: number;       // 本次的累计值
  private _changeAmount: number;   // 变化量 = newValue - previousValue
}
```

**问题分析**：

#### 场景 1：SUM（累加） - 跑步里程
```
用户输入：本次跑步 5 公里

当前逻辑：
- previousValue: 10 (之前累计)
- newValue: 15 (现在累计)
- changeAmount: 5 (本次完成)

问题：
❌ newValue 的语义不清晰（是累计值还是本次值？）
❌ 如果删除前面的记录，需要重新计算所有 newValue
```

#### 场景 2：AVERAGE（平均值） - 考试成绩
```
用户输入：本次考试 85 分

当前逻辑：
- previousValue: 80 (上次考试成绩？) ❌ 没有意义
- newValue: 85 (本次考试成绩) ✅ 正确
- changeAmount: 5 ❌ 完全错误

实际需要：
- 每次记录独立的考试成绩
- currentValue = (record1 + record2 + record3) / 3
```

#### 场景 3：LAST（取最后一次） - 体重记录
```
用户输入：当前体重 70kg

当前逻辑：
- previousValue: 72 (上次体重) ❌ 没有意义
- newValue: 70 (本次体重) ✅ 正确
- changeAmount: -2 ❌ 不应该用于计算

实际需要：
- 记录每次的体重值
- currentValue = 最后一次记录的值
```

### 问题 2：后端计算逻辑错误

**当前代码**（apps/api/.../GoalRecordApplicationService.ts）：
```typescript
// 创建记录时
const previousValue = keyResult.progress.currentValue;  // 10
const newValue = params.value;  // 15 (累计值)

const record = GoalRecord.create({
  previousValue: 10,
  newValue: 15,
  changeAmount: 5
});

keyResult.updateProgress(15);  // 直接设置为 15
```

**重新计算时**（KeyResult.recalculateProgress()）：
```typescript
case 'SUM':
  // ❌ 错误：累加所有 record 的 newValue
  newValue = values.reduce((sum, val) => sum + val, 0);
  // values = [15]
  // 结果 = 15 ✅

// 添加第二条记录
const record2 = GoalRecord.create({
  previousValue: 15,
  newValue: 20,  // 累计 20
  changeAmount: 5
});

// 重新计算
newValue = [15, 20].reduce((sum, val) => sum + val, 0);
// 结果 = 35 ❌ 错误！应该是 20
```

**根本问题**：
- `record.newValue` 存储的是"累计值"
- `recalculateProgress()` 把所有"累计值"再累加
- 导致重复计算

---

## 🎯 正确的设计方案

### 核心原则

**Record 应该存储"本次记录的独立值"，而不是"累计值"**

### 新的数据模型

```typescript
export class GoalRecord {
  private _keyResultUuid: string;
  private _goalUuid: string;
  private _value: number;          // ✅ 本次记录的值（核心字段）
  private _note: string | null;
  private _recordedAt: number;
  private _createdAt: number;

  // 可选：用于 UI 展示的辅助字段
  private _calculatedCurrentValue?: number;  // 记录时的累计值（仅用于显示）
}
```

### 字段说明

| 字段 | 说明 | 示例（跑步） | 示例（考试） | 示例（体重） |
|------|------|-------------|-------------|-------------|
| `value` | 本次记录的独立值 | 5 公里 | 85 分 | 70 kg |
| `calculatedCurrentValue` | 记录时计算的累计值 | 15 公里 | 82.5 分（平均） | 70 kg |
| `note` | 备注说明 | "晨跑" | "期中考试" | "早起空腹" |

### 不同聚合方式的语义

| 聚合方式 | record.value 的含义 | currentValue 的计算 |
|---------|-------------------|-------------------|
| **SUM（累加）** | 本次增加的数量 | sum(所有 record.value) |
| **AVERAGE（平均）** | 本次的独立数值 | avg(所有 record.value) |
| **MAX（最大值）** | 本次的独立数值 | max(所有 record.value) |
| **MIN（最小值）** | 本次的独立数值 | min(所有 record.value) |
| **LAST（最后一次）** | 本次的独立数值 | 最后一条 record.value |

---

## 🔧 修复方案

### 1. 修改 GoalRecord 实体

**文件**：`packages/domain-server/src/goal/entities/GoalRecord.ts`

```typescript
export class GoalRecord extends Entity implements IGoalRecordServer {
  // ===== 私有字段 =====
  private _keyResultUuid: string;
  private _goalUuid: string;
  private _value: number;  // ✅ 本次记录的值
  private _note: string | null;
  private _recordedAt: number;
  private _createdAt: number;

  // ===== 构造函数 =====
  private constructor(params: {
    uuid?: string;
    keyResultUuid: string;
    goalUuid: string;
    value: number;  // ✅ 修改
    note?: string | null;
    recordedAt: number;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._keyResultUuid = params.keyResultUuid;
    this._goalUuid = params.goalUuid;
    this._value = params.value;  // ✅ 修改
    this._note = params.note ?? null;
    this._recordedAt = params.recordedAt;
    this._createdAt = params.createdAt;
  }

  // ===== Getter =====
  public get value(): number {
    return this._value;
  }

  // ===== 工厂方法 =====
  public static create(params: {
    keyResultUuid: string;
    goalUuid: string;
    value: number;  // ✅ 本次记录的值
    note?: string;
    recordedAt?: number;
  }): GoalRecord {
    if (!params.keyResultUuid) {
      throw new Error('KeyResult UUID is required');
    }
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }
    if (typeof params.value !== 'number' || isNaN(params.value)) {
      throw new Error('Value must be a valid number');
    }

    const now = Date.now();

    return new GoalRecord({
      keyResultUuid: params.keyResultUuid,
      goalUuid: params.goalUuid,
      value: params.value,  // ✅ 修改
      note: params.note?.trim() || null,
      recordedAt: params.recordedAt ?? now,
      createdAt: now,
    });
  }

  // ===== DTO 转换 =====
  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,  // ✅ 修改
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
    };
  }

  public toClientDTO(calculatedCurrentValue?: number): GoalRecordClientDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,  // ✅ 本次记录的值
      calculatedCurrentValue: calculatedCurrentValue,  // ✅ 记录时的累计值（可选）
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
      formattedRecordedAt: new Date(this._recordedAt).toLocaleString(),
      formattedCreatedAt: new Date(this._createdAt).toLocaleString(),
    };
  }
}
```

### 2. 修改 KeyResult 实体

**文件**：`packages/domain-server/src/goal/entities/KeyResult.ts`

```typescript
export class KeyResult extends Entity {
  /**
   * 添加记录并重新计算进度
   */
  public addRecord(record: GoalRecordServerDTO): void {
    this._records.push(record);
    this.recalculateProgress();  // ✅ 添加后立即重新计算
  }

  /**
   * 根据聚合方式重新计算进度
   */
  public recalculateProgress(): void {
    if (this._records.length === 0) {
      this._progress.currentValue = 0;
      return;
    }

    const values = this._records.map(r => r.value);  // ✅ 使用 value 字段
    let newValue = 0;

    switch (this._progress.aggregationMethod) {
      case 'SUM':
        // ✅ 累加所有记录的值
        newValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'AVERAGE':
        // ✅ 计算平均值
        newValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'MAX':
        // ✅ 取最大值
        newValue = Math.max(...values);
        break;
      case 'MIN':
        // ✅ 取最小值
        newValue = Math.min(...values);
        break;
      case 'LAST':
        // ✅ 取最后一次
        newValue = values[values.length - 1];
        break;
    }

    this._progress = {
      ...this._progress,
      currentValue: newValue,
    };
    this._updatedAt = Date.now();
  }

  /**
   * 删除记录
   */
  public removeRecord(recordUuid: string): void {
    const index = this._records.findIndex(r => r.uuid === recordUuid);
    if (index === -1) {
      throw new Error(`Record with uuid ${recordUuid} not found`);
    }
    this._records.splice(index, 1);
    this._updatedAt = Date.now();
    this.recalculateProgress();  // ✅ 删除后重新计算
  }
}
```

### 3. 修改后端服务

**文件**：`apps/api/src/modules/goal/application/services/GoalRecordApplicationService.ts`

```typescript
async createGoalRecord(
  goalUuid: string,
  keyResultUuid: string,
  params: {
    value: number;  // ✅ 本次记录的值
    note?: string;
    recordedAt?: number;
  }
): Promise<GoalContracts.GoalRecordClientDTO> {
  // 1. 查询目标
  const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
  if (!goal) {
    throw new Error(`Goal not found: ${goalUuid}`);
  }

  // 2. 查找关键结果
  const keyResult = goal.keyResults.find((kr) => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error(`KeyResult not found: ${keyResultUuid}`);
  }

  // 3. 创建记录实体（只需要 value）
  const record = GoalRecord.create({
    keyResultUuid,
    goalUuid,
    value: params.value,  // ✅ 本次记录的值
    note: params.note || undefined,
    recordedAt: params.recordedAt || Date.now(),
  });

  // 4. 添加到关键结果（会自动重新计算 currentValue）
  keyResult.addRecord(record.toServerDTO());

  // 5. 持久化
  await this.goalRepository.save(goal);

  // 6. 发布领域事件
  await GoalEventPublisher.publishGoalEvents(goal);

  // 7. 返回 ClientDTO（包含计算后的 currentValue）
  return record.toClientDTO(keyResult.progress.currentValue);
}
```

### 4. 修改 DTO 接口

**文件**：`packages/contracts/src/modules/goal/entities/GoalRecordServer.ts`

```typescript
export interface GoalRecordServerDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // ✅ 本次记录的值
  note: string | null;
  recordedAt: number;
  createdAt: number;
}
```

**文件**：`packages/contracts/src/modules/goal/entities/GoalRecordClient.ts`

```typescript
export interface GoalRecordClientDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  value: number;  // ✅ 本次记录的值
  calculatedCurrentValue?: number;  // ✅ 记录时计算的累计值（用于展示）
  note: string | null;
  recordedAt: number;
  createdAt: number;
  
  // UI 辅助字段
  formattedRecordedAt: string;
  formattedCreatedAt: string;
}
```

### 5. 修改前端对话框

**文件**：`apps/web/src/modules/goal/presentation/components/dialogs/GoalRecordDialog.vue`

```typescript
const handleCreateKeyResult = async () => {
  // 获取当前 KeyResult
  const currentGoal = goals.value.find((g: any) => g.uuid === propGoalUuid.value);
  if (!currentGoal) {
    console.error('未找到目标');
    return;
  }
  
  const currentKeyResult = currentGoal.keyResults.find(
    (kr: any) => kr.uuid === propKeyResultUuid.value
  );
  if (!currentKeyResult) {
    console.error('未找到关键结果');
    return;
  }

  // ✅ 直接传递用户输入的值（本次记录的值）
  await createGoalRecord(propGoalUuid.value, propKeyResultUuid.value, {
    value: localRecord.value.changeAmount,  // ✅ 用户输入的本次值
    note: localRecord.value.note,
    recordedAt: Date.now(),
  });
};
```

---

## 📊 数据流示例

### 示例 1：SUM（累加） - 跑步里程

**目标**：本月跑步 100 公里

```typescript
// 第一次记录：跑步 5 公里
{
  value: 5,  // ✅ 本次跑步 5 公里
  note: "晨跑"
}
// currentValue = 5

// 第二次记录：跑步 3 公里
{
  value: 3,  // ✅ 本次跑步 3 公里
  note: "夜跑"
}
// currentValue = 5 + 3 = 8

// 第三次记录：跑步 10 公里
{
  value: 10,  // ✅ 本次跑步 10 公里
  note: "周末长跑"
}
// currentValue = 5 + 3 + 10 = 18
```

### 示例 2：AVERAGE（平均值） - 考试成绩

**目标**：平均成绩达到 90 分

```typescript
// 第一次记录：期中考试
{
  value: 85,  // ✅ 本次考试 85 分
  note: "期中考试"
}
// currentValue = 85

// 第二次记录：期末考试
{
  value: 92,  // ✅ 本次考试 92 分
  note: "期末考试"
}
// currentValue = (85 + 92) / 2 = 88.5

// 第三次记录：补考
{
  value: 95,  // ✅ 本次考试 95 分
  note: "补考"
}
// currentValue = (85 + 92 + 95) / 3 = 90.67
```

### 示例 3：LAST（取最后一次） - 体重记录

**目标**：体重降到 65 kg

```typescript
// 第一次记录：初始体重
{
  value: 72,  // ✅ 当前体重 72 kg
  note: "开始减肥"
}
// currentValue = 72

// 第二次记录：一周后
{
  value: 70,  // ✅ 当前体重 70 kg
  note: "减了2kg"
}
// currentValue = 70 (取最后一次)

// 第三次记录：两周后
{
  value: 68,  // ✅ 当前体重 68 kg
  note: "继续加油"
}
// currentValue = 68 (取最后一次)
```

---

## 📝 数据库迁移

### 需要迁移的字段

| 旧字段 | 新字段 | 迁移策略 |
|-------|-------|---------|
| `previous_value` | - | ❌ 删除 |
| `new_value` | `value` | ✅ 保留数据 |
| `change_amount` | - | ❌ 删除 |

### 迁移 SQL

```sql
-- 1. 添加新字段
ALTER TABLE goal_records ADD COLUMN value REAL;

-- 2. 迁移数据（根据聚合方式）
UPDATE goal_records
SET value = CASE
  -- 如果是 SUM 方式，使用 change_amount
  WHEN (SELECT aggregation_method FROM key_results WHERE uuid = goal_records.key_result_uuid) = 'SUM'
    THEN change_amount
  -- 其他方式，使用 new_value
  ELSE new_value
END;

-- 3. 删除旧字段
ALTER TABLE goal_records DROP COLUMN previous_value;
ALTER TABLE goal_records DROP COLUMN new_value;
ALTER TABLE goal_records DROP COLUMN change_amount;

-- 4. 重新计算所有 KeyResult 的 currentValue
-- （需要应用层执行 recalculateProgress()）
```

---

## ✅ 优势总结

### 1. 语义清晰

| 聚合方式 | record.value 的含义 | 示例 |
|---------|-------------------|------|
| SUM | 本次增加的数量 | 跑步 5 公里 |
| AVERAGE | 本次的独立数值 | 考试 85 分 |
| MAX | 本次的独立数值 | 最高心率 180 |
| MIN | 本次的独立数值 | 最低血压 90 |
| LAST | 本次的独立数值 | 体重 70 kg |

### 2. 计算正确

```typescript
// ✅ SUM：累加所有 record.value
currentValue = records.map(r => r.value).reduce((a, b) => a + b, 0);

// ✅ AVERAGE：平均所有 record.value
currentValue = records.map(r => r.value).reduce((a, b) => a + b, 0) / records.length;

// ✅ LAST：取最后一条 record.value
currentValue = records[records.length - 1].value;
```

### 3. 删除记录安全

```typescript
// 删除中间的记录
keyResult.removeRecord(recordUuid);

// ✅ 自动重新计算，结果正确
keyResult.recalculateProgress();
```

### 4. 数据模型简洁

```typescript
// 旧模型（3 个字段）
private _previousValue: number;
private _newValue: number;
private _changeAmount: number;

// 新模型（1 个字段）
private _value: number;
```

---

## 🚀 实施步骤

1. ✅ **修改 DTO 接口**（contracts 包）
2. ✅ **修改 GoalRecord 实体**（domain-server）
3. ✅ **修改 KeyResult 实体**（domain-server）
4. ✅ **修改后端服务**（api）
5. ✅ **修改前端组件**（web）
6. ✅ **数据库迁移脚本**
7. ✅ **更新单元测试**
8. ✅ **更新文档**

---

## 📚 相关文档

- [Goal Record API 修复报告](./GOAL_RECORD_API_FIX.md)
- [Goal 模块完整流程](./docs/modules/goal/Goal模块完整流程.md)
- [DDD 实体设计原则](./docs/architecture/DDD_DESIGN_PRINCIPLES.md)

---

**设计修复时间**：2025-11-17  
**设计人员**：GitHub Copilot  
**验证状态**：⏳ 待评审
