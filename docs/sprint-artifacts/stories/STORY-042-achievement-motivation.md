# STORY-042: 成就与激励系统

## 📋 Story 概述

**Story ID**: STORY-042  
**Epic**: EPIC-008 (Habit Tracking)  
**优先级**: P3 (体验增强)  
**预估工时**: 1 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-038 ✅ (Habit Check-in & Streak)

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 通过解锁成就、获得奖励、查看排行榜来激励自己  
**以便于** 保持习惯养成的动力，享受进步的乐趣

---

## 📋 验收标准

### 功能验收 - 成就徽章系统

- [ ] 预定义成就徽章库（50+ 种）
- [ ] 自动检测并解锁成就
- [ ] 成就分类：新手、进阶、专家、传奇
- [ ] 成就解锁动画和庆祝特效
- [ ] 展示已解锁/未解锁徽章
- [ ] 徽章详情：解锁条件、进度、获得时间

### 功能验收 - 里程碑庆祝

- [ ] 连续打卡里程碑：7天、30天、100天、365天
- [ ] 习惯数量里程碑：养成 5/10/20 个习惯
- [ ] 完成率里程碑：月度 90%、年度 80%
- [ ] 里程碑达成时全屏庆祝动画
- [ ] 自动生成庆祝海报（可分享）

### 功能验收 - 积分系统

- [ ] 打卡获得积分（基础 10 分）
- [ ] 连续打卡加成（Streak 倍数）
- [ ] 完成困难习惯额外积分
- [ ] 积分用途：解锁主题、头像、特权
- [ ] 积分历史和排行榜

### 功能验收 - 排行榜（可选社交）

- [ ] 个人历史排行榜
- [ ] 好友排行榜（需授权）
- [ ] 社区周榜/月榜（匿名可选）
- [ ] 多维度排行：Streak、总天数、积分
- [ ] 隐私保护：可选择不参与

### 功能验收 - 激励语录

- [ ] 每日激励语录推送
- [ ] 根据用户状态智能推送（如 Streak 中断时鼓励）
- [ ] 多语言语录库
- [ ] 用户可收藏喜欢的语录

### 技术验收

- [ ] 成就检测实时性 < 1 秒
- [ ] 庆祝动画流畅 60fps
- [ ] 排行榜数据加密传输
- [ ] 隐私设置严格遵守

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/domain-client/src/habit/
interface Achievement {
  id: string;
  type: 'streak' | 'count' | 'rate' | 'special';
  name: string;
  description: string;
  icon: string;                  // emoji 或图标 URL
  category: 'novice' | 'intermediate' | 'expert' | 'legendary';
  requirement: AchievementRequirement;
  points: number;                // 解锁获得的积分
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockMessage: string;         // 解锁时的祝贺语
}

interface AchievementRequirement {
  type: 'streak' | 'total_days' | 'completion_rate' | 'habit_count' | 'custom';
  target: number;
  habitId?: string;              // 特定习惯（可选）
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;              // 当前进度 0-100
  notified: boolean;
  celebrated: boolean;           // 是否已播放庆祝动画
}

interface Milestone {
  id: string;
  type: 'streak' | 'habit_count' | 'completion_rate';
  value: number;                 // 如 7 天、30 天
  name: string;
  icon: string;
  celebrationStyle: 'confetti' | 'fireworks' | 'balloons';
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;                // 正数=获得，负数=消费
  reason: string;
  relatedId?: string;            // 关联的打卡/成就 ID
  createdAt: Date;
}

interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;       // 可用积分（扣除已消费）
  level: number;                 // 等级（基于总积分）
  nextLevelPoints: number;       // 下一级所需积分
}

interface Leaderboard {
  type: 'streak' | 'total_days' | 'points';
  timeframe: 'weekly' | 'monthly' | 'all-time';
  entries: LeaderboardEntry[];
  updatedAt: Date;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;              // 可匿名显示
  avatar?: string;
  value: number;
  change: number;                // 排名变化
  isCurrentUser: boolean;
}

interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: 'encouragement' | 'persistence' | 'success' | 'failure';
  language: 'zh-CN' | 'en-US';
}

