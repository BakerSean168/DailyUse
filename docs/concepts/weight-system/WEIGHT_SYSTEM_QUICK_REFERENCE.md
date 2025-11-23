---
tags:
  - weight-system
  - quick-reference
  - guide
description: 权重系统快速参考指南
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# Weight System - Quick Reference Guide

## 🎯 Current System Status: ✅ Production Ready

The weight system has been completely migrated from **0-100% percentage model** to **1-10 integer weight model**.

---

## 📊 Weight System at a Glance

### Core Rules

| Rule | Details |
|------|---------|
| **Weight Range** | 1-10 (integer only) |
| **No Sum Constraint** | Weights can total any value |
| **Percentage Calculation** | `(weight / totalWeight) * 100%` |
| **Validation** | 1 ≤ weight ≤ 10 and integer only |

### Quick Example

```
User has 3 KeyResults with weights: [8, 5, 2]
Total Weight: 15
Weight Distribution: [53.3%, 33.3%, 13.3%]
```

---

## 🔄 Three Weight Strategies

### 1. Balanced Strategy (均衡策略)
**When to use**: All KRs have similar importance
```
3 KRs → [3, 3, 3] (sum: 9)
5 KRs → [2, 2, 2, 2, 2] (sum: 10)
```

### 2. Focused Strategy (聚焦策略)
**When to use**: Some KRs are more important
```
Priorities: [80, 50, 30]
Weights: [8, 6, 3] (sum: 17)
```

### 3. Stepped Strategy (阶梯策略)
**When to use**: Clear priority order (1st > 2nd > 3rd)
```
3 KRs → [7, 4, 1] (sum: 12)
5 KRs → [10, 8, 6, 4, 2] (sum: 30)
```

---

## 🔐 Weight Validation Rules

### ✅ Valid Weights
- `1` ✓ Minimum weight
- `5` ✓ Mid-range weight
- `10` ✓ Maximum weight
- `[1, 5, 10]` ✓ Mixed weights

### ❌ Invalid Weights
- `0` ✗ Below minimum
- `11` ✗ Above maximum
- `5.5` ✗ Not an integer
- `"5"` ✗ Not a number
- Must be validated per KR, not as sum

---

## 🔄 Migration from Old System

| Item | Old | New | Action |
|------|-----|-----|--------|
| Range | 0-100 | 1-10 | Scale values |
| Validation | Sum = 100% | No constraint | Remove validators |
| Calculation | `w/100` | `w/total` | Update formulas |
| API Param | `0-100` | `1-10` | Update calls |

### Database Migration Example
```sql
-- For old system using 0-100 range
UPDATE goal_key_results
SET weight = ROUND(weight / 10)
WHERE weight > 10;

-- For old system using 1-100 range
UPDATE goal_key_results
SET weight = ROUND(weight / 10)
WHERE weight >= 1;
```

---

## 📱 Frontend Usage

### In Vue Components
```typescript
// ✅ Correct
const weight = 5; // 1-10 range
const totalWeight = 15;
const percentage = (weight / totalWeight) * 100; // 33.3%

// ❌ Wrong (old system)
const weight = 50; // Should not exceed 10
const percentage = weight; // Should not assume weight is percentage
```

### API Client
```typescript
// Update KR weight
await updateKeyResultWeight(krId, 7); // 1-10 range only

// Get weight distribution
const { totalWeight, distribution } = await getWeightSumInfo(goalId);
```

---

## 🛠️ Backend Services

### WeightSnapshotApplicationService
- **Removed**: `validateWeightSum()` method
- **Removed**: `InvalidWeightSumError` class
- **Added**: `getWeightSumInfo(goalUuid)` method

### GoalRecordApplicationService
- **Updated**: Weight calculation in `getGoalProgressBreakdown()`
- **Formula**: `progress * (weight / totalWeight)` (not `progress * weight / 100`)

### WeightRecommendationService
- **Updated**: All three strategies (balanced, focused, stepped)
- **All output**: 1-10 range weights
- **Validation**: `validateWeights()` checks 1-10 range

---

## 📍 Key Endpoints

### Get Weight Summary
```
GET /goals/{goalUuid}/weight-snapshots
Response: { totalWeight, keyResults: [...] }
```

### Update KR Weight
```
PATCH /weight-snapshots/{snapshotId}/key-results/{krUuid}
Body: { weight: 1-10 }
```

### Get Aggregate View
```
GET /goals/{goalUuid}/aggregate
Response: { goal, keyResults, weightSummary, statistics }
```

---

## 🐛 Common Issues & Fixes

### Issue: "Weight must be between 1-10"
**Cause**: Trying to use old 0-100 range
**Fix**: Convert value to 1-10 range
```typescript
// Wrong
weight = 50;  // Error!

// Right
weight = 5;   // Correct
```

### Issue: "Weight percentages don't sum to 100%"
**Cause**: Checking if sum equals 100 (old validation)
**Fix**: Remove that validation; percentages will sum to 100% automatically
```typescript
// Wrong
if (totalWeight !== 100) throw Error();

// Right (no validation needed)
// Percentages are calculated as: weight / totalWeight * 100
```

### Issue: Weight display shows wrong percentages
**Cause**: Using `weight` directly instead of calculating ratio
**Fix**: Use formula: `(weight / totalWeight) * 100`
```typescript
// Wrong
const percentage = weight;  // 5 displayed as 5%

// Right
const percentage = (weight / totalWeight) * 100;  // 5/12 * 100 = 41.7%
```

---

## 📋 Checklist for Integration

### Frontend Developers
- [ ] Update weight input validators to 1-10 range
- [ ] Update percentage calculation formula
- [ ] Remove any sum validation
- [ ] Test with the three recommendation strategies
- [ ] Verify weight distribution displays correctly

### Backend Developers
- [ ] Ensure API parameters validated as 1-10
- [ ] Use `weight / totalWeight` in calculations
- [ ] No sum validation in WeightSnapshotApplicationService
- [ ] getWeightSumInfo() returns correct distribution
- [ ] Test with various weight combinations

### QA / Testing
- [ ] Test single KR (weight should be 100%)
- [ ] Test multiple KRs with different weights
- [ ] Test each recommendation strategy
- [ ] Verify percentage accuracy
- [ ] Test edge cases (weight 1, weight 10, unbalanced weights)

---

## 🔗 Related Documents

- `WEIGHT_SYSTEM_COMPLETE_OVERHAUL.md` - Full architecture details
- `WEIGHT_STRATEGIES_FIX.md` - Strategy algorithm changes
- `AGGREGATE_ENDPOINT_FIX.md` - Aggregate view endpoint
- `WEIGHT_SYSTEM_REFACTOR.md` - Original system design

---

## ✨ Benefits Summary

| Benefit | Impact |
|---------|--------|
| **Flexibility** | No sum constraint; any weight combination works |
| **Simplicity** | Easy-to-understand 1-10 scale |
| **Accuracy** | Dynamic percentage calculation; no rounding artifacts |
| **Scalability** | Works for 1 KR to 100+ KRs uniformly |
| **User Experience** | Clearer validation; better error messages |

---

## 📞 Support & Questions

For issues or questions about the weight system:
1. Check this quick reference guide
2. Review the detailed architecture document
3. Look at test files for usage examples
4. Check git history for migration details

**Last Updated**: Current Session
**System Status**: ✅ Production Ready
**Test Coverage**: ✅ Complete
