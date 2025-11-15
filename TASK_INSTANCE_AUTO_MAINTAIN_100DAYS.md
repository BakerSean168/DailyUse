# Task 实例自动维护机制 - 100 天策略

## 📋 实施概述

实现了一个**自动维护未来 100 天内所有实例**的机制，确保：
1. **创建时**：自动生成未来 100 天的所有实例
2. **获取时**：检查并补充实例到 100 天
3. **激活时**：重新生成 100 天的实例

---

## 🎯 核心策略

### 策略说明

**维护目标**：每个 ACTIVE 状态的 TaskTemplate 始终保持**未来 100 天内的所有实例**

**触发条件**：
- ✅ **创建模板时**：立即生成 100 天实例
- ✅ **激活模板时**：立即生成 100 天实例
- ✅ **获取模板列表时**：异步检查并补充（惰性补充）
- ⏳ **后台定时任务**（可选）：每天凌晨检查所有模板

**补充阈值**：当模板的最远实例日期 < 今天 + 100 天时，自动补充到 100 天

---

## 📂 修改的文件

### 1. 配置常量

**文件**：`packages/contracts/src/modules/task/config.ts`

```typescript
export const TASK_INSTANCE_GENERATION_CONFIG = {
  /**
   * 目标提前生成天数
   * 系统会自动维护每个模板有未来 100 天内的所有实例
   */
  TARGET_GENERATE_AHEAD_DAYS: 100,

  /**
   * 补充阈值（天）
   * 当剩余实例的最远日期距离现在少于此天数时，自动补充到目标天数
   */
  REFILL_THRESHOLD_DAYS: 100,

  /**
   * 批量操作的批次大小
   */
  BATCH_SIZE: 50,
} as const;
```

**变更说明**：
- ❌ 删除：`MAX_INSTANCES_PER_TEMPLATE`（不再限制数量）
- ✅ 保留：`TARGET_GENERATE_AHEAD_DAYS` = 100（目标天数）
- ✅ 修改：`REFILL_THRESHOLD_DAYS` = 100（补充阈值）

---

### 2. 仓储接口

**文件**：`packages/domain-server/src/task/repositories/ITaskInstanceRepository.ts`

**新增方法**：
```typescript
/**
 * 统计模板的未过期实例数量
 * @param templateUuid 模板 UUID
 * @param fromDate 起始日期（默认为当前时间）
 */
countFutureInstances(templateUuid: string, fromDate?: number): Promise<number>;
```

**实现**：`apps/api/src/modules/task/infrastructure/repositories/PrismaTaskInstanceRepository.ts`

```typescript
async countFutureInstances(templateUuid: string, fromDate?: number): Promise<number> {
  const date = fromDate ? new Date(fromDate) : new Date();
  return await this.prisma.taskInstance.count({
    where: {
      templateUuid,
      instanceDate: { gte: date },
    },
  });
}
```

---

### 3. 生成服务

**文件**：`packages/domain-server/src/task/services/TaskInstanceGenerationService.ts`

#### 核心方法：`generateInstancesForTemplate()`

```typescript
/**
 * 为指定模板生成实例
 * 新策略：自动维护未来 100 天内的所有实例
 * 
 * @param template 任务模板
 * @param forceGenerate 是否强制重新生成（删除现有并重新生成）
 */
async generateInstancesForTemplate(
  template: TaskTemplate,
  forceGenerate: boolean = false,
): Promise<TaskInstance[]> {
  const now = Date.now();
  
  // 1. 如果是强制生成，删除所有未完成的实例
  if (forceGenerate) {
    const existingInstances = await this.instanceRepository.findByTemplate(template.uuid);
    const pendingUuids = existingInstances
      .filter(inst => inst.status === 'PENDING')
      .map(inst => inst.uuid);
    if (pendingUuids.length > 0) {
      await this.instanceRepository.deleteMany(pendingUuids);
    }
  }

  // 2. 计算起始日期：从上次生成日期的下一天，或从今天开始
  const fromDate = template.lastGeneratedDate
    ? template.lastGeneratedDate + 86400000
    : now;

  // 3. 计算目标结束日期：未来 100 天
  const toDate = now + TARGET_GENERATE_AHEAD_DAYS * 86400000;

  // 4. 如果起始日期已经超过目标日期，说明已经生成够了
  if (fromDate > toDate) {
    console.log(`模板已生成到 ${new Date(fromDate).toLocaleDateString()}，无需补充`);
    return [];
  }

  // 5. 生成实例
  const instances = template.generateInstances(fromDate, toDate);

  // 6. 保存实例
  if (instances.length > 0) {
    await this.instanceRepository.saveMany(instances);
    await this.templateRepository.save(template);
    console.log(`✅ 为模板生成了 ${instances.length} 个实例`);
  }

  return instances;
}
```

#### 新增方法：`checkAndRefillInstances()`

