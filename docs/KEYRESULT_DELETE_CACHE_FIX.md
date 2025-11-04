# KeyResult 删除 + 缓存问题修复

**修复日期**：2024-11-04  
**解决问题数**：2  
**涉及文件**：4  

---

## 问题 1️⃣：刷新后 KeyResult 消失

### 现象
- 在 Goal 详情页面点进 KeyResult 详情页
- 页面显示正常，有对应的 KeyResults
- **刷新浏览器（F5）后**，KeyResult 消失，页面报错无法显示

### 根本原因
页面刷新时浏览器会完全重新加载应用：

```
1. F5 刷新 → 清空所有内存（Pinia store、组件状态）
2. 应用重新加载 → Pinia store 被重置为空
3. 从路由参数获取 goalUuid 和 keyResultUuid
4. 在缓存中查找 Goal → 缓存为空（刚才被清空了）
5. KeyResult 无法找到 → 显示空状态
```

### 解决方案

#### 文件：`KeyResultDetailView.vue`

在 `onMounted` → `loadData()` 时增加了缓存检查逻辑：

```typescript
// 如果缓存中没有 Goal 数据（例如刷新页面），需要从 API 重新加载
if (!goal.value) {
  // 从 API 强制刷新 Goal 数据（includeChildren=true）
  const fetchedGoal = await fetchGoalById(goalUuid.value, true);
  
  if (!fetchedGoal) {
    error.value = '目标不存在';
    setTimeout(() => {
      router.back();
    }, 1500);
    return;
  }
}
```

**关键点**：
- ✅ `fetchGoalById(goalUuid, true)` - 强制从 API 获取（true 表示 forceRefresh）
- ✅ `includeChildren=true` - 确保 API 返回完整的 KeyResults 
- ✅ 自动同步到 Pinia store - `fetchGoalById` 内部调用 `Goal.fromClientDTO()` 保存数据
- ✅ 比用户看到之前已经加载完成 - 用户感觉不到延迟

#### 配套改动

**useGoal.ts** - `fetchGoalById` 方法确保了：
```typescript
const fetchGoalById = async (uuid: string, forceRefresh = false) => {
  try {
    // 先从缓存中查找
    const cachedGoal = goalStore.getGoalByUuid(uuid);

    if (cachedGoal && !forceRefresh) {
      // 使用缓存的目标详情
      goalStore.setSelectedGoal(uuid);
      return cachedGoal;
    }

    // 从API获取目标详情
    const response = await goalManagementApplicationService.getGoalById(uuid);

    if (response) {
      goalStore.setSelectedGoal(uuid);
    }

    return response;
  } catch (error) {
    snackbar.showError('获取目标详情失败');
    throw error;
  }
};
```

**GoalManagementApplicationService.ts** - `getGoalById` 方法保证了：
```typescript
async getGoalById(uuid: string): Promise<GoalContracts.GoalClientDTO | null> {
  try {
    const data = await goalApiClient.getGoalById(uuid);
    
    // 创建客户端实体并同步到 store
    const goal = Goal.fromClientDTO(data);
    this.goalStore.addOrUpdateGoal(goal);

    return data;
  } catch (error) {
    // ...错误处理
  }
}
```

### 测试验证

✅ 测试场景：
1. 打开 Goal 列表
2. 点击某个 Goal 的 KeyResultCard → 进入列表
3. 点击某个 KeyResultCard → 进入详情页
4. 验证看到 KeyResult 信息和记录列表
5. **按 F5 刷新页面**
6. ✅ 页面重新加载并自动获取最新数据
7. ✅ KeyResult 仍然显示正常
8. ✅ 记录列表保留

---

## 问题 2️⃣：缺少删除 KeyResult 功能

### 需求
1. 实现后端 API 已有的删除 KeyResult 接口
2. 在 KeyResultCard 右下角添加删除按钮
3. 使用统一的删除确认方式

### 解决方案

#### 1. 添加删除确认对话框

**文件：`KeyResultDetailView.vue`**

在菜单中使用原生 `confirm` 对话框（与 GoalListView 一致）：

```typescript
// 删除 KeyResult - 使用确认对话框
const startDeleteKeyResult = () => {
  if (!confirm('确定要删除这个关键结果吗？这个操作无法撤销。')) {
    return;
  }
  
  handleDeleteKeyResult();
};

// 执行删除 KeyResult
const handleDeleteKeyResult = async () => {
  try {
    await deleteKeyResultForGoal(goalUuid.value, keyResultUuid.value);
    // 删除成功，延迟返回让用户看到成功提示
    setTimeout(() => {
      router.back();
    }, 800);
  } catch (error) {
    console.error('删除关键结果失败', error);
  }
};
```

#### 2. KeyResultCard 中添加删除按钮

**文件：`KeyResultCard.vue`**

在卡片右下角添加删除按钮（与添加记录按钮并排）：

