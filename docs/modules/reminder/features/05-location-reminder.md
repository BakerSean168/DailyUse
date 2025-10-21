# Feature Spec: 地理位置提醒

> **功能编号**: REMINDER-005  
> **RICE 评分**: 84 (Reach: 4, Impact: 6, Confidence: 7, Effort: 2)  
> **优先级**: P3  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 价值主张

**核心收益**:
- ✅ 到达/离开特定位置触发提醒
- ✅ 地理围栏（Geofence）
- ✅ 常用地点管理

---

## 2. 核心场景

### 场景 1: 创建位置提醒

```
📍 创建位置提醒
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

提醒内容: 买菜
位置: 家附近超市 🏪

触发条件:
🔘 到达此位置
⚪ 离开此位置

地理围栏半径: [200] 米

工作时间限制:
☑️ 仅工作日 17:00-20:00

[创建]  [取消]
```

---

### 场景 2: 常用地点管理

```
📌 常用地点
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 家 (116.404, 39.915)
   半径: 100m
   提醒: 3 个
   [编辑] [删除]

🏢 公司 (116.481, 39.990)
   半径: 200m
   提醒: 5 个
   [编辑] [删除]

🏪 超市 (116.410, 39.920)
   半径: 150m
   提醒: 1 个
   [编辑] [删除]

[+ 添加地点]
```

---

## 3. 技术要点

```typescript
export interface LocationReminderServerDTO {
  readonly uuid: string;
  readonly title: string;
  readonly locationName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radius: number;              // 米
  readonly triggerType: 'enter' | 'exit';
  readonly timeConstraints?: {
    readonly daysOfWeek?: number[];
    readonly startTime?: string;
    readonly endTime?: string;
  };
  readonly userId: string;
  readonly createdAt: number;
}
```

---

## 4. MVP 范围

- ✅ 地理围栏触发
- ✅ 到达/离开检测
- ✅ 常用地点管理
- ✅ 时间限制

---

**文档状态**: ✅ Ready

