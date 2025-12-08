# EPIC-008: Habits & Streaks (习惯追踪)

## 📋 Epic 概述

**Epic ID**: EPIC-008  
**Epic Name**: Habit Tracking & Streak System  
**Epic Owner**: Development Team  
**Created**: 2025-12-08  
**Priority**: P2 (增强体验)  
**Status**: 📋 Planning  
**前置依赖**: 
- EPIC-002 (Desktop Application Development) ✅ Completed

---

## 🎯 产品愿景

> **养成好习惯，打破坏习惯 —— 用数据驱动行为改变，用成就感维持动力。**

### 用户价值

| 特性 | 描述 | 价值 |
|------|------|------|
| 习惯追踪 | 每日打卡记录 | 可视化坚持 |
| 连续天数 | Streak 计数激励 | 持续动力 |
| 习惯堆叠 | 链接多个习惯 | 养成系统 |
| 数据分析 | 完成率与趋势 | 洞察优化 |
| 灵活提醒 | 时间/地点触发 | 不遗忘 |

---

## 📋 Stories 列表

### STORY-037: 习惯创建与管理

**优先级**: P1  
**预估工时**: 2 天

**用户故事**: 作为用户，我希望创建和管理我的日常习惯清单。

**功能范围**:
- 习惯创建向导
- 频率设置（每日/每周/自定义）
- 习惯分类（健康、学习、工作...）
- 图标与颜色自定义
- 习惯归档与恢复

---

### STORY-038: 习惯打卡与 Streak

**优先级**: P1  
**预估工时**: 2 天

**用户故事**: 作为用户，我希望快速完成习惯打卡并看到我的连续天数。

**功能范围**:
- 一键打卡
- 连续天数计算
- 最长记录追踪
- 补打机制（限制次数）
- 打卡动画反馈

---

### STORY-039: 习惯热力图

**优先级**: P2  
**预估工时**: 2 天

**用户故事**: 作为用户，我希望通过热力图直观看到我的习惯完成情况。

**功能范围**:
- GitHub 风格年度热力图
- 周视图/月视图切换
- 颜色深浅表示强度
- 点击查看详情
- 导出分享功能

---

### STORY-040: 习惯统计分析

**优先级**: P2  
**预估工时**: 2 天

**用户故事**: 作为用户，我希望看到详细的习惯完成统计帮助我分析和改进。

**功能范围**:
- 完成率趋势图
- 最佳/最差表现日
- 习惯间关联分析
- 周期性模式识别
- 改进建议

---

### STORY-041: 习惯提醒系统

**优先级**: P1  
**预估工时**: 2 天

**用户故事**: 作为用户，我希望在合适的时间收到习惯提醒确保不遗忘。

**功能范围**:
- 固定时间提醒
- 智能时间建议
- 地点触发提醒（移动端）
- 习惯链提醒
- 休息日例外

---

### STORY-042: 成就与激励系统

**优先级**: P3  
**预估工时**: 1 天

**用户故事**: 作为用户，我希望通过成就徽章和里程碑获得持续的激励。

**功能范围**:
- 成就徽章解锁
- 里程碑庆祝动画
- 积分系统
- 排行榜（可选社交）
- 自定义奖励

---

## 🏗️ 技术架构

### 数据模型

```typescript
interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;  // daily | weekly | custom
  targetDays?: number[];      // 0-6 for weekly
  icon: string;
  color: string;
  reminderTime?: string;
  createdAt: Date;
  archivedAt?: Date;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;        // YYYY-MM-DD
  completed: boolean;
  completedAt?: Date;
  note?: string;
  isBackfill: boolean;
}

interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  totalCompletions: number;
}
```

### 组件结构

```
┌─────────────────────────────────────────────────────┐
│                   Habit Module                       │
├─────────────────────────────────────────────────────┤
│  HabitList  │  HabitCard  │  HabitForm  │ HeatMap  │
│  StreakBadge  │  StatsChart  │  AchievementModal   │
├─────────────────────────────────────────────────────┤
│                  Habit Service                       │
│   HabitManager  │  StreakCalculator  │  Analytics  │
├─────────────────────────────────────────────────────┤
│                  Data Layer                          │
│   Habit  │  HabitLog  │  HabitStreak  │ Achievement │
└─────────────────────────────────────────────────────┘
```

---

## 📊 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| 习惯保持率 | > 70% 21天后 | 21天后仍在打卡的习惯比例 |
| 平均 Streak | > 14 天 | 所有习惯平均连续天数 |
| 打卡频率 | 每日使用 | 日活用户打卡比例 |
| 功能满意度 | > 4.2/5 | 用户评分 |

---

## 🗓️ 实施计划

| 周期 | Story | 里程碑 |
|------|-------|--------|
| Week 1 | STORY-037 | 习惯 CRUD 功能 |
| Week 1 | STORY-038 | 打卡与 Streak |
| Week 2 | STORY-039 | 热力图可视化 |
| Week 2 | STORY-040 | 统计分析 |
| Week 3 | STORY-041 | 提醒系统 |
| Week 3 | STORY-042 | 成就激励 |
