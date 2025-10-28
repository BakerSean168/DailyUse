---
mode: agent
---

# DailyUse - 开发规范

## 开发规范

### 命名约定

- **文件命名**: 小驼峰命名法 `accountUtils.ts`
- **类/常量/枚举**: 大驼峰命名法 `AccountConstants.ts`
- **组件**: 大驼峰命名法 `ProfileDialog.vue`
- **函数/变量**: 小驼峰命名法

### 代码质量

- **类型安全**: 严格的TypeScript配置
- **代码注释**: 详细的JSDoc注释
- **单元测试**: 核心业务逻辑测试覆盖
- **代码格式**: ESLint + Prettier统一格式化

### 包管理

- **优先使用**: `pnpm` 命令而非 `npm`
- **依赖管理**: 通过workspace统一管理
- **版本控制**: 语义化版本控制

### Git工作流

- **分支策略**: GitFlow或GitHub Flow
- **提交规范**: Conventional Commits
- **代码审查**: Pull Request必须经过审查

### DDD聚合根控制开发规范

#### 聚合根设计原则

1. **聚合边界明确** - 每个聚合根控制特定的业务边界
2. **业务规则集中** - 所有业务规则在聚合根内部实现
3. **数据一致性** - 聚合根保证内部数据的强一致性
4. **领域事件** - 重要业务变更必须发布领域事件

#### API路由设计规范

```typescript
// ✅ 推荐：通过聚合根操作子实体
POST   /api/v1/goals/:goalId/key-results
PUT    /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId
GET    /api/v1/goals/:goalId/aggregate

// ❌ 避免：直接操作子实体
POST   /api/v1/key-results
PUT    /api/v1/key-results/:id
DELETE /api/v1/key-results/:id
```

#### 聚合根实现规范

```typescript
// ✅ 正确的聚合根方法命名和实现
export class Goal extends GoalCore {
  // 创建子实体：create + 子实体名称
  createKeyResult(data: KeyResultData): string {
    /* ... */
  }

  // 更新子实体：update + 子实体名称
  updateKeyResult(uuid: string, updates: Partial<KeyResultData>): void {
    /* ... */
  }

  // 删除子实体：remove + 子实体名称
  removeKeyResult(uuid: string): void {
    /* ... */
  }

  // 业务规则验证
  private validateKeyResultWeight(weight: number): void {
    /* ... */
  }

  // 领域事件发布
  private publishDomainEvent(eventType: string, data: any): void {
    /* ... */
  }
}
```

#### 应用服务协调规范

```typescript
// ✅ 正确的应用服务实现
export class GoalAggregateService {
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: CreateKeyResultRequest,
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);

    // 2. 转换为领域实体
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根执行业务操作
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    await this.persistAggregateChanges(goal);

    return /* 响应 */;
  }
}
```

#### 仓储层扩展规范

```typescript
// ✅ 聚合根仓储扩展方法
export interface IGoalRepository {
  // 加载完整聚合
  loadGoalAggregate(accountUuid: string, goalUuid: string): Promise<GoalAggregateData>;

  // 原子性更新聚合
  updateGoalAggregate(accountUuid: string, changes: AggregateChanges): Promise<void>;

  // 业务规则验证
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    changes: any,
  ): Promise<ValidationResult>;
}
```

#### 错误处理规范

```typescript
// ✅ 业务规则错误处理
export class Goal extends GoalCore {
  createKeyResult(data: KeyResultData): string {
    // 业务规则验证
    if (!data.name.trim()) {
      throw new DomainError('关键结果名称不能为空', 'INVALID_KEY_RESULT_NAME');
    }

    const totalWeight = this.calculateTotalWeight();
    if (totalWeight + data.weight > 100) {
      throw new DomainError(
        `关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`,
        'WEIGHT_LIMIT_EXCEEDED',
      );
    }

    // 业务逻辑...
  }
}
```

#### 测试规范

```typescript
// ✅ 聚合根单元测试
describe('Goal Aggregate Root', () => {
  it('should enforce weight limit when creating key result', () => {
    const goal = new Goal(/* ... */);
    goal.addKeyResult({ weight: 60 });
    goal.addKeyResult({ weight: 30 });

    expect(() => {
      goal.createKeyResult({ weight: 20 }); // 总和110%
    }).toThrow('关键结果权重总和不能超过100%');
  });

  it('should cascade delete records when removing key result', () => {
    const goal = new Goal(/* ... */);
    const keyResultUuid = goal.createKeyResult(/* ... */);
    goal.createRecord({ keyResultUuid, value: 50 });

    goal.removeKeyResult(keyResultUuid);

    expect(goal.getRecordsForKeyResult(keyResultUuid)).toHaveLength(0);
  });
});
```

