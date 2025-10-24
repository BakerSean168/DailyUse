# Feature Spec: 日程搜索过滤

> **功能编号**: SCHEDULE-006  
> **RICE 评分**: 77 (Reach: 4, Impact: 5, Confidence: 7, Effort: 1.8)  
> **优先级**: P3  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 价值主张

**核心收益**:

- ✅ 多条件组合搜索
- ✅ 模糊搜索 + 精确筛选
- ✅ 保存常用搜索

---

## 2. 核心场景

### 场景 1: 高级搜索

```
🔍 日程搜索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

关键词: [产品会议...]

时间范围:
📅 从: [2025-10-01 ▼]
📅 到: [2025-10-31 ▼]

日历: [全部 ▼]

事件类型:
☑️ 会议
☑️ 工作
☐ 个人
☐ 学习

参与人员:
[选择...]

[搜索]  [清空]  [保存为常用搜索]
```

---

### 场景 2: 搜索结果

```
搜索结果 (23 个事件)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

按时间 ▼  |  按相关度  |  按日历

📅 10月15日（周二）

09:00-10:00  产品需求评审会
🟡 会议  |  参与人: 张三、李四、王五
[查看详情]

14:00-15:30  产品功能讨论
🟡 会议  |  参与人: 张三、赵六
[查看详情]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 10月18日（周五）
...
```

---

## 3. 技术要点

```typescript
interface SearchCriteria {
  readonly keyword?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly calendars?: string[];
  readonly types?: string[];
  readonly participants?: string[];
  readonly tags?: string[];
}

function searchEvents(criteria: SearchCriteria): ScheduleEvent[] {
  let results = this.scheduleRepository.findAll();

  if (criteria.keyword) {
    results = results.filter(
      (e) => e.title.includes(criteria.keyword) || e.description?.includes(criteria.keyword),
    );
  }

  if (criteria.startDate) {
    results = results.filter((e) => e.startTime >= criteria.startDate);
  }

  // ... 其他筛选

  return results;
}
```

---

## 4. MVP 范围

- ✅ 关键词搜索
- ✅ 时间范围筛选
- ✅ 多维度组合
- ✅ 保存搜索

---

**文档状态**: ✅ Ready
