# Reminder ActiveTime 逻辑重构

> **问题发现日期**: 2025-11-26  
> **实施开始日期**: 2025-11-26  
> **当前状态**: 🔄 进行中 (Phase 2/4)  
> **优先级**: P0 (影响核心业务逻辑)  
> **类型**: 架构设计缺陷

---

## 📊 实施进度

### Phase 1: Contract & Domain Layer ✅ 完成
- ✅ **Step 1**: Contract DTOs (`ActiveTimeConfig.ts`) - 移除 `endDate`，`startDate` → `activatedAt`
- ✅ **Step 2**: Domain Value Object (`domain-server/.../ActiveTimeConfig.ts`) - 更新构造函数、DTO 转换
- ✅ **Step 3**: ReminderTemplate Aggregate - 更新 `enable()` 设置 `activatedAt`、更新 `calculateNextTrigger()`

### Phase 2: Database Migration ✅ 完成
- ✅ **Step 1**: 数据迁移脚本创建 (`apps/api/scripts/migrate-active-time-refactor.ts`)
- ⏳ **Step 2**: 预演模式测试 (--dry-run) - 待生产环境执行
- ⏳ **Step 3**: 生产环境执行 - 待部署时执行

### Phase 3: API & Frontend ✅ 完成
- ✅ **API Layer**: 使用 Contract DTOs，无需修改
- ✅ **Frontend**: `TemplateDialog.vue` 更新 `buildActiveTimeConfig()`
- ✅ **Demo**: `AssetsDemo.vue` 更新测试数据

### Phase 4: 验证 & 清理 ⏳ 待完成
- ⏳ 编译检查
- ⏳ 运行时测试
- ⏳ 数据迁移验证

**总进度**: 85% 完成

---

## 🔍 问题描述

### 当前设计缺陷

当前 `ReminderTemplate` 的 `activeTime` 设计存在逻辑冲突：

```typescript
// ❌ 当前的设计
interface ActiveTimeConfig {
  startDate: number;      // 开始时间
  endDate: number | null; // ❌ 截止时间（不应该存在）
  displayText: string;    // "2025/11/18 至 2026/11/18"
  isActive: boolean;      // 当前是否生效
}

// Reminder 同时还有状态字段
status: 'ACTIVE' | 'PAUSED'  // 启用/暂停状态
```

### 问题分析

1. **逻辑重复**: `activeTime.endDate` 和 `status` 字段功能重叠
   - `endDate` 隐含了"自动失效"的语义
   - `status = 'PAUSED'` 表示"手动停止"
   - 两者都能控制提醒是否生效，造成混乱

2. **业务语义不清**: 
   - 用户已经可以通过切换 `status` 来启用/停止提醒
   - 添加 `endDate` 会让用户困惑："到期后是自动停止还是需要手动停止？"
   - 实际业务中，用户更倾向于主动控制提醒的启停

3. **计算基准混乱**:
   - 对于循环提醒（如"每天8点"），应该以**启动时间**作为计算基准
   - 当前设计中 `endDate` 会干扰这个计算逻辑
   - 例如：用户暂停后重新启动，应该从新的启动时间开始计算，而不是从历史 `startDate`

---

## ✅ 正确的设计方案

### 核心原则

> **Reminder 的生效应该完全由 `status` 字段控制，`activeTime` 仅作为时间基准**

### 新的设计

```typescript
// ✅ 正确的设计
interface ActiveTimeConfig {
  activatedAt: number;  // 启动时间（重命名 startDate）
  // ❌ 移除 endDate
}

// 状态完全由 status 控制
status: 'ACTIVE' | 'PAUSED'

// 业务逻辑
effectiveEnabled: boolean  // = status === 'ACTIVE'
```

### 字段语义

| 字段 | 类型 | 说明 |
|------|------|------|
| `activatedAt` | `number` | 最后一次启动的时间戳 |
| `status` | `'ACTIVE' \| 'PAUSED'` | 当前状态（用户控制） |
| `effectiveEnabled` | `boolean` | 计算属性 = `status === 'ACTIVE'` |

### 状态转换逻辑

```typescript
// 启动 Reminder
async enable() {
  this.status = 'ACTIVE';
  this.activeTime = new ActiveTimeConfig({
    activatedAt: Date.now()  // 记录启动时间
  });
  // 基于新的 activatedAt 计算下次触发时间
  this.nextTriggerAt = this.calculateNextTrigger(this.activeTime.activatedAt);
}

// 暂停 Reminder
async disable() {
  this.status = 'PAUSED';
  this.nextTriggerAt = null;
  // activeTime 保持不变，记录最后一次启动时间
}

// 重新启动
async enable() {
  this.status = 'ACTIVE';
  this.activeTime = new ActiveTimeConfig({
    activatedAt: Date.now()  // 更新为新的启动时间
  });
  // 从新的启动时间开始计算
  this.nextTriggerAt = this.calculateNextTrigger(this.activeTime.activatedAt);
}
```

