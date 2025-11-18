# 权重系统重构 - 从 100% 强制验证到动态权重比例

## 📋 概述

删除了旧的权重总和 = 100% 的强制验证，实现了更灵活的权重分布系统：
- **权重范围**: 1-10（而不是 0-100）
- **权重占比**: 由所有 KeyResult 权重的总和动态计算
- **优势**: 更直观，更易于设置，自动计算占比

---

## 🔄 修改清单

### 1. 后端服务层

#### ✅ WeightSnapshotApplicationService.ts
- ❌ 删除: `validateWeightSum()` 方法（校验权重总和 = 100%）
- ✅ 新增: `getWeightSumInfo()` 方法（计算权重分布及占比）
  ```typescript
  async getWeightSumInfo(goalUuid: string): Promise<{
    totalWeight: number;
    keyResults: Array<{ 
      uuid: string; 
      title: string; 
      weight: number; 
      percentage: number 
    }>;
  }>
  ```

#### ✅ WeightSnapshotErrors.ts
- ❌ 删除: `InvalidWeightSumError` 错误类

#### ✅ WeightSnapshotController.ts
- ✅ 更新权重参数验证范围: `0-100` → `1-10`
- ❌ 删除权重总和验证逻辑
- ✅ 响应返回权重分布信息（包含占比）

#### ✅ GoalRecordApplicationService.ts
- ✅ 修复权重计算逻辑（行 230-264）
  ```typescript
  // 旧算法（错误）
  const totalProgress = goal.keyResults.reduce((sum, kr) => {
    return sum + (progressPercentage * kr.weight / 100);  // ❌ 假设权重总和为 100
  }, 0);

  // 新算法（正确）
  const totalWeight = goal.keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
  const totalProgress = goal.keyResults.reduce((sum, kr) => {
    return sum + (progressPercentage * (kr.weight / totalWeight));  // ✅ 真实权重比例
  }, 0);
  ```

---

### 2. 前端更新

#### ✅ useWeightSnapshot.ts
- ✅ 更新注释: `newWeight - 新权重值 (0-100)` → `(1-10, 权重占比由所有 KR 权重的总和计算)`
- ✅ 更新返回类型: `snapshot: { ... }` → `weightInfo: { totalWeight, keyResults: [...] }`

#### ✅ weightSnapshotApiClient.ts
- ✅ 更新注释和返回类型

#### ✅ KeyResultDialog.vue
- ✅ 权重范围已正确设置为 1-10（无需修改）
- ✅ 权重规则验证已正确实现（无需修改）
- ✅ 默认权重值: 5（无需修改）

---

### 3. 单元测试

#### ✅ weight-snapshot.integration.test.ts
- ❌ 删除: 权重总和验证测试（两个测试用例）
- ✅ 新增: 权重分布信息测试（两个新测试）
  - 基本权重分布计算
  - 权重更新后的占比重新计算

---

## 📊 权重计算示例

### 场景 1: 均衡分配（三个 KR，各权重 3、3、4）

```
总权重 = 3 + 3 + 4 = 10
KR1 占比 = 3/10 = 30%
KR2 占比 = 3/10 = 30%
KR3 占比 = 4/10 = 40%
```

### 场景 2: 不均匀分配（KR 权重 1、5、10）

```
总权重 = 1 + 5 + 10 = 16
KR1 占比 = 1/16 ≈ 6.25%
KR2 占比 = 5/16 ≈ 31.25%
KR3 占比 = 10/16 = 62.5%
```

### 权重对目标进度的影响

假设三个 KR 的进度分别为 30%, 60%, 90%：

```
场景 1（均衡）:
目标进度 = 30% × 30% + 60% × 30% + 90% × 40%
        = 0.09 + 0.18 + 0.36
        = 63%

场景 2（不均衡）:
目标进度 = 30% × 6.25% + 60% × 31.25% + 90% × 62.5%
        = 0.01875 + 0.1875 + 0.5625
        = 76.875%
```

---

## 🎯 前端 UI 显示

### 目标权重分布图的正确显示

用户现在应该看到：

```
┌─ 目标权重分布图 ────────────────────┐
│                                    │
│  总权重: 16                        │
│                                    │
│  KR1: 权重 1  占比 6.25%  ▌       │
│  KR2: 权重 5  占比 31.25% ███     │
│  KR3: 权重 10 占比 62.5%  ██████ │
│                                    │
└────────────────────────────────────┘
```

---

## 🔧 API 接口变更

### 更新 KeyResult 权重

**Request**:
```json
{
  "newWeight": 7,
  "reason": "季度中期调整"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "keyResult": {
      "uuid": "kr-123",
      "title": "User Growth",
      "oldWeight": 5,
      "newWeight": 7
    },
    "weightInfo": {
      "totalWeight": 30,
      "keyResults": [
        {
          "uuid": "kr-123",
          "title": "User Growth",
          "weight": 7,
          "percentage": 23.33
        },
        {
          "uuid": "kr-456",
          "title": "Revenue Growth",
          "weight": 10,
          "percentage": 33.33
        },
        {
          "uuid": "kr-789",
          "title": "Retention",
          "weight": 13,
          "percentage": 43.33
        }
      ]
    }
  }
}
```

---

## ✅ 验证清单

- [x] 后端权重计算逻辑已修复
- [x] 权重验证已移除
- [x] API 返回格式已更新
- [x] 前端 composable 已更新
- [x] 前端 API 客户端已更新
- [x] 单元测试已更新
- [x] 权重范围已设置为 1-10
- [ ] 编译验证（待执行）
- [ ] 集成测试（待执行）
- [ ] 前端 UI 适配检查（待执行）

---

## 📝 关键变更总结

| 项目 | 旧逻辑 | 新逻辑 |
|------|--------|--------|
| **权重范围** | 0-100 | 1-10 |
| **权重总和** | 必须 = 100% | 任意值（自动计算占比） |
| **占比计算** | `weight / 100` | `weight / totalWeight` |
| **验证** | 严格验证 | 无验证 |
| **用户体验** | 需手工计算保证总和为 100% | 直接设置权重，自动计算占比 |

---

## 🚀 后续任务

1. **编译验证**
   - [ ] 运行 `pnpm build --filter @dailyuse/api`
   - [ ] 检查 Goal 模块是否有编译错误

2. **手动测试**
   - [ ] 创建 Goal 时设置不同权重
   - [ ] 更新 KR 权重后检查占比
   - [ ] 验证目标进度计算是否正确

3. **前端 UI 适配**
   - [ ] 检查目标详情页的权重显示
   - [ ] 检查权重分布图的显示
   - [ ] 验证权重编辑对话框

4. **文档更新**
   - [ ] 更新用户指南
   - [ ] 更新 API 文档
   - [ ] 更新开发者指南

---

## 📞 技术支持

如有问题，请检查：
1. 权重是否在 1-10 之间
2. 总权重计算是否正确
3. 占比相加是否为 100%（允许浮点误差）
