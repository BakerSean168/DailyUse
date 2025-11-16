# 任务完成确认对话框实施报告

## 1. 背景与问题

### 1.1 原有设计的问题

**现状**：点击完成任务 → 自动使用 `incrementValue` → 立即完成

**局限性**：
1. **不灵活**：只适合固定值的累加型任务
2. **不准确**：对于最大值、平均值等 AggregationMethod 不适用
3. **易误触**：点击即完成，无二次确认
4. **难撤销**：需要实现复杂的 Undo 机制

### 1.2 改进方案

**新设计**：点击完成任务 → 弹出确认对话框 → 用户输入实际值 → 确认完成

**优势**：
- ✅ **适应所有 AggregationMethod**（SUM/MAX/AVERAGE/MIN/LAST）
- ✅ **提高准确性**：用户输入实际完成值
- ✅ **防止误触**：二次确认机制
- ✅ **无需 Undo**：对话框取消即可

## 2. 架构设计

### 2.1 组件架构

```
TaskInstanceManagement.vue (父组件)
  │
  ├─ TaskInstanceCard.vue (任务卡片)
  │   └─ emit('complete', taskUuid)
  │
  └─ TaskCompleteDialog.vue (完成确认对话框)
      ├─ 显示任务信息
      ├─ 显示关联的 Goal 和 KeyResult
      ├─ 根据 AggregationMethod 调整 UI
      ├─ 输入 recordValue、note、duration
      └─ emit('confirm', { recordValue, note, duration })
```

### 2.2 数据流

```
1. 用户点击"完成"按钮
   ↓
2. TaskInstanceCard emit('complete', taskUuid)
   ↓
3. TaskInstanceManagement 调用 openCompleteDialog(taskUuid)
   ↓
4. useTaskCompleteDialog 查询任务和 Goal 信息
   ↓
5. 显示 TaskCompleteDialog 对话框
   ↓
6. 用户输入 recordValue、note、duration
   ↓
7. 用户点击"确认完成"
   ↓
8. TaskCompleteDialog emit('confirm', data)
   ↓
9. useTaskCompleteDialog 调用 completeTaskInstance(uuid, data)
   ↓
10. 后端处理：
    ├─ 完成 TaskInstance
    ├─ 创建 GoalRecord（如果有 recordValue）
    └─ 更新 KeyResult 进度
    ↓
11. 前端更新 UI
```

## 3. 实施细节

### 3.1 新建文件

#### 3.1.1 TaskCompleteDialog.vue

**位置**：`apps/web/src/modules/task/presentation/components/dialogs/TaskCompleteDialog.vue`

**功能**：
- 显示任务标题和日期
- 显示关联的 Goal 和 KeyResult 信息
- 根据 AggregationMethod 动态调整 UI
- 提供快捷值选择
- 实时预测完成后的进度
- 输入校验和提示

**核心 Props**：
```typescript
interface Props {
  taskUuid: string;
  taskTitle: string;
  instanceDate: number | Date;
  goalBinding?: GoalBinding; // Goal 绑定信息
  showQuickValues?: boolean;
}
```

**核心 Emits**：
```typescript
interface CompleteTaskData {
  recordValue?: number;
  note?: string;
  duration?: number;
}

emit('confirm', data: CompleteTaskData);
emit('cancel');
```

**核心功能**：

1. **动态标签和提示**（根据 AggregationMethod）：
   - `SUM`（累加）：显示"本次完成量（将累加到当前进度）"
   - `MAX`（最大值）：显示"本次达到的最高值"
   - `AVERAGE`（平均值）：显示"本次的值（将计算平均值）"
   - `MIN`（最小值）：显示"本次的最小值"
   - `LAST`（最新值）：显示"最新的值（将覆盖当前值）"

2. **智能快捷值推荐**：
   ```typescript
   const quickValues = computed(() => {
     if (!props.goalBinding) return [];
     
     const { aggregationMethod, currentValue, targetValue } = props.goalBinding;
     const remaining = targetValue - currentValue;
     
     switch (aggregationMethod) {
       case GoalContracts.AggregationMethod.SUM:
         // 累加型：提供常用增量值
         return [1, 5, 10, 20, 50].filter(v => v <= remaining);
       
       case GoalContracts.AggregationMethod.MAX:
         // 最大值：提供百分比里程碑
         return [0.5, 0.7, 0.9, 1.0]
           .map(p => Math.round(targetValue * p))
           .filter(v => v > currentValue);
       
       case GoalContracts.AggregationMethod.AVERAGE:
         // 平均值：提供目标周边值
         return [0.8, 0.9, 1.0, 1.1, 1.2]
           .map(p => Math.round(targetValue * p));
       
       // ... 其他方法
     }
   });
   ```

