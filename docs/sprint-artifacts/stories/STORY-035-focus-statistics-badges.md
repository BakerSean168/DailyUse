# STORY-035: 专注统计与徽章

## 📋 Story 概述

**Story ID**: STORY-035  
**Epic**: EPIC-007 (Pomodoro & Focus Mode)  
**优先级**: P2 (价值增强)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-032 ✅ (Pomodoro Timer)

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 看到我的专注数据统计和获得的成就徽章  
**以便于** 了解自己的专注习惯，激励自己保持高效工作

---

## 📋 验收标准

### 功能验收 - 统计数据

- [ ] 显示今日/本周/本月专注时长
- [ ] 显示今日/本周/本月完成番茄数
- [ ] 显示专注完成率（完成/计划）
- [ ] 显示最长连续专注天数
- [ ] 显示每日专注时长趋势图表

### 功能验收 - 徽章系统

- [ ] 连续专注徽章：7天、30天、100天
- [ ] 番茄数量徽章：10个、50个、100个、500个、1000个
- [ ] 单日专注徽章：3小时、5小时、8小时
- [ ] 特殊成就徽章：早起专注者、深夜工作狂、周末战士
- [ ] 显示已获得/未获得徽章
- [ ] 徽章获得时弹窗庆祝动画

### 功能验收 - 统计仪表板

- [ ] 周视图：每日专注时长柱状图
- [ ] 月视图：每周专注时长趋势图
- [ ] 年视图：每月专注时长概览
- [ ] 分时段统计：上午/下午/晚上专注分布
- [ ] 任务类型统计：不同类型任务专注时长占比

### 功能验收 - 数据导出

- [ ] 导出统计数据为 CSV
- [ ] 导出图表为图片
- [ ] 生成周报/月报（Markdown 格式）

### 技术验收

- [ ] 统计计算准确率 100%
- [ ] 图表渲染性能 < 200ms
- [ ] 支持 1 年以上历史数据
- [ ] 数据查询响应时间 < 100ms

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/focus/
interface FocusStatistics {
  userId: string;
  date: Date;                    // 统计日期
  totalFocusMinutes: number;     // 总专注时长（分钟）
  completedPomodoros: number;    // 完成番茄数
  plannedPomodoros: number;      // 计划番茄数
  longestStreak: number;         // 最长连续天数
  currentStreak: number;         // 当前连续天数
  morningMinutes: number;        // 上午专注（6-12）
  afternoonMinutes: number;      // 下午专注（12-18）
  eveningMinutes: number;        // 晚上专注（18-24）
}

interface Badge {
  id: string;
  type: 'streak' | 'count' | 'duration' | 'special';
  name: string;
  description: string;
  icon: string;                  // emoji 或图标名
  requirement: number;           // 达成条件
  category: string;              // 分类
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  progress: number;              // 当前进度
  notified: boolean;             // 是否已通知
}

interface FocusReport {
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalPomodoros: number;
  completionRate: number;
  bestDay: { date: Date; minutes: number };
  insights: string[];            // AI 生成的洞察
}
```

### 服务层

```typescript
// packages/application-client/src/focus/services/FocusStatisticsService.ts
export class FocusStatisticsService {
  // 统计查询
  getDailyStatistics(date: Date): Promise<FocusStatistics>;
  getWeeklyStatistics(startDate: Date): Promise<FocusStatistics[]>;
  getMonthlyStatistics(year: number, month: number): Promise<FocusStatistics[]>;
  getYearlyStatistics(year: number): Promise<FocusStatistics[]>;
  
  // 趋势分析
  getFocusTrend(days: number): Promise<TrendData>;
  getCompletionRateTrend(weeks: number): Promise<TrendData>;
  getTimeDistribution(days: number): Promise<TimeDistribution>;
  
  // 报告生成
  generateDailyReport(date: Date): Promise<FocusReport>;
  generateWeeklyReport(startDate: Date): Promise<FocusReport>;
  generateMonthlyReport(year: number, month: number): Promise<FocusReport>;
  
  // 数据导出
  exportToCSV(startDate: Date, endDate: Date): Promise<string>;
  exportChartImage(chartType: string, data: any): Promise<Blob>;
}

// packages/application-client/src/focus/services/BadgeService.ts
export class BadgeService {
  // 徽章查询
  getAllBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  getBadgeProgress(userId: string, badgeId: string): Promise<number>;
  