```typescript
/**
 * 检查并补充模板的实例
 * 当最远实例的日期 < 今天 + 100 天时，自动补充
 */
async checkAndRefillInstances(templateUuid: string): Promise<void> {
  const template = await this.templateRepository.findByUuid(templateUuid);
  if (!template || template.status !== 'ACTIVE') {
    return;
  }

  const now = Date.now();
  const targetDate = now + TARGET_GENERATE_AHEAD_DAYS * 86400000;
  
  // 检查最远实例的日期
  const lastGenerated = template.lastGeneratedDate || 0;
  const daysRemaining = Math.floor((lastGenerated - now) / 86400000);
  
  // 如果剩余天数少于阈值，触发补充
  if (daysRemaining < REFILL_THRESHOLD_DAYS) {
    console.log(`🔄 模板实例只到 ${new Date(lastGenerated).toLocaleDateString()}（还有 ${daysRemaining} 天），开始补充...`);
    await this.generateInstancesForTemplate(template, false);
  }
}
```

---

### 4. 应用服务

**文件**：`apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts`

#### 修改：创建时生成实例

```typescript
async createTaskTemplate(params: {...}): Promise<TaskTemplateServerDTO> {
  const template = TaskTemplate.create({...});
  await this.templateRepository.save(template);

  // 🔥 如果状态是 ACTIVE，立即生成初始实例
  if (template.status === TaskTemplateStatus.ACTIVE) {
    console.log(`模板 "${template.title}" 已创建，开始生成初始实例...`);
    await this.generateInitialInstances(template);
  }

  return template.toClientDTO();
}

private async generateInitialInstances(template: TaskTemplate): Promise<void> {
  try {
    await this.generationService.generateInstancesForTemplate(template);
    console.log(`✅ 模板 "${template.title}" 初始实例生成完成`);
  } catch (error) {
    console.error(`❌ 模板 "${template.title}" 初始实例生成失败:`, error);
  }
}
```

#### 修改：激活时生成实例

```typescript
async activateTaskTemplate(uuid: string): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  template.activate();
  await this.templateRepository.save(template);

  // 🔥 激活后立即生成实例
  console.log(`模板 "${template.title}" 已激活，开始生成实例...`);
  await this.generateInitialInstances(template);

  return template.toClientDTO();
}
```

#### 新增：获取时检查并补充

```typescript
/**
 * 根据账户获取任务模板列表
 * 获取时自动检查并补充实例
 */
async getTaskTemplatesByAccount(
  accountUuid: string,
): Promise<TaskTemplateServerDTO[]> {
  const templates = await this.templateRepository.findByAccount(accountUuid);
  
  // 🔥 自动检查并补充每个 ACTIVE 模板的实例
  for (const template of templates) {
    if (template.status === TaskTemplateStatus.ACTIVE) {
      this.checkAndRefillInstances(template.uuid).catch((error) => {
        console.error(`❌ 补充模板 "${template.title}" 实例失败:`, error);
      });
    }
  }
  
  return templates.map((t) => t.toClientDTO());
}

/**
 * 获取活跃的任务模板
 * 获取时自动检查并补充实例
 */
async getActiveTaskTemplates(
  accountUuid: string,
): Promise<TaskTemplateServerDTO[]> {
  const templates = await this.templateRepository.findActiveTemplates(accountUuid);
  
  // 🔥 自动检查并补充每个模板的实例
  for (const template of templates) {
    this.checkAndRefillInstances(template.uuid).catch((error) => {
      console.error(`❌ 补充模板 "${template.title}" 实例失败:`, error);
    });
  }
  
  return templates.map((t) => t.toClientDTO());
}

/**
 * 检查并补充模板实例（异步执行，不阻塞返回）
 */
private async checkAndRefillInstances(templateUuid: string): Promise<void> {
  try {
    await this.generationService.checkAndRefillInstances(templateUuid);
  } catch (error) {
    console.error(`❌ [TaskTemplateApplicationService] 补充实例失败:`, error);
  }
}
```

**设计说明**：
- 使用 `.catch()` 异步执行，不阻塞 API 返回
- 如果补充失败，记录错误但不影响用户获取模板列表
- 用户下次获取时会再次尝试补充

---

## 🔄 完整流程

### 流程 1：创建 TaskTemplate

```
用户创建 TaskTemplate
    ↓
status = ACTIVE (默认)
    ↓
保存到数据库
    ↓
检查状态 === ACTIVE
    ↓
调用 generateInitialInstances()
    ↓
计算日期范围：今天 → 今天 + 100 天
    ↓
生成所有实例（每日任务、每周任务等）
    ↓
保存实例到数据库
    ↓
✅ 完成
```

**示例**：
- 今天：2025-11-15
- 生成范围：2025-11-15 → 2026-02-23（100 天）
- 每日任务：生成 100 个实例
- 每周任务：生成 ~14 个实例
- 每月任务：生成 ~3 个实例

---

### 流程 2：获取模板列表时自动补充

```
用户请求 GET /api/task/templates
    ↓
查询所有模板
    ↓
返回模板列表给用户
    ↓
异步遍历 ACTIVE 模板
    ↓
检查每个模板的 lastGeneratedDate
    ↓
如果 lastGeneratedDate < 今天 + 100 天
    ↓
补充实例到 今天 + 100 天
    ↓
✅ 后台静默补充，不阻塞用户
```