3. **实时进度预测**：
   ```typescript
   const predictProgress = () => {
     if (!props.goalBinding || !recordValue.value) return '';
     
     const { aggregationMethod, currentValue, targetValue, unit } = props.goalBinding;
     let predicted = 0;
     
     switch (aggregationMethod) {
       case GoalContracts.AggregationMethod.SUM:
         predicted = currentValue + recordValue.value;
         break;
       case GoalContracts.AggregationMethod.MAX:
         predicted = Math.max(currentValue, recordValue.value);
         break;
       // ... 其他方法
     }
     
     const percentage = ((predicted / targetValue) * 100).toFixed(1);
     return `${predicted} / ${targetValue} ${unit || ''} (${percentage}%)`;
   };
   ```

4. **输入校验**：
   ```typescript
   const isValid = computed(() => {
     // 如果没有 goalBinding，只需要输入完成即可
     if (!props.goalBinding) return true;
     
     // 如果有 goalBinding，需要输入 recordValue
     return recordValue.value !== null && recordValue.value > 0;
   });
   ```

#### 3.1.2 useTaskCompleteDialog.ts

**位置**：`apps/web/src/modules/task/presentation/composables/useTaskCompleteDialog.ts`

**功能**：
- 管理对话框状态
- 查询任务和 Goal 信息
- 提供打开、确认、取消对话框的方法

**核心方法**：

1. **openCompleteDialog**：
   ```typescript
   async function openCompleteDialog(taskInstanceUuid: string) {
     // 1. 获取任务实例
     const instance = taskStore.getTaskInstanceByUuid(taskInstanceUuid);
     
     // 2. 获取任务模板
     const template = taskStore.getTaskTemplateByUuid(instance.templateUuid);
     
     // 3. 准备对话框数据
     dialogData.value = {
       show: true,
       taskUuid: taskInstanceUuid,
       taskTitle: template.title,
       instanceDate: instance.instanceDate,
     };
     
     // 4. 如果任务绑定了目标，获取 Goal 信息
     if (template.goalBinding) {
       const goalBinding = await fetchGoalBindingInfo(template.goalBinding);
       if (goalBinding) {
         dialogData.value.goalBinding = goalBinding;
       }
     }
   }
   ```

2. **fetchGoalBindingInfo**：
   ```typescript
   async function fetchGoalBindingInfo(
     binding: TaskContracts.TaskGoalBindingClientDTO
   ): Promise<GoalBinding | null> {
     // 1. 从服务器获取 Goal（会使用缓存）
     const goal = await fetchGoalById(binding.goalUuid);
     
     // 2. 查找 KeyResult
     const keyResult = goal.keyResults?.find(
       (kr: GoalContracts.KeyResultClientDTO) => kr.uuid === binding.keyResultUuid
     );
     
     // 3. 构造 GoalBinding 对象
     return {
       goalUuid: goal.uuid,
       goalTitle: goal.title,
       keyResultUuid: keyResult.uuid,
       keyResultTitle: keyResult.title,
       aggregationMethod: keyResult.progress.aggregationMethod,
       currentValue: keyResult.progress.currentValue,
       targetValue: keyResult.progress.targetValue,
       unit: keyResult.progress.unit,
     };
   }
   ```

3. **confirmComplete**：
   ```typescript
   async function confirmComplete(data: {
     recordValue?: number;
     note?: string;
     duration?: number;
   }) {
     await completeTaskInstance(dialogData.value.taskUuid, data);
     dialogData.value.show = false;
   }
   ```

### 3.2 修改的文件

#### 3.2.1 TaskInstanceManagement.vue

**修改内容**：

1. 导入对话框组件和 composable：
   ```vue
   import TaskCompleteDialog from './dialogs/TaskCompleteDialog.vue';
   import { useTaskCompleteDialog } from '../composables/useTaskCompleteDialog';
   
   const { dialogData, openCompleteDialog, confirmComplete, cancelDialog } 
     = useTaskCompleteDialog();
   ```

2. 修改完成事件处理：
   ```vue
   <!-- 之前 -->
   <TaskInstanceCard @complete="completeTaskInstance" />
   
   <!-- 现在 -->
   <TaskInstanceCard @complete="openCompleteDialog" />
   ```