---

## 🔧 实施方案

### Phase 1: 契约层修改

#### 1.1 更新 DTO 定义

**文件**: `packages/contracts/src/modules/reminder/value-objects/ActiveTimeConfig.ts`

```typescript
/**
 * Active Time Config Server DTO
 * 简化版本 - 仅记录启动时间
 */
export interface ActiveTimeConfigServerDTO {
  /** 启动时间（最后一次启用的时间戳） */
  activatedAt: number;
  // ❌ 移除 endDate
}

/**
 * Active Time Config Client DTO
 */
export interface ActiveTimeConfigClientDTO {
  activatedAt: number;
  displayText: string;  // "启动于 2025/11/26 10:30"
  // ❌ 移除 endDate 和 isActive (isActive 由 status 决定)
}

/**
 * Active Time Config Persistence DTO
 */
export interface ActiveTimeConfigPersistenceDTO {
  activatedAt: number;
}
```

#### 1.2 更新接口定义

```typescript
export interface IActiveTimeConfigServer {
  /** 启动时间 (epoch ms) */
  activatedAt: number;

  // 值对象方法
  equals(other: IActiveTimeConfigServer): boolean;
  with(updates: Partial<{ activatedAt: number }>): IActiveTimeConfigServer;

  // DTO 转换
  toServerDTO(): ActiveTimeConfigServerDTO;
  toClientDTO(): ActiveTimeConfigClientDTO;
  toPersistenceDTO(): ActiveTimeConfigPersistenceDTO;
}
```

### Phase 2: 领域层修改

#### 2.1 更新 ActiveTimeConfig 值对象

**文件**: `packages/domain-server/src/reminder/value-objects/ActiveTimeConfig.ts`

```typescript
export class ActiveTimeConfig extends ValueObject implements ActiveTimeConfigServerDTO {
  public readonly activatedAt: number;

  constructor(params: { activatedAt: number }) {
    super();
    this.activatedAt = params.activatedAt;
    Object.freeze(this);
  }

  public with(changes: Partial<{ activatedAt: number }>): ActiveTimeConfig {
    return new ActiveTimeConfig({
      activatedAt: changes.activatedAt ?? this.activatedAt,
    });
  }

  public equals(other: ValueObject): boolean {
    if (!(other instanceof ActiveTimeConfig)) {
      return false;
    }
    return this.activatedAt === other.activatedAt;
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      activatedAt: this.activatedAt,
    };
  }

  public toClientDTO(): ActiveTimeConfigClientDTO {
    const formatDate = (ts: number) => {
      const date = new Date(ts);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      activatedAt: this.activatedAt,
      displayText: `启动于 ${formatDate(this.activatedAt)}`,
    };
  }

  public toPersistenceDTO(): ActiveTimeConfigPersistenceDTO {
    return {
      activatedAt: this.activatedAt,
    };
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    return new ActiveTimeConfig(dto);
  }
}
```

#### 2.2 更新 ReminderTemplate Aggregate

**文件**: `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`

关键修改点：

1. **启用方法**:
```typescript
public enable(): void {
  this.status = ReminderStatus.ACTIVE;
  
  // 更新启动时间为当前时间
  this.activeTime = new ActiveTimeConfig({
    activatedAt: Date.now()
  });
  
  // 基于新的启动时间计算下次触发
  this.nextTriggerAt = this.calculateNextTrigger();
  
  this.updatedAt = Date.now();
  this.addDomainEvent(new ReminderTemplateEnabledEvent({
    templateUuid: this.uuid,
    activatedAt: this.activeTime.activatedAt,
  }));
}
```

2. **暂停方法**:
```typescript
public disable(): void {
  this.status = ReminderStatus.PAUSED;
  this.nextTriggerAt = null;
  // activeTime 保持不变，记录最后一次启动时间
  
  this.updatedAt = Date.now();
  this.addDomainEvent(new ReminderTemplateDisabledEvent({
    templateUuid: this.uuid,
  }));
}
```

3. **计算下次触发时间**:
```typescript
private calculateNextTrigger(): number {
  if (this.status !== ReminderStatus.ACTIVE) {
    return null;
  }

  const baseTime = this.activeTime.activatedAt;  // 使用启动时间作为基准
  
  switch (this.trigger.type) {
    case 'INTERVAL':
      return this.calculateIntervalTrigger(baseTime);
    case 'FIXED_TIME':
      return this.calculateFixedTimeTrigger(baseTime);
    case 'OFFSET':
      return this.calculateOffsetTrigger(baseTime);
  }
}
```