interface Reward {
  id: string;
  type: 'theme' | 'avatar' | 'feature';
  name: string;
  description: string;
  pointsCost: number;
  unlockable: boolean;
  previewImage?: string;
}
```

### 成就定义

```typescript
// 预定义成就库
const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // 新手成就
  {
    id: 'first-checkin',
    type: 'special',
    name: '破冰者',
    description: '完成第一次习惯打卡',
    icon: '🎉',
    category: 'novice',
    requirement: { type: 'total_days', target: 1 },
    points: 10,
    rarity: 'common',
    unlockMessage: '恭喜完成第一次打卡！习惯养成之旅开始了！',
  },
  {
    id: 'streak-3',
    type: 'streak',
    name: '初露锋芒',
    description: '连续打卡 3 天',
    icon: '🔥',
    category: 'novice',
    requirement: { type: 'streak', target: 3 },
    points: 30,
    rarity: 'common',
    unlockMessage: '3 天连续！你已经开始养成习惯了！',
  },
  
  // 进阶成就
  {
    id: 'streak-7',
    type: 'streak',
    name: '一周战士',
    description: '连续打卡 7 天',
    icon: '💪',
    category: 'intermediate',
    requirement: { type: 'streak', target: 7 },
    points: 70,
    rarity: 'rare',
    unlockMessage: '坚持一周！你的毅力令人钦佩！',
  },
  {
    id: 'habit-5',
    type: 'count',
    name: '多面手',
    description: '同时养成 5 个习惯',
    icon: '🎯',
    category: 'intermediate',
    requirement: { type: 'habit_count', target: 5 },
    points: 100,
    rarity: 'rare',
    unlockMessage: '5 个习惯同时进行！你真是时间管理大师！',
  },
  
  // 专家成就
  {
    id: 'streak-30',
    type: 'streak',
    name: '月度冠军',
    description: '连续打卡 30 天',
    icon: '👑',
    category: 'expert',
    requirement: { type: 'streak', target: 30 },
    points: 300,
    rarity: 'epic',
    unlockMessage: '30 天！你已经将习惯融入生活！',
  },
  {
    id: 'completion-90',
    type: 'rate',
    name: '完美主义者',
    description: '月度完成率达到 90%',
    icon: '⭐',
    category: 'expert',
    requirement: { 
      type: 'completion_rate', 
      target: 90,
      timeframe: 'monthly',
    },
    points: 200,
    rarity: 'epic',
    unlockMessage: '90% 完成率！追求极致的你值得这份荣誉！',
  },
  
  // 传奇成就
  {
    id: 'streak-100',
    type: 'streak',
    name: '百日传奇',
    description: '连续打卡 100 天',
    icon: '🏆',
    category: 'legendary',
    requirement: { type: 'streak', target: 100 },
    points: 1000,
    rarity: 'legendary',
    unlockMessage: '100 天！你已经是习惯养成大师了！',
  },
  {
    id: 'streak-365',
    type: 'streak',
    name: '年度神话',
    description: '连续打卡 365 天',
    icon: '🌟',
    category: 'legendary',
    requirement: { type: 'streak', target: 365 },
    points: 3650,
    rarity: 'legendary',
    unlockMessage: '整整一年！你创造了属于自己的传奇！',
  },
  
  // 特殊成就
  {
    id: 'early-bird',
    type: 'special',
    name: '早起的鸟儿',
    description: '连续 7 天在早上 6 点前打卡',
    icon: '🐦',
    category: 'intermediate',
    requirement: { type: 'custom', target: 7 },
    points: 150,
    rarity: 'rare',
    unlockMessage: '早起的鸟儿有虫吃！你是时间的主人！',
  },
  {
    id: 'night-owl',
    type: 'special',
    name: '夜猫子',
    description: '连续 7 天在晚上 10 点后打卡',
    icon: '🦉',
    category: 'intermediate',
    requirement: { type: 'custom', target: 7 },
    points: 150,
    rarity: 'rare',
    unlockMessage: '深夜依然坚持！你的决心令人敬佩！',
  },
];
```

### 服务层

```typescript
// packages/application-client/src/habit/services/AchievementService.ts
export class AchievementService {
  // 成就查询
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<number>;
  
  // 成就检测
  checkAchievements(
    userId: string,
    context: AchievementContext
  ): Promise<Achievement[]>;
  
  unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<UserAchievement>;
  
  // 成就分类
  getAchievementsByCategory(
    category: string
  ): Promise<Achievement[]>;
  
  getUnlockedAchievements(userId: string): Promise<Achievement[]>;
  getLockedAchievements(userId: string): Promise<Achievement[]>;
  
  // 事件
  onAchievementUnlocked: (achievement: Achievement) => void;
  onMilestoneReached: (milestone: Milestone) => void;
}

