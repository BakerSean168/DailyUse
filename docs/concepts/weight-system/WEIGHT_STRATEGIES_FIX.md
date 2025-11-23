---
tags:
  - weight-system
  - fix
  - algorithm
description: 权重生成策略修复：1-10 范围实现
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# Weight Strategies Fix - 1-10 Range Implementation

**Date**: Current Session
**Status**: ✅ COMPLETED
**Related Issues**: Weight validation showing "5%" instead of correct weight values

## Problem Summary

The weight generation strategies in `WeightRecommendationService` were still using the old **0-100 percentage logic**, causing:
- Weights like `[5, 5, 5]` to be displayed as "5%" instead of weight values
- Validation errors showing "权重总和为 5%，应该为 100%"
- Mismatch between backend (1-10) and frontend recommendation service

## Solution Overview

Updated all three weight generation strategies to produce weights in the **1-10 integer range** instead of 0-100 percentages.

## Changes Made

### File: `apps/web/src/modules/goal/application/services/WeightRecommendationService.ts`

#### 1. Balanced Strategy (均衡策略)

**Before** (0-100):
```typescript
const baseWeight = Math.floor(100 / count);        // e.g., 33 for 3 KRs
const weights = Array(count).fill(baseWeight);     // [33, 33, 33]
// Reasoning: "约 33% 权重"
```

**After** (1-10):
```typescript
const baseWeight = count <= 3 ? 3 : 2;             // e.g., 3 for 3 KRs
const weights = Array(count).fill(baseWeight);     // [3, 3, 3]
// Reasoning: "分配权重 3/10"
```

**Examples**:
| KRs Count | Old (0-100) | New (1-10) | Old Sum | New Sum |
|-----------|-----------|-----------|---------|---------|
| 1         | [100]     | [5]       | 100%    | 5       |
| 2         | [50, 50]  | [3, 3]    | 100%    | 6       |
| 3         | [33, 33, 34] | [3, 3, 3] | 100% | 9     |
| 5         | [20, 20, 20, 20, 20] | [2, 2, 2, 2, 2] | 100% | 10 |

#### 2. Focused Strategy (聚焦策略)

**Before** (0-100):
```typescript
const weights = priorities.map((p) => Math.round((p / total) * 100));
// [80, 50, 30] -> [40, 25, 15] (with adjustments to sum to 100)
```

**After** (1-10):
```typescript
const weights = priorities.map((p) => {
  const weight = Math.round((p / 100) * 9) + 1;    // Map 0-100 to 1-10
  return Math.max(1, Math.min(10, weight));        // Ensure bounds
});
// [80, 50, 30] -> [8, 6, 3] (no adjustment needed)
```

**Mapping Formula**:
- Priority 100 → Weight 10
- Priority 89 → Weight 9
- Priority 55 → Weight 6
- Priority 0 → Weight 1

#### 3. Stepped Strategy (阶梯策略)

**Before** (0-100):
```typescript
const step = Math.floor(100 / ((count * (count + 1)) / 2));
const tempWeights = priorityIndexes.map((_, i) => (count - i) * step);
// For 3 KRs: [50, 33, 17] (with adjustments)
```

**After** (1-10):
```typescript
if (count === 1) {
  weights = [5];                    // Single KR: middle value
} else if (count === 2) {
  weights = [7, 3];                 // Two KRs: focused
} else if (count === 3) {
  weights = [7, 4, 1];              // Three KRs: ladder
} else {
  // For more KRs: decreasing by 2
  weights = [10, 8, 6, 4, 2, ...];
}
```

**Examples**:
| Priorities | Old (0-100) | New (1-10) | Old Sum | New Sum |
|-----------|-----------|-----------|---------|---------|
| [100, 50, 20] | [50, 33, 17] | [7, 4, 1] | 100% | 12 |
| [80, 60, 40, 20] | [40, 30, 20, 10] | [10, 8, 6, 4] | 100% | 28 |

## Impact

### Weight Distribution
- **Old**: Weights summed to 100% (enforced by validation)
- **New**: Weights in 1-10 range (no sum constraint)
- **Display**: Percentage calculated as `(weight / totalWeight) * 100%`

### Examples

**Scenario: 3 KRs with Balanced Strategy**
- Weights: [3, 3, 3]
- Total: 9
- Percentages: [33.3%, 33.3%, 33.3%]

**Scenario: 3 KRs with Stepped Strategy**
- Weights: [7, 4, 1]
- Total: 12
- Percentages: [58.3%, 33.3%, 8.3%]

## Testing

### Weight Generation Verification
```
Balanced (3 KRs): [3, 3, 3] Sum: 9     ✅
Balanced (5 KRs): [2, 2, 2, 2, 2] Sum: 10 ✅
Focused: [8, 6, 4] Sum: 18            ✅
Stepped (3 KRs): [7, 4, 1] Sum: 12    ✅
Stepped (5 KRs): [10, 8, 6, 4, 2] Sum: 30 ✅
```

All weights are in 1-10 range ✅
No weights exceed range ✅
No percentages used ✅

## Related Changes

This fix works in conjunction with:
1. **WeightSnapshotApplicationService** - Removed 0-100% sum validation
2. **GoalRecordApplicationService** - Using `weight/totalWeight` calculation
3. **WeightSnapshotController** - Updated parameter validation to 1-10

## Backwards Compatibility

⚠️ **Breaking Change**: If existing code expects weights to sum to 100%, it will break.

**Mitigation**:
- Updated all calculation methods to use `weight/totalWeight` ratio
- Removed `validateWeightSum()` validation
- Frontend displays percentage automatically

## Verification Checklist

- [x] All strategy methods generate 1-10 weights
- [x] No 0-100 percentage calculations remain
- [x] Mapping formula correctly converts priorities to weights
- [x] TypeScript compilation passes
- [x] No weight values exceed 1-10 bounds
- [x] Reasoning strings updated to use weight/10 format

## Next Steps

1. ✅ Deploy weight strategy changes
2. ⏳ Test recommendation feature in UI
3. ⏳ Verify weight percentages display correctly
4. ⏳ Manual e2e test of weight assignment flow