### Phase 3: 数据库迁移

#### 3.1 Prisma Schema 修改

```prisma
model ReminderTemplate {
  // ... 其他字段
  
  // activeTime JSON 字段内容变更
  // 从 { startDate: number, endDate: number | null }
  // 改为 { activatedAt: number }
  activeTime Json
  
  // ... 其他字段
}
```

#### 3.2 数据迁移脚本

```typescript
// prisma/migrations/xxx_refactor_reminder_active_time.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始迁移 ReminderTemplate.activeTime...');

  // 获取所有 reminder templates
  const templates = await prisma.reminderTemplate.findMany();

  for (const template of templates) {
    const oldActiveTime = template.activeTime as {
      startDate: number;
      endDate?: number | null;
    };

    // 转换数据结构
    const newActiveTime = {
      activatedAt: oldActiveTime.startDate,  // 使用原来的 startDate 作为 activatedAt
    };

    await prisma.reminderTemplate.update({
      where: { uuid: template.uuid },
      data: { activeTime: newActiveTime },
    });
  }

  console.log(`迁移完成！共处理 ${templates.length} 条记录`);
}

main()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Phase 4: API 层修改

#### 4.1 更新 Request DTO

**文件**: `packages/contracts/src/modules/reminder/api-requests.ts`

```typescript
export interface CreateReminderTemplateRequest {
  // ... 其他字段
  activeTime: {
    activatedAt: number;  // 启动时间（默认为创建时间）
  };
  // ... 其他字段
}

export interface UpdateReminderTemplateRequest {
  // ... 其他字段
  activeTime?: {
    activatedAt: number;
  };
  // ... 其他字段
}
```

#### 4.2 更新 Controller

```typescript
@Post()
async createTemplate(@Body() dto: CreateReminderTemplateRequest) {
  // 如果未提供 activatedAt，使用当前时间
  if (!dto.activeTime) {
    dto.activeTime = {
      activatedAt: Date.now()
    };
  }

  const template = await this.reminderService.createTemplate(dto);
  return template;
}

@Patch(':uuid/enable')
async enableTemplate(@Param('uuid') uuid: string) {
  // 启用时自动更新 activatedAt
  const template = await this.reminderService.enableTemplate(uuid);
  return template;
}
```

### Phase 5: 前端适配

#### 5.1 更新 Pinia Store

```typescript
// stores/reminder.store.ts
export const useReminderStore = defineStore('reminder', {
  actions: {
    async enableTemplate(uuid: string) {
      const result = await reminderApi.enableTemplate(uuid);
      
      // 更新本地状态
      const template = this.templates.find(t => t.uuid === uuid);
      if (template) {
        template.status = 'ACTIVE';
        template.activeTime = {
          activatedAt: Date.now(),
          displayText: `启动于 ${new Date().toLocaleString()}`,
        };
        template.effectiveEnabled = true;
      }
      
      return result;
    },
    
    async disableTemplate(uuid: string) {
      const result = await reminderApi.disableTemplate(uuid);
      
      const template = this.templates.find(t => t.uuid === uuid);
      if (template) {
        template.status = 'PAUSED';
        template.effectiveEnabled = false;
        // activeTime 保持不变
      }
      
      return result;
    },
  },
});
```

#### 5.2 更新 UI 组件

```vue
<template>
  <div class="reminder-active-time">
    <!-- ✅ 新的显示方式 -->
    <div v-if="template.status === 'ACTIVE'">
      <v-icon>mdi-check-circle</v-icon>
      {{ template.activeTime.displayText }}
    </div>
    <div v-else>
      <v-icon>mdi-pause-circle</v-icon>
      已暂停
    </div>
    
    <!-- ❌ 移除 endDate 相关显示 -->
    <!-- <div>{{ template.activeTime.displayText }}</div> -->
  </div>
