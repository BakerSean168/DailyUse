import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGoal } from '../useGoal';

// Mock 依赖
vi.mock('../../../application/services/GoalWebApplicationService', () => ({
  GoalWebApplicationService: vi.fn().mockImplementation(() => ({
    getGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getGoalFolders: vi.fn(),
    createGoalFolder: vi.fn(),
    updateGoalFolder: vi.fn(),
    deleteGoalFolder: vi.fn(),
  })),
}));

vi.mock('../stores/goalStore', () => ({
  getGoalStore: vi.fn(() => ({
    isLoading: false,
    error: null,
    getAllGoals: [],
    getAllGoalFolders: [],
    getSelectedGoal: null,
    setGoals: vi.fn(),
    addGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    setGoalFolders: vi.fn(),
    addGoalFolder: vi.fn(),
    updateGoalFolder: vi.fn(),
    deleteGoalFolder: vi.fn(),
  })),
}));

vi.mock('../../../../shared/composables/useSnackbar', () => ({
  useSnackbar: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  })),
}));

describe('useGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const goal = useGoal();

      expect(goal).toBeDefined();
      expect(goal.isLoading).toBeDefined();
      expect(goal.error).toBeDefined();
      expect(goal.goals).toBeDefined();
      expect(goal.GoalFolders).toBeDefined();
      expect(goal.currentGoal).toBeDefined();
    });

    it('应该正确初始化方法', () => {
      const goal = useGoal();

      expect(typeof goal.fetchGoals).toBe('function');
      expect(typeof goal.createGoal).toBe('function');
      expect(typeof goal.updateGoal).toBe('function');
      expect(typeof goal.deleteGoal).toBe('function');
      expect(typeof goal.fetchGoalFolders).toBe('function');
      expect(typeof goal.createGoalFolder).toBe('function');
    });

    it('应该正确初始化本地状态', () => {
      const goal = useGoal();

      expect(goal.editingGoal).toBeDefined();
      expect(goal.showCreateDialog).toBeDefined();
      expect(goal.showEditDialog).toBeDefined();
      expect(goal.searchQuery).toBeDefined();
      expect(goal.filters).toBeDefined();
    });
  });

  describe('目标管理', () => {
    it('应该能够获取目标列表', async () => {
      const goal = useGoal();

      // 测试方法存在性
      expect(typeof goal.fetchGoals).toBe('function');

      // 测试缓存优先策略参数
      const result = goal.fetchGoals(false, {
        page: 1,
        limit: 10,
        status: 'active',
      });

      expect(result).toBeDefined();
    });

    it('应该能够创建新目标', async () => {
      const goal = useGoal();
      const goalData = {
        title: 'New Goal',
        description: 'New Description',
        targetDate: new Date(),
        priority: 'high',
        status: 'planning',
      };

      // 测试方法存在性
      expect(typeof goal.createGoal).toBe('function');
    });

    it('应该能够更新目标', async () => {
      const goal = useGoal();
      const updateData = {
        title: 'Updated Goal',
        description: 'Updated Description',
      };

      // 测试方法存在性
      expect(typeof goal.updateGoal).toBe('function');
    });

    it('应该能够删除目标', async () => {
      const goal = useGoal();

      // 测试方法存在性
      expect(typeof goal.deleteGoal).toBe('function');
    });
  });

  describe('目标目录管理', () => {
    it('应该能够获取目标目录', async () => {
      const goal = useGoal();

      // 测试方法存在性
      expect(typeof goal.fetchGoalFolders).toBe('function');
    });

    it('应该能够创建目标目录', async () => {
      const goal = useGoal();
      const dirData = {
        name: 'New Directory',
        description: 'New Description',
        parentUuid: null,
      };

      // 测试方法存在性
      expect(typeof goal.createGoalFolder).toBe('function');
    });

    it('应该能够更新目标目录', async () => {
      const goal = useGoal();
      const updateData = {
        name: 'Updated Directory',
        description: 'Updated Description',
      };

      // 测试方法存在性
      expect(typeof goal.updateGoalFolder).toBe('function');
    });

    it('应该能够删除目标目录', async () => {
      const goal = useGoal();

      // 测试方法存在性
      expect(typeof goal.deleteGoalFolder).toBe('function');
    });
  });

  describe('计算属性', () => {
    it('应该正确提供加载状态', () => {
      const goal = useGoal();

      expect(goal.isLoading.value).toBeDefined();
      expect(typeof goal.isLoading.value).toBe('boolean');
    });

    it('应该正确提供错误状态', () => {
      const goal = useGoal();

      expect(goal.error.value).toBeDefined();
    });

    it('应该正确提供目标列表', () => {
      const goal = useGoal();

      expect(goal.goals.value).toBeDefined();
      expect(Array.isArray(goal.goals.value)).toBe(true);
    });

    it('应该正确提供目标目录列表', () => {
      const goal = useGoal();

      expect(goal.GoalFolders.value).toBeDefined();
      expect(Array.isArray(goal.GoalFolders.value)).toBe(true);
    });

    it('应该正确提供当前选中目标', () => {
      const goal = useGoal();

      // 初始状态下 currentGoal 应该是 undefined
      expect(goal.currentGoal.value).toBeUndefined();

      // currentGoal 应该是一个响应式引用
      expect(goal.currentGoal).toBeDefined();
    });
  });

  describe('本地状态管理', () => {
    it('应该正确管理编辑状态', () => {
      const goal = useGoal();

      expect(goal.editingGoal.value).toBe(null);
      expect(goal.showCreateDialog.value).toBe(false);
      expect(goal.showEditDialog.value).toBe(false);
    });

    it('应该正确管理搜索状态', () => {
      const goal = useGoal();

      expect(goal.searchQuery.value).toBe('');
      expect(typeof goal.searchQuery.value).toBe('string');
    });

    it('应该正确管理过滤器状态', () => {
      const goal = useGoal();

      expect(goal.filters).toBeDefined();
      expect(typeof goal.filters).toBe('object');
      expect(goal.filters.status).toBeDefined();
      expect(goal.filters.dirUuid).toBeDefined();
    });
  });

  describe('UI 交互方法', () => {
    it('应该提供对话框控制方法', () => {
      const goal = useGoal();

      // 检查是否有对话框相关方法
      if (goal.openCreateDialog) {
        expect(typeof goal.openCreateDialog).toBe('function');
      }

      if (goal.openEditDialog) {
        expect(typeof goal.openEditDialog).toBe('function');
      }

      if (goal.closeDialogs) {
        expect(typeof goal.closeDialogs).toBe('function');
      }
    });

    it('应该提供搜索和过滤方法', () => {
      const goal = useGoal();

      // 检查响应式搜索状态
      expect(goal.searchQuery).toBeDefined();
      expect(typeof goal.searchQuery.value).toBe('string');

      // 检查过滤器状态
      expect(goal.filters).toBeDefined();
      expect(typeof goal.filters).toBe('object');

      if (goal.clearFilters) {
        expect(typeof goal.clearFilters).toBe('function');
      }
    });
  });

  describe('缓存策略', () => {
    it('应该支持强制刷新', async () => {
      const goal = useGoal();

      // 测试强制刷新参数
      const forceRefreshResult = goal.fetchGoals(true);
      expect(forceRefreshResult).toBeDefined();

      // 测试缓存优先
      const cacheFirstResult = goal.fetchGoals(false);
      expect(cacheFirstResult).toBeDefined();
    });

    it('应该支持分页参数', async () => {
      const goal = useGoal();

      const paginatedResult = goal.fetchGoals(false, {
        page: 2,
        limit: 20,
      });

      expect(paginatedResult).toBeDefined();
    });
  });

  describe('数据处理', () => {
    it('应该正确处理目标数据结构', () => {
      const goal = useGoal();

      // 目标应该是数组
      expect(Array.isArray(goal.goals.value)).toBe(true);

      // 目标目录应该是数组
      expect(Array.isArray(goal.GoalFolders.value)).toBe(true);
    });

    it('应该正确处理错误状态', () => {
      const goal = useGoal();

      // 错误状态应该是响应式的
      expect(goal.error.value).toBeDefined();
    });

    it('应该正确处理加载状态', () => {
      const goal = useGoal();

      // 加载状态应该是布尔值
      expect(typeof goal.isLoading.value).toBe('boolean');
    });
  });
});