## 数据获取流程架构设计

### 推荐架构：Composable + ApplicationService + Store 分层

**设计原则**：

- **Domain层**: 纯业务逻辑，不涉及技术实现
- **Application层**: 业务用例协调，API调用，缓存策略
- **Presentation层**: UI状态管理，用户交互

**数据流向**：

```
Vue组件 → Composable → ApplicationService → API Client
                  ↓                      ↓
                Store (缓存)              Backend API
```

### 架构层次职责

#### 1. Presentation Layer (表示层)

**Pinia Store**: 纯缓存存储

```typescript
// store/goalStore.ts
export const useGoalStore = defineStore('goal', {
  state: () => ({
    // 缓存数据
    goals: [] as Goal[],
    GoalFolders: [] as GoalFolder[],

    // UI状态
    isLoading: false,
    error: null,
    pagination: {...},
    filters: {...},
    selectedGoalUuid: null,
  }),

  getters: {
    // 纯数据查询，无业务逻辑
    getGoalByUuid: (state) => (uuid: string) =>
      state.goals.find(g => g.uuid === uuid),

    getActiveGoals: (state) =>
      state.goals.filter(g => g.status === 'active'),
  },

  actions: {
    // 纯数据操作，不调用外部服务
    setGoals(goals: Goal[]) { this.goals = goals; },
    addGoal(goal: Goal) { this.goals.push(goal); },
    updateGoal(goal: Goal) { /* 更新逻辑 */ },
    removeGoal(uuid: string) { /* 删除逻辑 */ },

    // UI状态管理
    setLoading(loading: boolean) { this.goals = goals; },
    setError(error: string | null) { this.error = error; },
  },
});
```

**Composable**: 业务逻辑封装

```typescript
// composables/useGoal.ts
export function useGoal() {
  const goalStore = useGoalStore();
  const goalService = new GoalWebApplicationService();

  // 获取所有目标 - 优先从缓存读取
  const fetchGoals = async (forceRefresh = false) => {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && goalStore.goals.length > 0) {
      return goalStore.goals;
    }

    // 调用应用服务获取数据
    await goalService.fetchAndCacheGoals();
    return goalStore.goals;
  };

  // 创建目标
  const createGoal = async (request: CreateGoalRequest) => {
    return await goalService.createGoal(request);
  };

  return {
    // 响应式数据（从store获取）
    goals: computed(() => goalStore.goals),
    isLoading: computed(() => goalStore.isLoading),

    // 业务方法
    fetchGoals,
    createGoal,
    // ...其他方法
  };
}
```

#### 2. Application Layer (应用层)

**ApplicationService**: 业务用例协调

```typescript
// application/services/GoalWebApplicationService.ts
export class GoalWebApplicationService {
  constructor(
    private goalApiClient = goalApiClient,
    private goalStore = useGoalStore(),
  ) {}

  /**
   * 获取并缓存目标数据
   * 职责：API调用 + 缓存管理 + 错误处理
   */
  async fetchAndCacheGoals(params?: GetGoalsParams): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 调用API
      const response = await this.goalApiClient.getGoals(params);

      // 转换为领域实体
      const goals = response.goals.map((dto) => Goal.fromDTO(dto));

      // 缓存到store
      this.goalStore.setGoals(goals);
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 创建目标
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    try {
      this.goalStore.setLoading(true);

      // API调用
      const response = await this.goalApiClient.createGoal(request);

      // 转换为领域实体
      const goal = Goal.fromResponse(response);

      // 更新缓存
      this.goalStore.addGoal(goal);

      return goal;
    } catch (error) {
      this.goalStore.setError(error.message);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(): Promise<void> {
    await Promise.all([
      this.fetchAndCacheGoals({ limit: 1000 }),
      this.fetchAndCacheGoalFolders({ limit: 1000 }),
    ]);
  }
}
```

#### 3. Infrastructure Layer (基础设施层)

**API Client**: 纯API调用

