# 🔍 Store 持久化测试指南

## 问题诊断

### 发现的问题
序列化时调用 `goal.toClientDTO()` 默认 `includeChildren=false`，导致 KeyResults 丢失！

### 修复方案
```typescript
// ❌ 错误：默认不包含 KeyResults
goal.toClientDTO()

// ✅ 正确：显式包含 KeyResults
goal.toClientDTO(true)  // includeChildren=true
```

---

## 测试步骤

### 1️⃣ 清除旧数据
```javascript
// 在浏览器控制台运行
localStorage.removeItem('goal-store')
location.reload()
```

### 2️⃣ 检查序列化日志
打开控制台，查找以下日志：
```
📦 [GoalStore] 开始序列化 Store 数据
📦 [GoalStore] 序列化 Goal: { uuid: "...", keyResultsCount: 1 }
📦 [GoalStore] 序列化完成: { goalsCount: 1, firstGoalKeyResultsCount: 1 }
```

✅ **期望**：`firstGoalKeyResultsCount: 1` (有 KeyResults)
❌ **之前**：`firstGoalKeyResultsCount: 0` (丢失了)

### 3️⃣ 检查 localStorage
```javascript
// 查看持久化的数据
const data = JSON.parse(localStorage.getItem('goal-store'))
console.log('Goals:', data.goals)
console.log('First Goal KeyResults:', data.goals[0]?.keyResults)
```

✅ **期望**：`keyResults` 数组存在且包含数据
❌ **之前**：`keyResults` 不存在或为空

### 4️⃣ 刷新页面测试
```javascript
// 刷新页面后检查
location.reload()

// 页面加载后运行
const store = useGoalStore()
console.log('Store Goals:', store.goals)
console.log('First Goal KeyResults:', store.goals[0]?.keyResults)
```

✅ **期望**：刷新后 KeyResults 仍然存在

---

## 数据流验证

### 完整的数据流
```
1. API 返回完整数据 (with KeyResults) ✅
   ↓
2. Goal.fromClientDTO(data) ✅
   ↓
3. store.setGoals(goals) ✅
   ↓
4. 序列化: goal.toClientDTO(true) ✅  🔥 关键修复
   ↓
5. 存储到 localStorage ✅
   ↓
6. 从 localStorage 读取 ✅
   ↓
7. 反序列化: Goal.fromClientDTO(data) ✅
   ↓
8. store.goals (with KeyResults) ✅
```

---

## 验证清单

- [ ] API 返回的数据包含 KeyResults
- [ ] `setGoals()` 接收到的数据包含 KeyResults
- [ ] 序列化日志显示 `keyResultsCount > 0`
- [ ] localStorage 中的数据包含 KeyResults
- [ ] 反序列化日志显示 `keyResultsCount > 0`
- [ ] 刷新页面后 store 中仍有 KeyResults
- [ ] UI 正确显示 KeyResults

---

## 调试命令

### 查看完整的 store 状态
```javascript
const store = useGoalStore()
console.log('Store State:', {
  goalsCount: store.goals.length,
  goals: store.goals,
  firstGoal: store.goals[0],
  firstGoalKeyResults: store.goals[0]?.keyResults,
})
```

### 查看 localStorage 原始数据
```javascript
console.log(localStorage.getItem('goal-store'))
```

### 强制重新序列化
```javascript
const store = useGoalStore()
// 触发一个更新来重新序列化
store.setGoals(store.goals)
```

---

## 修复的文件
- `apps/web/src/modules/goal/presentation/stores/goalStore.ts`

## 关键改动
```typescript
// 序列化时显式包含子实体
goal.toClientDTO(true)  // 🔥 includeChildren=true
```

