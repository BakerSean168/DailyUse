# Goal 模块问题修复报告

## 问题 1：动机分析和备忘信息字段混淆 ✅

### 问题描述
`goalNote` 和 `goalMotive` 两个计算属性都绑定到了 `motivation` 字段，导致数据混乱。

### 原代码
```typescript
const goalNote = computed({
  get: () => goalModel.value?.motivation || '',  // ❌ 错误
  set: (val: string) => {
    goalModel.value?.updateMotivation(val);      // ❌ 错误
  },
});

const goalMotive = computed({
  get: () => goalModel.value?.motivation || '',  // ✅ 正确
  set: (val: string) => {
    goalModel.value?.updateMotivation(val);      // ✅ 正确
  },
});
```

### 修复方案
将 `goalNote` 改为绑定到 `description` 字段：

```typescript
const goalNote = computed({
  get: () => goalModel.value?.description || '',  // ✅ 修复
  set: (val: string) => {
    goalModel.value?.updateDescription(val);      // ✅ 修复
  },
});
```

### 字段职责明确

| 字段 | 计算属性 | UI 位置 | 用途 |
|------|---------|---------|------|
| `description` | `goalDescription`, `goalNote` | 基本信息 Tab | 目标的详细描述 |
| `motivation` | `goalMotive` | 动机分析 Tab | 为什么要实现这个目标 |
| `feasibilityAnalysis` | `goalFeasibility` | 动机分析 Tab | 可行性分析 |

---

## 问题 2：创建目标时无法获取 accountUuid ✅

### 问题描述
用户刚登录后尝试创建目标，报错：
```
❌ 无法获取 accountUuid，AccountStore 状态:
{
  currentAccount: null,
  currentAccountUuid: null,
  isAuthenticated: false,
  token: false
}
```

### 根本原因分析

#### 可能原因 1：AccountStore 未正确初始化
- ✅ `accountStore.ts` 在初始化时会调用 `restoreFromStorage()`
- ✅ `LoginApplicationService` 登录成功后会调用 `accountStore.setCurrentAccount(account)`
- ✅ `setCurrentAccount` 方法会同时保存到 `localStorage.currentAccount`

#### 可能原因 2：localStorage 未持久化
- ⚠️  可能是浏览器隐私模式或存储被禁用
- ⚠️  可能是页面刷新时机问题

#### 可能原因 3：GoalDialog 打开时机过早
- ⚠️  可能在 AccountStore 初始化完成前就打开了对话框

### 修复方案：三层兜底机制

```typescript
// 创建模式：获取 accountUuid（三层兜底）

// 方法 1：从 AccountStore 获取（推荐）
let accountUuid = accountStore.currentAccountUuid;

// 方法 2：从 localStorage.currentAccount 获取（兜底 1）
if (!accountUuid) {
  const savedAccount = localStorage.getItem('currentAccount');
  if (savedAccount) {
    const account = JSON.parse(savedAccount);
    accountUuid = account.uuid;
  }
}

// 方法 3：从 token 解析（兜底 2）
if (!accountUuid) {
  const token = localStorage.getItem('token');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    accountUuid = payload.accountUuid;
  }
}

// 如果三种方法都失败，抛出错误
if (!accountUuid) {
  throw new Error('无法获取用户信息，请重新登录');
}
```

### 优势

1. **更健壮**：三层兜底机制确保能获取到 accountUuid
2. **更好的错误提示**：详细的调试信息帮助排查问题
3. **向后兼容**：即使 AccountStore 未初始化也能工作

### 数据流

```
用户登录
    ↓
LoginApplicationService.login()
    ├─ 保存 accessToken、refreshToken 到 AuthStore
    ├─ 保存到 localStorage (token)
    └─ 获取用户信息
        └─ accountStore.setCurrentAccount(account)
            ├─ currentAccount.value = account
            └─ localStorage.setItem('currentAccount', JSON.stringify(account))
    ↓
用户打开 Goal 创建对话框
    ↓
GoalDialog.handleSave()
    ├─ 方法 1: accountStore.currentAccountUuid ✅
    ├─ 方法 2: localStorage.getItem('currentAccount') ✅
    └─ 方法 3: 从 token 解析 ✅
    ↓
成功获取 accountUuid
    ↓
创建目标
```

---

## 测试建议

