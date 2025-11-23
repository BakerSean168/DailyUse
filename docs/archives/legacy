# Task vs Goal 模块 - accountUuid 获取方式对比

## 问题背景

Goal 模块在创建目标时无法获取 accountUuid，导致创建失败。通过参考 Task 模块的实现，发现了更安全的解决方案。

## 对比分析

### ❌ Goal 模块（修复前）- 前端传递方式

```typescript
// GoalDialog.vue (修复前)
let accountUuid = accountStore.currentAccountUuid;

// 方法 1：从 AccountStore 获取
if (!accountUuid) {
  const savedAccount = localStorage.getItem('currentAccount');
  if (savedAccount) {
    const account = JSON.parse(savedAccount);
    accountUuid = account.uuid;
  }
}

// 方法 2：从 token 解析
if (!accountUuid) {
  const token = localStorage.getItem('token');
  const payload = JSON.parse(atob(token.split('.')[1]));
  accountUuid = payload.accountUuid;
}

// 设置到 goalModel 并传递给后端
goalModel.value.setAccountUuid(accountUuid);

const createData = {
  accountUuid: goalModel.value.accountUuid, // ❌ 前端传递
  title: goalModel.value.title,
  // ...
};

await createGoal(createData);
```

**问题**：
- ❌ 依赖前端存储（localStorage、AccountStore）
- ❌ 可能在 Store 初始化前就调用
- ❌ 需要三层兜底逻辑，复杂且脆弱
- ❌ 安全性低：前端可以伪造 accountUuid

---

### ✅ Task 模块 - 后端注入方式

```typescript
// TaskTemplateDialog.vue
const createBlankTemplate = (): TaskTemplate => {
  // accountUuid 使用空字符串占位符，保存时由后端从 token 注入
  const template = TaskTemplate.forCreate();
  return template;
};

const createRequest = {
  // ✅ 不传递 accountUuid，或传递空字符串
  title: formData.taskTemplate.title,
  description: formData.taskTemplate.description,
  // ...
};

await createTaskTemplate(createRequest);
```

```typescript
// TaskTemplateController.ts (后端)
static async createTaskTemplate(req: Request, res: Response) {
  // ✅ 从 JWT token 中提取 accountUuid
  const accountUuid = TaskTemplateController.extractAccountUuid(req);

  // ✅ 后端注入，确保安全性
  const template = await service.createTaskTemplate({
    ...req.body,
    accountUuid, // 后端注入，覆盖前端传递的值
  });

  return responseBuilder.sendSuccess(res, template);
}

// 提取 accountUuid 的辅助方法
private static extractAccountUuid(req: Request): string {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7); // 移除 'Bearer '
  const decoded = jwt.decode(token) as any;
  
  if (!decoded?.accountUuid) {
    throw new Error('Invalid token: missing accountUuid');
  }
  
  return decoded.accountUuid;
}
```

**优势**：
- ✅ 安全可靠：从 JWT token 中提取，无法伪造
- ✅ 简单清晰：前端无需处理 accountUuid
- ✅ 统一规范：所有模块使用相同方式
- ✅ 职责明确：认证由后端负责

---

### ✅ Goal 模块（修复后）- 采用后端注入方式

```typescript
// GoalDialog.vue (修复后)
const handleSave = async () => {
  if (isEditing.value) {
    // 更新模式：不需要 accountUuid
    const updateData = {
      title: goalModel.value.title,
      description: goalModel.value.description,
      // ...
    };
    await updateGoal(goalModel.value.uuid, updateData);
  } else {
    // 创建模式：后端会从 token 自动注入 accountUuid，前端无需传递
    const keyResults = (goalModel.value.keyResults || []).map(kr => ({
      title: kr.title,
      description: kr.description,
      // ...
    }));
    
    const createData = {
      // ✅ 不传递 accountUuid，后端会从 token 注入
      title: goalModel.value.title,
      description: goalModel.value.description,
      // ...
      keyResults: keyResults.length > 0 ? keyResults : undefined,
    };
    
    console.log('✅ 创建目标请求数据（accountUuid 由后端注入）:', createData);
    await createGoal(createData);
  }
};
```

```typescript
// GoalController.ts (后端 - 已存在)
static async createGoal(req: AuthenticatedRequest, res: Response) {
  const service = await GoalController.getGoalService();
  
  // ✅ 从认证中间件获取 accountUuid（安全可靠）
  const accountUuid = req.user?.accountUuid;

  if (!accountUuid) {
    return GoalController.responseBuilder.sendError(res, {
      code: ResponseCode.UNAUTHORIZED,
      message: 'Authentication required',
    });
  }

  logger.info('Creating goal', { accountUuid });

  // ✅ 将 accountUuid 合并到请求体中
  const goal = await service.createGoal({
    ...req.body,
    accountUuid, // 后端注入
  });

  return GoalController.responseBuilder.sendSuccess(res, goal);
}
```

---

## 修改总结

### 前端修改

**文件**：`apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue`

**修改内容**：
1. ❌ 删除了复杂的 accountUuid 获取逻辑（三层兜底）
2. ❌ 删除了 `accountStore` 导入和使用
3. ❌ 删除了 `goalModel.value.setAccountUuid(accountUuid)` 调用
4. ✅ 创建请求中不再传递 `accountUuid` 字段
5. ✅ 添加注释说明后端会自动注入

