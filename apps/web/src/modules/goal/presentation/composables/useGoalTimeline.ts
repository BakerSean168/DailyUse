/**
 * useGoalTimeline
 *
 * 目标时间线 Composable
 * 处理时间线数据、播放控制和状态管理
 */

import { ref, computed, watch, type Ref } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import {
  generateTimelineFromGoal,
  interpolateSnapshots,
  DEFAULT_TIMELINE_PLAY_STATE,
  type TimelineData,
  type TimelineSnapshot,
  type TimelinePlayState,
} from '../../application/services/GoalTimelineService';
import { useWeightSnapshot } from './useWeightSnapshot';

export function useGoalTimeline(goal: Ref<GoalContracts.GoalClientDTO | null>) {
  // ==================== State ====================

  const timelineData = ref<TimelineData | null>(null);
  const playState = ref<TimelinePlayState>({ ...DEFAULT_TIMELINE_PLAY_STATE });
  const interpolationProgress = ref(0); // 0-1, 用于快照间插值

  const { snapshots, fetchGoalSnapshots, isLoading } = useWeightSnapshot();

  // ==================== Computed ====================

  const currentSnapshot = computed<TimelineSnapshot | null>(() => {
    if (!timelineData.value || playState.value.currentIndex < 0) {
      return null;
    }

    const snapshots = timelineData.value.snapshots;
    const currentIndex = playState.value.currentIndex;

    // 如果没有插值进度，直接返回当前快照
    if (interpolationProgress.value === 0) {
      return snapshots[currentIndex] || null;
    }

    // 如果有插值进度，计算插值快照
    const nextIndex = currentIndex + 1;
    if (nextIndex >= snapshots.length) {
      return snapshots[currentIndex] || null;
    }

    return interpolateSnapshots(
      snapshots[currentIndex],
      snapshots[nextIndex],
      interpolationProgress.value,
    );
  });

  const hasTimeline = computed(() => {
    return timelineData.value && timelineData.value.snapshots.length > 1;
  });

  const canPlay = computed(() => {
    return hasTimeline.value && !playState.value.isPlaying;
  });

  const canPause = computed(() => {
    return playState.value.isPlaying;
  });

  // ==================== Methods ====================

  /**
   * 加载时间线数据
   */
  async function loadTimeline(goalUuid: string) {
    if (!goal.value) return;

    try {
      // 加载权重快照
      await fetchGoalSnapshots(goalUuid, 1, 100); // 获取最近 100 个快照

      // 将 ServerDTO 转换为 ClientDTO（简化版本）
      const clientSnapshots: GoalContracts.KeyResultWeightSnapshotClientDTO[] = snapshots.value.map(
        (s) => ({
          ...s,
          snapshotTimeText: new Date(s.snapshotTime).toLocaleString('zh-CN'),
          triggerText: s.trigger === 'manual' ? '手动' : s.trigger === 'auto' ? '自动' : '其他',
          weightChangeText: `${s.oldWeight}% → ${s.newWeight}%`,
          weightChangeColor: s.weightDelta > 0 ? '#4caf50' : s.weightDelta < 0 ? '#f44336' : '#999',
        }),
      );

      // 生成时间线
      timelineData.value = generateTimelineFromGoal(goal.value, clientSnapshots);

      // 重置播放状态
      playState.value = { ...DEFAULT_TIMELINE_PLAY_STATE };
      interpolationProgress.value = 0;
    } catch (error) {
      console.error('Failed to load timeline:', error);
      throw error;
    }
  }

  /**
   * 切换播放状态
   */
  function togglePlay() {
    playState.value.isPlaying = !playState.value.isPlaying;
  }

  /**
   * 暂停播放
   */
  function pause() {
    playState.value.isPlaying = false;
  }

  /**
   * 播放
   */
  function play() {
    if (!hasTimeline.value) return;

    // 如果已经到达末尾，重新开始
    if (playState.value.currentIndex >= (timelineData.value?.snapshots.length || 0) - 1) {
      playState.value.currentIndex = 0;
    }

    playState.value.isPlaying = true;
  }

  /**
   * 跳转到指定快照
   */
  function seekToSnapshot(index: number) {
    if (!timelineData.value) return;

    const maxIndex = timelineData.value.snapshots.length - 1;
    playState.value.currentIndex = Math.max(0, Math.min(index, maxIndex));
    interpolationProgress.value = 0;
  }

  /**
   * 下一个快照
   */
  function nextSnapshot() {
    if (!timelineData.value) return;

    const maxIndex = timelineData.value.snapshots.length - 1;
    if (playState.value.currentIndex < maxIndex) {
      playState.value.currentIndex++;
      interpolationProgress.value = 0;
    } else if (playState.value.loop) {
      playState.value.currentIndex = 0;
      interpolationProgress.value = 0;
    } else {
      playState.value.isPlaying = false;
    }
  }

  /**
   * 上一个快照
   */
  function previousSnapshot() {
    if (!timelineData.value) return;

    if (playState.value.currentIndex > 0) {
      playState.value.currentIndex--;
      interpolationProgress.value = 0;
    }
  }

  /**
   * 设置播放速度
   */
  function setSpeed(speed: 0.5 | 1 | 2) {
    playState.value.speed = speed;
  }

  /**
   * 切换循环播放
   */
  function toggleLoop() {
    playState.value.loop = !playState.value.loop;
  }

  /**
   * 重置时间线
   */
  function reset() {
    playState.value = { ...DEFAULT_TIMELINE_PLAY_STATE };
    interpolationProgress.value = 0;
  }

  /**
   * 设置插值进度（用于平滑过渡）
   */
  function setInterpolationProgress(progress: number) {
    interpolationProgress.value = Math.max(0, Math.min(1, progress));
  }

  // ==================== Watchers ====================

  // 当目标变化时，重新加载时间线
  watch(
    goal,
    (newGoal) => {
      if (newGoal) {
        loadTimeline(newGoal.uuid).catch(console.error);
      } else {
        timelineData.value = null;
        reset();
      }
    },
    { immediate: true },
  );

  // ==================== Return ====================

  return {
    // State
    timelineData: computed(() => timelineData.value),
    currentSnapshot,
    playState: computed(() => playState.value),
    interpolationProgress: computed(() => interpolationProgress.value),
    loadingSnapshots: isLoading,

    // Computed
    hasTimeline,
    canPlay,
    canPause,

    // Methods
    loadTimeline,
    togglePlay,
    pause,
    play,
    seekToSnapshot,
    nextSnapshot,
    previousSnapshot,
    setSpeed,
    toggleLoop,
    reset,
    setInterpolationProgress,

    // Refs (for v-model)
    currentIndex: computed({
      get: () => playState.value.currentIndex,
      set: (value: number) => {
        playState.value.currentIndex = value;
        interpolationProgress.value = 0;
      },
    }),
    isPlaying: computed({
      get: () => playState.value.isPlaying,
      set: (value: boolean) => {
        playState.value.isPlaying = value;
      },
    }),
    speed: computed({
      get: () => playState.value.speed,
      set: (value: 0.5 | 1 | 2) => {
        playState.value.speed = value;
      },
    }),
    loop: computed({
      get: () => playState.value.loop,
      set: (value: boolean) => {
        playState.value.loop = value;
      },
    }),
  };
}
