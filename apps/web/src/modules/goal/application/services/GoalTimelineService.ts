/**
 * GoalTimelineService
 *
 * 目标时间线服务，用于获取和处理目标历史快照数据
 * 支持基于权重快照的时间线动画
 */

import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';

/**
 * 时间线快照点
 * 表示某个时间点的目标状态
 */
export interface TimelineSnapshot {
  /** 快照时间戳 (ms) */
  timestamp: number;
  /** 快照时间（可读格式） */
  date: Date;
  /** 目标 UUID */
  goalUuid: string;
  /** 快照数据 */
  data: {
    /** 关键结果及其权重 */
    keyResults: Array<{
      uuid: string;
      title: string;
      weight: number;
      progress: number;
    }>;
    /** 总权重 */
    totalWeight: number;
    /** 总进度 */
    totalProgress: number;
  };
  /** 快照触发原因 */
  trigger?: string;
  /** 变更描述 */
  reason?: string;
}

/**
 * 时间线数据
 * 包含所有快照点和元数据
 */
export interface TimelineData {
  /** 目标 UUID */
  goalUuid: string;
  /** 目标标题 */
  goalTitle: string;
  /** 快照列表（按时间排序） */
  snapshots: TimelineSnapshot[];
  /** 时间范围 */
  timeRange: {
    start: number;
    end: number;
  };
  /** 统计信息 */
  stats: {
    totalSnapshots: number;
    totalChanges: number;
    avgWeightChange: number;
  };
}

/**
 * 时间线播放状态
 */
export interface TimelinePlayState {
  /** 当前快照索引 */
  currentIndex: number;
  /** 播放状态 */
  isPlaying: boolean;
  /** 播放速度（倍数） */
  speed: 0.5 | 1 | 2;
  /** 循环播放 */
  loop: boolean;
}

/**
 * 从目标数据和权重快照生成时间线
 * @param goal 目标数据
 * @param weightSnapshots 权重快照列表
 */
export function generateTimelineFromGoal(
  goal: GoalClientDTO,
  weightSnapshots: KeyResultWeightSnapshotClientDTO[],
): TimelineData {
  const snapshots: TimelineSnapshot[] = [];

  // 1. 创建初始快照（目标创建时）
  const initialSnapshot: TimelineSnapshot = {
    timestamp: goal.createdAt,
    date: new Date(goal.createdAt),
    goalUuid: goal.uuid,
    data: {
      keyResults:
        goal.keyResults?.map((kr) => ({
          uuid: kr.uuid,
          title: kr.title,
          weight: kr.weight || 0,
          progress: kr.progressPercentage || 0,
        })) || [],
      totalWeight: goal.keyResults?.reduce((sum, kr) => sum + (kr.weight || 0), 0) || 0,
      totalProgress: goal.overallProgress || 0,
    },
    trigger: 'initial',
    reason: '目标创建',
  };

  snapshots.push(initialSnapshot);

  // 2. 从 weight snapshots 生成快照
  if (goal.keyResults && weightSnapshots.length > 0) {
    // 按时间排序权重快照
    const sortedSnapshots = [...weightSnapshots].sort(
      (a, b) => Number(a.snapshotTime) - Number(b.snapshotTime),
    );

    // 为每个 weight change 创建快照
    const currentWeights = new Map<string, number>();
    goal.keyResults.forEach((kr) => {
      currentWeights.set(kr.uuid, kr.weight || 0);
    });

    sortedSnapshots.forEach((ws) => {
      // 更新权重
      currentWeights.set(ws.keyResultUuid, ws.newWeight);

      // 查找对应的 KeyResult
      const kr = goal.keyResults?.find((k) => k.uuid === ws.keyResultUuid);

      // 创建快照
      const snapshot: TimelineSnapshot = {
        timestamp: Number(ws.snapshotTime),
        date: new Date(Number(ws.snapshotTime)),
        goalUuid: goal.uuid,
        data: {
          keyResults: goal.keyResults!.map((k) => ({
            uuid: k.uuid,
            title: k.title,
            weight: currentWeights.get(k.uuid) || 0,
            progress: k.progressPercentage || 0,
          })),
          totalWeight: Array.from(currentWeights.values()).reduce((sum, w) => sum + w, 0),
          totalProgress: goal.overallProgress || 0,
        },
        trigger: ws.trigger,
        reason: ws.reason || (kr ? `${kr.title}: ${ws.oldWeight}% → ${ws.newWeight}%` : '权重调整'),
      };

      snapshots.push(snapshot);
    });
  }

  // 3. 添加当前状态快照
  const currentSnapshot: TimelineSnapshot = {
    timestamp: Date.now(),
    date: new Date(),
    goalUuid: goal.uuid,
    data: {
      keyResults:
        goal.keyResults?.map((kr) => ({
          uuid: kr.uuid,
          title: kr.title,
          weight: kr.weight || 0,
          progress: kr.progressPercentage || 0,
        })) || [],
      totalWeight: goal.keyResults?.reduce((sum, kr) => sum + (kr.weight || 0), 0) || 0,
      totalProgress: goal.overallProgress || 0,
    },
    trigger: 'current',
    reason: '当前状态',
  };

  snapshots.push(currentSnapshot);

  // 4. 确保快照按时间排序
  snapshots.sort((a, b) => a.timestamp - b.timestamp);

  // 5. 计算统计信息
  const totalChanges = snapshots.length - 2; // 排除初始和当前快照
  const weightChanges = snapshots.slice(1).map((snapshot, idx) => {
    const prevSnapshot = snapshots[idx];
    return Math.abs(snapshot.data.totalWeight - prevSnapshot.data.totalWeight);
  });
  const avgWeightChange =
    weightChanges.length > 0
      ? weightChanges.reduce((sum, change) => sum + change, 0) / weightChanges.length
      : 0;

  return {
    goalUuid: goal.uuid,
    goalTitle: goal.title,
    snapshots,
    timeRange: {
      start: snapshots[0].timestamp,
      end: snapshots[snapshots.length - 1].timestamp,
    },
    stats: {
      totalSnapshots: snapshots.length,
      totalChanges,
      avgWeightChange,
    },
  };
}