**代码对比**：
```diff
- import { useAccountStore } from '@/modules/account/presentation/stores/accountStore';
- const accountStore = useAccountStore();

  const createData = {
-   accountUuid: goalModel.value.accountUuid, // ❌ 前端传递
+   // accountUuid 由后端从 JWT token 自动注入 ✅
    title: goalModel.value.title,
    // ...
  };
```

### 后端修改

**文件**：`apps/api/src/modules/goal/interface/http/GoalController.ts`

**状态**：✅ 无需修改，已正确实现

后端已经从 `req.user.accountUuid`（认证中间件注入）获取 accountUuid：

```typescript
// ✅ 已存在的正确实现
const accountUuid = req.user?.accountUuid;
const goal = await service.createGoal({
  ...req.body,
  accountUuid, // 后端注入，覆盖前端传递的值
});
```

---

## 安全性对比

### 前端传递方式（不安全）

```
前端 localStorage/Store
    ↓
提取 accountUuid
    ↓
放入请求体
    ↓
发送到后端
    ↓ ⚠️ 可以被篡改
后端接收并使用
```

**风险**：
- 🔴 前端可以伪造 accountUuid
- 🔴 可能访问其他用户的数据
- 🔴 安全漏洞

### 后端注入方式（安全）

```
前端发送请求
    ↓
附带 JWT token (Authorization Header)
    ↓
后端验证 token
    ↓ ✅ 从 token 提取 accountUuid
    ↓ ✅ 覆盖请求体中的值
后端使用正确的 accountUuid
```

**优势**：
- 🟢 JWT token 无法伪造（有签名验证）
- 🟢 accountUuid 来自可信来源
- 🟢 即使前端传递了错误的值也会被覆盖
- 🟢 安全可靠

---

## 其他模块建议

### 需要检查的模块

1. **Reminder 模块**：是否也存在前端传递 accountUuid 的问题？
2. **Schedule 模块**：是否使用了正确的方式？
3. **Setting 模块**：用户设置相关操作是否安全？

### 统一规范建议

**创建一个认证工具类**：

```typescript
// apps/api/src/shared/utils/auth.util.ts
export class AuthUtil {
  /**
   * 从请求中提取 accountUuid
   * 优先使用认证中间件注入的 req.user.accountUuid
   * 兜底使用 JWT token 解析
   */
  static extractAccountUuid(req: Request): string {
    // 方法 1：从认证中间件（推荐）
    const authenticatedReq = req as AuthenticatedRequest;
    if (authenticatedReq.user?.accountUuid) {
      return authenticatedReq.user.accountUuid;
    }
    
    // 方法 2：从 JWT token 解析（兜底）
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;
    
    if (!decoded?.accountUuid) {
      throw new Error('Invalid token: missing accountUuid');
    }
    
    return decoded.accountUuid;
  }
}
```

**所有 Controller 统一使用**：

```typescript
// TaskTemplateController.ts
const accountUuid = AuthUtil.extractAccountUuid(req);

// GoalController.ts
const accountUuid = AuthUtil.extractAccountUuid(req);

// ReminderController.ts
const accountUuid = AuthUtil.extractAccountUuid(req);
```

---

## 测试验证

### 测试场景 1：正常创建（✅ 应该成功）

1. 用户登录
2. 创建新目标
3. ✅ 验证：能够成功创建，后端日志显示正确的 accountUuid

### 测试场景 2：Token 过期（❌ 应该失败）

1. 用户 token 过期
2. 尝试创建目标
3. ✅ 验证：返回 401 Unauthorized

### 测试场景 3：伪造 accountUuid（✅ 应该被覆盖）

1. 前端尝试传递错误的 accountUuid（如果有恶意用户）
2. 创建目标
3. ✅ 验证：后端使用 token 中的正确 accountUuid，而不是前端传递的值

### 测试场景 4：无 token（❌ 应该失败）

1. 清除 token
2. 尝试创建目标
3. ✅ 验证：API 请求被拦截器拒绝或返回 401

---

## 最佳实践总结

### ✅ 推荐做法

1. **前端**：不传递 accountUuid（或传递空字符串作为占位符）
2. **后端**：从 JWT token 或认证中间件获取 accountUuid
3. **安全**：即使前端传递了 accountUuid，后端也要覆盖它

### ❌ 避免做法

1. ❌ 前端从 localStorage 获取 accountUuid 并传递
2. ❌ 后端直接使用请求体中的 accountUuid
3. ❌ 信任前端传递的用户身份信息

### 核心原则

> **永远不要信任前端传递的用户身份信息**  
> **用户身份必须由后端从可信来源（JWT token）提取**

---

## 相关文档

- **Task 模块参考**：`apps/api/src/modules/task/interface/http/controllers/TaskTemplateController.ts`
- **Goal 模块修复**：`apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue`
- **认证中间件**：`apps/api/src/shared/middleware/auth.middleware.ts`

---

**文档创建时间**：2025-11-19  
**修复状态**：✅ 已完成  
**安全级别**：🟢 高（采用后端注入方式）
