# AI Module DDD Architecture Refactoring

## 重构目标

将 AI 模块调整为符合 DDD 架构规范，参考 Goal 模块的实现。

## 架构变更

### 1. Domain Server Layer (`packages/domain-server/src/ai/`)

**保留（纯领域逻辑）：**

- ✅ `repositories/` - 仓储接口（IRepository）
- ✅ `errors/` - 领域错误（AIValidationError, AIQuotaExceededError）
- ✅ `services/AIGenerationService.ts` - **纯领域服务（只做验证）**

**移除（基础设施细节）：**

- ❌ `adapters/` → 移动到 `apps/api/src/modules/ai/infrastructure/adapters/`
- ❌ `services/prompts/` → 移动到 `apps/api/src/modules/ai/infrastructure/prompts/`
- ❌ `services/QuotaEnforcementService.ts` → 移动到 `apps/api/src/modules/ai/infrastructure/`

### 2. AIGenerationService (Domain Service) 职责

**重构前（错误）：**

```typescript
class AIGenerationService {
  constructor(private aiAdapter: BaseAIAdapter) {
    this.quotaService = new QuotaEnforcementService();
  }

  async generateKeyResults(...) {
    // ❌ 调用基础设施 (Adapter)
    // ❌ 调用配额服务
    // ❌ 构建 Prompt
  }
}
```

**重构后（正确）：**

```typescript
class AIGenerationService {
  constructor() {
    // ✅ 不注入基础设施依赖
  }

  // ✅ 只做纯业务规则验证
  validateKeyResultsOutput(keyResults: any[]): void {
    // 验证数量、格式、权重总和等业务规则
  }

  validateTasksOutput(tasks: any[]): void {
    // 验证任务的业务规则
  }
}
```

### 3. Infrastructure Layer (`apps/api/src/modules/ai/infrastructure/`)

**新增结构：**

```
infrastructure/
├── adapters/
│   ├── BaseAIAdapter.ts         # 从 domain-server 移动
│   ├── OpenAIAdapter.ts          # 从 domain-server 移动
│   └── MockAIAdapter.ts          # 从 domain-server 移动
├── prompts/
│   └── templates.ts              # 从 domain-server 移动
├── QuotaEnforcementService.ts    # 从 domain-server 移动
├── repositories/
│   ├── PrismaAIUsageQuotaRepository.ts
│   └── PrismaAIConversationRepository.ts
├── di/
│   └── AIContainer.ts
└── index.ts                      # 导出所有基础设施
```

### 4. Application Service 职责

**重构后（正确）：**

```typescript
class AIGenerationApplicationService {
  constructor(
    private validationService: AIGenerationService,  // 领域服务
    private aiAdapter: BaseAIAdapter,                // 基础设施
    private quotaRepository: IAIUsageQuotaRepository, // 仓储
    private conversationRepository: IAIConversationRepository,
  ) {
    this.quotaService = new QuotaEnforcementService(); // 基础设施
  }

  async generateKeyResults(...) {
    // 1. 获取配额（仓储）
    // 2. 检查配额（基础设施服务）
    // 3. 获取 Prompt（基础设施）
    // 4. 调用 AI Adapter（基础设施）
    // 5. 验证输出（领域服务）✅
    // 6. 消费配额（基础设施服务）
    // 7. 持久化（仓储）
  }
}
```

## 文件移动清单

### 已完成移动：

1. **Adapters:**
   - `packages/domain-server/src/ai/adapters/BaseAIAdapter.ts`
     → `apps/api/src/modules/ai/infrastructure/adapters/BaseAIAdapter.ts`
   - `packages/domain-server/src/ai/adapters/OpenAIAdapter.ts`
     → `apps/api/src/modules/ai/infrastructure/adapters/OpenAIAdapter.ts`
   - `packages/domain-server/src/ai/adapters/MockAIAdapter.ts`
     → `apps/api/src/modules/ai/infrastructure/adapters/MockAIAdapter.ts`

2. **Prompts:**
   - `packages/domain-server/src/ai/services/prompts/templates.ts`
     → `apps/api/src/modules/ai/infrastructure/prompts/templates.ts`