// packages/application-client/src/habit/services/PointsService.ts
export class PointsService {
  // 积分操作
  addPoints(
    userId: string,
    amount: number,
    reason: string
  ): Promise<PointsTransaction>;
  
  deductPoints(
    userId: string,
    amount: number,
    reason: string
  ): Promise<PointsTransaction>;
  
  // 积分查询
  getUserPoints(userId: string): Promise<UserPoints>;
  getPointsHistory(
    userId: string,
    limit?: number
  ): Promise<PointsTransaction[]>;
  
  // 等级系统
  calculateLevel(totalPoints: number): number;
  getNextLevelPoints(currentLevel: number): number;
  
  // 奖励兑换
  redeemReward(userId: string, rewardId: string): Promise<void>;
  getAvailableRewards(userId: string): Promise<Reward[]>;
}

// packages/application-client/src/habit/services/LeaderboardService.ts
export class LeaderboardService {
  // 排行榜
  getLeaderboard(
    type: 'streak' | 'total_days' | 'points',
    timeframe: 'weekly' | 'monthly' | 'all-time'
  ): Promise<Leaderboard>;
  
  getUserRank(userId: string, type: string): Promise<number>;
  
  // 好友排行
  getFriendsLeaderboard(userId: string): Promise<Leaderboard>;
  
  // 隐私设置
  updatePrivacySettings(
    userId: string,
    settings: PrivacySettings
  ): Promise<void>;
}

// packages/application-client/src/habit/services/MotivationService.ts
export class MotivationService {
  // 语录
  getDailyQuote(): Promise<MotivationalQuote>;
  getQuoteByContext(
    context: 'encouragement' | 'persistence' | 'success' | 'failure'
  ): Promise<MotivationalQuote>;
  
  getFavoriteQuotes(userId: string): Promise<MotivationalQuote[]>;
  toggleFavorite(
    userId: string,
    quoteId: string
  ): Promise<void>;
}
```

### 成就检测算法

```typescript
// 自动检测成就解锁
class AchievementDetector {
  async checkForUnlocks(
    userId: string,
    event: 'checkin' | 'streak' | 'milestone'
  ): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    const allAchievements = await this.getAllAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    
    for (const achievement of allAchievements) {
      // 跳过已解锁的
      if (unlockedIds.has(achievement.id)) continue;
      
      // 检查解锁条件
      const isMet = await this.checkRequirement(
        userId,
        achievement.requirement
      );
      
      if (isMet) {
        await this.unlockAchievement(userId, achievement.id);
        unlocked.push(achievement);
      }
    }
    
    return unlocked;
  }
  
  private async checkRequirement(
    userId: string,
    requirement: AchievementRequirement
  ): Promise<boolean> {
    switch (requirement.type) {
      case 'streak': {
        const streak = await this.getCurrentStreak(userId, requirement.habitId);
        return streak >= requirement.target;
      }
      
      case 'total_days': {
        const totalDays = await this.getTotalDays(userId, requirement.habitId);
        return totalDays >= requirement.target;
      }
      
      case 'completion_rate': {
        const rate = await this.getCompletionRate(
          userId,
          requirement.timeframe
        );
        return rate >= requirement.target;
      }
      
      case 'habit_count': {
        const count = await this.getActiveHabitCount(userId);
        return count >= requirement.target;
      }
      
      case 'custom': {
        // 自定义逻辑（如早起、夜猫子等）
        return this.checkCustomRequirement(userId, requirement);
      }
      
      default:
        return false;
    }
  }
}

// 积分计算规则
class PointsCalculator {
  calculateCheckInPoints(checkIn: HabitCheckIn, streak: number): number {
    let points = 10; // 基础分
    
    // Streak 加成（每连续一天 +1 分，最多 +50）
    const streakBonus = Math.min(streak - 1, 50);
    points += streakBonus;
    
    // 困难习惯加成
    if (this.isDifficultHabit(checkIn.habitId)) {
      points *= 1.5;
    }
    
    // 早起加成（6点前）
    if (checkIn.checkedAt.getHours() < 6) {
      points *= 1.2;
    }
    
    return Math.floor(points);
  }
  
  calculateLevel(totalPoints: number): number {
    // 等级公式：level = floor(sqrt(totalPoints / 100))
    return Math.floor(Math.sqrt(totalPoints / 100));
  }
  