```typescript
// infrastructure/api/goalApiClient.ts
export const goalApiClient = {
  async getGoals(params?: GetGoalsParams): Promise<GoalListResponse> {
    const response = await httpClient.get('/api/goals', { params });
    return response.data;
  },

  async createGoal(request: CreateGoalRequest): Promise<GoalResponse> {
    const response = await httpClient.post('/api/goals', request);
    return response.data;
  },

  // ...其他API方法
};
```

### 登录时数据初始化策略

**全局初始化服务**：

```typescript
// shared/services/InitializationService.ts
export class InitializationService {
  async initializeUserData(accountUuid: string): Promise<void> {
    // 并行初始化所有模块数据
    await Promise.all([
      this.initializeGoalModule(),
      this.initializeTaskModule(),
      this.initializeReminderModule(),
      // ...其他模块
    ]);
  }

  private async initializeGoalModule(): Promise<void> {
    const goalService = new GoalWebApplicationService();
    await goalService.initializeModuleData();
  }
}
```

**登录后调用**：

```typescript
// authentication/stores/authStore.ts
const login = async (credentials) => {
  const response = await authApi.login(credentials);

  // 设置用户信息
  setUser(response.user);
  setToken(response.token);

  // 初始化所有模块数据
  await initializationService.initializeUserData(response.user.uuid);
};
```

### 架构优势

1. **职责明确**：Store纯缓存，Service纯业务协调，API纯数据获取
2. **性能优化**：登录时一次性同步，后续直接从缓存读取
3. **错误隔离**：每层独立的错误处理机制
4. **可测试性**：每层可独立单元测试
5. **可维护性**：清晰的依赖关系和数据流

### 实际使用示例

```vue
<!-- views/GoalList.vue -->
<script setup>
import { useGoal } from '../composables/useGoal';

const { goals, isLoading, fetchGoals, createGoal } = useGoal();

// 组件挂载时，优先从缓存获取数据
onMounted(async () => {
  await fetchGoals(); // 如果有缓存直接返回，无缓存则API获取
});

// 手动刷新
const refresh = () => fetchGoals(true); // 强制从API刷新
</script>
```

这种架构既保证了性能（缓存优先），又保证了数据的准确性（支持强制刷新），同时符合DDD的分层原则。

## 模块初始化系统架构规范

### 初始化系统设计原则

**核心原则**：

- **分层职责明确**: ApplicationService 负责数据操作，Composables 只读取数据
- **统一初始化流程**: 所有模块遵循相同的初始化生命周期
- **错误隔离**: 单个模块初始化失败不影响整个应用启动
- **可扩展性**: 支持新模块的便捷接入

### 模块初始化架构分层

#### 1. ApplicationService 层

**职责**:

- **直接操作 Store**: 使用 `getReminderStore()` 等工厂函数直接修改 store 数据
- **API 调用**: 负责所有与后端的数据交互
- **业务逻辑协调**: 处理复杂的业务用例
- **初始化管理**: 提供 `initializeModule()` 和 `initializeModuleData()` 方法

**规范实现**:

```typescript
// ApplicationService 标准结构
export class ModuleWebApplicationService {
  /**
   * 直接获取 Store（不使用 composables）
   */
  private get moduleStore() {
    return getModuleStore(); // 使用工厂函数，不是 useModuleStore()
  }

  /**
   * 仅初始化模块（应用启动时调用）
   * 只初始化 store 和本地状态，不进行网络同步
   */
  async initializeModule(): Promise<void> {
    try {
      this.moduleStore.initialize();
      console.log('Module 基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('Module 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化模块数据（用户登录时调用）
   * 从服务器同步所有数据到 store
   */
  async initializeModuleData(): Promise<void> {
    try {
      await this.syncAllModuleData();
      console.log('Module 数据同步完成');
    } catch (error) {
      console.error('Module 数据同步失败:', error);
      throw error;
    }
  }

  /**
   * 同步所有模块数据
   */
  async syncAllModuleData(): Promise<void> {
    // 并行获取数据
    const [dataA, dataB] = await Promise.all([
      this.apiClient.getDataA(),
      this.apiClient.getDataB(),
    ]);

    // 转换并存储到 store
    const entitiesA = dataA.map((dto) => EntityA.fromDTO(dto));
    const entitiesB = dataB.map((dto) => EntityB.fromDTO(dto));

    this.moduleStore.setDataA(entitiesA);
    this.moduleStore.setDataB(entitiesB);
  }
}
```

