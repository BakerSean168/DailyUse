/**
 * TaskStatsWidget 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import TaskStatsWidget from '../TaskStatsWidget.vue';
import { DashboardContracts } from '@dailyuse/contracts';

// Mock useTaskStatistics composable
vi.mock('../../../../task/presentation/composables/useTaskStatistics', () => ({
  useTaskStatistics: vi.fn(() => ({
    instanceStatistics: ref({
      total: 10,
      pending: 3,
      inProgress: 2,
      completed: 5,
      skipped: 0,
      expired: 0,
      today: 0,
    }),
    completionRate: ref(50),
    isLoading: ref(false),
  })),
}));

describe('TaskStatsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染 Widget', () => {
      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.task-stats-widget').exists()).toBe(true);
      expect(wrapper.find('.widget-title h3').text()).toBe('任务统计');
    });

    it('应该显示完成率 (非 small 尺寸)', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').text()).toBe('50%');
      expect(wrapper.find('.completion-rate-label').text()).toBe('完成率');
    });

    it('应该在 small 尺寸时隐藏完成率', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-completion-rate').exists()).toBe(false);
    });
  });

  describe('尺寸变体', () => {
    it('应该应用 small 尺寸样式', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-size-small').exists()).toBe(true);
      expect(wrapper.find('.stats-compact').exists()).toBe(true);
    });

    it('应该应用 medium 尺寸样式', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.widget-size-medium').exists()).toBe(true);
      expect(wrapper.find('.stats-grid').exists()).toBe(true);
    });

    it('应该应用 large 尺寸样式', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.LARGE },
      });

      expect(wrapper.find('.widget-size-large').exists()).toBe(true);
      expect(wrapper.find('.stats-grid-large').exists()).toBe(true);
    });

    it('默认尺寸应该是 medium', () => {
      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.widget-size-medium').exists()).toBe(true);
    });
  });

  describe('统计数据显示', () => {
    it('应该显示待办任务数量', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const pendingCard = statCards.find((card) => card.text().includes('待办'));

      expect(pendingCard).toBeDefined();
      expect(pendingCard?.text()).toContain('3');
    });

    it('应该显示进行中任务数量', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const inProgressCard = statCards.find((card) => card.text().includes('进行中'));

      expect(inProgressCard).toBeDefined();
      expect(inProgressCard?.text()).toContain('2');
    });

    it('应该显示已完成任务数量', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      const statCards = wrapper.findAll('.stat-card');
      const completedCard = statCards.find((card) => card.text().includes('已完成'));

      expect(completedCard).toBeDefined();
      expect(completedCard?.text()).toContain('5');
    });

    it('应该显示总任务数', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.total-value').text()).toBe('10');
    });
  });

  describe('Small 尺寸紧凑显示', () => {
    it('应该显示紧凑统计信息', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      const compactItems = wrapper.findAll('.stat-item-compact');

      expect(compactItems).toHaveLength(3);
    });

    it('应该显示总计、完成和进行中', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      const text = wrapper.text();

      expect(text).toContain('总计');
      expect(text).toContain('完成');
      expect(text).toContain('进行中');
      expect(text).toContain('10'); // total
      expect(text).toContain('5'); // completed
      expect(text).toContain('2'); // inProgress
    });

    it('应该隐藏底部总计区域', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      expect(wrapper.find('.widget-footer').exists()).toBe(false);
    });
  });

  describe('加载状态', () => {
    it('应该在加载时显示加载状态', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      // Update mock to return loading state
      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(0),
        isLoading: ref(true),
      } as any);

      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.widget-loading-state').exists()).toBe(true);
      expect(wrapper.text()).toContain('加载中...');
    });

    it('应该在加载完成后隐藏加载状态', () => {
      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.widget-loading-state').exists()).toBe(false);
      expect(wrapper.find('.widget-content').exists()).toBe(true);
    });
  });

  describe('完成率颜色', () => {
    it('应该为高完成率 (>=80%) 显示绿色', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 10,
          pending: 0,
          inProgress: 0,
          completed: 10,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(100),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-green-600');
    });

    it('应该为中等完成率 (50-79%) 显示蓝色', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 10,
          pending: 0,
          inProgress: 0,
          completed: 6,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(60),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-blue-600');
    });

    it('应该为低完成率 (30-49%) 显示橙色', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 10,
          pending: 0,
          inProgress: 0,
          completed: 4,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(40),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-orange-600');
    });

    it('应该为极低完成率 (<30%) 显示灰色', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 10,
          pending: 0,
          inProgress: 0,
          completed: 2,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(20),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.completion-rate-value').classes()).toContain('text-gray-600');
    });
  });

  describe('图标显示', () => {
    it('应该显示 Widget 图标', () => {
      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.i-heroicons-clipboard-document-check').exists()).toBe(true);
    });

    it('应该为每个统计项显示图标', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      expect(wrapper.find('.i-heroicons-clock').exists()).toBe(true); // 待办
      expect(wrapper.find('.i-heroicons-arrow-path').exists()).toBe(true); // 进行中
      expect(wrapper.find('.i-heroicons-check-circle').exists()).toBe(true); // 已完成
    });
  });

  describe('响应式布局', () => {
    it('应该在 medium 尺寸时使用 grid 布局', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.MEDIUM },
      });

      const grid = wrapper.find('.stats-grid');
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).not.toContain('stats-grid-large');
    });

    it('应该在 large 尺寸时使用加强 grid 布局', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.LARGE },
      });

      const grid = wrapper.find('.stats-grid');
      expect(grid.exists()).toBe(true);
      expect(grid.classes()).toContain('stats-grid-large');
    });

    it('应该在 small 尺寸时使用 flex 布局', () => {
      const wrapper = mount(TaskStatsWidget, {
        props: { size: DashboardContracts.WidgetSize.SMALL },
      });

      expect(wrapper.find('.stats-compact').exists()).toBe(true);
      expect(wrapper.find('.stats-grid').exists()).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理零任务的情况', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(0),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.total-value').text()).toBe('0');
      expect(wrapper.find('.completion-rate-value').text()).toBe('0%');
    });

    it('应该处理 100% 完成率', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 10,
          pending: 0,
          inProgress: 0,
          completed: 10,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(100),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.completion-rate-value').text()).toBe('100%');
    });

    it('应该处理大数值', async () => {
      const { useTaskStatistics } = await import(
        '../../../../task/presentation/composables/useTaskStatistics'
      );

      vi.mocked(useTaskStatistics).mockReturnValueOnce({
        instanceStatistics: ref({
          total: 9999,
          pending: 3000,
          inProgress: 1999,
          completed: 5000,
          skipped: 0,
          expired: 0,
          today: 0,
        }),
        completionRate: ref(50.05),
        isLoading: ref(false),
      } as any);

      const wrapper = mount(TaskStatsWidget);

      expect(wrapper.find('.total-value').text()).toBe('9999');
    });
  });

  describe('Props 验证', () => {
    it('应该接受有效的 WidgetSize 值', () => {
      const sizes = [
        DashboardContracts.WidgetSize.SMALL,
        DashboardContracts.WidgetSize.MEDIUM,
        DashboardContracts.WidgetSize.LARGE,
      ];

      sizes.forEach((size) => {
        const wrapper = mount(TaskStatsWidget, {
          props: { size },
        });

        expect(wrapper.find(`.widget-size-${size}`).exists()).toBe(true);
      });
    });
  });
});
