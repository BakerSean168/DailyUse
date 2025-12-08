# STORY-038: 习惯打卡与Streak

## 📋 Story 概述

**Story ID**: STORY-038  
**Epic**: EPIC-008 (Habit Tracking)  
**优先级**: P1 (核心价值)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: EPIC-003 ✅ (Goal & Task Management)

---

## 🎯 用户故事

**作为** 想要养成良好习惯的 DailyUse 用户  
**我希望** 能够快速打卡记录习惯完成情况，并看到我的连续打卡天数  
**以便于** 激励自己坚持习惯，享受连续打卡带来的成就感

---

## 📋 验收标准

### 功能验收 - 一键打卡

- [ ] 习惯列表快速打卡（点击即完成）
- [ ] 支持撤销今日打卡（限当日）
- [ ] 已完成习惯显示✓标记
- [ ] 未完成习惯显示空心圆○
- [ ] 打卡时显示动画反馈

### 功能验收 - Streak 计算

- [ ] 显示当前连续打卡天数（Current Streak）
- [ ] 显示历史最长连续天数（Longest Streak）
- [ ] 显示总打卡天数（Total Days）
- [ ] 连续天数自动计算，跨天重置
- [ ] Streak 中断后从 0 开始

### 功能验收 - 补打卡机制

- [ ] 允许补打卡昨日习惯（仅限1天）
- [ ] 补打卡需用户确认（防止误操作）
- [ ] 补打卡标记为"已补"，与正常打卡区分
- [ ] 补打卡不影响 Streak 计算（可配置）
- [ ] 每个习惯最多补打卡 3 次/月（可配置）

### 功能验收 - 打卡动画

- [ ] 打卡成功：✓ 弹出动画 + 音效（可选）
- [ ] 连续打卡里程碑（7天、30天、100天）特殊庆祝
- [ ] Streak 数字跳动动画
- [ ] 撤销打卡淡出动画

### 功能验收 - 打卡历史

- [ ] 查看某个习惯的打卡日历
- [ ] 日历标记：已完成✓、已补○、未完成空
- [ ] 点击日期查看当日备注
- [ ] 支持添加打卡备注（可选）

### 技术验收

- [ ] 打卡响应时间 < 100ms
- [ ] 支持离线打卡，联网后同步
- [ ] Streak 计算准确率 100%
- [ ] 跨时区正确处理日期

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/habit/
interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;                 // emoji 或图标
  frequency: HabitFrequency;     // daily, weekly, custom
  reminderTime?: string;         // HH:mm
  category?: string;
  isActive: boolean;
  createdAt: Date;
  archivedAt?: Date;
}

interface HabitFrequency {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[];         // 0-6 (周一到周日)
  customDays?: Date[];           // 自定义日期
}

interface HabitCheckIn {
  id: string;
  habitId: string;
  userId: string;
  date: Date;                    // 打卡日期（YYYY-MM-DD）
  checkedAt: Date;               // 实际打卡时间
  isBackfilled: boolean;         // 是否补打卡
  note?: string;                 // 打卡备注
  mood?: 'great' | 'good' | 'ok' | 'bad';  // 心情（可选）
}

interface HabitStreak {
  habitId: string;
  currentStreak: number;         // 当前连续天数
  longestStreak: number;         // 历史最长
  totalDays: number;             // 总打卡天数
  lastCheckInDate: Date;
  streakStartDate: Date;
  milestones: StreakMilestone[]; // 里程碑记录
}

interface StreakMilestone {
  days: number;                  // 7, 30, 100, etc.
  achievedAt: Date;
  notified: boolean;
}

interface BackfillConfig {
  allowBackfill: boolean;        // 是否允许补打卡
  backfillDays: number;          // 可补打卡天数（默认1）
  monthlyLimit: number;          // 每月补打卡上限（默认3）
  affectsStreak: boolean;        // 是否影响Streak（默认false）
}
```

### 服务层

```typescript
// packages/application-client/src/habit/services/HabitCheckInService.ts
export class HabitCheckInService {
  // 打卡操作
  checkIn(habitId: string, note?: string): Promise<HabitCheckIn>;
  uncheckIn(habitId: string, date: Date): Promise<void>;
  backfillCheckIn(habitId: string, date: Date): Promise<HabitCheckIn>;
  
  // 打卡查询
  getTodayCheckIns(userId: string): Promise<HabitCheckIn[]>;
  getCheckInHistory(habitId: string, startDate: Date, endDate: Date): Promise<HabitCheckIn[]>;
  isCheckedIn(habitId: string, date: Date): Promise<boolean>;
  
  // 补打卡检查
  canBackfill(habitId: string, date: Date): Promise<boolean>;
  getRemainingBackfills(habitId: string): Promise<number>;
  
