# Feature Spec: 通知摘要

> **功能编号**: NOTIFICATION-003  
> **RICE 评分**: 112 (Reach: 7, Impact: 4, Confidence: 8, Effort: 2)  
> **优先级**: P2  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

通知过多导致信息过载：

- ❌ 每天收到几十条通知，难以逐一查看
- ❌ 重要通知淹没在大量通知中
- ❌ 缺少整体概览
- ❌ 无法批量处理

### 价值主张

**一句话价值**: 将通知汇总为每日/每周摘要，减少干扰并提高效率

**核心收益**:

- ✅ 每日摘要推送（早晨 8:00）
- ✅ 每周摘要推送（周一早晨）
- ✅ 智能分类和优先级排序
- ✅ 一键批量操作

---

## 2. 用户价值与场景

### 核心场景 1: 每日通知摘要

**场景描述**:  
用户每天早晨收到前一天的通知摘要。

**用户故事**:

```gherkin
As a 用户
I want 每天早晨收到通知摘要
So that 快速了解昨日重要信息
```

**操作流程**:

1. 系统在每天 8:00 生成昨日摘要
2. 用户收到摘要通知：

   ```
   📬 每日通知摘要 - 10月20日
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   昨日收到 23 条通知，其中：
   🔴 高优先级: 3 条
   🟡 中优先级: 12 条
   🔵 低优先级: 8 条

   [查看摘要] [全部已读]
   ```

3. 用户点击"查看摘要"
4. 显示完整摘要页面：

   ```
   📬 每日通知摘要
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   2025年10月20日（周日）

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 高优先级（需关注）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⏰ 任务即将逾期
   "API 性能优化" 将于今天 18:00 截止
   [查看任务] [延期]

   💬 重要评论
   张三在 "产品需求文档" 中 @了你
   [查看评论] [回复]

   🎯 目标进度提醒
   "Q4 产品上线" 进度落后 15%
   [查看目标] [更新进度]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🟡 中优先级（一般信息）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ 任务完成（8 条）
   李四、王五等完成了 8 个任务
   [查看列表]

   📅 日程提醒（4 条）
   今天有 4 个日程安排
   [查看日历]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔵 低优先级（可忽略）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   系统通知、日常提醒等 8 条
   [展开查看]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   [全部标记已读]  [管理通知偏好]
   ```

**预期结果**:

- 信息结构清晰
- 优先级明确
- 支持快速操作

---

### 核心场景 2: 每周通知摘要

**场景描述**:  
用户每周一早晨收到上周的完整通知摘要。

**用户故事**:

```gherkin
As a 用户
I want 每周一收到上周摘要
So that 回顾上周重要事项
```

**操作流程**:

1. 系统在周一 8:00 生成上周摘要
2. 显示周摘要：

   ```
   📊 每周通知摘要 - 第 42 周
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   10月14日 - 10月20日

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📈 本周概览
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   总通知数: 156 条
   平均每天: 22.3 条

   优先级分布：
   🔴 高: 18 条 (12%)
   🟡 中: 89 条 (57%)
   🔵 低: 49 条 (31%)

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🏆 本周亮点
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ 完成 28 个任务
   本周效率 +15% vs 上周
   [查看详情]

   🎯 目标进展
   "Q4 产品上线" KR1 达成 80%
   [查看目标]

   💬 协作互动
   参与 15 次讨论，@你 8 次
   [查看记录]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️ 需要关注
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   • 5 个任务逾期
   • 3 个目标进度落后
   • 2 个重要通知未读

   [查看待办事项]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📅 下周预告
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   • 12 个任务截止
   • 8 个会议安排
   • 2 个目标检查点

   [查看下周日程]
   ```

**预期结果**:

- 全面回顾
- 数据对比
- 前瞻规划

---

### 核心场景 3: 智能分组和折叠

**场景描述**:  
系统自动将相似通知分组折叠。

**用户故事**:

```gherkin
As a 用户
I want 相似通知自动分组
So that 减少信息冗余
```

**操作流程**:

1. 系统检测相似通知：

   ```typescript
   function groupNotifications(notifications: Notification[]): NotificationGroup[] {
     const groups: NotificationGroup[] = [];

     // 1. 按类型分组
     const byType = groupBy(notifications, 'type');

     // 2. 进一步细分
     for (const [type, items] of Object.entries(byType)) {
       if (type === 'task_completed') {
         // 多个任务完成 → 合并
         groups.push({
           type: 'task_completed',
           title: `${items.length} 个任务已完成`,
           items: items,
           collapsed: true,
         });
       } else if (type === 'comment_mention') {
         // 按文档分组
         const byDoc = groupBy(items, 'relatedObjectId');
         for (const [docId, docItems] of Object.entries(byDoc)) {
           if (docItems.length > 1) {
             groups.push({
               type: 'comment_mention',
               title: `${docItems.length} 条评论来自 "${docItems[0].relatedObject.title}"`,
               items: docItems,
               collapsed: true,
             });
           } else {
             groups.push(...docItems);
           }
         }
       } else {
         groups.push(...items);
       }
     }

     return groups;
   }
   ```

