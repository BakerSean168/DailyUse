# STORY-037: 习惯创建与管理

## 📋 Story 概述

**Story ID**: STORY-037  
**Epic**: EPIC-008 (Habits & Streaks)  
**优先级**: P1 (核心价值)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: EPIC-002 ✅

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 创建和管理我的日常习惯清单  
**以便于** 系统化追踪我的习惯养成进度

---

## 📋 验收标准

### 功能验收 - 习惯创建

- [ ] 用户可创建新习惯
- [ ] 必填：习惯名称
- [ ] 可选：描述、图标、颜色
- [ ] 频率设置：每日/每周指定天/自定义
- [ ] 分类选择：健康、学习、工作、生活、其他

### 功能验收 - 习惯列表

- [ ] 查看所有活跃习惯
- [ ] 按分类筛选
- [ ] 拖拽排序
- [ ] 显示今日完成状态
- [ ] 显示当前连续天数

### 功能验收 - 习惯编辑

- [ ] 编辑习惯基本信息
- [ ] 修改频率设置
- [ ] 习惯归档（保留历史数据）
- [ ] 习惯删除（确认后永久删除）
- [ ] 恢复已归档习惯

### 功能验收 - 预设习惯模板

- [ ] 提供常见习惯模板
- [ ] 模板包含推荐图标和颜色
- [ ] 一键从模板创建

### 技术验收

- [ ] 习惯数据同步到云端
- [ ] 离线时本地存储
- [ ] 列表加载 < 500ms

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/habit/aggregates/Habit.ts
export interface Habit {
  id: string;
  accountUuid: string;
  name: string;
  description?: string;
  icon: string;           // emoji 或图标名
  color: string;          // hex color
  category: HabitCategory;
  frequency: HabitFrequency;
  targetDays?: number[];  // 0=周日, 1=周一, ... 6=周六
  reminderTime?: string;  // HH:mm
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitCategory = 
  | 'health'    // 🏃 健康
  | 'learning'  // 📚 学习
  | 'work'      // 💼 工作
  | 'life'      // 🏠 生活
  | 'other';    // ✨ 其他

export type HabitFrequency = 
  | 'daily'     // 每天
  | 'weekly'    // 每周指定天
  | 'custom';   // 自定义间隔

// 习惯模板
export const HABIT_TEMPLATES = [
  { name: '早起', icon: '🌅', color: '#FF9500', category: 'health', frequency: 'daily' },
  { name: '运动 30 分钟', icon: '🏃', color: '#34C759', category: 'health', frequency: 'daily' },
  { name: '阅读', icon: '📖', color: '#5856D6', category: 'learning', frequency: 'daily' },
  { name: '冥想', icon: '🧘', color: '#AF52DE', category: 'health', frequency: 'daily' },
  { name: '喝 8 杯水', icon: '💧', color: '#007AFF', category: 'health', frequency: 'daily' },
  { name: '写日记', icon: '📝', color: '#FF2D55', category: 'life', frequency: 'daily' },
  { name: '整理房间', icon: '🧹', color: '#FF9500', category: 'life', frequency: 'weekly' },
  { name: '复盘周总结', icon: '📊', color: '#5AC8FA', category: 'work', frequency: 'weekly' },
];
```

### 服务层

```typescript
// packages/application-client/src/habit/services/HabitService.ts
export class HabitService {
  // CRUD
  async createHabit(data: CreateHabitRequest): Promise<Habit>;
  async updateHabit(id: string, data: UpdateHabitRequest): Promise<Habit>;
  async archiveHabit(id: string): Promise<void>;
  async restoreHabit(id: string): Promise<void>;
  async deleteHabit(id: string): Promise<void>;
  
  // 查询
  async getHabits(filter?: HabitFilter): Promise<Habit[]>;
  async getHabitById(id: string): Promise<Habit>;
  async getArchivedHabits(): Promise<Habit[]>;
  
  // 排序
  async reorderHabits(habitIds: string[]): Promise<void>;
  
