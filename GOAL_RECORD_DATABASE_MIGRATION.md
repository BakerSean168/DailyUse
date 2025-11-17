# Goal Record 数据库迁移指南

## 📋 概述

本文档说明如何将 **GoalRecord** 数据模型从旧设计（3 个字段）迁移到新设计（1 个字段）。

## 🎯 迁移目标

将 `goal_records` 表从：

```sql
-- 旧结构（❌ 错误）
goal_records (
  uuid,
  key_result_uuid,
  previous_value,  -- ❌ 删除
  value,           -- ✅ 保留（但语义改变）
  ...
)
```

迁移到：

```sql
-- 新结构（✅ 正确）
goal_records (
  uuid,
  key_result_uuid,
  value,  -- ✅ 本次记录的独立值
  ...
)
```

## 📊 当前状态

### Electron (Desktop) - SQLite ✅

**文件**：`apps/desktop/src/main/shared/database/goalTables.ts`

**状态**：✅ 已经是新结构

```sql
CREATE TABLE IF NOT EXISTS goal_records (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  goal_uuid TEXT NOT NULL,
  key_result_uuid TEXT,
  value REAL,  -- ✅ 只有一个 value 字段
  notes TEXT,
  ...
)
```

**不需要迁移**：表结构已经正确。

---

### Web/API - PostgreSQL ❌

**文件**：`apps/api/prisma/schema.prisma`

**状态**：❌ 还是旧结构

```prisma
model goalRecord {
  uuid          String    @id
  keyResultUuid String    @map("key_result_uuid")
  previousValue Float     @default(0) @map("previous_value")  // ❌ 需要删除
  value         Float                                         // ✅ 保留（语义改变）
  note          String?
  recordedAt    DateTime  @map("recorded_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  keyResult     keyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)

  @@index([recordedAt])
  @@map("goal_records")
}
```

**需要迁移**：

1. 修改 Prisma schema
2. 创建数据库迁移脚本
3. 修复 `PrismaGoalRepository.ts` 中的字段映射
4. 重新计算所有 KeyResult 的 `currentValue`

---

## 🔧 迁移步骤（Web/API）

### Step 1: 修改 Prisma Schema

**文件**：`apps/api/prisma/schema.prisma`

```prisma
model goalRecord {
  uuid          String    @id
  keyResultUuid String    @map("key_result_uuid")
  value         Float  // ✅ 本次记录的独立值
  note          String?
  recordedAt    DateTime  @map("recorded_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  keyResult     keyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)

  @@index([recordedAt])
  @@map("goal_records")
}
```

**变更说明**：

- ❌ 删除 `previousValue` 字段
- ✅ 保留 `value` 字段（语义改变：从"累计值"改为"本次记录的独立值"）

---

### Step 2: 创建数据库迁移脚本

**命令**：

```bash
cd /home/sean/my_program/DailyUse/apps/api
npx prisma migrate dev --name remove_goal_record_previous_value
```

**生成的迁移文件** (自动创建):

`apps/api/prisma/migrations/YYYYMMDDHHMMSS_remove_goal_record_previous_value/migration.sql`

**迁移SQL内容**：

```sql
-- Step 1: 备份现有数据
CREATE TEMP TABLE goal_records_backup AS 
SELECT * FROM goal_records;

-- Step 2: 数据迁移逻辑
-- 根据 aggregation_method 决定如何迁移 value
UPDATE goal_records gr
SET value = CASE
  -- SUM 模式：value 应该是本次增量（而不是累计值）
  WHEN (
    SELECT kr.aggregation_method 
    FROM key_results kr 
    WHERE kr.uuid = gr.key_result_uuid
  ) = 'SUM'
  THEN COALESCE(gr.value - gr.previous_value, gr.value)
  
  -- 其他模式（AVERAGE/LAST/MAX/MIN）：value 应该是本次记录的独立值
  ELSE gr.value
END;

-- Step 3: 删除 previous_value 列
ALTER TABLE "goal_records" DROP COLUMN "previous_value";

-- Step 4: 验证数据
-- 检查是否有 NULL 值
SELECT COUNT(*) FROM goal_records WHERE value IS NULL;
```

---

### Step 3: 修复 PrismaGoalRepository.ts