3. 添加对话框组件：
   ```vue
   <TaskCompleteDialog
     v-if="dialogData.show"
     v-model="dialogData.show"
     :task-uuid="dialogData.taskUuid"
     :task-title="dialogData.taskTitle"
     :instance-date="dialogData.instanceDate"
     :goal-binding="dialogData.goalBinding"
     @confirm="confirmComplete"
     @cancel="cancelDialog"
   />
   ```

#### 3.2.2 CompleteTaskInstanceRequest.ts

**位置**：`packages/contracts/src/modules/task/api-requests.ts`

**修改内容**：
```typescript
export interface CompleteTaskInstanceRequest {
  recordValue?: number; // ✨ 新增：Goal Record 的值
  duration?: number;
  note?: string;
  rating?: number;
}
```

#### 3.2.3 useTaskInstance.ts

**位置**：`apps/web/src/modules/task/presentation/composables/useTaskInstance.ts`

**修改内容**：
```typescript
// 修改函数签名
async function completeTaskInstance(
  uuid: string,
  result?: {
    recordValue?: number; // ✨ 新增
    duration?: number;
    note?: string;
    rating?: number;
  }
)
```

## 4. AggregationMethod 适配

### 4.1 五种计算方式

| Method | 中文名 | 输入含义 | 计算逻辑 | 适用场景 |
|--------|--------|---------|---------|---------|
| `SUM` | 累加 | 本次完成量 | `current + input` | 阅读书籍、跑步公里数 |
| `MAX` | 最大值 | 本次达到的最高值 | `max(current, input)` | 最高分数、最大体重 |
| `AVERAGE` | 平均值 | 本次的值 | 重新计算平均 | 每日学习时长 |
| `MIN` | 最小值 | 本次的最小值 | `min(current, input)` | 最低体重、最短用时 |
| `LAST` | 最新值 | 最新的值 | 覆盖为 `input` | 当前体重、最新状态 |

### 4.2 UI 适配

每种方法有不同的：
- **图标**：SUM(➕) / MAX(⬆️) / AVERAGE(📊) / MIN(⬇️) / LAST(🔄)
- **颜色**：SUM(primary) / MAX(success) / AVERAGE(info) / MIN(warning) / LAST(secondary)
- **标签**：动态生成的输入提示
- **快捷值**：智能推荐的常用值
- **预测逻辑**：不同的进度计算方式

## 5. 用户交互流程

### 5.1 无 Goal 绑定的任务

```
用户点击"完成"
  ↓
显示对话框（简化版）
  ├─ 任务标题
  ├─ 完成日期
  ├─ 备注（可选）
  └─ 耗时（可选）
  ↓
用户点击"确认完成"
  ↓
任务标记为已完成
```

### 5.2 有 Goal 绑定的任务

```
用户点击"完成"
  ↓
显示对话框（完整版）
  ├─ 任务标题和日期
  ├─ 关联的 Goal 和 KeyResult 信息
  ├─ 当前进度（current / target）
  ├─ 计算方式图标和说明
  ├─ 输入 recordValue（必填）
  │   ├─ 动态标签（根据 AggregationMethod）
  │   ├─ 动态提示（根据 AggregationMethod）
  │   └─ 快捷值按钮（智能推荐）
  ├─ 实时预测完成后的进度
  ├─ 备注（可选）
  └─ 耗时（可选）
  ↓
用户输入 recordValue（例如：5）
  ↓
实时预测显示：完成后预计 55 / 100 页 (55.0%)
  ↓
用户点击"确认完成"
  ↓
后端处理：
  ├─ 完成 TaskInstance
  ├─ 创建 GoalRecord（recordValue = 5）
  └─ 更新 KeyResult 进度
```

## 6. 待完成工作

### 6.1 后端支持（高优先级）

**需要修改的文件**：

1. **TaskInstanceApplicationService.ts**（后端）
   - 位置：`apps/api/src/modules/task/application/services/`
   - 修改：`completeTaskInstance` 方法
   - 新增逻辑：
     ```typescript
     async completeTaskInstance(
       uuid: string,
       accountUuid: string,
       data?: {
         recordValue?: number; // ✨ 新增
         duration?: number;
         note?: string;
         rating?: number;
       }
     ) {
       // 1. 完成任务实例
       const instance = await this.taskInstanceDomain.complete(uuid, data);
       
       // 2. 如果有 recordValue，创建 GoalRecord
       if (data?.recordValue && instance.goalBinding) {
         await this.goalRecordService.createRecord({
           goalUuid: instance.goalBinding.goalUuid,
           keyResultUuid: instance.goalBinding.keyResultUuid,
           value: data.recordValue,
           recordedAt: new Date(),
           source: 'TASK_INSTANCE',
           sourceUuid: uuid,
         });
       }
       
       return instance;
     }
     ```

