/**
 * KRPreviewList Component Tests
 * 
 * 测试范围：
 * - 列表渲染
 * - 选择/取消选择
 * - 批量操作（全选/取消全选/清空）
 * - 编辑关键结果
 * - 删除关键结果
 * - 采纳选中项
 * - 事件触发
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import KRPreviewList from '../KRPreviewList.vue';
import type { AIProviderConfigClientDTO, AIUsageQuotaClientDTO, GeneratedGoalDraft } from '@dailyuse/contracts/ai';

// Mock useMessage
const mockShowSnackbar = vi.fn();
vi.mock('@dailyuse/ui', () => ({
  useMessage: () => ({
    showSnackbar: mockShowSnackbar,
  }),
}));

// Mock crypto.randomUUID
if (!global.crypto) {
  (global as any).crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'mock-uuid-' + Math.random();
}

describe('KRPreviewList', () => {
  let wrapper: VueWrapper;
  let vuetify: ReturnType<typeof createVuetify>;

  const mockKeyResults: Array<KeyResultSuggestion & { uuid?: string; selected?: boolean }> = [
    {
      uuid: 'kr-1',
      title: '关键结果 1',
      description: '描述 1',
      targetValue: 100,
      unit: '个',
      weight: 30,
      importance: 'HIGH' as const,
      selected: false,
    },
    {
      uuid: 'kr-2',
      title: '关键结果 2',
      description: '描述 2',
      targetValue: 200,
      unit: '次',
      weight: 40,
      importance: 'MEDIUM' as const,
      selected: true,
    },
    {
      uuid: 'kr-3',
      title: '关键结果 3',
      description: '描述 3',
      targetValue: 300,
      unit: '%',
      weight: 30,
      importance: 'LOW' as const,
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
    return mount(KRPreviewList, {
      props: {
        results: mockKeyResults,
        ...props,
      },
      global: {
        plugins: [vuetify],
      },
    });
  };

  describe('列表渲染', () => {
    it('应该正确渲染关键结果列表', () => {
      wrapper = mountComponent();
      
      const list = wrapper.find('[data-testid="kr-preview-list"]');
      expect(list.exists()).toBe(true);

      const items = wrapper.findAll('[data-testid="kr-preview-item"]');
      expect(items).toHaveLength(3);
    });

    it('空列表应该显示提示信息', () => {
      wrapper = mountComponent({ results: [] });
      
      const alert = wrapper.find('.v-alert');
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toContain('暂无生成的关键结果');
    });

    it('应该显示选中数量', () => {
      wrapper = mountComponent();
      
      const chip = wrapper.find('.v-chip');
      expect(chip.text()).toContain('1 / 3 已选择');
    });

    it('应该显示关键结果详细信息', () => {
      wrapper = mountComponent();
      
      const firstItem = wrapper.findAll('[data-testid="kr-preview-item"]')[0];
      expect(firstItem.text()).toContain('关键结果 1');
      expect(firstItem.text()).toContain('目标：100 个');
      expect(firstItem.text()).toContain('权重：30%');
    });

    it('应该根据重要性显示不同颜色', () => {
      wrapper = mountComponent();
      
      const items = wrapper.findAll('[data-testid="kr-preview-item"]');
      
      // 第一个是 HIGH - 应该有 error 色
      const chip1 = items[0].findAll('.v-chip').find(c => c.text().includes('高'));
      expect(chip1?.classes()).toContain('bg-error');
      
      // 第二个是 MEDIUM - 应该有 warning 色
      const chip2 = items[1].findAll('.v-chip').find(c => c.text().includes('中'));
      expect(chip2?.classes()).toContain('bg-warning');
    });
  });

  describe('选择功能', () => {
    it('点击复选框应该切换选中状态', async () => {
      wrapper = mountComponent();
      
      const checkboxes = wrapper.findAll('[data-testid="kr-checkbox"]');
      const firstCheckbox = checkboxes[0].find('input');
      
      await firstCheckbox.setValue(true);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('selectionChange');
      expect(emitted).toBeTruthy();
    });

    it('应该正确计算选中数量', async () => {
      wrapper = mountComponent();
      
      expect(wrapper.vm.selectedCount).toBe(1); // 初始有 1 个选中

      // 选中第一个
      wrapper.vm.keyResults[0].selected = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedCount).toBe(2);
    });

    it('全选应该选中所有项', async () => {
      wrapper = mountComponent();
      
      const selectAllBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('全选')
      );
      
      if (selectAllBtn) {
        await selectAllBtn.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedCount).toBe(3);
        expect(wrapper.vm.keyResults.every(kr => kr.selected)).toBe(true);
      }
    });

    it('取消全选应该取消所有选中', async () => {
      wrapper = mountComponent();
      
      // 先全选
      wrapper.vm.keyResults.forEach(kr => kr.selected = true);
      await wrapper.vm.$nextTick();

      const deselectAllBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('取消全选')
      );
      
      if (deselectAllBtn) {
        await deselectAllBtn.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedCount).toBe(0);
        expect(wrapper.vm.keyResults.every(kr => !kr.selected)).toBe(true);
      }
    });
  });

  describe('编辑功能', () => {
    it('点击编辑按钮应该打开编辑对话框', async () => {
      wrapper = mountComponent();
      
      const items = wrapper.findAll('[data-testid="kr-preview-item"]');
      const editBtn = items[0].findAll('.v-btn').find(btn => 
        btn.attributes('icon') === 'mdi-pencil'
      );
      
      if (editBtn) {
        await editBtn.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.showEditDialog).toBe(true);
        expect(wrapper.vm.editingKR).toBeTruthy();
      }
    });

    it('保存编辑应该更新关键结果', async () => {
      wrapper = mountComponent();
      
      // 打开编辑对话框
      wrapper.vm.openEditDialog(wrapper.vm.keyResults[0]);
      await wrapper.vm.$nextTick();

      // 修改标题
      wrapper.vm.editingKR.title = '修改后的标题';

      // 保存
      await wrapper.vm.saveEdit();
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('edit');
      expect(emitted).toBeTruthy();
      if (emitted) {
        expect(emitted[0][0].title).toBe('修改后的标题');
      }
    });

    it('取消编辑应该关闭对话框', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.openEditDialog(wrapper.vm.keyResults[0]);
      await wrapper.vm.$nextTick();

      wrapper.vm.cancelEdit();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showEditDialog).toBe(false);
      expect(wrapper.vm.editingKR).toBeNull();
    });
  });

  describe('删除功能', () => {
    it('点击删除按钮应该触发 remove 事件', async () => {
      wrapper = mountComponent();
      
      const items = wrapper.findAll('[data-testid="kr-preview-item"]');
      const deleteBtn = items[0].findAll('.v-btn').find(btn => 
        btn.attributes('icon') === 'mdi-delete'
      );
      
      if (deleteBtn) {
        await deleteBtn.trigger('click');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('remove');
        expect(emitted).toBeTruthy();
        if (emitted) {
          expect(emitted[0][0]).toBe('kr-1');
        }
      }
    });

    it('清空所有应该触发所有删除事件', async () => {
      wrapper = mountComponent();
      
      const clearAllBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('清空')
      );
      
      if (clearAllBtn) {
        await clearAllBtn.trigger('click');
        await wrapper.vm.$nextTick();

        // 应该为每个结果触发 remove 事件
        const emitted = wrapper.emitted('remove');
        expect(emitted).toBeTruthy();
        if (emitted) {
          expect(emitted).toHaveLength(3);
        }
      }
    });
  });

  describe('采纳功能', () => {
    it('采纳选中项应该触发 accept 事件', async () => {
      wrapper = mountComponent();
      
      // 选中一些项
      wrapper.vm.keyResults[0].selected = true;
      wrapper.vm.keyResults[1].selected = true;
      await wrapper.vm.$nextTick();

      const acceptBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('采纳选中')
      );
      
      if (acceptBtn) {
        await acceptBtn.trigger('click');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('accept');
        expect(emitted).toBeTruthy();
        if (emitted) {
          expect(emitted[0][0]).toHaveLength(2);
        }
      }
    });

    it('没有选中项时采纳按钮应该禁用', () => {
      wrapper = mountComponent();
      
      // 取消所有选中
      wrapper.vm.keyResults.forEach(kr => kr.selected = false);
      
      const acceptBtn = wrapper.findAll('.v-btn').find(btn => 
        btn.text().includes('采纳选中')
      );
      
      if (acceptBtn) {
        expect(acceptBtn.attributes('disabled')).toBeDefined();
      }
    });

    it('采纳成功应该显示成功提示', async () => {
      wrapper = mountComponent();
      
      wrapper.vm.keyResults[0].selected = true;
      await wrapper.vm.$nextTick();

      await wrapper.vm.acceptSelected();
      await wrapper.vm.$nextTick();

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining('成功采纳'),
        'success'
      );
    });
  });

  describe('工具方法', () => {
    it('应该正确获取重要性标签', () => {
      wrapper = mountComponent();
      
      expect(wrapper.vm.getImportanceLabel('HIGH')).toBe('高');
      expect(wrapper.vm.getImportanceLabel('MEDIUM')).toBe('中');
      expect(wrapper.vm.getImportanceLabel('LOW')).toBe('低');
    });

    it('应该正确获取重要性颜色', () => {
      wrapper = mountComponent();
      
      expect(wrapper.vm.getImportanceColor('HIGH')).toBe('error');
      expect(wrapper.vm.getImportanceColor('MEDIUM')).toBe('warning');
      expect(wrapper.vm.getImportanceColor('LOW')).toBe('info');
    });
  });

  describe('响应式更新', () => {
    it('更新 props 应该重新渲染列表', async () => {
      wrapper = mountComponent();
      
      const newResults = [
        {
          uuid: 'kr-new',
          title: '新关键结果',
          targetValue: 999,
          unit: '个',
          importance: 'HIGH' as const,
        },
      ];

      await wrapper.setProps({ results: newResults });
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="kr-preview-item"]');
      expect(items).toHaveLength(1);
      expect(items[0].text()).toContain('新关键结果');
    });
  });

  describe('暴露的方法', () => {
    it('应该暴露 getSelectedResults 方法', () => {
      wrapper = mountComponent();
      
      const selectedResults = wrapper.vm.getSelectedResults();
      expect(selectedResults).toHaveLength(1);
      expect(selectedResults[0].uuid).toBe('kr-2');
    });

    it('应该暴露 clearSelection 方法', () => {
      wrapper = mountComponent();
      
      wrapper.vm.clearSelection();
      
      expect(wrapper.vm.selectedCount).toBe(0);
    });
  });
});