**文件**：`apps/api/src/modules/goal/infrastructure/repositories/PrismaGoalRepository.ts`

#### 3.1 修复 `mapToEntity` 方法

**旧代码**（Line 124-136）：

```typescript
// ❌ 错误：使用旧字段
keyResult.addRecord({
  uuid: recordData.uuid,
  keyResultUuid: krData.uuid,
  goalUuid: data.uuid,
  previousValue: recordData.previousValue || 0,  // ❌ 删除
  newValue: recordData.value,                     // ❌ 删除
  changeAmount: recordData.value - (recordData.previousValue || 0),  // ❌ 删除
  note: recordData.note,
  recordedAt: recordData.recordedAt instanceof Date 
    ? recordData.recordedAt.getTime() 
    : recordData.recordedAt,
  createdAt: recordData.recordedAt instanceof Date 
    ? recordData.createdAt.getTime() 
    : recordData.createdAt,
});
```

**新代码**：

```typescript
// ✅ 正确：使用新字段
keyResult.addRecord({
  uuid: recordData.uuid,
  keyResultUuid: krData.uuid,
  goalUuid: data.uuid,
  value: recordData.value,  // ✅ 本次记录的独立值
  note: recordData.note,
  recordedAt: recordData.recordedAt instanceof Date 
    ? recordData.recordedAt.getTime() 
    : recordData.recordedAt,
  createdAt: recordData.createdAt instanceof Date 
    ? recordData.createdAt.getTime() 
    : recordData.createdAt,
});
```

#### 3.2 修复 `save` 方法

**旧代码**（Line 242-262）：

```typescript
// ❌ 错误：保存旧字段
await (this.prisma as any).goalRecord.upsert({
  where: { uuid: record.uuid },
  create: {
    uuid: record.uuid,
    previousValue: record.previousValue ?? 0,  // ❌ 删除
    value: record.newValue ?? 0,               // ❌ 错误：应该是 record.value
    note: record.note || null,
    recordedAt: new Date(record.recordedAt),
    createdAt: new Date(record.createdAt),
    keyResult: {
      connect: { uuid: kr.uuid },
    },
  },
  update: {
    previousValue: record.previousValue ?? 0,  // ❌ 删除
    value: record.newValue ?? 0,               // ❌ 错误：应该是 record.value
    note: record.note || null,
    recordedAt: new Date(record.recordedAt),
  },
});
```

**新代码**：

```typescript
// ✅ 正确：保存新字段
await (this.prisma as any).goalRecord.upsert({
  where: { uuid: record.uuid },
  create: {
    uuid: record.uuid,
    value: record.value,  // ✅ 本次记录的独立值
    note: record.note || null,
    recordedAt: new Date(record.recordedAt),
    createdAt: new Date(record.createdAt),
    keyResult: {
      connect: { uuid: kr.uuid },
    },
  },
  update: {
    value: record.value,  // ✅ 本次记录的独立值
    note: record.note || null,
    recordedAt: new Date(record.recordedAt),
  },
});
```

---

### Step 4: 重新生成 Prisma Client

**命令**：

```bash
cd /home/sean/my_program/DailyUse/apps/api
npx prisma generate
```

**作用**：

- 根据新的 schema 重新生成 TypeScript 类型
- 删除 `previousValue` 字段的类型定义

---

### Step 5: 重新计算所有 KeyResult 的 currentValue

由于迁移后，某些 KeyResult 的 `currentValue` 可能不正确（尤其是 SUM 模式），需要重新计算。

**方案 A：应用层脚本**