  // 事件
  onCheckIn: (checkIn: HabitCheckIn) => void;
  onUncheckIn: (habitId: string, date: Date) => void;
  onMilestoneAchieved: (milestone: StreakMilestone) => void;
}

// packages/application-client/src/habit/services/HabitStreakService.ts
export class HabitStreakService {
  // Streak 计算
  calculateStreak(habitId: string): Promise<HabitStreak>;
  updateStreak(habitId: string, checkIn: HabitCheckIn): Promise<HabitStreak>;
  resetStreak(habitId: string): Promise<void>;
  
  // Streak 查询
  getStreak(habitId: string): Promise<HabitStreak>;
  getAllStreaks(userId: string): Promise<HabitStreak[]>;
  getBestStreak(userId: string): Promise<HabitStreak>;
  
  // 里程碑
  checkMilestones(streak: HabitStreak): StreakMilestone[];
  notifyMilestone(milestone: StreakMilestone): void;
}
```

### Streak 计算算法

```typescript
// 连续天数计算
class StreakCalculator {
  calculateStreak(checkIns: HabitCheckIn[]): StreakResult {
    // 按日期排序
    const sorted = checkIns.sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    for (const checkIn of sorted) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const daysDiff = this.getDaysDiff(lastDate, checkIn.date);
        
        if (daysDiff === 1) {
          // 连续
          tempStreak++;
        } else {
          // 中断
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = checkIn.date;
    }
    
    // 最后一段
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // 检查当前是否还在连续
    if (lastDate && this.isToday(lastDate)) {
      currentStreak = tempStreak;
    } else if (lastDate && this.isYesterday(lastDate)) {
      currentStreak = tempStreak; // 昨天打卡了，今天还没到截止
    } else {
      currentStreak = 0; // Streak 已中断
    }
    
    return {
      currentStreak,
      longestStreak,
      totalDays: sorted.length,
    };
  }
  
  private getDaysDiff(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
  }
  
  private isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }
  
  private isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(date, yesterday);
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
```

### UI 组件

#### 习惯打卡列表

```
┌─────────────────────────────────────────────────────┐
│              📅 今日习惯打卡                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🏃 晨跑 30 分钟              [✓] 已完成             │
│  🔥 7 天连续 | 最长 30 天                            │
│                                                      │
│  📖 阅读 30 分钟              [ ] 待完成             │
│  🔥 12 天连续 | 最长 45 天                           │
│                                                      │
│  💧 喝 8 杯水                 [✓] 已完成             │
│  🔥 5 天连续 | 最长 15 天                            │
│                                                      │
│  🧘 冥想 10 分钟              [ ] 待完成             │
│  🔥 3 天连续 | 最长 10 天                            │
│                                                      │
│  ⚠️ 昨日未完成：学英语 - [补打卡] 或 [跳过]          │
│                                                      │
├─────────────────────────────────────────────────────┤
│  今日进度: 2/4 (50%)                                 │
│  [ + 添加习惯 ]                                      │
└─────────────────────────────────────────────────────┘
```

#### 打卡成功动画

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│                      ✓                               │
│                   (放大动画)                         │
│                                                      │
│                  打卡成功！                          │
│                                                      │
│               🔥 连续 8 天 🔥                        │
│                                                      │
│              继续保持，加油！                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 里程碑庆祝

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│                  🎉 恭喜你！🎉                       │
│                                                      │
│                      🏆                              │
│                                                      │
│            "晨跑 30 分钟" 连续 30 天！               │
│                                                      │
│          你已经形成了一个好习惯！                    │
│                                                      │
│              [ 分享成就 ]  [ 继续 ]                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 补打卡确认

```
┌─────────────────────────────────────────────────────┐
│              📝 补打卡确认                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  习惯: 阅读 30 分钟                                  │
│  日期: 2025-12-07 (昨天)                             │
│                                                      │
│  ⚠️ 注意：                                           │
│  • 本月剩余补打卡次数：2 次                          │
│  • 补打卡不会影响连续天数计算                        │
│  • 仅限补打卡昨天的习惯                              │
│                                                      │
│  备注（可选）:                                        │
│  ┌──────────────────────────────────────────┐       │
│  │ 昨晚临时加班，忘记打卡了                  │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│             [ 确认补打卡 ]  [ 取消 ]                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 习惯详情 - 打卡日历