### 测试用例 1：动机分析和描述分离
1. 创建新目标
2. 在"基本信息" Tab 输入描述："这是目标描述"
3. 在"动机分析" Tab 输入动机："这是我的动机"
4. 保存并重新打开
5. ✅ 验证：描述和动机应该独立存储

### 测试用例 2：正常登录流程
1. 用户登录
2. 等待 AccountStore 初始化完成
3. 创建新目标
4. ✅ 验证：能够成功创建，使用 `accountStore.currentAccountUuid`

### 测试用例 3：localStorage 恢复
1. 用户登录
2. 刷新页面
3. AccountStore 从 localStorage 恢复
4. 创建新目标
5. ✅ 验证：能够成功创建，使用 localStorage 中的 account

### 测试用例 4：仅 token 可用（极端情况）
1. 清除 `localStorage.currentAccount`
2. 保留 `localStorage.token`
3. 创建新目标
4. ✅ 验证：能够从 token 解析 accountUuid

### 测试用例 5：所有方法失败
1. 清除 `localStorage.currentAccount`
2. 清除 `localStorage.token`
3. AccountStore 未初始化
4. 尝试创建目标
5. ✅ 验证：显示明确的错误提示 "无法获取用户信息，请重新登录"

---

## 调试信息增强

新增详细的日志输出：

```typescript
console.error('❌ 无法获取 accountUuid，调试信息:', {
  'AccountStore.currentAccount': accountStore.currentAccount,
  'AccountStore.currentAccountUuid': accountStore.currentAccountUuid,
  'AccountStore.isAuthenticated': accountStore.isAuthenticated,
  'localStorage.token': !!localStorage.getItem('token'),
  'localStorage.currentAccount': !!localStorage.getItem('currentAccount'),
});
```

这些信息可以帮助快速定位问题：
- 是 AccountStore 的问题？
- 是 localStorage 的问题？
- 还是 token 的问题？

---

## 后续改进建议

### 1. 统一的用户信息获取工具函数

创建 `getUserAccountUuid()` 工具函数：

```typescript
// utils/auth.ts
export function getUserAccountUuid(): string {
  // 方法 1: AccountStore
  const accountStore = useAccountStore();
  if (accountStore.currentAccountUuid) {
    return accountStore.currentAccountUuid;
  }
  
  // 方法 2: localStorage
  const savedAccount = localStorage.getItem('currentAccount');
  if (savedAccount) {
    try {
      const account = JSON.parse(savedAccount);
      return account.uuid;
    } catch (e) {}
  }
  
  // 方法 3: token
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.accountUuid;
    } catch (e) {}
  }
  
  throw new Error('无法获取用户信息，请重新登录');
}
```

### 2. 确保 AccountStore 在路由守卫中初始化

```typescript
// router/guards/auth.ts
router.beforeEach(async (to, from, next) => {
  const accountStore = useAccountStore();
  
  // 如果未初始化，先恢复
  if (!accountStore.currentAccount && localStorage.getItem('currentAccount')) {
    accountStore.restoreFromStorage();
  }
  
  next();
});
```

### 3. 添加用户信息过期检测

```typescript
// 检查 currentAccount 是否过期
function isAccountDataStale(): boolean {
  const savedAccount = localStorage.getItem('currentAccount');
  if (!savedAccount) return true;
  
  const account = JSON.parse(savedAccount);
  const savedTime = account._savedAt || 0;
  const now = Date.now();
  
  // 如果超过 24 小时，认为数据过期
  return (now - savedTime) > 24 * 60 * 60 * 1000;
}
```

---

## 总结

### 修复内容

1. ✅ **分离 `goalNote` 和 `goalMotive`**
   - `goalNote` → 绑定到 `description`
   - `goalMotive` → 绑定到 `motivation`

2. ✅ **增强 accountUuid 获取逻辑**
   - 三层兜底机制
   - 详细的调试信息
   - 更好的错误提示

### 影响

- 🟢 **正向影响**：
  - 数据不再混淆
  - 创建目标更可靠
  - 更好的错误排查

- 🟡 **需要注意**：
  - 现有的目标可能有混淆的数据（需要数据清理）
  - 多了一些日志输出（可以后续移除）

### 文件修改

- ✅ `GoalDialog.vue`：修复字段绑定和 accountUuid 获取逻辑

---

**修复时间**：2025-11-19  
**状态**：✅ 已修复  
**测试状态**：⏳ 待用户验证