  // 模板
  getHabitTemplates(): HabitTemplate[];
  async createFromTemplate(template: HabitTemplate): Promise<Habit>;
}
```

### API 端点

```
POST   /api/habits              # 创建习惯
GET    /api/habits              # 获取习惯列表
GET    /api/habits/:id          # 获取单个习惯
PUT    /api/habits/:id          # 更新习惯
DELETE /api/habits/:id          # 删除习惯
POST   /api/habits/:id/archive  # 归档习惯
POST   /api/habits/:id/restore  # 恢复习惯
PUT    /api/habits/reorder      # 重新排序
```

### UI 组件

```
┌─────────────────────────────────────────────────────┐
│  习惯管理                              [+ 新建习惯]  │
├─────────────────────────────────────────────────────┤
│  [全部] [健康] [学习] [工作] [生活]                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🌅 早起              每日    🔥 15 天        ○  │ │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🏃 运动 30 分钟      每日    🔥 7 天         ●  │ │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📖 阅读              每日    🔥 3 天         ○  │ │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘

创建/编辑习惯对话框:
┌─────────────────────────────────────────────────────┐
│  新建习惯                                     [X]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  从模板创建:                                         │
│  [🌅 早起] [🏃 运动] [📖 阅读] [🧘 冥想] [更多...]   │
│                                                      │
│  ─────────────── 或自定义 ───────────────           │
│                                                      │
│  习惯名称 *                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  图标        颜色                                    │
│  [😀 ▾]     [████ ▾]                               │
│                                                      │
│  分类                                                │
│  ○ 健康  ○ 学习  ○ 工作  ○ 生活  ○ 其他            │
│                                                      │
│  频率                                                │
│  ● 每天  ○ 每周指定天  ○ 自定义                     │
│                                                      │
│  提醒时间（可选）                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ 08:00                                        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│                      [取消]  [创建习惯]              │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

> **模块职责**: Habit 模块仅负责习惯的 CRUD 和 Streak 管理，提醒功能委托给 Reminder 模块

```
packages/domain-client/src/habit/
  ├── aggregates/Habit.ts (CRUD + Streak)
  ├── value-objects/HabitFrequency.ts
  ├── value-objects/HabitCategory.ts
  ├── constants/habitTemplates.ts
  └── index.ts

// 提醒功能在 reminder 模块中实现
packages/domain-client/src/reminder/
  └── entities/HabitReminder.ts (继承 ReminderTemplate)

packages/contracts/src/modules/habit/
  ├── habit.types.ts
  ├── habit-requests.ts
  └── index.ts

packages/application-client/src/habit/
  ├── services/HabitService.ts
  └── index.ts

apps/api/src/modules/habit/
  ├── domain/
  │   └── Habit.ts
  ├── infrastructure/
  │   └── HabitRepository.ts
  ├── application/
  │   └── HabitApplicationService.ts
  ├── interface/http/
  │   ├── HabitController.ts
  │   └── habitRoutes.ts
  └── index.ts

apps/api/prisma/migrations/xxx_add_habits/
  └── migration.sql

apps/desktop/src/renderer/views/habit/
  ├── HabitListView.tsx
  ├── HabitFormDialog.tsx
  └── HabitCard.tsx

apps/desktop/src/renderer/hooks/
  └── useHabits.ts
```

### Prisma Schema 变更

```prisma
model habit {
  id          String   @id @default(uuid()) @db.Uuid
  accountUuid String   @map("account_uuid")
  name        String   @db.VarChar(100)
  description String?  @db.Text
  icon        String   @db.VarChar(50)
  color       String   @db.VarChar(7)
  category    String   @db.VarChar(20)
  frequency   String   @db.VarChar(20)
  targetDays  Int[]    @map("target_days")
  reminderTime String? @map("reminder_time") @db.VarChar(5)
  isArchived  Boolean  @default(false) @map("is_archived")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  account account     @relation(fields: [accountUuid], references: [uuid])
  logs    habitLog[]

  @@index([accountUuid])
  @@index([isArchived])
  @@map("habits")
}
```

---

## 🧪 测试要点

### 单元测试

- Habit 实体验证规则
- HabitService CRUD 方法
- 频率计算逻辑

### 集成测试

- API 端点测试
- 数据库持久化
- 排序功能

### E2E 测试

- 创建习惯完整流程
- 从模板创建
- 归档与恢复

---

## 📝 注意事项

1. **同步考虑**：习惯模块需集成现有 Sync 基础设施
2. **性能优化**：习惯列表使用虚拟滚动（预留大量习惯场景）
3. **图标系统**：使用 emoji 或内置图标库
4. **颜色选择器**：提供预设颜色 + 自定义输入