**示例**：
- 今天：2025-11-20（5 天后）
- 模板 A 的 lastGeneratedDate：2026-01-15（还有 56 天）
- 判断：56 天 < 100 天阈值
- 操作：补充实例到 2026-02-28（100 天）

---

### 流程 3：激活暂停的模板

```
用户激活模板（PAUSED → ACTIVE）
    ↓
调用 template.activate()
    ↓
保存状态到数据库
    ↓
调用 generateInitialInstances()
    ↓
生成未来 100 天的实例
    ↓
✅ 完成
```

---

## 📊 数据示例

### 示例 1：每日任务

**模板配置**：
- 标题：每日晨跑
- 重复规则：每天
- 开始日期：2025-11-15

**生成结果**（创建时）：
```
2025-11-15  → TaskInstance (PENDING)
2025-11-16  → TaskInstance (PENDING)
2025-11-17  → TaskInstance (PENDING)
...
2026-02-22  → TaskInstance (PENDING)
2026-02-23  → TaskInstance (PENDING)
```
**总计**：100 个实例

---

### 示例 2：每周任务

**模板配置**：
- 标题：周报撰写
- 重复规则：每周五
- 开始日期：2025-11-15

**生成结果**（创建时）：
```
2025-11-15 (周五) → TaskInstance (PENDING)
2025-11-22 (周五) → TaskInstance (PENDING)
2025-11-29 (周五) → TaskInstance (PENDING)
...
2026-02-13 (周五) → TaskInstance (PENDING)
2026-02-20 (周五) → TaskInstance (PENDING)
```
**总计**：~14 个实例

---

### 示例 3：补充逻辑

**初始状态**（2025-11-15 创建）：
- lastGeneratedDate：2026-02-23
- 实例范围：2025-11-15 ~ 2026-02-23（100 天）

**5 天后**（2025-11-20）：
- 今天：2025-11-20
- lastGeneratedDate：2026-02-23
- 剩余天数：(2026-02-23 - 2025-11-20) = 95 天
- 判断：95 天 < 100 天阈值
- 操作：补充实例到 2026-02-28（100 天）

**10 天后**（2025-11-25）：
- 今天：2025-11-25
- lastGeneratedDate：2026-02-28（上次补充）
- 剩余天数：(2026-02-28 - 2025-11-25) = 95 天
- 判断：95 天 < 100 天阈值
- 操作：补充实例到 2026-03-05（100 天）

---

## ✅ 优势

1. **自动化**：无需手动干预，系统自动维护
2. **惰性补充**：用户获取时才检查，按需补充
3. **不阻塞**：补充操作异步执行，不影响 API 响应速度
4. **灵活性**：可以根据需要调整 `TARGET_GENERATE_AHEAD_DAYS` 配置
5. **资源高效**：只维护 100 天的实例，不会无限增长

---

## ⚠️ 注意事项

1. **过期实例不删除**：已过期的实例会保留（方便查看历史）
2. **强制重新生成**：调用 `generateInstancesForTemplate(template, true)` 会删除所有 PENDING 实例并重新生成
3. **非重复任务**：一次性任务不会生成多个实例
4. **状态检查**：只为 `ACTIVE` 状态的模板维护实例

---

## 🔮 后续改进建议

### 1. 后台定时任务（可选）

如果担心用户长时间不访问系统，可以添加后台定时任务：

```typescript
// apps/api/src/shared/schedulers/taskScheduler.ts
import cron from 'node-cron';
import { TaskContainer } from '../../modules/task/infrastructure/di/TaskContainer';

export function setupTaskScheduler(): void {
  // 每天凌晨 3 点执行
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 [定时任务] 开始检查并生成任务实例');
    const generationService = TaskContainer.getInstance().resolve('TaskInstanceGenerationService');
    await generationService.checkAndGenerateInstances();
  });
}
```

### 2. 清理过期实例（可选）

定期清理 N 天前的已完成/跳过实例：

```typescript
async cleanupOldInstances(beforeDate: number): Promise<void> {
  // 删除 beforeDate 之前的已完成/跳过实例
  await this.instanceRepository.deleteOldCompletedInstances(beforeDate);
}
```

### 3. 监控和告警

添加监控指标：
- 实例生成失败率
- 补充延迟时间
- 模板实例覆盖率

---

## 📝 总结

**核心策略**：
- ✅ **100 天策略**：维护未来 100 天内的所有实例
- ✅ **惰性补充**：获取时检查，按需补充
- ✅ **自动生成**：创建/激活时立即生成

**实施完成**：
- ✅ 配置常量
- ✅ 仓储接口（countFutureInstances）
- ✅ 生成服务逻辑
- ✅ 应用服务集成
- ✅ 创建时生成
- ✅ 激活时生成
- ✅ 获取时补充

**测试建议**：
1. 创建每日任务，验证生成 100 个实例
2. 创建每周任务，验证生成 ~14 个实例
3. 等待几天后获取模板列表，验证自动补充
4. 暂停再激活模板，验证重新生成

---

**实施日期**：2025-11-15  
**实施状态**：✅ 已完成