/**
 * 在两个快照之间进行插值
 * 用于创建平滑的过渡动画
 */
export function interpolateSnapshots(
  snapshot1: TimelineSnapshot,
  snapshot2: TimelineSnapshot,
  progress: number, // 0-1
): TimelineSnapshot {
  return {
    timestamp: snapshot1.timestamp + (snapshot2.timestamp - snapshot1.timestamp) * progress,
    date: new Date(snapshot1.timestamp + (snapshot2.timestamp - snapshot1.timestamp) * progress),
    goalUuid: snapshot1.goalUuid,
    data: {
      keyResults: snapshot1.data.keyResults.map((kr1, idx) => {
        const kr2 = snapshot2.data.keyResults[idx];
        if (!kr2) return kr1;

        return {
          uuid: kr1.uuid,
          title: kr1.title,
          weight: kr1.weight + (kr2.weight - kr1.weight) * progress,
          progress: kr1.progress + (kr2.progress - kr1.progress) * progress,
        };
      }),
      totalWeight:
        snapshot1.data.totalWeight +
        (snapshot2.data.totalWeight - snapshot1.data.totalWeight) * progress,
      totalProgress:
        snapshot1.data.totalProgress +
        (snapshot2.data.totalProgress - snapshot1.data.totalProgress) * progress,
    },
    trigger: progress < 0.5 ? snapshot1.trigger : snapshot2.trigger,
    reason: progress < 0.5 ? snapshot1.reason : snapshot2.reason,
  };
}

/**
 * 格式化时间线时间戳
 */
export function formatTimelineTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

/**
 * 计算时间线播放持续时间
 * @param snapshotCount 快照数量
 * @param speed 播放速度
 * @returns 持续时间（毫秒）
 */
export function calculatePlayDuration(snapshotCount: number, speed: number): number {
  const baseInterval = 1000; // 每个快照间隔 1 秒
  return ((snapshotCount - 1) * baseInterval) / speed;
}

/**
 * 默认时间线播放状态
 */
export const DEFAULT_TIMELINE_PLAY_STATE: TimelinePlayState = {
  currentIndex: 0,
  isPlaying: false,
  speed: 1,
  loop: false,
};