2. 显示分组通知：

   ```
   📬 通知列表
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ 8 个任务已完成  [展开 ▼]
   ├─ "API 开发" by 张三
   ├─ "UI 设计" by 李四
   ├─ "测试用例编写" by 王五
   └─ ... 还有 5 个

   💬 5 条评论来自 "产品需求文档"  [展开 ▼]
   ├─ 张三 @了你
   ├─ 李四回复了你
   └─ ... 还有 3 条

   📅 今天有 4 个日程  [展开 ▼]
   ```

**预期结果**:

- 减少视觉干扰
- 保持信息完整
- 支持展开查看

---

### 核心场景 4: 自定义摘要偏好

**场景描述**:  
用户配置摘要推送时间和内容。

**用户故事**:

```gherkin
As a 用户
I want 自定义摘要偏好
So that 符合我的作息习惯
```

**操作流程**:

1. 用户打开"通知偏好"
2. 配置摘要设置：

   ```
   ⚙️ 摘要偏好设置
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📅 每日摘要
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   启用每日摘要: ☑️

   推送时间: [08:00 ▼]
   备选: 7:00, 8:00, 9:00, 12:00, 18:00

   包含内容:
   ☑️ 高优先级通知
   ☑️ 任务截止提醒
   ☑️ 目标进度提醒
   ☐ 日程安排（已在日历查看）
   ☐ 系统通知

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 每周摘要
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   启用每周摘要: ☑️

   推送时间: 周一 [08:00 ▼]

   包含内容:
   ☑️ 本周数据统计
   ☑️ 目标进度回顾
   ☑️ 效率分析
   ☑️ 下周预告

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   [保存设置]  [恢复默认]
   ```

**预期结果**:

- 灵活配置
- 个性化推送
- 尊重用户习惯

---

## 3. 设计要点

### 摘要生成逻辑

```typescript
interface NotificationDigest {
  period: 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;

  summary: {
    totalCount: number;
    byPriority: Record<Priority, number>;
    byType: Record<NotificationType, number>;
  };

  sections: DigestSection[];
}

interface DigestSection {
  title: string;
  priority: Priority;
  items: NotificationGroup[];
  collapsed: boolean;
}

async function generateDailyDigest(userId: string): Promise<NotificationDigest> {
  const yesterday = subDays(new Date(), 1);
  const notifications = await this.notificationRepository.findByDateRange(
    userId,
    startOfDay(yesterday),
    endOfDay(yesterday),
  );

  // 1. 按优先级分类
  const byPriority = groupBy(notifications, 'priority');

  // 2. 生成摘要
  return {
    period: 'daily',
    startDate: startOfDay(yesterday),
    endDate: endOfDay(yesterday),
    summary: {
      totalCount: notifications.length,
      byPriority: {
        HIGH: byPriority.HIGH?.length || 0,
        MEDIUM: byPriority.MEDIUM?.length || 0,
        LOW: byPriority.LOW?.length || 0,
      },
      byType: countByType(notifications),
    },
    sections: [
      {
        title: '高优先级（需关注）',
        priority: 'HIGH',
        items: groupNotifications(byPriority.HIGH || []),
        collapsed: false,
      },
      {
        title: '中优先级（一般信息）',
        priority: 'MEDIUM',
        items: groupNotifications(byPriority.MEDIUM || []),
        collapsed: true,
      },
      {
        title: '低优先级（可忽略）',
        priority: 'LOW',
        items: groupNotifications(byPriority.LOW || []),
        collapsed: true,
      },
    ],
  };
}
```

---

### Contracts

#### 新增实体：NotificationDigest

```typescript
export interface NotificationDigestServerDTO {
  readonly uuid: string;
  readonly userId: string;
  readonly period: 'daily' | 'weekly';
  readonly startDate: number;
  readonly endDate: number;
  readonly summary: DigestSummary;
  readonly sections: DigestSection[];
  readonly sentAt?: number;
  readonly readAt?: number;
  readonly createdAt: number;
}

export interface DigestSummary {
  readonly totalCount: number;
  readonly byPriority: Record<Priority, number>;
  readonly byType: Record<string, number>;
}
```

---

## 4. MVP 范围

### MVP（1 周）

- ✅ 每日摘要生成和推送
- ✅ 优先级分类
- ✅ 基础分组折叠
- ✅ 自定义推送时间

### Full（后续）

- ✅ 每周摘要
- ✅ 智能分组优化
- ✅ 数据统计和趋势
- ✅ 批量操作

---

## 5. 验收标准（Gherkin）

```gherkin
Feature: 通知摘要

  Scenario: 每日摘要推送
    Given 用户设置每日摘要时间为 8:00
    And 昨日有 23 条通知
    When 到达 8:00
    Then 应收到每日摘要通知
    And 摘要包含 23 条通知
    And 按优先级分类显示
```

---

## 6. 成功指标

| 指标         | 目标值          |
| ------------ | --------------- |
| 摘要启用率   | >50% 用户启用   |
| 摘要打开率   | >60% 摘要被查看 |
| 通知处理效率 | 提升 30%        |

---

**文档状态**: ✅ Ready for Review  
**下一步**: 核心模块 P2 功能全部完成！