#### 2. Store 层

**职责**:

- **纯数据存储**: 只负责数据的存储和基本查询
- **工厂函数**: 提供 `getModuleStore()` 供 ApplicationService 使用
- **初始化状态**: 管理模块的初始化状态和缓存策略

**规范实现**:

```typescript
// Store 标准结构
export const useModuleStore = defineStore('module', {
  state: () => ({
    // 数据缓存
    entities: [] as Entity[],

    // UI 状态
    isLoading: false,
    error: null,

    // 初始化状态
    isInitialized: false,
    lastSyncTime: null,
  }),

  getters: {
    // 纯数据查询方法
    getEntityByUuid: (state) => (uuid: string) => state.entities.find((e) => e.uuid === uuid),
  },

  actions: {
    // 数据操作方法（供 ApplicationService 调用）
    setEntities(entities: Entity[]) {
      this.entities = entities;
    },

    addOrUpdateEntity(entity: Entity) {
      const index = this.entities.findIndex((e) => e.uuid === entity.uuid);
      if (index >= 0) {
        this.entities[index] = entity;
      } else {
        this.entities.push(entity);
      }
    },

    // 初始化相关
    initialize() {
      this.isInitialized = true;
      this.lastSyncTime = new Date();
    },

    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;
      const cacheAge = Date.now() - this.lastSyncTime.getTime();
      return cacheAge > 30 * 60 * 1000; // 30分钟过期
    },
  },
});

/**
 * Store 工厂函数
 * 供 ApplicationService 使用，避免响应式依赖
 */
export const getModuleStore = () => {
  return useModuleStore();
};
```

#### 3. Composables 层（只读模式）

**职责**:

- **只读数据访问**: 从 store 获取数据，提供响应式接口
- **不修改状态**: 绝不直接调用 store 的修改方法
- **UI 状态管理**: 管理纯本地 UI 状态（如当前选中项）

**规范实现**:

```typescript
// Composables 只读模式标准结构
export function useModule() {
  const moduleStore = useModuleStore();

  // ===== 响应式数据（只读）=====
  const entities = computed(() => moduleStore.entities);
  const isLoading = computed(() => moduleStore.isLoading);
  const error = computed(() => moduleStore.error);

  // ===== 本地 UI 状态 =====
  const currentEntity = ref<Entity | null>(null);

  // ===== 数据查询方法（只读）=====
  const getEntityByUuid = (uuid: string): Entity | null => {
    return moduleStore.getEntityByUuid(uuid);
  };

  // ===== 本地状态管理 =====
  const setCurrentEntity = (entity: Entity | null): void => {
    currentEntity.value = entity;
  };

  return {
    // 响应式数据（只读）
    entities,
    isLoading,
    error,
    currentEntity,

    // 数据查询方法（只读）
    getEntityByUuid,

    // 本地状态管理
    setCurrentEntity,
  };
}
```

#### 4. 模块 Index 层

**职责**:

- **统一导出**: 提供模块的统一入口
- **工厂函数**: 提供服务实例的工厂方法
- **初始化函数**: 导出模块初始化函数

**规范实现**:

```typescript
// modules/module/index.ts 标准结构
import { ModuleWebApplicationService } from './application/services/ModuleWebApplicationService';

/**
 * 全局单例服务实例 - 懒加载
 */
let _moduleService: ModuleWebApplicationService | null = null;

/**
 * 获取 Module Web 应用服务实例
 */
export const getModuleWebService = (): ModuleWebApplicationService => {
  if (!_moduleService) {
    _moduleService = new ModuleWebApplicationService();
  }
  return _moduleService;
};

/**
 * 初始化 Module 模块
 * 供初始化系统调用
 */
export const initializeModuleModule = async (): Promise<void> => {
  const service = getModuleWebService();
  await service.initializeModule();
};

// 导出其他必要的类型和组件
export type { ModuleWebApplicationService };
export { useModule } from './presentation/composables/useModule';
```

### 初始化系统流程

#### 1. 注册初始化任务

**规范实现**:

```typescript
// modules/module/initialization/moduleInitialization.ts
export function registerModuleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 模块基础初始化任务（应用启动时）
  const moduleInitTask: InitializationTask = {
    name: 'module-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 30,
    initialize: async () => {
      console.log('📦 [Module] 开始初始化 Module 模块...');
      try {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 确保 Pinia 初始化
        const service = getModuleWebService();
        await service.initializeModule(); // 只初始化，不同步数据
        console.log('✅ [Module] Module 模块初始化完成');
      } catch (error) {
        console.error('❌ [Module] Module 模块初始化失败:', error);
        console.warn('Module 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      const service = getModuleWebService();
      service.cleanup();
    },
  };

  // 用户数据同步任务（用户登录时）
  const moduleDataSyncTask: InitializationTask = {
    name: 'module-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`📦 [Module] 开始用户数据同步: ${context?.accountUuid}`);
      try {
        const service = getModuleWebService();
        await service.initializeModuleData(); // 同步数据
        console.log(`✅ [Module] 用户数据同步完成: ${context?.accountUuid}`);
      } catch (error) {
        console.error(`❌ [Module] 用户数据同步失败: ${context?.accountUuid}`, error);
        console.warn('Module 数据同步失败，但用户登录将继续');
      }
    },
    cleanup: async () => {
      const service = getModuleWebService();
      service.cleanup();
    },
  };

  manager.registerTask(moduleInitTask);
  manager.registerTask(moduleDataSyncTask);
}
```

#### 2. 全局初始化服务

**规范实现**:

```typescript
// shared/services/InitializationService.ts
export class InitializationService {
  async initializeUserData(accountUuid: string): Promise<void> {
    // 并行初始化所有模块数据
    await Promise.all([
      this.initializeGoalModule(),
      this.initializeReminderModule(),
      this.initializeTaskModule(),
      // ...其他模块
    ]);
  }

  private async initializeReminderModule(): Promise<void> {
    const reminderService = getReminderWebService();
    await reminderService.initializeModuleData();
  }
}
```

### 关键架构原则总结

#### ✅ 正确的做法

1. **ApplicationService 直接操作 Store**

   ```typescript
   // ✅ 正确 - ApplicationService 中
   private get reminderStore() {
     return getReminderStore(); // 使用工厂函数
   }

   async createTemplate(data) {
     const template = Template.fromData(data);
     this.reminderStore.addTemplate(template); // 直接修改 store
   }
   ```

2. **Composables 只读数据**

   ```typescript
   // ✅ 正确 - Composables 中
   export function useReminder() {
     const store = useReminderStore();

     return {
       templates: computed(() => store.templates), // 只读
       getTemplateById: (id) => store.getTemplateById(id), // 只读查询
     };
   }
   ```

3. **分层初始化**

   ```typescript
   // ✅ 正确 - 分阶段初始化
   // 应用启动时：只初始化模块
   await service.initializeModule();

   // 用户登录时：同步数据
   await service.initializeModuleData();
   ```

#### ❌ 错误的做法

1. **Composables 修改 Store**

   ```typescript
   // ❌ 错误 - Composables 中不应该有状态修改
   export function useReminder() {
     const store = useReminderStore();

     const createTemplate = async (data) => {
       store.addTemplate(data); // 错误：composables 不应修改 store
     };
   }
   ```

2. **ApplicationService 使用 Composables**

   ```typescript
   // ❌ 错误 - ApplicationService 中不应使用 composables
   export class ReminderWebApplicationService {
     async createTemplate(data) {
       const { createTemplate } = useReminder(); // 错误：不应使用 composables
       return await createTemplate(data);
     }
   }
   ```

3. **混乱的初始化顺序**
   ```typescript
   // ❌ 错误 - 在应用启动时同步网络数据
   async initializeModule() {
     await this.syncAllDataFromServer(); // 错误：应用启动时不应进行网络请求
   }
   ```

这种架构确保了：

- **清晰的职责分离**: 每层职责明确，不越界
- **一致的初始化流程**: 所有模块遵循相同的初始化生命周期
- **良好的性能**: 应用启动快速，数据按需同步
- **易于维护**: 代码结构清晰，便于扩展和测试

### Composables 应用场景分层规范

#### 核心业务模块 - 只读模式 Composables

**适用模块**: Goal, Task, Reminder, Authentication, Account, Repository, Editor 等涉及 ApplicationService 的核心业务模块

**职责划分**:

- **ApplicationService**: 负责所有业务逻辑、API调用、状态修改
- **Composables (useXXX)**: 只读数据访问、响应式包装、本地UI状态

**命名规范**:

- ✅ 正确: `useGoal`, `useTask`, `useAuthentication`
- ❌ 错误: `useGoalService`, `useTaskService`, `useAuthenticationService`

**标准实现**:

```typescript
// ✅ 核心业务模块 - 只读模式
export function useAuthentication() {
  const authStore = useAuthStore();
  const authService = getAuthService(); // 获取 ApplicationService 实例

  // ===== 只读响应式数据 =====
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);

  // ===== 本地 UI 状态 =====
  const loginFormVisible = ref(false);

  // ===== 只读查询方法 =====
  const getUserProfile = () => authStore.user;
  const hasPermission = (permission: string) => authStore.hasPermission(permission);

  // ===== 业务操作（委托给 ApplicationService）=====
  const login = async (credentials) => {
    return await authService.login(credentials);
  };

  const logout = async () => {
    return await authService.logout();
  };

  // ===== 本地 UI 状态管理 =====
  const showLoginForm = () => (loginFormVisible.value = true);
  const hideLoginForm = () => (loginFormVisible.value = false);

  return {
    // 只读响应式数据
    isAuthenticated,
    user,
    isLoading,
    error,

    // 本地 UI 状态
    loginFormVisible,

    // 只读查询方法
    getUserProfile,
    hasPermission,

    // 业务操作（委托模式）
    login,
    logout,

    // 本地状态管理
    showLoginForm,
    hideLoginForm,
  };
}
```

#### 简单工具模块 - 完整 Composables

**适用场景**: UI状态管理、工具函数、不涉及复杂业务逻辑的功能

**标准实现**:

```typescript
// ✅ 简单工具模块 - 完整模式
export function useModal() {
  const isOpen = ref(false);
  const title = ref('');
  const content = ref('');

  const open = (modalTitle?: string, modalContent?: string) => {
    title.value = modalTitle || '';
    content.value = modalContent || '';
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
    title.value = '';
    content.value = '';
  };

  const toggle = () => {
    isOpen.value ? close() : open();
  };

  return {
    // 状态
    isOpen,
    title,
    content,

    // 操作
    open,
    close,
    toggle,
  };
}

export function useTheme() {
  const theme = ref<'light' | 'dark'>('light');

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
    document.documentElement.setAttribute('data-theme', theme.value);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // 初始化主题
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  });

  return {
    theme: readonly(theme),
    toggleTheme,
    setTheme,
  };
}
```

#### 混合模式 Composables（不推荐）

**使用场景**: 遗留代码迁移期间的临时方案

```typescript
// ⚠️ 混合模式 - 仅用于遗留代码迁移
export function useGoalLegacy() {
  const store = useGoalStore();
  const service = getGoalService();

  return {
    // 只读数据访问
    goals: computed(() => store.goals),
    isLoading: computed(() => store.isLoading),

    // 业务操作入口（委托给 ApplicationService）
    createGoal: (data) => service.createGoal(data),
    updateGoal: (id, data) => service.updateGoal(id, data),

    // 避免直接暴露 store 修改方法
  };
}
```

#### 架构选择决策表

| 模块类型     | Composables模式     | ApplicationService | 示例                       |
| ------------ | ------------------- | ------------------ | -------------------------- |
| 核心业务模块 | 只读模式            | 必需               | Goal, Task, Authentication |
| 简单UI工具   | 完整模式            | 不需要             | Modal, Theme, Counter      |
| 工具函数库   | 完整模式            | 不需要             | Clipboard, LocalStorage    |
| 遗留代码     | 混合模式 → 只读模式 | 逐步引入           | 迁移期间使用               |

#### 重构指导原则

1. **新功能**: 直接使用对应的模式
2. **现有代码**: 逐步重构，优先重构复杂业务逻辑
3. **命名统一**: 所有 composables 使用 `useXXX` 命名，去掉 `Service` 后缀
4. **职责清晰**: 明确区分业务逻辑（ApplicationService）和数据访问（Composables）

这种分层架构确保了代码的**一致性**、**可维护性**和**可扩展性**。

#### 应用服务层依赖注入规范

**核心原则**: 基础设施层通过 di/xxcontainer 来管理依赖，在 ApplicationService 通过 createInstance 来注入依赖，或者默认选项。然后通过 getInstance 来获取服务实例。