  // 徽章检查
  checkBadgeUnlocks(userId: string, statistics: FocusStatistics): Promise<Badge[]>;
  notifyBadgeUnlock(badge: Badge): void;
  
  // 徽章分类
  getBadgesByCategory(category: string): Promise<Badge[]>;
  getUnlockedBadges(userId: string): Promise<Badge[]>;
  getLockedBadges(userId: string): Promise<Badge[]>;
}
```

### 徽章定义

```typescript
// 预定义徽章系统
const BADGE_DEFINITIONS: Badge[] = [
  // 连续专注
  { id: 'streak-7', type: 'streak', name: '初心不改', requirement: 7, icon: '🔥' },
  { id: 'streak-30', type: 'streak', name: '坚持如一', requirement: 30, icon: '💪' },
  { id: 'streak-100', type: 'streak', name: '专注大师', requirement: 100, icon: '👑' },
  
  // 番茄数量
  { id: 'pomodoro-10', type: 'count', name: '番茄新手', requirement: 10, icon: '🍅' },
  { id: 'pomodoro-50', type: 'count', name: '番茄达人', requirement: 50, icon: '🎯' },
  { id: 'pomodoro-100', type: 'count', name: '番茄专家', requirement: 100, icon: '⭐' },
  { id: 'pomodoro-500', type: 'count', name: '番茄大师', requirement: 500, icon: '💎' },
  { id: 'pomodoro-1000', type: 'count', name: '番茄传奇', requirement: 1000, icon: '🏆' },
  
  // 单日时长
  { id: 'daily-3h', type: 'duration', name: '专注三小时', requirement: 180, icon: '⏰' },
  { id: 'daily-5h', type: 'duration', name: '专注五小时', requirement: 300, icon: '🌟' },
  { id: 'daily-8h', type: 'duration', name: '专注八小时', requirement: 480, icon: '🚀' },
  
  // 特殊成就
  { id: 'early-bird', type: 'special', name: '早起的鸟儿', requirement: 1, icon: '🐦' },
  { id: 'night-owl', type: 'special', name: '深夜工作狂', requirement: 1, icon: '🦉' },
  { id: 'weekend-warrior', type: 'special', name: '周末战士', requirement: 1, icon: '⚔️' },
];
```

### UI 组件

```
┌─────────────────────────────────────────────────────┐
│              📊 专注统计 & 成就                      │
├─────────────────────────────────────────────────────┤
│  [ 今日 ]  [ 本周 ]  [ 本月 ]  [ 全部 ]             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ╔════════════════════════════════════════════╗     │
│  ║  今日专注                                  ║     │
│  ║  ┌──────┐  ┌──────┐  ┌──────┐             ║     │
│  ║  │ 2h   │  │  8   │  │ 100% │             ║     │
│  ║  │ 15min│  │ 番茄 │  │完成率│             ║     │
│  ║  └──────┘  └──────┘  └──────┘             ║     │
│  ╚════════════════════════════════════════════╝     │
│                                                      │
│  ╔════════════════════════════════════════════╗     │
│  ║  本周趋势                                  ║     │
│  ║    3h  ┃                                   ║     │
│  ║    2h  ┃  ▄▄  ▄▄      ▄▄                   ║     │
│  ║    1h  ┃▄ ██▄ ██  ▄▄  ██  ▄▄              ║     │
│  ║    0h  ┗━━━━━━━━━━━━━━━━━━━━━━━━           ║     │
│  ║         一 二 三 四 五 六 日               ║     │
│  ╚════════════════════════════════════════════╝     │
│                                                      │
│  ╔════════════════════════════════════════════╗     │
│  ║  🏆 成就徽章                               ║     │
│  ║  ┌────────────────────────────────────┐    ║     │
│  ║  │ 🔥 初心不改  💪 坚持如一  👑 专注大师 │ (解锁) ║
│  ║  │ 🍅 番茄新手  🎯 番茄达人  ⭐ 番茄专家 │ (解锁) ║
│  ║  │ 💎 番茄大师  🏆 番茄传奇  ⏰ 专注三小时│ (未解锁)║
│  ║  │ 🐦 早起的鸟儿 🦉 深夜工作狂           │ (解锁) ║
│  ║  └────────────────────────────────────┘    ║     │
│  ║  进度: 12/15 徽章已解锁                    ║     │
│  ╚════════════════════════════════════════════╝     │
│                                                      │
│  [ 📥 导出数据 ]  [ 📊 生成报告 ]                   │
└─────────────────────────────────────────────────────┘
```

### 徽章解锁动画

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│                    ✨ 新成就解锁 ✨                  │
│                                                      │
│                      🏆                              │
│                   番茄传奇                           │
│                                                      │
│              恭喜！你已完成 1000 个番茄               │
│                                                      │
│                  [ 查看详情 ]                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 图表库选择

```typescript
// 使用 Chart.js 或 Recharts
import { Bar, Line, Pie } from 'recharts';