  getNextLevelPoints(currentLevel: number): number {
    // 下一级所需总积分
    return (currentLevel + 1) ** 2 * 100;
  }
}
```

### UI 组件

#### 成就展示页面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🏆 成就与奖励                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [ 全部 ]  [ 新手 ]  [ 进阶 ]  [ 专家 ]  [ 传奇 ]                            │
│                                                                              │
│  你的等级: Lv.12  (2,500 / 3,200 积分)                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│                                                                              │
│  已解锁: 23/50 成就                                                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  🎉 已解锁                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  🎉 破冰者             💪 初露锋芒          🔥 一周战士          │       │
│  │  完成第一次打卡        连续 3 天            连续 7 天            │       │
│  │  2025-10-01            2025-10-03           2025-10-07           │       │
│  │                                                                  │       │
│  │  👑 月度冠军           ⭐ 完美主义者        🏆 百日传奇          │       │
│  │  连续 30 天            90% 完成率           连续 100 天          │       │
│  │  2025-11-06            2025-11-30           [进度: 87/100]       │       │
│  │                                                                  │       │
│  │  🐦 早起的鸟儿         🎯 多面手            💎 习惯大师          │       │
│  │  早上 6 点前打卡       5 个习惯             10 个习惯           │       │
│  │  2025-11-15            2025-10-20           2025-12-01           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  🔒 未解锁 (进度追踪)                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  🏆 百日传奇           🌟 年度神话          🦉 夜猫子            │       │
│  │  连续 100 天           连续 365 天          晚上 10 点后         │       │
│  │  进度: 87%  ━━━━━━━━░░  进度: 23%  ━━░░░░░░░  进度: 42%  ━━━━░░░░│       │
│  │                                                                  │       │
│  │  🎨 艺术家             📚 学霸              💪 铁人             │       │
│  │  创意类习惯 20 天      学习类习惯 50 天     健身类习惯 100 天   │       │
│  │  进度: 60%  ━━━━━━░░░░  进度: 35%  ━━━░░░░░░  进度: 78%  ━━━━━━━░│       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 成就解锁动画

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│              ✨ ✨ ✨ ✨ ✨                         │
│                                                      │
│                  🎉 成就解锁！🎉                     │
│                                                      │
│                      👑                              │
│                   月度冠军                           │
│                                                      │
│              连续打卡 30 天达成！                    │
│                                                      │
│              🎁 获得 300 积分 🎁                     │
│                                                      │
│        你已经将习惯融入生活！继续加油！              │
│                                                      │
│             [ 分享成就 ]  [ 继续 ]                   │
│                                                      │
│              ✨ ✨ ✨ ✨ ✨                         │
└─────────────────────────────────────────────────────┘
```

#### 积分中心

```
┌─────────────────────────────────────────────────────┐
│              💎 积分中心                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  你的积分:  2,500 分                                 │
│  等级: Lv.12  (距离 Lv.13 还需 700 分)               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                                      │
│  📊 积分历史                                         │
│  ┌────────────────────────────────────────────┐     │
│  │ 2025-12-08  +15  晨跑打卡 (7天连续)        │     │
│  │ 2025-12-08  +12  阅读打卡 (5天连续)        │     │
│  │ 2025-12-07  +300 解锁成就"月度冠军"        │     │
│  │ 2025-12-07  +14  晨跑打卡 (6天连续)        │     │
│  │ 2025-12-07  -100 兑换主题"深邃星空"        │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  🎁 可兑换奖励                                       │
│  ┌────────────────────────────────────────────┐     │
│  │ 🎨 主题：深邃星空     500 分  [已兑换]     │     │
│  │ 🖼️  头像框：金色光环   800 分  [兑换]       │     │
│  │ ⭐ 特权：数据导出     1000 分  [兑换]       │     │
│  │ 🔮 主题：赛博朋克    1500 分  [兑换]       │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 排行榜

```
┌─────────────────────────────────────────────────────┐
│              🏆 排行榜                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [ 本周 ]  [ 本月 ]  [ 全部 ]                        │
│  [ Streak ]  [ 总天数 ]  [ 积分 ]                    │
│                                                      │
│  🌍 全球周榜 - 最长 Streak                           │
│  ┌────────────────────────────────────────────┐     │
│  │ 1. 🥇 习惯大师        187 天  ↗ +2         │     │
│  │ 2. 🥈 晨跑达人        156 天  ↗ +1         │     │
│  │ 3. 🥉 坚持不懈        142 天  ↘ -1         │     │
│  │ 4.    努力中         128 天  → 持平        │     │
│  │ 5.    毅力之星       115 天  ↗ +3         │     │
│  │ ...                                        │     │
│  │ 28. 😊 你            87 天   ↗ +5  ⭐      │     │
│  │ ...                                        │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  👥 好友榜 (需添加好友)                              │
│  ┌────────────────────────────────────────────┐     │
│  │ 1. 😊 你              87 天                │     │
│  │ 2. 👤 好友A          65 天                 │     │
│  │ 3. 👤 好友B          52 天                 │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  隐私设置:                                           │
│  [ ✓ ] 参与全球排行榜                                │
│  [   ] 匿名显示                                      │
│  [ ✓ ] 允许好友查看我的进度                          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 每日激励