1. **依赖注入容器** (`packages/domain-server/src/{module}/di/`)

   ```typescript
   // XxxContainer.ts - 依赖注入容器
   export class GoalContainer {
     private static instance: GoalContainer;
     private prismaGoalRepository?: PrismaGoalRepository;

     static getInstance(): GoalContainer {
       if (!this.instance) {
         this.instance = new GoalContainer();
       }
       return this.instance;
     }

     async getPrismaGoalRepository(): Promise<PrismaGoalRepository> {
       if (!this.prismaGoalRepository) {
         const prismaClient = await getPrismaClient();
         this.prismaGoalRepository = new PrismaGoalRepository(prismaClient);
       }
       return this.prismaGoalRepository;
     }
   }
   ```

2. **应用服务依赖注入** (`ApplicationService`)

   ```typescript
   export class GoalApplicationService {
     private static instance: GoalApplicationService;
     private goalRepository: IGoalRepository;

     constructor(goalRepository: IGoalRepository) {
       this.goalRepository = goalRepository;
     }

     // 创建实例时注入依赖，支持默认选项
     static async createInstance(
       goalRepository?: IGoalRepository,
     ): Promise<GoalApplicationService> {
       const goalContainer = GoalContainer.getInstance();
       goalRepository = goalRepository || (await goalContainer.getPrismaGoalRepository());
       this.instance = new GoalApplicationService(goalRepository);
       return this.instance;
     }

     // 获取服务实例
     static async getInstance(): Promise<GoalApplicationService> {
       if (!this.instance) {
         GoalApplicationService.instance = await GoalApplicationService.createInstance();
       }
       return this.instance;
     }
   }
   ```

3. **依赖注入优势**
   - **可测试性**: 可以注入模拟仓储进行单元测试
   - **灵活性**: 可以在不同环境注入不同实现
   - **解耦**: 应用层不直接依赖具体的基础设施实现
   - **单例管理**: 确保服务实例的一致性

4. **使用示例**

   ```typescript
   // 生产环境 - 使用默认依赖
   const goalService = await GoalApplicationService.getInstance();

   // 测试环境 - 注入模拟依赖
   const mockRepository = new MockGoalRepository();
   const goalService = await GoalApplicationService.createInstance(mockRepository);
   ```

#### 仓储接口设计规范

**核心原则**: 仓储接口必须返回DTO对象，而不是领域实体

1. **接口定义** (`packages/domain-server/src/{module}/repositories/`)

   ```typescript
   // ❌ 错误 - 返回领域实体
   findByUuid(uuid: string): Promise<Repository | null>;

   // ✅ 正确 - 返回DTO对象
   findByUuid(uuid: string): Promise<RepositoryDTO | null>;
   ```

2. **DTO转换原则**
   - 仓储层负责数据库实体 ↔ DTO 的转换
   - 应用层负责 DTO ↔ 领域实体 的转换
   - 领域实体提供 `toDTO()` 和 `fromDTO()` 方法

3. **数据流向**

   ```
   数据库实体 → [仓储层] → DTO → [应用层] → 领域实体 → [业务逻辑]
   ```

4. **实现示例**
   ```typescript
   // 仓储实现中的转换
   async findByUuid(uuid: string): Promise<RepositoryDTO | null> {
     const dbEntity = await this.prisma.repository.findUnique({ where: { uuid } });
     return dbEntity ? this.mapToDTO(dbEntity) : null;
   }
   ```

#### 架构分层原则

1. **依赖方向** - 内层不依赖外层
2. **关注点分离** - 每层职责明确
3. **接口隔离** - 通过接口而非具体实现通信
4. **可测试性** - 支持单元测试和模拟

## 前端实体编辑对话框开发规范

### 实体方法

domain-client 下的实体类应包含以下方法：

- forCreate(): 创建新实体的静态方法,名称属性 传空值，其他必要的属性传默认值，不必要的属性不传
- clone(): 克隆当前实体的实例方法

### 目录结构

src/modules/{module}/presentation/components/dialogs/xxxDialog.vue

### 组件结构

