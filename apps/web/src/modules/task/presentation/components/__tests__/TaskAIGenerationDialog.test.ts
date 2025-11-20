/**
 * TaskAIGenerationDialog Component Tests
 * Story 2.4: Generate Task Templates UI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TaskAIGenerationDialog from '../TaskAIGenerationDialog.vue';
import { TaskPriority } from '@dailyuse/contracts';

// Mock generateTasks
const mockGenerateTasks = vi.fn().mockResolvedValue({
  tasks: [
    {
      title: 'Audit Current Bug Backlog',
      description: 'Review and categorize all existing bugs',
      estimatedHours: 8,
      priority: 'high',
      dependencies: [],
      tags: ['audit', 'bugs'],
    },
    {
      title: 'Implement Bug Categorization',
      description: 'Create categories for different bug types',
      estimatedHours: 12,
      priority: 'normal',
      dependencies: [0],
      tags: ['implementation'],
    },
    {
      title: 'Setup Bug Tracking Dashboard',
      description: 'Create dashboard for bug metrics',
      estimatedHours: 6,
      priority: 'low',
      dependencies: [0, 1],
      tags: ['dashboard'],
    },
  ],
  tokenUsage: {
    promptTokens: 100,
    completionTokens: 200,
    totalTokens: 300,
  },
  generatedAt: Date.now(),
});

// Mock composables
vi.mock('@/modules/ai/presentation/composables/useAIGeneration', () => ({
  useAIGeneration: () => ({
    generateTasks: mockGenerateTasks,
  }),
}));

vi.mock('@/modules/task/infrastructure/api/taskApiClient', () => ({
  taskTemplateApiClient: {
    createTaskTemplate: vi.fn().mockResolvedValue({
      uuid: 'task-123',
      title: 'Test Task',
      status: 'PENDING',
    }),
  },
}));

vi.mock('@/composables/useMessage', () => ({
  useMessage: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/stores/auth/authStore', () => ({
  useAuthStore: () => ({
    accountUuid: 'account-123',
  }),
}));

describe('TaskAIGenerationDialog', () => {
  let wrapper: VueWrapper;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    wrapper = mount(TaskAIGenerationDialog, {
      props: {
        modelValue: true,
        keyResultTitle: 'Reduce bug count to 50',
        keyResultDescription: 'Critical bugs only',
        targetValue: 50,
        currentValue: 100,
        unit: 'bugs',
        timeRemaining: 30,
        goalUuid: 'goal-123',
        keyResultUuid: 'kr-123',
        accountUuid: 'account-123',
      },
      global: {
        plugins: [pinia],
        stubs: {
          VDialog: true,
          VCard: true,
          VCardTitle: true,
          VCardText: true,
          VCardActions: true,
          VBtn: true,
          VProgressCircular: true,
          VAlert: true,
          VList: true,
          VListItem: true,
          VCheckbox: true,
          VTextField: true,
          VTextarea: true,
          VSelect: true,
          VChip: true,
          VProgressLinear: true,
          VIcon: true,
          VSpacer: true,
          VDivider: true,
        },
      },
    });
  });

  it('renders with props', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('modelValue')).toBe(true);
    expect(wrapper.props('keyResultTitle')).toBe('Reduce bug count to 50');
  });

  it('opens and closes on modelValue', async () => {
    expect(wrapper.props('modelValue')).toBe(true);

    await wrapper.setProps({ modelValue: false });
    expect(wrapper.props('modelValue')).toBe(false);
  });

  it('shows loading state during generation', async () => {
    await wrapper.vm.$nextTick();

    // Verify generateTasks was called
    expect(mockGenerateTasks).toHaveBeenCalledWith({
      keyResultTitle: 'Reduce bug count to 50',
      keyResultDescription: 'Critical bugs only',
      targetValue: 50,
      currentValue: 100,
      unit: 'bugs',
      timeRemaining: 30,
    });
  });

  it('displays task list after generation', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // Wait for async generation

    const vm = wrapper.vm as any;
    expect(vm.generatedTasks).toHaveLength(3);
    expect(vm.generatedTasks[0].title).toBe('Audit Current Bug Backlog');
  });

  it('sorts tasks by priority (HIGH → MEDIUM → LOW)', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;
    const sorted = vm.sortedTasks;

    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('normal');
    expect(sorted[2].priority).toBe('low');
  });

  it('allows inline editing of task fields', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;
    const task = vm.generatedTasks[0];

    // Edit title
    task.title = 'Updated Title';
    expect(task.title).toBe('Updated Title');

    // Edit hours
    task.estimatedHours = 16;
    expect(task.estimatedHours).toBe(16);

    // Edit priority
    task.priority = 'low';
    expect(task.priority).toBe('low');
  });

  it('emits tasksImported on import', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;

    // Select all tasks
    vm.generatedTasks.forEach((t: any) => (t.selected = true));

    // Import
    await vm.importSelectedTasks();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('tasksImported')).toBeTruthy();
    expect(wrapper.emitted('tasksImported')?.[0]).toEqual([3]);
  });

  it('shows progress indicator when importing > 5 tasks', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;
    vm.importing = true;
    vm.importProgress = 50;

    await wrapper.vm.$nextTick();

    expect(vm.importing).toBe(true);
    expect(vm.importProgress).toBe(50);
  });

  it('handles 429 quota exceeded error', async () => {
    mockGenerateTasks.mockRejectedValueOnce(new Error('429: Quota exceeded'));

    const wrapper2 = mount(TaskAIGenerationDialog, {
      props: {
        modelValue: true,
        keyResultTitle: 'Test',
        targetValue: 100,
        currentValue: 0,
        timeRemaining: 30,
        accountUuid: 'account-123',
        goalUuid: 'goal-123',
        keyResultUuid: 'kr-123',
      },
      global: {
        plugins: [pinia],
        stubs: {
          VDialog: true,
          VCard: true,
          VCardTitle: true,
          VCardText: true,
          VCardActions: true,
          VBtn: true,
          VProgressCircular: true,
          VAlert: true,
          VList: true,
          VListItem: true,
          VCheckbox: true,
          VTextField: true,
          VSelect: true,
          VChip: true,
          VProgressLinear: true,
          VIcon: true,
          VSpacer: true,
          VDivider: true,
        },
      },
    });

    await wrapper2.vm.$nextTick();
    await wrapper2.vm.$nextTick();

    const vm = wrapper2.vm as any;
    expect(vm.error).toContain('429');
  });

  it('calculates selected count correctly', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;

    // All selected initially
    expect(vm.selectedCount).toBe(3);

    // Unselect one
    vm.generatedTasks[0].selected = false;
    await wrapper.vm.$nextTick();
    expect(vm.selectedCount).toBe(2);
  });

  it('shows priority badge colors correctly', async () => {
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as any;

    expect(vm.getPriorityColor('high')).toBe('error');
    expect(vm.getPriorityColor('urgent')).toBe('error');
    expect(vm.getPriorityColor('normal')).toBe('warning');
    expect(vm.getPriorityColor('low')).toBe('info');
  });
});
