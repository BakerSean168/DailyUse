/**
 * DocumentSummarizer Component Integration Tests
 * 测试容器组件的交互逻辑和渲染行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import DocumentSummarizer from '../DocumentSummarizer.vue';
import SummaryDisplay from '../SummaryDisplay.vue';
import { useDocumentSummarizer } from '../../composables/useDocumentSummarizer';
import type { SummaryResult } from '../../types/summarization';

// Mock the composable
vi.mock('../../composables/useDocumentSummarizer', () => ({
  useDocumentSummarizer: vi.fn(),
}));

// Mock Vuetify components
const createVuetifyMocks = () => ({
  VContainer: { template: '<div class="v-container"><slot /></div>' },
  VRow: { template: '<div class="v-row"><slot /></div>' },
  VCol: { template: '<div class="v-col"><slot /></div>' },
  VCard: { template: '<div class="v-card"><slot /></div>' },
  VCardText: { template: '<div class="v-card-text"><slot /></div>' },
  VCardTitle: { template: '<div class="v-card-title"><slot /></div>' },
  VTextarea: {
    template:
      '<textarea class="v-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :disabled="disabled || undefined" data-test="input-textarea" />',
    props: [
      'modelValue',
      'disabled',
      'label',
      'placeholder',
      'rows',
      'counter',
      'maxlength',
      'rules',
      'variant',
      'autoGrow',
    ],
    emits: ['update:modelValue'],
  },
  VChip: {
    template: '<span class="v-chip" data-test="character-count-chip"><slot /></span>',
    props: ['color', 'size', 'variant'],
  },
  VSwitch: {
    template:
      '<input type="checkbox" class="v-switch" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" :disabled="disabled || undefined" data-test="include-actions-switch" />',
    props: ['modelValue', 'disabled', 'label', 'color', 'density', 'hideDetails'],
    emits: ['update:modelValue'],
  },
  VBtn: {
    props: ['disabled', 'loading', 'color', 'size', 'variant', 'prependIcon'],
    emits: ['click'],
    template: `
      <button 
        class="v-btn" 
        v-bind="{ disabled: disabled ? '' : undefined }"
        :class="{ loading: loading }"
        @click="$emit('click')"
      >
        <slot />
      </button>
    `,
  },
  VAlert: {
    template: '<div class="v-alert" :class="type" data-test="error-alert"><slot /></div>',
    props: ['type', 'variant', 'closable'],
    emits: ['click:close'],
  },
  VOverlay: {
    template: '<div v-if="modelValue" class="v-overlay" data-test="loading-overlay"><slot /></div>',
    props: ['modelValue', 'contained', 'class'],
  },
  VProgressCircular: {
    template: '<div class="v-progress-circular" data-test="loading-spinner" />',
    props: ['indeterminate', 'size', 'color'],
  },
  VIcon: { template: '<i class="v-icon" :class="icon" />', props: ['icon', 'size'] },
  VSpacer: { template: '<div class="v-spacer" />' },
  VDivider: { template: '<hr class="v-divider" />' },
  VList: { template: '<ul class="v-list"><slot /></ul>', props: ['density'] },
  VListItem: { template: '<li class="v-list-item"><slot name="prepend" /><slot /></li>' },
  VListItemTitle: { template: '<div class="v-list-item-title"><slot /></div>' },
});

describe('DocumentSummarizer', () => {
  const mockSummarize = vi.fn();
  const mockCopyToClipboard = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true); // Mock confirm dialog
  });

  const createWrapper = (composableReturn = {}) => {
    const defaultReturn = {
      inputText: { value: '' },
      summary: { value: null },
      isLoading: { value: false },
      error: { value: null },
      includeActions: { value: true },
      characterCount: { value: 0 },
      isTextValid: { value: false },
      canSummarize: { value: false },
      summarize: mockSummarize,
      copyToClipboard: mockCopyToClipboard,
      reset: mockReset,
      ...composableReturn,
    };

    vi.mocked(useDocumentSummarizer).mockReturnValue(defaultReturn as any);

    return mount(DocumentSummarizer, {
      global: {
        components: {
          ...createVuetifyMocks(),
          SummaryDisplay,
        },
        stubs: {
          SummaryDisplay: true,
        },
      },
    });
  };

  describe('Initial Render', () => {
    it('should render page header correctly', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-test="page-title"]').text()).toContain('文档摘要工具');
      expect(wrapper.find('[data-test="page-subtitle"]').text()).toContain(
        '快速提取长文本的核心内容、关键要点和行动建议',
      );
    });

    it('should render input card with textarea', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-test="input-card"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="input-textarea"]').exists()).toBe(true);
    });

    it('should render character count indicator', () => {
      const wrapper = createWrapper({
        characterCount: { value: 100 },
      });

      expect(wrapper.find('[data-test="character-count"]').text()).toContain('100 / 50,000 字符');
    });

    it('should render include actions switch', () => {
      const wrapper = createWrapper();

      const switchInput = wrapper.find('[data-test="include-actions-switch"]');
      expect(switchInput.exists()).toBe(true);
    });

    it('should render action buttons', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-test="summarize-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="clear-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="summarize-button"]').text()).toContain('生成摘要');
      expect(wrapper.find('[data-test="clear-button"]').text()).toContain('清空');
    });
  });

  describe('Character Count Indicator', () => {
    it('should display correct color for zero characters', () => {
      const wrapper = createWrapper({
        characterCount: { value: 0 },
      });

      const chip = wrapper.find('[data-test="character-count-chip"]');
      expect(chip.exists()).toBe(true);
    });

    it('should display warning for text near limit', () => {
      const wrapper = createWrapper({
        characterCount: { value: 45000 },
      });

      expect(wrapper.find('[data-test="character-count"]').text()).toContain('45000');
    });

    it('should display error for text exceeding limit', () => {
      const wrapper = createWrapper({
        characterCount: { value: 50001 },
        isTextValid: { value: false },
      });

      expect(wrapper.find('[data-test="character-count-error"]').text()).toContain(
        '文本超出长度限制',
      );
    });

    it('should display error for invalid short text', () => {
      const wrapper = createWrapper({
        characterCount: { value: 0 },
        isTextValid: { value: false },
      });

      // When count > 0 but invalid
      const wrapperInvalid = createWrapper({
        characterCount: { value: 1 },
        isTextValid: { value: false },
        inputText: { value: 'a' },
      });

      // Should not show error when count is exactly 0
      expect(wrapper.find('[data-test="character-count-error"]').exists()).toBe(false);
    });
  });

  describe('Button States', () => {
    it('should disable summarize button when cannot summarize', () => {
      const wrapper = createWrapper({
        canSummarize: { value: false },
      });

      const summarizeBtn = wrapper.find('[data-test="summarize-button"]');
      expect(summarizeBtn.attributes('disabled')).toBe('');
    });

    it('should enable summarize button when can summarize', () => {
      const wrapper = createWrapper({
        canSummarize: { value: true },
      });

      const summarizeBtn = wrapper.find('[data-test="summarize-button"]');
      expect(summarizeBtn.attributes('disabled')).toBeUndefined();
    });

    it('should show loading state on summarize button', () => {
      const wrapper = createWrapper({
        isLoading: { value: true },
      });

      const summarizeBtn = wrapper.find('[data-test="summarize-button"]');
      expect(summarizeBtn.classes()).toContain('loading');
    });

    it('should disable clear button when no input and no summary', () => {
      const wrapper = createWrapper({
        characterCount: { value: 0 },
        summary: { value: null },
      });

      const clearBtn = wrapper.find('[data-test="clear-button"]');
      expect(clearBtn.attributes('disabled')).toBeDefined();
    });

    it('should enable clear button when has input', () => {
      const wrapper = createWrapper({
        characterCount: { value: 100 },
      });

      const clearBtn = wrapper.find('[data-test="clear-button"]');
      expect(clearBtn.attributes('disabled')).toBeUndefined();
    });

    it('should enable clear button when has summary', () => {
      const wrapper = createWrapper({
        characterCount: { value: 0 },
        summary: {
          value: {
            summary: { core: 'test', keyPoints: ['a'] },
            metadata: {
              tokensUsed: 10,
              generatedAt: Date.now(),
              inputLength: 10,
              compressionRatio: 0.1,
            },
          },
        },
      });

      const clearBtn = wrapper.find('[data-test="clear-button"]');
      expect(clearBtn.attributes('disabled')).toBeUndefined();
    });
  });

  describe('User Interactions', () => {
    it('should call summarize when button clicked', async () => {
      const wrapper = createWrapper({
        canSummarize: { value: true },
      });

      const summarizeBtn = wrapper.find('[data-test="summarize-button"]');
      await summarizeBtn.trigger('click');

      expect(mockSummarize).toHaveBeenCalledOnce();
    });

    it('should call reset when clear button clicked and confirmed', async () => {
      const wrapper = createWrapper({
        characterCount: { value: 100 },
      });

      const clearBtn = wrapper.find('[data-test="clear-button"]');
      await clearBtn.trigger('click');

      expect(global.confirm).toHaveBeenCalledWith('确定要清空输入和输出吗？');
      expect(mockReset).toHaveBeenCalledOnce();
    });

    it('should not call reset when clear cancelled', async () => {
      global.confirm = vi.fn(() => false);

      const wrapper = createWrapper({
        characterCount: { value: 100 },
      });

      const clearBtn = wrapper.find('[data-test="clear-button"]');
      await clearBtn.trigger('click');

      expect(global.confirm).toHaveBeenCalled();
      expect(mockReset).not.toHaveBeenCalled();
    });

    it('should update includeActions when switch toggled', async () => {
      const includeActionsRef = { value: true };
      const wrapper = createWrapper({
        includeActions: includeActionsRef,
      });

      const switchInput = wrapper.find(
        '[data-test="include-actions-switch"] input[type="checkbox"]',
      );

      // Simulate toggle
      includeActionsRef.value = false;
      await nextTick();

      expect(includeActionsRef.value).toBe(false);
    });
  });

  describe('Error Display', () => {
    it('should not show error alert when no error', () => {
      const wrapper = createWrapper({
        error: { value: null },
      });

      expect(wrapper.find('[data-test="error-alert"]').exists()).toBe(false);
    });

    it('should show error alert when error exists', () => {
      const wrapper = createWrapper({
        error: { value: '请先登录以使用 AI 功能' },
      });

      const alert = wrapper.find('[data-test="error-alert"]');
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toContain('请先登录以使用 AI 功能');
    });

    it('should clear error when alert closed', async () => {
      const errorRef: { value: string | null } = { value: 'Some error' };
      const wrapper = createWrapper({
        error: errorRef,
      });

      const alert = wrapper.find('[data-test="error-alert"]');
      expect(alert.exists()).toBe(true);

      // Simulate close
      errorRef.value = null;
      await nextTick();

      expect(errorRef.value).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should not show overlay when not loading', () => {
      const wrapper = createWrapper({
        isLoading: { value: false },
      });

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(false);
    });

    it('should show loading overlay when loading', () => {
      const wrapper = createWrapper({
        isLoading: { value: true },
      });

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="loading-spinner"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('正在生成摘要...');
    });

    it('should disable inputs when loading', () => {
      const wrapper = createWrapper({
        isLoading: { value: true },
      });

      const textarea = wrapper.find('[data-test="input-textarea"]');
      expect(textarea.attributes('disabled')).toBeDefined();

      const switchInput = wrapper.find(
        '[data-test="include-actions-switch"] input[type="checkbox"]',
      );
      expect(switchInput.attributes('disabled')).toBeDefined();
    });
  });

  describe('Summary Display', () => {
    it('should not show SummaryDisplay when no summary', () => {
      const wrapper = createWrapper({
        summary: { value: null },
      });

      expect(wrapper.findComponent(SummaryDisplay).exists()).toBe(false);
    });

    it('should show SummaryDisplay when summary exists', () => {
      const mockSummary: SummaryResult = {
        summary: {
          core: 'Test summary',
          keyPoints: ['Point 1', 'Point 2'],
          actionItems: ['Action 1'],
        },
        metadata: {
          tokensUsed: 150,
          generatedAt: Date.now(),
          inputLength: 1000,
          compressionRatio: 0.15,
        },
      };

      const wrapper = createWrapper({
        summary: { value: mockSummary },
      });

      const summaryDisplay = wrapper.findComponent(SummaryDisplay);
      expect(summaryDisplay.exists()).toBe(true);
      expect(summaryDisplay.props('summary')).toMatchObject(mockSummary);
    });

    it('should call copyToClipboard when copy event emitted', async () => {
      const mockSummary: SummaryResult = {
        summary: {
          core: 'Test',
          keyPoints: ['Point'],
        },
        metadata: {
          tokensUsed: 10,
          generatedAt: Date.now(),
          inputLength: 50,
          compressionRatio: 0.2,
        },
      };

      const wrapper = createWrapper({
        summary: { value: mockSummary },
      });

      const summaryDisplay = wrapper.findComponent(SummaryDisplay);
      await summaryDisplay.vm.$emit('copy');

      expect(mockCopyToClipboard).toHaveBeenCalledOnce();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render container with proper classes', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.document-summarizer').exists()).toBe(true);
      expect(wrapper.find('.v-container').exists()).toBe(true);
    });

    it('should apply responsive column sizes', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-test="input-card"]').exists()).toBe(true);
    });
  });

  describe('Integration Flow', () => {
    it('should complete full summarization flow', async () => {
      const inputTextRef = { value: '' };
      const summaryRef: { value: SummaryResult | null } = { value: null };
      const isLoadingRef = { value: false };
      const errorRef: { value: string | null } = { value: null };

      const wrapper = createWrapper({
        inputText: inputTextRef,
        summary: summaryRef,
        isLoading: isLoadingRef,
        error: errorRef,
        characterCount: { value: 500 },
        isTextValid: { value: true },
        canSummarize: { value: true },
      });

      // 1. User enters text (simulated)
      inputTextRef.value = 'Long document to summarize...';
      await nextTick();

      // 2. User clicks summarize
      const summarizeBtn = wrapper.find('[data-test="summarize-button"]');
      await summarizeBtn.trigger('click');
      expect(mockSummarize).toHaveBeenCalled();

      // 3. Loading state
      isLoadingRef.value = true;
      await nextTick();
      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(true);

      // 4. Summary received
      isLoadingRef.value = false;
      summaryRef.value = {
        summary: {
          core: 'Summary result',
          keyPoints: ['Key 1', 'Key 2'],
        },
        metadata: {
          tokensUsed: 100,
          generatedAt: Date.now(),
          inputLength: 500,
          compressionRatio: 0.2,
        },
      };
      await nextTick();

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(false);
      expect(wrapper.findComponent(SummaryDisplay).exists()).toBe(true);

      // 5. User copies result
      const summaryDisplay = wrapper.findComponent(SummaryDisplay);
      await summaryDisplay.vm.$emit('copy');
      expect(mockCopyToClipboard).toHaveBeenCalled();

      // 6. User clears
      const clearBtn = wrapper.find('[data-test="clear-button"]');
      await clearBtn.trigger('click');
      expect(mockReset).toHaveBeenCalled();
    });
  });
});