- 使用 `<script setup>` 语法糖
- 使用 `defineExpose` 暴露打开对话框的方法
- 使用 `ref` 绑定表单元素，进行表单验证
- 使用 `computed` 计算属性绑定实体属性
- 使用 `v-model` 双向绑定表单输入
- 使用 `v-dialog` 作为对话框容器
- 使用 `v-form` 包裹表单内容
- 使用 `v-text-field`、`v-select` 等 Vuetify 表单组件
- 使用 `v-btn` 作为操作按钮
- 使用 `v-icon` 显示图标选择
- 使用 `v-card` 作为对话框内容容器
- 使用 `v-card-title`、`v-card-text`、`v-card-actions` 分隔对话框内容
- 使用 `v-list` 和 `v-list-item` 显示下拉选项
- 使用 `v-skeleton-loader` 显示加载状态
- 不发送事件，直接调用 composables 方法，直接在组件内使用，实现业务逻辑

### 参考代码

```vue
<template>
  <v-dialog :model-value="visible" max-width="400" persistent>
    <v-card>
      <v-card-title class="pa-4">
        <v-icon size="24" class="mr-2">mdi-folder-plus</v-icon>
        {{ isEditing ? '编辑目标节点' : '创建目标节点' }}
      </v-card-title>

      <v-form ref="formRef">
        <v-card-text class="pa-4">
          <v-text-field
            v-model="name"
            label="节点名称"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            @keyup.enter="handleSave"
          >
          </v-text-field>

          <v-select
            v-model="icon"
            :items="iconOptions"
            label="选择图标"
            variant="outlined"
            density="compact"
            item-title="text"
            item-value="value"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-icon>{{ item.raw.value }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
      </v-form>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn
          color="primary"
          class="ml-2"
          @click="handleSave"
          variant="elevated"
          :disabled="!isFormValid"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { GoalFolder } from '@dailyuse/domain-client';
// composables
import { useGoal } from '../../composables/useGoal';
import { vi } from 'date-fns/locale';

const { createGoalFolder, updateGoalFolder } = useGoal();

const visible = ref(false);
const propGoalFolder = ref<GoalFolder | null>(null);
const localGoalFolder = ref<GoalFolder>(GoalFolder.forCreate({ accountUuid: '' }));

const isEditing = computed(() => !!propGoalFolder.value);
const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

const name = computed({
  get: () => localGoalFolder.value.name,
  set: (val: string) => {
    localGoalFolder.value.updateInfo({ name: val });
  },
});

const icon = computed({
  get: () => localGoalFolder.value.icon,
  set: (val: string) => {
    localGoalFolder.value.updateInfo({ icon: val });
  },
});

const iconOptions = [
  { text: '文件夹', value: 'mdi-folder' },
  { text: '目标', value: 'mdi-target' },
  { text: '学习', value: 'mdi-school' },
  { text: '工作', value: 'mdi-briefcase' },
  { text: '生活', value: 'mdi-home' },
  { text: '健康', value: 'mdi-heart' },
];

const nameRules = [
  (v: string) => !!v || '名称不能为空',
  (v: string) => (v && v.length >= 1) || '名称至少需要2个字符',
  (v: string) => (v && v.length <= 50) || '名称不能超过50个字符',
];

const handleSave = () => {
  if (!isFormValid.value) return;
  if (propGoalFolder.value) {
    // 编辑模式
    updateGoalFolder(localGoalFolder.value.uuid, localGoalFolder.value.toDTO());
  } else {
    // 创建模式
    createGoalFolder(localGoalFolder.value.toDTO());
  }
  closeDialog();
};

const handleCancel = () => {
  closeDialog();
};

const openDialog = (GoalFolder?: GoalFolder) => {
  visible.value = true;
  propGoalFolder.value = GoalFolder || null;
};

const openForCreate = () => {
  openDialog();
};

const openForEdit = (GoalFolder: GoalFolder) => {
  openDialog(GoalFolder);
};

const closeDialog = () => {
  visible.value = false;
};

watch(
  [() => visible.value, () => propGoalFolder.value],
  ([show]) => {
    if (show) {
      localGoalFolder.value = propGoalFolder.value
        ? propGoalFolder.value.clone()
        : GoalFolder.forCreate({ accountUuid: '' });
    } else {
      localGoalFolder.value = GoalFolder.forCreate({ accountUuid: '' });
    }
  },
  { immediate: true },
);

defineExpose({
  openForCreate,
  openForEdit,
});
</script>
```