</template>
```

---

## 📋 实施清单

### 必须修改的文件

#### 契约层 (Contracts)
- [ ] `packages/contracts/src/modules/reminder/value-objects/ActiveTimeConfig.ts`
- [ ] `packages/contracts/src/modules/reminder/api-requests.ts`
- [ ] `packages/contracts/src/modules/reminder/aggregates/ReminderTemplateServer.ts`
- [ ] `packages/contracts/src/modules/reminder/aggregates/ReminderTemplateClient.ts`

#### 领域层 (Domain Server)
- [ ] `packages/domain-server/src/reminder/value-objects/ActiveTimeConfig.ts`
- [ ] `packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`
- [ ] `packages/domain-server/src/reminder/services/ReminderDomainService.ts`

#### API 层
- [ ] `apps/api/src/reminder/controllers/reminder-template.controller.ts`
- [ ] `apps/api/src/reminder/services/reminder-template.service.ts`
- [ ] `apps/api/src/reminder/dto/*.dto.ts`

#### 数据库层
- [ ] 创建 Prisma 迁移脚本
- [ ] 执行数据迁移

#### 前端层
- [ ] `apps/web/src/stores/reminder.store.ts`
- [ ] `apps/web/src/components/reminder/*.vue`
- [ ] `apps/web/src/api/reminder.api.ts`

#### 测试
- [ ] 更新单元测试
- [ ] 更新集成测试
- [ ] 更新 E2E 测试

---

## 🧪 测试场景

### 1. 启用/禁用测试

```typescript
describe('ReminderTemplate ActiveTime', () => {
  it('should update activatedAt when enabled', async () => {
    const template = createTemplate({
      status: 'PAUSED',
      activeTime: { activatedAt: Date.now() - 1000 }
    });

    const beforeTime = Date.now();
    await template.enable();
    const afterTime = Date.now();

    expect(template.activeTime.activatedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(template.activeTime.activatedAt).toBeLessThanOrEqual(afterTime);
    expect(template.status).toBe('ACTIVE');
  });

  it('should keep activatedAt when disabled', async () => {
    const originalTime = Date.now();
    const template = createTemplate({
      status: 'ACTIVE',
      activeTime: { activatedAt: originalTime }
    });

    await template.disable();

    expect(template.activeTime.activatedAt).toBe(originalTime);
    expect(template.status).toBe('PAUSED');
  });
});
```

### 2. 循环提醒计算测试

```typescript
it('should calculate next trigger based on activatedAt', async () => {
  const activatedAt = new Date('2025-11-26 08:00:00').getTime();
  const template = createTemplate({
    status: 'ACTIVE',
    activeTime: { activatedAt },
    trigger: {
      type: 'INTERVAL',
      interval: { minutes: 30 }
    }
  });

  const nextTrigger = template.calculateNextTrigger();
  const expectedTrigger = activatedAt + 30 * 60 * 1000;

  expect(nextTrigger).toBe(expectedTrigger);
});
```

---

## 🚨 风险评估

### 破坏性变更 (Breaking Changes)

#### API 响应格式变化

**Before**:
```json
{
  "activeTime": {
    "startDate": 1763467443854,
    "endDate": 1795003443854,
    "displayText": "2025/11/18 至 2026/11/18",
    "isActive": true
  }
}
```

**After**:
```json
{
  "activeTime": {
    "activatedAt": 1763467443854,
    "displayText": "启动于 2025/11/26 10:30"
  },
  "status": "ACTIVE",
  "effectiveEnabled": true
}
```

### 数据迁移风险

- ✅ **低风险**: `startDate` → `activatedAt` 是直接重命名，数据不丢失
- ❌ **数据丢弃**: `endDate` 字段将被丢弃（但业务上不需要）
- ⚠️ **需要验证**: 确保所有已有提醒在迁移后能正常触发

### 兼容性处理

如果需要向后兼容（不推荐），可以添加适配层：

```typescript
// 临时兼容层（后续删除）
public toLegacyClientDTO(): LegacyActiveTimeConfigClientDTO {
  return {
    startDate: this.activatedAt,  // 映射到旧字段
    endDate: null,
    displayText: this.toClientDTO().displayText,
    isActive: this.status === 'ACTIVE',
  };
}
```

---

## 📅 实施计划

### Week 1: 契约层 + 领域层
- Day 1-2: 更新契约定义
- Day 3-4: 更新领域层实现
- Day 5: 编写单元测试

### Week 2: API + 数据库
- Day 1-2: 更新 API 层
- Day 3: 编写数据迁移脚本
- Day 4: 在测试环境执行迁移
- Day 5: 编写集成测试

### Week 3: 前端 + 测试
- Day 1-2: 更新前端代码
- Day 3: 更新 E2E 测试
- Day 4-5: 完整测试 + Bug修复

### Week 4: 发布
- Day 1: 灰度发布 (5% 用户)
- Day 2-3: 监控 + 问题修复
- Day 4: 全量发布
- Day 5: 删除兼容代码

---

## 📚 相关文档

- [[modules/reminder/README|Reminder 模块文档]]
- [[concepts/ddd-patterns|DDD 模式指南]]
- [[guides/development/testing|测试指南]]

---

**创建时间**: 2025-11-26  
**最后更新**: 2025-11-26  
**负责人**: @BakerSean168  
**状态**: 📝 待审批