创建一次性脚本：`apps/api/src/scripts/recalculate-goal-progress.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { KeyResult } from '@dailyuse/domain-server/goal/entities/KeyResult';

const prisma = new PrismaClient();

async function recalculateAllGoalProgress() {
  console.log('🔄 开始重新计算所有 KeyResult 的 currentValue...');

  // 1. 获取所有 KeyResult（包含 records）
  const keyResults = await prisma.keyResult.findMany({
    include: {
      goalRecord: true,
    },
  });

  console.log(`📊 找到 ${keyResults.length} 个 KeyResult`);

  // 2. 逐个重新计算
  for (const kr of keyResults) {
    const records = kr.goalRecord || [];
    
    if (records.length === 0) {
      console.log(`⏭️  KeyResult ${kr.uuid} 没有记录，跳过`);
      continue;
    }

    // 3. 根据聚合方式计算 currentValue
    const values = records.map(r => r.value);
    let newCurrentValue: number;

    switch (kr.aggregationMethod) {
      case 'SUM':
        newCurrentValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'AVERAGE':
        newCurrentValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case 'MAX':
        newCurrentValue = Math.max(...values);
        break;
      case 'MIN':
        newCurrentValue = Math.min(...values);
        break;
      case 'LAST':
        newCurrentValue = values[values.length - 1];
        break;
      default:
        console.warn(`⚠️  KeyResult ${kr.uuid} 使用未知的聚合方式: ${kr.aggregationMethod}`);
        continue;
    }

    // 4. 更新数据库
    await prisma.keyResult.update({
      where: { uuid: kr.uuid },
      data: { currentValue: newCurrentValue },
    });

    console.log(`✅ KeyResult ${kr.uuid}: ${kr.currentValue} → ${newCurrentValue} (${kr.aggregationMethod})`);
  }

  console.log('✨ 重新计算完成！');
  await prisma.$disconnect();
}

recalculateAllGoalProgress().catch(console.error);
```

**运行**：

```bash
cd /home/sean/my_program/DailyUse/apps/api
ts-node src/scripts/recalculate-goal-progress.ts
```

---

**方案 B：SQL 脚本** （更快）

```sql
-- 更新所有 KeyResult 的 currentValue

-- SUM 模式
UPDATE key_results kr
SET current_value = (
  SELECT COALESCE(SUM(gr.value), 0)
  FROM goal_records gr
  WHERE gr.key_result_uuid = kr.uuid
)
WHERE kr.aggregation_method = 'SUM';

-- AVERAGE 模式
UPDATE key_results kr
SET current_value = (
  SELECT COALESCE(AVG(gr.value), 0)
  FROM goal_records gr
  WHERE gr.key_result_uuid = kr.uuid
)
WHERE kr.aggregation_method = 'AVERAGE';

-- MAX 模式
UPDATE key_results kr
SET current_value = (
  SELECT COALESCE(MAX(gr.value), 0)
  FROM goal_records gr
  WHERE gr.key_result_uuid = kr.uuid
)
WHERE kr.aggregation_method = 'MAX';

-- MIN 模式
UPDATE key_results kr
SET current_value = (
  SELECT COALESCE(MIN(gr.value), 0)
  FROM goal_records gr
  WHERE gr.key_result_uuid = kr.uuid
)
WHERE kr.aggregation_method = 'MIN';

-- LAST 模式
UPDATE key_results kr
SET current_value = (
  SELECT gr.value
  FROM goal_records gr
  WHERE gr.key_result_uuid = kr.uuid
  ORDER BY gr.recorded_at DESC
  LIMIT 1
)
WHERE kr.aggregation_method = 'LAST';
```

---

## 📝 迁移检查清单

### 准备阶段

- [ ] 备份生产环境数据库
- [ ] 在开发/测试环境验证迁移脚本
- [ ] 确认所有开发者已更新代码

### Schema 修改

- [ ] 修改 `apps/api/prisma/schema.prisma`
  - [ ] 删除 `previousValue` 字段
  - [ ] 保留 `value` 字段
- [ ] 运行 `npx prisma migrate dev`
- [ ] 运行 `npx prisma generate`

### 代码修改

- [ ] 修复 `PrismaGoalRepository.ts` - `mapToEntity` 方法
- [ ] 修复 `PrismaGoalRepository.ts` - `save` 方法
- [ ] 编译验证：`pnpm build --filter @dailyuse/api`

### 数据迁移

- [ ] 运行数据迁移脚本
- [ ] 重新计算所有 KeyResult 的 `currentValue`
- [ ] 验证数据正确性

### 测试验证

- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 手动测试添加记录功能
- [ ] 手动测试删除记录后重新计算

---

## 🚨 注意事项

### 1. 数据迁移的风险

**SUM 模式**：

如果数据库中已经存储了错误的数据（`value` 是累计值而不是增量），迁移后：