3. **Quota Service:**
   - `packages/domain-server/src/ai/services/QuotaEnforcementService.ts`
     → `apps/api/src/modules/ai/infrastructure/QuotaEnforcementService.ts`

## 代码更新清单

### 已完成更新：

1. ✅ `packages/domain-server/src/ai/services/AIGenerationService.ts`
   - 移除 AI Adapter 依赖
   - 移除 QuotaEnforcementService 依赖
   - 移除 generateKeyResults() 和 generateTaskTemplate() 方法
   - 只保留验证方法：validateKeyResultsOutput(), validateTasksOutput()

2. ✅ `packages/domain-server/src/ai/index.ts`
   - 移除 adapters 导出
   - 只导出领域层内容（repositories, services, errors）

3. ✅ `apps/api/src/modules/ai/infrastructure/index.ts` (新建)
   - 导出所有基础设施（adapters, prompts, QuotaEnforcementService）

4. ✅ `apps/api/src/modules/ai/infrastructure/QuotaEnforcementService.ts`
   - 更新导入路径：从 `@dailyuse/domain-server/ai` 导入错误类型

5. ✅ `apps/api/src/modules/ai/application/services/AIGenerationApplicationService.ts`
   - 重构为协调器角色
   - 注入 validationService (领域), aiAdapter (基础设施), quotaService (基础设施)
   - generateKeyResults() 和 generateTasks() 方法完全重写

6. ✅ `apps/api/src/modules/ai/infrastructure/di/AIContainer.ts`
   - 更新依赖注入逻辑
   - 从 infrastructure/ 导入基础设施服务
   - 从 domain-server 只导入领域服务

### 待更新：

7. ⏳ `packages/domain-server/src/ai/services/__tests__/AIGenerationService.test.ts`
   - 需要完全重写（领域服务现在只做验证）
   - 测试 validateKeyResultsOutput() 和 validateTasksOutput()

8. ⏳ `apps/api/src/modules/ai/interface/http/AIConversationController.ts`
   - 更新方法调用（返回值结构变化）

## DDD 架构原则总结

### Domain Layer (domain-server)

- ✅ 值对象 (Value Objects)
- ✅ 实体 (Entities)
- ✅ 聚合根 (Aggregates)
- ✅ 仓储接口 (Repository Interfaces)
- ✅ 领域服务 (Domain Services) - **纯业务逻辑验证**
- ✅ 领域错误 (Domain Errors)

### Infrastructure Layer (apps/api/infrastructure)

- ✅ 适配器 (Adapters) - 外部服务接口
- ✅ Prompt 模板 (Prompts) - AI 特定配置
- ✅ 配额管理服务 (QuotaEnforcementService) - 应用层基础设施逻辑
- ✅ 仓储实现 (Repository Implementations)

### Application Layer (apps/api/application)

- ✅ 应用服务 (Application Services) - 协调器
- ✅ 事务边界管理
- ✅ DTO 转换

### Interface Layer (apps/api/interface)

- ✅ HTTP Controllers
- ✅ 路由配置
- ✅ 请求/响应验证

## 测试策略

### Domain Service Tests (纯单元测试)

```typescript
describe('AIGenerationService', () => {
  const service = new AIGenerationService();

  describe('validateKeyResultsOutput', () => {
    it('should accept valid 3-5 key results with 100±5 weight');
    it('should reject less than 3 key results');
    it('should reject more than 5 key results');
    it('should reject weight sum not 100±5');
  });

  describe('validateTasksOutput', () => {
    it('should accept valid 5-10 tasks');
    it('should reject invalid task count');
    it('should reject invalid priority');
  });
});
```

### Application Service Tests (集成测试)

```typescript
describe('AIGenerationApplicationService', () => {
  // 需要 mock: aiAdapter, quotaRepository, validationService

  it('should generate key results with quota check');
  it('should throw when quota exceeded');
  it('should validate output using domain service');
});
```

## 参考文档

- Goal Module DDD Structure: `packages/domain-server/src/goal/`
- DDD Principles: Domain logic stays in domain layer, infrastructure in infrastructure layer