// 柱状图：每日专注时长
<BarChart data={weeklyData}>
  <Bar dataKey="minutes" fill="#8884d8" />
</BarChart>

// 折线图：完成率趋势
<LineChart data={trendData}>
  <Line type="monotone" dataKey="completionRate" stroke="#82ca9d" />
</LineChart>

// 饼图：时段分布
<PieChart>
  <Pie data={distributionData} dataKey="value" />
</PieChart>
```

---

## 📁 文件变更清单

### 新增文件

```
packages/domain-client/src/focus/
  ├── aggregates/FocusStatistics.ts
  ├── aggregates/Badge.ts
  ├── aggregates/UserBadge.ts
  ├── value-objects/FocusReport.ts
  └── constants/BadgeDefinitions.ts

packages/application-client/src/focus/
  ├── services/FocusStatisticsService.ts
  ├── services/BadgeService.ts
  └── utils/StatisticsCalculator.ts

packages/infrastructure-client/src/repositories/
  ├── FocusStatisticsRepository.ts
  └── BadgeRepository.ts

apps/desktop/src/renderer/components/focus/
  ├── FocusStatisticsPage.tsx
  ├── StatisticsCard.tsx
  ├── TrendChart.tsx
  ├── BadgeGallery.tsx
  ├── BadgeCard.tsx
  ├── BadgeUnlockModal.tsx
  └── ReportExporter.tsx

apps/desktop/src/renderer/hooks/
  ├── useFocusStatistics.ts
  └── useBadges.ts

apps/desktop/src/renderer/utils/
  └── chartConfig.ts
```

### 修改文件

```
packages/application-client/src/focus/services/PomodoroService.ts
  └── 添加统计数据记录逻辑

apps/desktop/src/renderer/routes.tsx
  └── 添加统计页面路由

apps/desktop/src/renderer/components/Layout.tsx
  └── 添加统计页面导航链接

package.json
  └── 添加图表库依赖 (recharts 或 chart.js)
```

---

## 🧪 测试要点

### 单元测试

- 统计数据计算准确性
- 连续天数计算逻辑
- 徽章解锁条件判断
- 报告生成逻辑

### 集成测试

- 番茄完成后统计更新
- 徽章解锁通知
- 跨天统计重置
- 数据导出完整性

### E2E 测试

- 完成番茄查看统计
- 解锁徽章查看动画
- 导出报告并验证内容
- 切换时间范围查看统计

### 性能测试

- 1 年历史数据查询性能
- 图表渲染性能
- 大量徽章加载性能

---

## 📝 注意事项

1. **数据准确性**：统计数据直接影响用户信任，必须保证 100% 准确
2. **性能优化**：历史数据按月归档，避免全量查询
3. **徽章设计**：徽章门槛要合理，既有激励又不过于简单
4. **用户隐私**：统计数据仅本地存储，不上传服务器（除非用户开启同步）
5. **时区处理**：跨时区使用时统计日期要正确处理
6. **动画性能**：徽章解锁动画要流畅但不占用过多资源
7. **导出格式**：CSV 格式要兼容 Excel 和 Google Sheets
8. **AI 洞察**：未来可集成 AI 分析专注习惯，给出改进建议

---

## 🚀 未来扩展

1. **社交对比**：可选的好友排行榜（需用户授权）
2. **AI 建议**：基于历史数据给出最佳专注时段建议
3. **目标设定**：设置周/月专注目标，自动追踪进度
4. **数据分析**：分析任务类型与专注效率的关系
5. **第三方集成**：导出到 Notion、Obsidian 等笔记工具