```sql
-- 假设旧数据
record1: previous_value = 0,  value = 5   (第一次记录)
record2: previous_value = 5,  value = 10  (第二次记录)
record3: previous_value = 10, value = 15  (第三次记录)

-- 迁移后（使用 value - previous_value）
record1: value = 5   (5 - 0 = 5)   ✅ 正确
record2: value = 5   (10 - 5 = 5)  ✅ 正确
record3: value = 5   (15 - 10 = 5) ✅ 正确

-- 重新计算 currentValue
SUM(5, 5, 5) = 15  ✅ 正确
```

**AVERAGE 模式**：

```sql
-- 假设旧数据（value 已经是正确的独立值）
record1: previous_value = 0,  value = 85
record2: previous_value = 0,  value = 90
record3: previous_value = 0,  value = 88

-- 迁移后（直接使用 value）
record1: value = 85  ✅ 正确
record2: value = 90  ✅ 正确
record3: value = 88  ✅ 正确

-- 重新计算 currentValue
AVERAGE(85, 90, 88) = 87.67  ✅ 正确
```

### 2. 向后兼容性

迁移完成后，**不能回滚**，因为：

- 删除了 `previous_value` 列
- 无法从新数据恢复 `previous_value`

**建议**：

- 保留数据库备份至少 30 天
- 在生产环境迁移前，先在测试环境验证

### 3. 迁移期间的停机时间

**预估**：

- 小型数据库（< 1000 条记录）：< 1 分钟
- 中型数据库（1000-10000 条记录）：1-5 分钟
- 大型数据库（> 10000 条记录）：5-30 分钟

**建议**：

- 选择业务低峰期进行迁移
- 提前通知用户

---

## 📊 验证方法

### 1. 数据完整性验证

```sql
-- 检查是否有 NULL 值
SELECT COUNT(*) as null_value_count
FROM goal_records
WHERE value IS NULL;

-- 应该返回 0
```

### 2. 计算正确性验证

```sql
-- 随机选择 5 个 KeyResult 验证
SELECT 
  kr.uuid,
  kr.aggregation_method,
  kr.current_value as stored_value,
  CASE
    WHEN kr.aggregation_method = 'SUM' THEN (
      SELECT COALESCE(SUM(gr.value), 0)
      FROM goal_records gr
      WHERE gr.key_result_uuid = kr.uuid
    )
    WHEN kr.aggregation_method = 'AVERAGE' THEN (
      SELECT COALESCE(AVG(gr.value), 0)
      FROM goal_records gr
      WHERE gr.key_result_uuid = kr.uuid
    )
    WHEN kr.aggregation_method = 'LAST' THEN (
      SELECT gr.value
      FROM goal_records gr
      WHERE gr.key_result_uuid = kr.uuid
      ORDER BY gr.recorded_at DESC
      LIMIT 1
    )
  END as calculated_value
FROM key_results kr
WHERE kr.uuid IN (
  SELECT uuid FROM key_results ORDER BY RANDOM() LIMIT 5
);

-- stored_value 应该等于 calculated_value
```

### 3. 功能测试

```bash
# 1. 测试添加记录（SUM 模式）
curl -X POST http://localhost:3000/api/goals/{goalUuid}/key-results/{keyResultUuid}/records \
  -H "Content-Type: application/json" \
  -d '{"value": 5, "note": "测试记录"}'

# 2. 验证 currentValue 是否正确增加
curl http://localhost:3000/api/goals/{goalUuid}

# 3. 删除记录
curl -X DELETE http://localhost:3000/api/goals/{goalUuid}/key-results/{keyResultUuid}/records/{recordUuid}

# 4. 验证 currentValue 是否正确减少
curl http://localhost:3000/api/goals/{goalUuid}
```

---

## 🎉 迁移完成标志

- ✅ Prisma schema 已更新
- ✅ 数据库迁移已执行
- ✅ `PrismaGoalRepository.ts` 已修复
- ✅ 编译通过（无类型错误）
- ✅ 所有单元测试通过
- ✅ 数据完整性验证通过
- ✅ 计算正确性验证通过
- ✅ 功能测试通过

---

**迁移文档创建时间**：2025-11-17  
**迁移负责人**：GitHub Copilot  
**验证状态**：⏳ 待执行
