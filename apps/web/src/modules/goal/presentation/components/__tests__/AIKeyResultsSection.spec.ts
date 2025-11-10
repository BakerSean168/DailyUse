/**
 * AIKeyResultsSection Component Tests
 * 
 * 测试范围：
 * - 组件集成（按钮 + 列表）
 * - 完整工作流程（生成 → 预览 → 采纳）
 * - 提示信息显示/隐藏
 * - 已采纳列表显示
 * - 手动添加触发
 * - 事件传递
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AIKeyResultsSection from '../AIKeyResultsSection.vue';
import AIGenerateKRButton from '../AIGenerateKRButton.vue';
import KRPreviewList from '../KRPreviewList.vue';
import type { AIContracts } from '@dailyuse/contracts';

// Mock useSnackbar
const mockShowSnackbar = vi.fn();
vi.mock('../../../../shared/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    showSnackbar: mockShowSnackbar,
  }),
}));

// Mock useAIGeneration
vi.mock('../../../../modules/ai/composables/useAIGeneration', () => ({
  useAIGeneration: () => ({
    generateKeyResults: vi.fn(),
    loadQuotaStatus: vi.fn(),
    clearKeyResults: vi.fn(),
    resetState: vi.fn(),
    quota: { value: null },
    hasQuota: { value: true },
    isLoading: { value: false },
    error: { value: null },
    timeToReset: { value: '' },
  }),
}));

// Mock crypto.randomUUID
if (!global.crypto) {
  (global as any).crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'mock-uuid-' + Math.random();
}

describe('AIKeyResultsSection', () => {
  let wrapper: VueWrapper;
  let vuetify: ReturnType<typeof createVuetify>;

  const mockGeneratedResults: Array<AIContracts.KeyResultSuggestion & { uuid?: string; selected?: boolean }> = [
    {
      uuid: 'kr-1',
      title: 'KR 1',
      description: 'Description 1',
      targetValue: 100,
      unit: '个',
      weight: 50,
      importance: 'HIGH' as const,
      selected: false,
    },
    {
      uuid: 'kr-2',
      title: 'KR 2',
      description: 'Description 2',
      targetValue: 200,
      unit: '次',
      weight: 50,
      importance: 'MEDIUM' as const,
      selected: false,
    },
  ];

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
    return mount(AIKeyResultsSection, {
      props: {
        goalTitle: '测试目标',
        goalDescription: '测试描述',
        ...props,
      },
      global: {
        plugins: [vuetify],
        stubs: {
          // 不 stub 子组件，测试真实集成
        },
      },
    });
  };

  describe('组件渲染', () => {
    it('应该正确渲染标题', () => {
      wrapper = mountComponent();
      
      expect(wrapper.text()).toContain('关键结果管理');
    });

    it('应该渲染 AI 生成按钮', () => {
      wrapper = mountComponent();
      
      const button = wrapper.findComponent(AIGenerateKRButton);
      expect(button.exists()).toBe(true);
    });

    it('应该渲染预览列表', () => {
      wrapper = mountComponent();
      
      const previewList = wrapper.findComponent(KRPreviewList);
      expect(previewList.exists()).toBe(true);
    });

    it('应该传递 props 到生成按钮', () => {
      wrapper = mountComponent({
        goalTitle: '自定义目标',
        goalDescription: '自定义描述',
      });
      
      const button = wrapper.findComponent(AIGenerateKRButton);
      expect(button.props('initialGoalTitle')).toBe('自定义目标');
      expect(button.props('initialGoalDescription')).toBe('自定义描述');
    });
  });

  describe('提示信息', () => {
    it('初始状态应该显示使用提示', () => {
      wrapper = mountComponent();
      
      const hint = wrapper.find('[data-testid="usage-hint"]');
      expect(hint.exists()).toBe(true);
      expect(hint.text()).toContain('点击"AI 生成关键结果"按钮');
    });

    it('有生成结果后应该隐藏提示', async () => {
      wrapper = mountComponent();
      
      // 模拟生成结果
      wrapper.vm.generatedResults = mockGeneratedResults;
      await wrapper.vm.$nextTick();

      const hint = wrapper.find('[data-testid="usage-hint"]');
      expect(hint.exists()).toBe(false);
    });

    it('点击关闭应该隐藏提示', async () => {
      wrapper = mountComponent();
      
      const hint = wrapper.find('[data-testid="usage-hint"]');
      const closeBtn = hint.find('.v-btn');
      
      await closeBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showHint).toBe(false);
    });
  });

  describe('生成结果处理', () => {
    it('接收生成结果应该更新预览列表', async () => {
      wrapper = mountComponent();
      
      const button = wrapper.findComponent(AIGenerateKRButton);
      button.vm.$emit('generated', mockGeneratedResults);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generatedResults).toHaveLength(2);
      
      const previewList = wrapper.findComponent(KRPreviewList);
      expect(previewList.props('results')).toHaveLength(2);
    });

    it('生成结果应该添加 uuid 和 selected 属性', async () => {
      wrapper = mountComponent();
      
      const resultsWithoutUuid = mockGeneratedResults.map(r => ({
        ...r,
        uuid: undefined,
      }));

      const button = wrapper.findComponent(AIGenerateKRButton);
      button.vm.$emit('generated', resultsWithoutUuid);
      await wrapper.vm.$nextTick();

      wrapper.vm.generatedResults.forEach(result => {
        expect(result.uuid).toBeTruthy();
        expect(typeof result.selected).toBe('boolean');
      });
    });

    it('生成错误应该显示提示', async () => {
      wrapper = mountComponent();
      
      const error = new Error('生成失败');
      const button = wrapper.findComponent(AIGenerateKRButton);
      button.vm.$emit('error', error);
      await wrapper.vm.$nextTick();

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('生成失败'),
        'error'
      );
    });
  });

  describe('采纳功能', () => {
    it('采纳选中项应该更新已采纳列表', async () => {
      wrapper = mountComponent();
      
      // 先设置生成结果
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      wrapper.vm.generatedResults[0].selected = true;
      await wrapper.vm.$nextTick();

      // 触发采纳
      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('accept', [wrapper.vm.generatedResults[0]]);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.acceptedResults).toHaveLength(1);
      expect(wrapper.vm.acceptedResults[0].title).toBe('KR 1');
    });

    it('采纳后应该从预览列表移除', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      wrapper.vm.generatedResults[0].selected = true;
      await wrapper.vm.$nextTick();

      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('accept', [wrapper.vm.generatedResults[0]]);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generatedResults).toHaveLength(1);
      expect(wrapper.vm.generatedResults[0].title).toBe('KR 2');
    });

    it('采纳后应该触发 resultsUpdated 事件', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('accept', [wrapper.vm.generatedResults[0]]);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('resultsUpdated');
      expect(emitted).toBeTruthy();
      if (emitted) {
        expect(emitted[0][0]).toHaveLength(1);
      }
    });
  });

  describe('编辑功能', () => {
    it('编辑应该更新结果', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      const editedResult = {
        ...wrapper.vm.generatedResults[0],
        title: '修改后的标题',
      };

      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('edit', editedResult);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generatedResults[0].title).toBe('修改后的标题');
    });
  });

  describe('删除功能', () => {
    it('删除应该从列表移除', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('remove', 'kr-1');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generatedResults).toHaveLength(1);
      expect(wrapper.vm.generatedResults[0].uuid).toBe('kr-2');
    });

    it('从已采纳列表删除应该移除项', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.acceptedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      // 查找已采纳列表中的删除按钮
      const acceptedList = wrapper.find('[data-testid="accepted-results-list"]');
      const items = acceptedList.findAll('[data-testid="accepted-kr-item"]');
      const deleteBtn = items[0].findAll('.v-btn').find(btn => 
        btn.attributes('icon') === 'mdi-close'
      );

      if (deleteBtn) {
        await deleteBtn.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.acceptedResults).toHaveLength(1);
      }
    });
  });

  describe('手动添加', () => {
    it('点击手动添加应该触发 manualAdd 事件', async () => {
      wrapper = mountComponent();
      
      const manualAddBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('手动添加')
      );

      if (manualAddBtn) {
        await manualAddBtn.trigger('click');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('manualAdd');
        expect(emitted).toBeTruthy();
      }
    });
  });

  describe('已采纳列表显示', () => {
    it('没有采纳项时不显示已采纳列表', () => {
      wrapper = mountComponent();
      
      const acceptedList = wrapper.find('[data-testid="accepted-results-list"]');
      expect(acceptedList.exists()).toBe(false);
    });

    it('有采纳项时显示已采纳列表', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.acceptedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      const acceptedList = wrapper.find('[data-testid="accepted-results-list"]');
      expect(acceptedList.exists()).toBe(true);
      
      const items = acceptedList.findAll('[data-testid="accepted-kr-item"]');
      expect(items).toHaveLength(2);
    });

    it('已采纳列表应该显示正确数量', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.acceptedResults = [...mockGeneratedResults];
      await wrapper.vm.$nextTick();

      const chip = wrapper.findAll('.v-chip').find(c => 
        c.text().includes('个')
      );
      
      expect(chip?.text()).toContain('2 个');
    });
  });

  describe('完整工作流程', () => {
    it('应该完成完整的生成-采纳流程', async () => {
      wrapper = mountComponent();
      
      // 1. 生成结果
      const button = wrapper.findComponent(AIGenerateKRButton);
      button.vm.$emit('generated', mockGeneratedResults);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.generatedResults).toHaveLength(2);

      // 2. 选中第一项
      wrapper.vm.generatedResults[0].selected = true;
      await wrapper.vm.$nextTick();

      // 3. 采纳选中项
      const previewList = wrapper.findComponent(KRPreviewList);
      previewList.vm.$emit('accept', [wrapper.vm.generatedResults[0]]);
      await wrapper.vm.$nextTick();

      // 验证结果
      expect(wrapper.vm.acceptedResults).toHaveLength(1);
      expect(wrapper.vm.generatedResults).toHaveLength(1);
      expect(wrapper.emitted('resultsUpdated')).toBeTruthy();
    });
  });

  describe('暴露的方法', () => {
    it('应该暴露 getAcceptedResults 方法', () => {
      wrapper = mountComponent();
      
      wrapper.vm.acceptedResults = [...mockGeneratedResults];
      
      const results = wrapper.vm.getAcceptedResults();
      expect(results).toHaveLength(2);
    });

    it('应该暴露 clearAll 方法', () => {
      wrapper = mountComponent();
      
      wrapper.vm.generatedResults = [...mockGeneratedResults];
      wrapper.vm.acceptedResults = [...mockGeneratedResults];
      
      wrapper.vm.clearAll();
      
      expect(wrapper.vm.generatedResults).toHaveLength(0);
      expect(wrapper.vm.acceptedResults).toHaveLength(0);
    });
  });
});
