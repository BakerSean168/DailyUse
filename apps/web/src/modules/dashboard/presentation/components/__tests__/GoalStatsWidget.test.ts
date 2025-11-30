/**
 * GoalStatsWidget 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GoalStatsWidget from '../GoalStatsWidget.vue';
import { WidgetType } from '@dailyuse/contracts/dashboard';
import type { WidgetConfig, DashboardConfigServerDTO } from '@dailyuse/contracts/dashboard';

// Mock goalStore
const mockGoalStatistics = {
  total: 10,
  active: 3,
  inProgress: 3,
  completed: 5,
  paused: 1,
  archived: 1,
};

vi.mock('../../../../goal/presentation/stores/goalStore', () => ({
  useGoalStore: vi.fn(() => ({
    getGoalStatistics: mockGoalStatistics,
  })),
}));

describe('GoalStatsWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染 Widget', () => {
      const wrapper = mount(GoalStatsWidget);

      expect(wrapper.find('.goal-stats-widget').exists()).toBe(true);
      expect(wrapper.find('.widget-title h3').text()).toBe('目标统计');
    });

    it('应该显示完成率 (非 small 尺寸)', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').exists()).toBe(true);
      expect(wrapper.find('.completion-rate-label').text()).toBe('完成率');
    });

    it('应该在 small 尺寸时隐藏完成率', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-completion-rate').exists()).toBe(false);
    });
  });

  describe('尺寸变体', () => {
    it('应该应用 small 尺寸样式', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-size-small').exists()).toBe(true);
      expect(wrapper.find('.stats-compact').exists()).toBe(true);
    });

    it('应该应用 medium 尺寸样式', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.widget-size-medium').exists()).toBe(true);
      expect(wrapper.find('.stats-grid').exists()).toBe(true);
    });

    it('应该应用 large 尺寸样式', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.LARGE },
      });

      expect(wrapper.find('.widget-size-large').exists()).toBe(true);
      expect(wrapper.find('.stats-grid-large').exists()).toBe(true);
    });

    it('默认尺寸应该是 medium', () => {
      const wrapper = mount(GoalStatsWidget);

      expect(wrapper.find('.widget-size-medium').exists()).toBe(true);
    });
  });

  describe('统计数据显示', () => {
    it('应该显示进行中目标数量', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const inProgressCard = statCards.find((card) => card.text().includes('进行中'));

      expect(inProgressCard).toBeDefined();
      expect(inProgressCard?.text()).toContain('3');
    });

    it('应该显示已完成目标数量', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const completedCard = statCards.find((card) => card.text().includes('已完成'));

      expect(completedCard).toBeDefined();
      expect(completedCard?.text()).toContain('5');
    });

    it('应该显示已归档目标数量', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const archivedCard = statCards.find((card) => card.text().includes('已归档'));

      expect(archivedCard).toBeDefined();
      expect(archivedCard?.text()).toContain('1');
    });

    it('应该显示总目标数', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.total-value').text()).toBe('10');
    });

    it('应该正确计算完成率', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      // 完成率 = (5 / 10) * 100 = 50%
      expect(wrapper.find('.completion-rate-value').text()).toBe('50%');
    });
  });

  describe('Small 尺寸紧凑显示', () => {
    it('应该显示紧凑统计信息', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      const compactItems = wrapper.findAll('.stat-item-compact');

      expect(compactItems).toHaveLength(3);
    });

    it('应该显示总计、完成和进行中', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      const text = wrapper.text();

      expect(text).toContain('总计');
      expect(text).toContain('完成');
      expect(text).toContain('进行中');
      expect(text).toContain('10'); // total
      expect(text).toContain('5'); // completed
      expect(text).toContain('3'); // inProgress
    });

    it('应该隐藏底部总计区域', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-footer').exists()).toBe(false);
    });
  });

  describe('完成率颜色', () => {
    it('应该为高完成率 (>=80%) 显示绿色', async () => {
      const { useGoalStore } = await import('../../../../goal/presentation/stores/goalStore');

      vi.mocked(useGoalStore).mockReturnValueOnce({
        getGoalStatistics: {
          total: 10,
          completed: 9,
          inProgress: 1,
          active: 1,
          paused: 0,
          archived: 0,
        },
      } as any);

      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-green-600');
    });

    it('应该为中等完成率 (50-79%) 显示蓝色', async () => {
      const { useGoalStore } = await import('../../../../goal/presentation/stores/goalStore');

      vi.mocked(useGoalStore).mockReturnValueOnce({
        getGoalStatistics: {
          total: 10,
          completed: 6,
          inProgress: 4,
          active: 4,
          paused: 0,
          archived: 0,
        },
      } as any);

      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-blue-600');
    });

    it('应该为低完成率 (30-49%) 显示橙色', async () => {
      const { useGoalStore } = await import('../../../../goal/presentation/stores/goalStore');

      vi.mocked(useGoalStore).mockReturnValueOnce({
        getGoalStatistics: {
          total: 10,
          completed: 4,
          inProgress: 6,
          active: 6,
          paused: 0,
          archived: 0,
        },
      } as any);

      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-orange-600');
    });
  });

  describe('图标显示', () => {
    it('应该显示 Widget 图标', () => {
      const wrapper = mount(GoalStatsWidget);

      expect(wrapper.find('.i-heroicons-trophy').exists()).toBe(true);
    });

    it('应该为每个统计项显示图标', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.i-heroicons-arrow-trending-up').exists()).toBe(true); // 进行中
      expect(wrapper.find('.i-heroicons-trophy').exists()).toBe(true); // 已完成
      expect(wrapper.find('.i-heroicons-archive-box').exists()).toBe(true); // 已归档
    });
  });

  describe('响应式布局', () => {
    it('应该在 medium 尺寸时使用 grid 布局', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.MEDIUM },
      });

      const grid = wrapper.find('.stats-grid');
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).not.toContain('stats-grid-large');
    });

    it('应该在 large 尺寸时使用加强 grid 布局', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.LARGE },
      });

      const grid = wrapper.find('.stats-grid');
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).toContain('stats-grid-large');
    });

    it('应该在 small 尺寸时使用 flex 布局', () => {
      const wrapper = mount(GoalStatsWidget, {
        props: { size: WidgetSize.SMALL },
      });

      expect(wrapper.find('.stats-compact').exists()).toBe(true);
      expect(wrapper.find('.stats-grid').exists()).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理零目标的情况', async () => {
      const { useGoalStore } = await import('../../../../goal/presentation/stores/goalStore');

      vi.mocked(useGoalStore).mockReturnValueOnce({
        getGoalStatistics: {
          total: 0,
          completed: 0,
          inProgress: 0,
          active: 0,
          paused: 0,
          archived: 0,
        },
      } as any);

      const wrapper = mount(GoalStatsWidget);

      expect(wrapper.find('.total-value').text()).toBe('0');
      expect(wrapper.find('.completion-rate-value').text()).toBe('0%');
    });

    it('应该处理 100% 完成率', async () => {
      const { useGoalStore } = await import('../../../../goal/presentation/stores/goalStore');

      vi.mocked(useGoalStore).mockReturnValueOnce({
        getGoalStatistics: {
          total: 5,
          completed: 5,
          inProgress: 0,
          active: 0,
          paused: 0,
          archived: 0,
        },
      } as any);

      const wrapper = mount(GoalStatsWidget);

      expect(wrapper.find('.completion-rate-value').text()).toBe('100%');
    });
  });

  describe('Props 验证', () => {
    it('应该接受有效的 WidgetSize 值', () => {
      const sizes = [
        WidgetSize.SMALL,
        WidgetSize.MEDIUM,
        WidgetSize.LARGE,
      ];

      sizes.forEach((size) => {
        const wrapper = mount(GoalStatsWidget, {
          props: { size },
        });

        expect(wrapper.find(`.widget-size-${size}`).exists()).toBe(true);
      });
    });
  });
});