```
┌─────────────────────────────────────────────────────┐
│              🏃 晨跑 30 分钟 - 打卡历史              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 统计                                             │
│  🔥 当前连续: 7 天                                   │
│  🏆 最长连续: 30 天                                  │
│  ✓ 总打卡: 87 天                                     │
│                                                      │
│  📅 2025 年 12 月                        < >         │
│  ┌──────────────────────────────────────┐           │
│  │ 一  二  三  四  五  六  日           │           │
│  │                      1✓  2✓  3✓     │           │
│  │ 4✓  5✓  6✓  7✓  8✓  9○  10         │           │
│  │ 11✓ 12✓ 13✓ 14✓ 15✓ 16✓ 17✓       │           │
│  │ 18✓ 19✓ 20✓ 21✓ 22✓ 23✓ 24✓       │           │
│  │ 25✓ 26✓ 27✓ 28✓ 29✓ 30✓ 31        │           │
│  └──────────────────────────────────────┘           │
│                                                      │
│  图例: ✓ 已打卡  ○ 补打卡  空 未完成                │
│                                                      │
│  💡 12月9日 - 补打卡                                 │
│  备注: 那天去爬山了，算是更高强度的运动              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 打卡动画实现

```typescript
// 使用 Framer Motion 或 CSS animations
import { motion } from 'framer-motion';

const CheckInAnimation = () => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <CheckIcon />
  </motion.div>
);

const StreakCounter = ({ value }: { value: number }) => (
  <motion.span
    key={value}
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring' }}
  >
    {value}
  </motion.span>
);

const MilestoneModal = () => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', duration: 0.8 }}
  >
    🏆
  </motion.div>
);
```

---

## 📁 文件变更清单

### 新增文件

```
packages/domain-client/src/habit/
  ├── aggregates/Habit.ts
  ├── aggregates/HabitCheckIn.ts
  ├── aggregates/HabitStreak.ts
  ├── value-objects/HabitFrequency.ts
  ├── value-objects/BackfillConfig.ts
  └── index.ts

packages/application-client/src/habit/
  ├── services/HabitService.ts
  ├── services/HabitCheckInService.ts
  ├── services/HabitStreakService.ts
  └── utils/StreakCalculator.ts

packages/infrastructure-client/src/repositories/
  ├── HabitRepository.ts
  ├── HabitCheckInRepository.ts
  └── HabitStreakRepository.ts

apps/desktop/src/renderer/components/habit/
  ├── HabitListPage.tsx
  ├── HabitCard.tsx
  ├── CheckInButton.tsx
  ├── CheckInAnimation.tsx
  ├── StreakBadge.tsx
  ├── MilestoneModal.tsx
  ├── BackfillConfirmModal.tsx
  ├── HabitCalendar.tsx
  └── HabitDetailPage.tsx

apps/desktop/src/renderer/hooks/
  ├── useHabits.ts
  ├── useCheckIn.ts
  └── useStreak.ts

apps/desktop/src/renderer/animations/
  └── checkInAnimations.ts
```

### 修改文件

```
apps/desktop/src/renderer/routes.tsx
  └── 添加习惯页面路由

apps/desktop/src/renderer/components/Layout.tsx
  └── 添加习惯模块导航

package.json
  └── 添加动画库依赖 (framer-motion)
```

---

## 🧪 测试要点

### 单元测试

- Streak 计算算法准确性
- 跨天边界条件处理
- 补打卡次数限制
- 里程碑触发条件

### 集成测试

- 打卡后 Streak 自动更新
- 撤销打卡回滚状态
- 补打卡影响 Streak 计算
- 跨时区日期处理

### E2E 测试

- 完整打卡流程
- 连续多日打卡
- 补打卡完整流程
- 里程碑弹窗显示

### 性能测试

- 打卡响应时间
- 大量历史数据查询
- 动画流畅度

---

## 📝 注意事项

1. **日期处理**：统一使用本地时区的日期（YYYY-MM-DD），避免跨时区问题
2. **Streak 准确性**：算法必须 100% 准确，这直接影响用户信任
3. **补打卡限制**：要合理限制补打卡次数，避免滥用
4. **动画性能**：打卡动画要流畅，但不能阻塞 UI
5. **离线支持**：打卡操作要支持离线，联网后同步
6. **数据持久化**：打卡数据要可靠持久化，不能丢失
7. **用户激励**：里程碑要有仪式感，增强成就感
8. **误操作保护**：撤销打卡仅限当日，防止恶意修改历史

---

## 🚀 未来扩展

1. **社交功能**：好友间可见彼此的 Streak，互相激励
2. **智能提醒**：根据历史习惯智能推荐最佳打卡时间
3. **AI 分析**：分析打卡模式，识别容易中断的习惯
4. **挑战模式**：30天挑战、90天挑战等
5. **奖励系统**：连续打卡获得虚拟奖励
6. **数据可视化**：更丰富的统计图表
7. **习惯分组**：晨间习惯、晚间习惯等分组管理
8. **语音打卡**：通过语音快速完成打卡