```
┌─────────────────────────────────────────────────────┐
│              💡 今日激励                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│     "成功就是日复一日那一点点小小努力的积累。"       │
│                                                      │
│                         —— 罗伯特·克利尔             │
│                                                      │
│                    [ ♥ 收藏 ]                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
packages/domain-client/src/habit/
  ├── aggregates/Achievement.ts
  ├── aggregates/UserAchievement.ts
  ├── aggregates/Milestone.ts
  ├── value-objects/PointsTransaction.ts
  ├── value-objects/UserPoints.ts
  ├── value-objects/Leaderboard.ts
  ├── value-objects/MotivationalQuote.ts
  ├── value-objects/Reward.ts
  └── constants/AchievementDefinitions.ts

packages/application-client/src/habit/
  ├── services/AchievementService.ts
  ├── services/PointsService.ts
  ├── services/LeaderboardService.ts
  ├── services/MotivationService.ts
  └── utils/
      ├── AchievementDetector.ts
      └── PointsCalculator.ts

apps/desktop/src/renderer/components/habit/motivation/
  ├── AchievementGallery.tsx
  ├── AchievementCard.tsx
  ├── AchievementUnlockModal.tsx
  ├── MilestoneModal.tsx
  ├── PointsCenter.tsx
  ├── PointsHistory.tsx
  ├── RewardShop.tsx
  ├── Leaderboard.tsx
  ├── DailyQuote.tsx
  └── CelebrationAnimation.tsx

apps/desktop/src/renderer/hooks/
  ├── useAchievements.ts
  ├── usePoints.ts
  └── useLeaderboard.ts

apps/desktop/src/renderer/animations/
  └── celebrationEffects.ts
```

### 修改文件

```
packages/application-client/src/habit/services/HabitCheckInService.ts
  └── 集成积分奖励和成就检测

apps/desktop/src/renderer/routes.tsx
  └── 添加成就和排行榜页面路由

apps/desktop/src/renderer/components/Layout.tsx
  └── 添加积分和等级显示
```

---

## 🧪 测试要点

### 单元测试

- 成就解锁条件判断
- 积分计算规则
- 等级计算公式
- 排行榜排序逻辑

### 集成测试

- 打卡后成就自动检测
- 积分自动发放
- 成就解锁通知
- 排行榜数据同步

### E2E 测试

- 完整成就解锁流程
- 积分兑换奖励
- 查看排行榜
- 分享成就

### 性能测试

- 成就检测响应时间
- 庆祝动画流畅度
- 排行榜加载速度

---

## 📝 注意事项

1. **激励平衡**：奖励要足够吸引，但不能让用户为了积分而打卡
2. **公平性**：排行榜要防止作弊，考虑验证机制
3. **隐私保护**：排行榜参与要可选，尊重用户隐私
4. **动画性能**：庆祝动画要流畅但不占用过多资源
5. **奖励价值**：虚拟奖励要有实际价值（功能解锁、美化等）
6. **防止沉迷**：不要过度游戏化，保持工具本质
7. **文化敏感**：语录和成就名称要注意文化差异
8. **成就难度**：设置要合理，既有挑战又可达成

---

## 🚀 未来扩展

1. **社交挑战**：好友间发起习惯挑战
2. **团队协作**：团队共同养成习惯
3. **NFT 成就**：区块链记录稀有成就
4. **AR 徽章**：AR 展示成就徽章
5. **语音庆祝**：成就解锁时语音祝贺
6. **个性化奖励**：根据用户喜好推荐奖励
7. **慈善捐赠**：积分可换成慈善捐款
8. **实体奖品**：高积分兑换实体商品
