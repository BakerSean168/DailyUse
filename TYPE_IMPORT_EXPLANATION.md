# TypeScript 类型导入说明

## ✅ 问题：`import type` vs 直接 `import` 的区别

### 1. 直接导入类（Class）
```typescript
import { KeyResult, Goal } from '@dailyuse/domain-client';
```

**特点**：
- ✅ 导入的是**运行时值**（class）
- ✅ 可以用于**类型注解**和**实例化**
- ✅ 会被编译到 JavaScript 代码中
- ✅ 体积更大（包含类的实现代码）

**使用场景**：
```typescript
// 1. 类型注解
const myGoal: Goal = ...;

// 2. 实例化
const goal = new Goal(...);

// 3. 静态方法调用
const goal = Goal.fromClientDTO(dto);

// 4. instanceof 检查
if (goal instanceof Goal) { ... }
```

---

### 2. 类型导入（Type-only Import）
```typescript
import type { KeyResult, Goal } from '@dailyuse/domain-client';
```

**特点**：
- ✅ 只导入**类型信息**（编译时）
- ✅ **不会**被编译到 JavaScript 代码中
- ✅ 体积更小（零运行时开销）
- ❌ **不能**用于实例化或静态方法调用

**使用场景**：
```typescript
// ✅ 只用于类型注解
const myGoal: Goal = ...;
const keyResults: KeyResult[] = [];

// ❌ 不能实例化（会报错）
const goal = new Goal(...);  // Error!

// ❌ 不能调用静态方法（会报错）
const goal = Goal.fromClientDTO(dto);  // Error!
```

---

### 3. 混合导入（推荐方式）
```typescript
// 导入类（运行时值）
import { KeyResult, Goal } from '@dailyuse/domain-client';

// 导入纯类型
import type { GoalContracts } from '@dailyuse/contracts';
```

**什么时候用哪种**：

| 导入方式 | 使用场景 | 示例 |
|---------|---------|------|
| **直接导入** | 需要类的实现（实例化、静态方法） | `Goal.fromClientDTO(dto)` |
| **type 导入** | 只用于类型注解（接口、DTO） | `const dto: GoalContracts.GoalClientDTO` |

---

### 4. 你的代码中的最佳实践

```typescript
// ✅ 推荐：混合导入
import { useRouter, useRoute } from 'vue-router';
import { useGoal } from '../composables/useGoal';
import { GoalContracts } from '@dailyuse/contracts';  // DTO 类型
import type { KeyResult, Goal } from '@dailyuse/domain-client';  // 仅类型注解

// 如果需要调用静态方法，改为直接导入
import { KeyResult, Goal } from '@dailyuse/domain-client';  // 需要 Goal.fromClientDTO()
```

---

### 5. 编译后的区别

**直接导入**：
```typescript
// TypeScript
import { Goal } from '@dailyuse/domain-client';
const goal: Goal = Goal.fromClientDTO(dto);

// 编译后 JavaScript（保留）
import { Goal } from '@dailyuse/domain-client';
const goal = Goal.fromClientDTO(dto);
```

**类型导入**：
```typescript
// TypeScript
import type { Goal } from '@dailyuse/domain-client';
const goal: Goal = getGoal();

// 编译后 JavaScript（移除）
// import 语句被完全移除！
const goal = getGoal();
```

---

### 6. 性能优化建议

#### ✅ 优化前
```typescript
// 导入了整个类（包含所有方法和实现）
import { Goal, KeyResult } from '@dailyuse/domain-client';

const goals: Goal[] = [];
const keyResults: KeyResult[] = [];
```

#### ✅ 优化后（体积更小）
```typescript
// 只导入类型信息（零开销）
import type { Goal, KeyResult } from '@dailyuse/domain-client';

const goals: Goal[] = [];
const keyResults: KeyResult[] = [];
```

---

### 7. 你的 KeyResultDetailView.vue 最佳实践

```typescript
// ❌ 当前写法（不够优化）
import type { KeyResult, Goal } from '@dailyuse/domain-client';

// 如果你需要用到实体方法，改为：
import { KeyResult, Goal } from '@dailyuse/domain-client';

// 如果只用于类型注解，保持 type import
import type { KeyResult, Goal } from '@dailyuse/domain-client';

// DTO 类型始终用 type import（它们是接口，不是类）
import type { GoalContracts } from '@dailyuse/contracts';
// 或者
import { type GoalContracts } from '@dailyuse/contracts';
```

---

## 📋 总结

| 特性 | 直接导入 | Type 导入 |
|-----|---------|----------|
| 运行时存在 | ✅ 是 | ❌ 否 |
| 可实例化 | ✅ 是 | ❌ 否 |
| 可调用静态方法 | ✅ 是 | ❌ 否 |
| 可用于类型注解 | ✅ 是 | ✅ 是 |
| 编译后体积 | 大 | 小（零） |
| 适用场景 | 需要类实现 | 只需要类型 |

**规则**：
- 🎯 如果需要调用 `.fromClientDTO()` / `.create()` 等静态方法 → 直接导入
- 🎯 如果只用于变量类型注解 → type 导入
- 🎯 接口/DTO 始终用 type 导入

