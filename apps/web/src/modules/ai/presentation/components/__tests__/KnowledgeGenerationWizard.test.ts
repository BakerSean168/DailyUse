import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import KnowledgeGenerationWizard from '../generation/KnowledgeGenerationWizard.vue';
import { DocumentStatus } from '../../types/knowledgeGeneration';

// Router mock
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    currentRoute: { value: { path: '/ai-tools/knowledge-generator' } },
  }),
}));

// Display mock
vi.mock('vuetify', () => ({ useDisplay: () => ({ mobile: false }) }));

// Composable mock
const mockComposable = {
  task: { value: null as any },
  documents: { value: [] as any[] },
  isGenerating: { value: false },
  error: { value: null as string | null },
  currentStep: { value: 1 },
  progress: { value: 0 },
  isCompleted: { value: false },
  isFailed: { value: false },
  estimatedTime: { value: null as string | null },
  documentPreviews: { value: [] as any[] },
  startGeneration: vi.fn(),
  discardDocument: vi.fn(),
  cancelTask: vi.fn(),
  reset: vi.fn(),
};

vi.mock('../../composables/useKnowledgeGeneration', () => ({
  useKnowledgeGeneration: () => mockComposable,
}));

// Stubs
const stubs = {
  VContainer: { template: '<div><slot /></div>' },
  VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' },
  VCard: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VStepper: { template: '<div><slot /></div>' },
  VStepperHeader: { template: '<div><slot /></div>' },
  VStepperItem: { template: '<div><slot /></div>' },
  VStepperWindow: { template: '<div><slot /></div>' },
  VStepperWindowItem: { template: '<div><slot /></div>' },
  VForm: { template: '<form><slot /></form>', methods: { validate: () => ({ valid: true }) } },
  VTextField: {
    template:
      '<input data-test="input-topic" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  VSelect: { template: '<select><slot /></select>' },
  VProgressLinear: {
    template: '<div data-test="progress-bar" :data-value="modelValue"></div>',
    props: ['modelValue'],
  },
  VList: { template: '<div><slot /></div>' },
  VListItem: { template: '<div data-test="document-status-item"><slot /></div>' },
  VListItemTitle: { template: '<span class="title"><slot /></span>' },
  VIcon: { template: '<i />' },
  VChip: { template: '<span><slot /></span>' },
  VAlert: { template: '<div class="alert"><slot /></div>' },
  VBtn: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  VSpacer: { template: '<span />' },
  VDivider: { template: '<hr />' },
  VDialog: { template: '<div v-if="modelValue"><slot /></div>', props: ['modelValue'] },
  KnowledgeDocumentCard: { template: '<div data-test="doc-card" />', props: ['document'] },
};

function mountWizard() {
  return mount(KnowledgeGenerationWizard, { global: { stubs } });
}

describe('KnowledgeGenerationWizard (migrated)', () => {
  let wrapper: ReturnType<typeof mountWizard>;
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockComposable, {
      task: { value: null },
      documents: { value: [] },
      isGenerating: { value: false },
      error: { value: null },
      currentStep: { value: 1 },
      progress: { value: 0 },
      isCompleted: { value: false },
      isFailed: { value: false },
      estimatedTime: { value: null },
      documentPreviews: { value: [] },
    });
  });
  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });
  it('Step1: 输入框显示', () => {
    wrapper = mountWizard();
    expect(wrapper.find('[data-test="input-topic"]').exists()).toBe(true);
  });
  it('Step1: startGeneration 参数正确', async () => {
    wrapper = mountWizard();
    await wrapper.find('[data-test="input-topic"]').setValue('测试主题');
    await (wrapper.vm as any).handleStartGeneration();
    expect(mockComposable.startGeneration).toHaveBeenCalledWith({
      topic: '测试主题',
      documentCount: 5,
      targetAudience: 'Beginners',
    });
  });
  it('Step3: 丢弃文档触发 discardDocument', async () => {
    mockComposable.currentStep.value = 3;
    mockComposable.isCompleted.value = true;
    mockComposable.documents.value = [
      {
        uuid: 'x',
        title: 'DocX',
        status: DocumentStatus.COMPLETED,
        excerpt: '...',
        wordCount: 100,
      },
    ];
    wrapper = mountWizard();
    await (wrapper.vm as any).handleDiscard('x');
    expect(mockComposable.discardDocument).toHaveBeenCalledWith('x');
  });
  it('Step4: 成功文案显示', () => {
    mockComposable.currentStep.value = 4;
    mockComposable.isCompleted.value = true;
    mockComposable.documents.value = [
      { uuid: 'd1', title: 'A', status: DocumentStatus.COMPLETED, excerpt: '', wordCount: 50 },
    ];
    wrapper = mountWizard();
    expect(wrapper.text()).toContain('知识库创建成功');
  });
  it('取消流程: confirmCancel 执行取消与重置并导航', async () => {
    mockComposable.currentStep.value = 2;
    mockComposable.isGenerating.value = true;
    wrapper = mountWizard();
    await (wrapper.vm as any).handleCancel();
    expect((wrapper.vm as any).showCancelDialog).toBe(true);
    await (wrapper.vm as any).confirmCancel();
    expect(mockComposable.cancelTask).toHaveBeenCalled();
    expect(mockComposable.reset).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/ai-tools');
  });
  it('错误提示: Step2 显示错误信息', () => {
    mockComposable.currentStep.value = 2;
    mockComposable.isFailed.value = true;
    mockComposable.error.value = '生成失败：配额不足';
    wrapper = mountWizard();
    expect(wrapper.text()).toContain('生成失败：配额不足');
  });
  it('可访问性: Stepper 具有 tablist 角色', () => {
    wrapper = mountWizard();
    const stepper = wrapper.find('[data-test="stepper"]');
    expect(stepper.attributes('role')).toBe('tablist');
  });
  it('可访问性: ProgressBar 具有 ARIA 属性', () => {
    mockComposable.currentStep.value = 2;
    wrapper = mountWizard();
    const bar = wrapper.find('[data-test="progress-bar"]');
    expect(bar.attributes('role')).toBe('progressbar');
    expect(bar.attributes('aria-valuemin')).toBe('0');
    expect(bar.attributes('aria-valuemax')).toBe('100');
  });
  it('可访问性: 取消对话框具有 dialog 角色与 aria-modal', async () => {
    mockComposable.currentStep.value = 2;
    wrapper = mountWizard();
    await (wrapper.vm as any).handleCancel();
    const dialog = wrapper.find('[data-test="cancel-dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('role')).toBe('dialog');
    expect(dialog.attributes('aria-modal')).toBe('true');
  });
  it('可访问性: 键盘导航 Stepper ArrowRight 前进', async () => {
    wrapper = mountWizard();
    expect(mockComposable.currentStep.value).toBe(1);
    await wrapper.find('[data-test="stepper"]').trigger('keydown', { key: 'ArrowRight' });
    expect(mockComposable.currentStep.value).toBe(2);
  });
  it('可访问性: 键盘导航 Home 跳到第一步, End 跳到最后一步', async () => {
    wrapper = mountWizard();
    mockComposable.currentStep.value = 2;
    await wrapper.find('[data-test="stepper"]').trigger('keydown', { key: 'End' });
    expect(mockComposable.currentStep.value).toBe(4);
    await wrapper.find('[data-test="stepper"]').trigger('keydown', { key: 'Home' });
    expect(mockComposable.currentStep.value).toBe(1);
  });
  it('可访问性: 进度 live region 更新包含百分比', () => {
    mockComposable.currentStep.value = 2;
    mockComposable.progress.value = 42;
    wrapper = mountWizard();
    const live = wrapper.find('[data-test="progress-live"]');
    expect(live.text()).toContain('42%');
  });
});