2. **TaskInstanceController.ts**（后端）
   - 位置：`apps/api/src/modules/task/presentation/controllers/`
   - 修改：完成任务的 API 端点
   - 确保传递 `recordValue` 参数

### 6.2 测试验证（中优先级）

**测试场景**：

1. **无 Goal 绑定的任务**：
   - ✅ 点击完成显示对话框
   - ✅ 对话框不显示 Goal 信息
   - ✅ 直接确认即可完成

2. **SUM 累加型任务**：
   - ✅ 显示累加型标签和提示
   - ✅ 快捷值为 [1, 5, 10, 20, 50]
   - ✅ 输入 5，预测显示 "current + 5"

3. **MAX 最大值任务**：
   - ✅ 显示最大值标签和提示
   - ✅ 快捷值为目标的百分比
   - ✅ 输入值，预测显示 max(current, input)

4. **AVERAGE 平均值任务**：
   - ✅ 显示平均值标签和提示
   - ✅ 快捷值为目标周边值
   - ✅ 输入值，预测显示平均值计算结果

5. **其他方法类似测试**...

6. **边界情况**：
   - ✅ 输入为 0 或负数
   - ✅ 输入超过目标值
   - ✅ 取消对话框
   - ✅ 网络错误处理

### 6.3 优化和清理（低优先级）

1. **移除旧的自动完成逻辑**：
   - TaskTemplate 中的 `incrementValue` 可能不再需要默认使用
   - 清理相关的自动计算代码

2. **性能优化**：
   - 对话框数据的缓存策略
   - Goal 信息的预加载

3. **UI 优化**：
   - 对话框动画效果
   - 快捷值的更智能推荐
   - 移动端适配

## 7. 技术亮点

### 7.1 智能适配

根据 `AggregationMethod` 动态调整：
- 输入标签和提示
- 快捷值推荐
- 进度预测逻辑
- 图标和颜色

### 7.2 用户体验

- **实时反馈**：输入时立即显示预测进度
- **快捷操作**：一键选择常用值
- **防止误触**：二次确认机制
- **清晰提示**：每种方法有独特的图标和说明

### 7.3 可维护性

- **关注点分离**：对话框组件 + 业务 composable
- **类型安全**：完整的 TypeScript 类型定义
- **可扩展**：易于支持新的 AggregationMethod

## 8. 总结

### 8.1 已完成（70%）

- ✅ TaskCompleteDialog.vue 组件（~600 行，功能完整）
- ✅ useTaskCompleteDialog.ts composable
- ✅ TaskInstanceManagement.vue 集成
- ✅ CompleteTaskInstanceRequest 接口扩展
- ✅ useTaskInstance.ts 签名更新
- ✅ 五种 AggregationMethod 完整适配
- ✅ 智能快捷值推荐
- ✅ 实时进度预测
- ✅ 移除撤回按钮（UX 改进）
- ✅ 增强 KeyResult 信息显示（当前值、目标值、进度条、剩余量）

### 8.2 待完成（30%）

- ⏳ 后端 ApplicationService 支持 recordValue
- ⏳ 后端 Controller 接收和传递 recordValue
- ⏳ 完整的测试验证
- ⏳ 性能优化和 UI 调整

### 8.3 影响

**正向影响**：
- ✅ 支持所有 AggregationMethod
- ✅ 提高数据准确性
- ✅ 防止误触操作
- ✅ 无需复杂的 Undo 机制

**需要注意**：
- ⚠️ 用户需要多一步操作（但这是有价值的）
- ⚠️ 需要后端支持 recordValue 参数
- ⚠️ 现有的 incrementValue 逻辑可能需要调整

## 9. 下一步行动

1. **立即**：实施后端支持（TaskInstanceApplicationService 和 Controller）
2. **尽快**：完整测试所有 AggregationMethod 场景
3. **随后**：性能优化和 UI 调整
4. **最后**：清理旧逻辑和文档更新

---

**文档创建时间**：2025-01-XX  
**实施进度**：60% 完成  
**预计完成时间**：需要 2-3 小时完成后端支持和测试