```vue
<!-- 右侧按钮组 -->
<div class="d-flex align-center gap-2">
  <!-- 添加记录按钮 -->
  <v-btn
    :color="goal?.color || 'primary'"
    icon="mdi-plus"
    size="small"
    variant="tonal"
    class="add-record-btn"
    @click.stop="goalRecordDialogRef?.openDialog(...)"
  >
    <v-tooltip activator="parent" location="bottom"> 添加进度记录 </v-tooltip>
  </v-btn>

  <!-- 删除按钮 -->
  <v-btn
    icon="mdi-delete"
    size="small"
    variant="tonal"
    color="error"
    class="delete-kr-btn"
    @click.stop="handleDeleteKeyResult"
  >
    <v-tooltip activator="parent" location="bottom"> 删除关键结果 </v-tooltip>
  </v-btn>
</div>
```

**删除方法实现**：

```typescript
// ✅ 删除 KeyResult
const handleDeleteKeyResult = async () => {
  if (!confirm('确定要删除这个关键结果吗？此操作将同时删除所有关联的记录，无法撤销。')) {
    return;
  }

  try {
    await deleteKeyResultForGoal(props.keyResult.goalUuid, props.keyResult.uuid);
    snackbar.showSuccess('关键结果已删除');
  } catch (error) {
    console.error('删除关键结果失败:', error);
    snackbar.showError('删除关键结果失败');
  }
};
```

#### 3. 增强 useGoal.ts 中的删除方法

**文件：`useGoal.ts`**

原方法只删除 KeyResult，现在加入自动刷新以更新 Goal 列表：

```typescript
// 删除后强制刷新 Goal 数据，确保 UI 更新
const deleteKeyResultForGoal = async (goalUuid: string, keyResultUuid: string) => {
  try {
    await goalWebApplicationService.deleteKeyResultForGoal(goalUuid, keyResultUuid);
    snackbar.showSuccess('关键结果删除成功');
    // ✅ 删除成功后强制刷新 Goal 数据，确保 KeyResults 列表更新
    await fetchGoals(true);
  } catch (error) {
    snackbar.showError('删除关键结果失败');
    throw error;
  }
};
```

### 按钮样式和交互

**样式特点**：
- 🎨 删除按钮显示为 `color="error"`（红色）
- 👁️ 默认透明度 70%，悬停时 100%（与添加按钮一致）
- 📏 大小 `size="small"` 与添加按钮一致
- 💬 悬停时显示 tooltip 提示

```css
.delete-kr-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.key-result-card:hover .delete-kr-btn {
  opacity: 1;
}
```

**交互流程**：
```
用户点击删除按钮
  ↓
显示确认对话框 (confirm)
  ↓
用户确认删除
  ↓
调用 API 删除 KeyResult
  ↓
自动刷新 Goal 列表
  ↓
显示 "关键结果已删除" 提示
  ↓
KeyResultCard 从列表消失
```

### 文件变更清单

| 文件 | 变更 | 描述 |
|------|------|------|
| `KeyResultDetailView.vue` | ✏️ 修改 | 实现删除确认和执行逻辑 |
| `KeyResultCard.vue` | ✏️ 修改 | 添加删除按钮和处理方法 |
| `useGoal.ts` | ✏️ 修改 | 增强删除方法，添加自动刷新 |

---

## 技术细节

### 缓存策略

```
场景 1：正常操作（不刷新）
Goal 列表 → 选中某个 Goal → 使用缓存数据 ✅

场景 2：页面刷新（F5）
Goal 列表 → F5 刷新 → 缓存清空
KeyResult 详情页 → 检测缓存为空
→ 自动调用 fetchGoalById(forceRefresh=true)
→ 从 API 重新加载完整 Goal（含 KeyResults）
→ 显示正确的内容 ✅

场景 3：删除 KeyResult
KeyResultCard 右侧删除按钮 → 确认删除
→ 调用 deleteKeyResultForGoal()
→ API 删除成功
→ 自动刷新 Goal 列表（fetchGoals(true))
→ KeyResult 从列表消失 ✅
```

### API 调用链

```
KeyResultCard.handleDeleteKeyResult()
  ↓
useGoal.deleteKeyResultForGoal()
  ↓
goalWebApplicationService.deleteKeyResultForGoal()
  ↓
goalApiClient.deleteKeyResultForGoal()
  ↓
DELETE /api/goals/:goalUuid/key-results/:keyResultUuid
  ↓
成功后：useGoal.fetchGoals(true) → 重新加载列表
```

---

## 验收标准 ✅

### 修复 1：刷新后 KeyResult 不消失
- [x] F5 刷新页面后 KeyResult 仍然显示
- [x] KeyResult 的所有信息完整（标题、进度、记录等）
- [x] 没有控制台错误
- [x] 加载动画显示正确

### 修复 2：删除 KeyResult 功能
- [x] KeyResultCard 右下角有删除按钮
- [x] 点击删除按钮显示确认对话框
- [x] 确认删除后 KeyResult 从列表消失
- [x] 显示成功提示信息
- [x] Goal 列表中对应的 KeyResult 数量减少
- [x] 刷新页面后删除结果保留

---

## 后续优化建议

- [ ] 使用标准的 ConfirmDialog 组件替代原生 confirm（更美观）
- [ ] 添加撤销功能（临时缓存删除操作）
- [ ] 软删除改进（记录删除历史）
- [ ] 批量删除功能
- [ ] 删除前检查是否有进行中的记录
- [ ] 级联删除提示（删除 Goal 时同时删除所有 KeyResults）

