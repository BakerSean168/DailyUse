/**
 * AIGenerateKRButton Component Tests
 *
 * 测试范围：
 * - 组件渲染和初始状态
 * - 对话框打开/关闭
 * - 表单验证
 * - AI 生成流程
 * - 配额显示
 * - 事件触发
 * - 错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AIGenerateKRButton from '../AIGenerateKRButton.vue';
import type { AIContracts } from '@dailyuse/contracts';

// Mock useAIGeneration composable
const mockGenerateKeyResults = vi.fn();
const mockLoadQuotaStatus = vi.fn();
const mockClearKeyResults = vi.fn();
const mockResetState = vi.fn();

vi.mock('../../../../ai/presentation/composables/useAIGeneration', () => ({
  useAIGeneration: () => ({
    generateKeyResults: mockGenerateKeyResults,
    loadQuotaStatus: mockLoadQuotaStatus,
    clearError: vi.fn(),
    isGenerating: { value: false },
    error: { value: null },
    quota: {
      value: {
        quotaLimit: 50,
        usedQuota: 10,
        remainingQuota: 40,
        resetTime: new Date('2025-01-11T00:00:00Z'),
      },
    },
    hasQuota: { value: true },
    timeToReset: { value: '12小时' },
  }),
}));

// Mock useSnackbar
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock('../../../../shared/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe('AIGenerateKRButton', () => {
  let wrapper: VueWrapper;
  let vuetify: ReturnType<typeof createVuetify>;

  beforeEach(() => {
    vuetify = createVuetify({
      components,
      directives,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  /**
   * 辅助函数：挂载组件
   */
  const mountComponent = (props = {}) => {
    return mount(AIGenerateKRButton, {
      props,
      global: {
        plugins: [vuetify],
      },
    });
  };

  describe('组件渲染和初始状态', () => {
    it('应该正确渲染按钮', () => {
      wrapper = mountComponent();

      const button = wrapper.find('[data-testid="ai-generate-kr-button"]');
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('AI 生成关键结果');
    });

    it('应该显示配额 chip', () => {
      wrapper = mountComponent();

      const chip = wrapper.find('.v-chip');
      expect(chip.exists()).toBe(true);
      expect(chip.text()).toBe('40/50');
    });

    it('初始时对话框应该关闭', () => {
      wrapper = mountComponent();

      const dialog = wrapper.find('[data-testid="ai-generate-kr-dialog"]');
      expect(dialog.exists()).toBe(false);
    });

    it('应该使用传入的 props 初始化表单', async () => {
      wrapper = mountComponent({
        initialGoalTitle: '测试目标',
        initialGoalDescription: '测试描述',
      });

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const titleInput = wrapper.find('[data-testid="goal-title-input"]');
      const descInput = wrapper.find('[data-testid="goal-description-input"]');

      expect((titleInput.element as HTMLInputElement).value).toBe('测试目标');
      expect((descInput.element as HTMLTextAreaElement).value).toBe('测试描述');
    });
  });

  describe('对话框交互', () => {
    it('点击按钮应该打开对话框', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const dialog = wrapper.find('[data-testid="ai-generate-kr-dialog"]');
      expect(dialog.exists()).toBe(true);
    });

    it('点击关闭按钮应该关闭对话框', async () => {
      wrapper = mountComponent();

      // 打开对话框
      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      // 关闭对话框
      const closeBtn = wrapper.find('.v-card-title .v-btn');
      await closeBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDialog).toBe(false);
    });

    it('点击取消按钮应该关闭对话框', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const cancelBtn = wrapper.findAll('.v-btn').find((btn) => btn.text().includes('取消'));

      if (cancelBtn) {
        await cancelBtn.trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.showDialog).toBe(false);
      }
    });
  });

  describe('表单验证', () => {
    it('目标标题为空时应该显示验证错误', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      // 清空目标标题
      const titleInput = wrapper.find('[data-testid="goal-title-input"]');
      await titleInput.setValue('');

      // 表单应该无效
      expect(wrapper.vm.formValid).toBe(false);
    });

    it('目标标题有值时表单应该有效', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const titleInput = wrapper.find('[data-testid="goal-title-input"]');
      await titleInput.setValue('测试目标');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.formValid).toBe(true);
    });
  });

  describe('AI 生成流程', () => {
    it('点击生成按钮应该调用 generateKeyResults with Epic 2 params', async () => {
      const mockResults = {
        keyResults: [
          {
            title: 'KR1',
            description: 'Description 1',
            targetValue: 100,
            unit: '个',
            weight: 33,
            valueType: 'NUMBER',
            aggregationMethod: 'SUM',
          },
        ],
        tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        generatedAt: Date.now(),
      };

      mockGenerateKeyResults.mockResolvedValueOnce(mockResults);

      wrapper = mountComponent({
        initialGoalTitle: '测试目标',
      });

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      // Fill in required date fields
      const startDateInput = wrapper.find('[data-testid="start-date-input"]');
      const endDateInput = wrapper.find('[data-testid="end-date-input"]');

      await startDateInput.setValue('2025-01-01');
      await endDateInput.setValue('2025-01-31');
      await wrapper.vm.$nextTick();

      // 点击生成按钮
      const generateBtn = wrapper.find('[data-testid="generate-button"]');

      await generateBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(mockGenerateKeyResults).toHaveBeenCalledWith({
        goalTitle: '测试目标',
        startDate: expect.any(Number),
        endDate: expect.any(Number),
        goalDescription: undefined,
        goalContext: undefined,
      });
    });

    it('生成成功应该触发 generated 事件', async () => {
      const mockResults = {
        keyResults: [
          {
            title: 'KR1',
            description: 'Description 1',
            targetValue: 100,
            unit: '个',
            weight: 33,
            valueType: 'NUMBER',
            aggregationMethod: 'SUM',
          },
        ],
        tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        generatedAt: Date.now(),
      };

      mockGenerateKeyResults.mockResolvedValueOnce(mockResults);

      wrapper = mountComponent({
        initialGoalTitle: '测试目标',
      });

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      // Dates are auto-filled by component
      const generateBtn = wrapper.find('[data-testid="generate-button"]');

      await generateBtn.trigger('click');
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const emitted = wrapper.emitted('generated');
      expect(emitted).toBeTruthy();
      if (emitted) {
        expect(emitted[0]).toEqual([mockResults]);
      }
    });

    it('生成失败应该触发 error 事件', async () => {
      const mockError = new Error('生成失败');
      mockGenerateKeyResults.mockRejectedValueOnce(mockError);

      wrapper = mountComponent({
        initialGoalTitle: '测试目标',
      });

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper.find('[data-testid="generate-button"]');

      await generateBtn.trigger('click');
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const emitted = wrapper.emitted('error');
      expect(emitted).toBeTruthy();
      if (emitted) {
        expect(typeof emitted[0][0]).toBe('string');
      }
    });
  });

  describe('配额显示', () => {
    it('应该显示配额信息', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const alert = wrapper.find('.v-alert');
      expect(alert.text()).toContain('今日剩余额度');
      expect(alert.text()).toContain('40 / 50 次');
    });

    it('应该显示配额重置时间', async () => {
      wrapper = mountComponent();

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const alert = wrapper.find('.v-alert');
      expect(alert.text()).toContain('12小时后重置');
    });

    it('配额不足时按钮应该禁用', async () => {
      // 重新 mock 配额不足的情况
      vi.doMock('../../../../ai/presentation/composables/useAIGeneration', () => ({
        useAIGeneration: () => ({
          generateKeyResults: mockGenerateKeyResults,
          loadQuotaStatus: mockLoadQuotaStatus,
          clearKeyResults: mockClearKeyResults,
          resetState: mockResetState,
          quota: {
            value: {
              quotaLimit: 50,
              usedQuota: 50,
              remainingQuota: 0,
              resetTime: new Date('2025-01-11T00:00:00Z'),
            },
          },
          hasQuota: { value: false },
          isLoading: { value: false },
          error: { value: null },
          timeToReset: { value: '12小时' },
        }),
      }));

      wrapper = mountComponent();

      const button = wrapper.find('[data-testid="ai-generate-kr-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该显示错误提示', async () => {
      const mockError = new Error('API 错误');
      mockGenerateKeyResults.mockRejectedValueOnce(mockError);

      wrapper = mountComponent({
        initialGoalTitle: '测试目标',
      });

      await wrapper.find('[data-testid="ai-generate-kr-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      const generateBtn = wrapper.findAll('.v-btn').find((btn) => btn.text().includes('开始生成'));

      if (generateBtn) {
        await generateBtn.trigger('click');
        await wrapper.vm.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const errorAlert = wrapper.find('.v-alert[type="error"]');
        expect(errorAlert.exists()).toBe(true);
        expect(errorAlert.text()).toContain('API 错误');
      }
    });
  });
});
