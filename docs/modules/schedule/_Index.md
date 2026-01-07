---
tags:
  - index
  - schedule
  - navigation
description: Schedule 模块文档索引
created: 2025-01-01
updated: 2025-01-01
---

# Schedule 模块文档索引

> 📚 快速导航到所有 Schedule 模块文档

## 模块概述

- [[README|📅 Schedule 模块概述]]

---

## 实体对象

### 聚合根 (Aggregates)
- [[aggregates/Schedule|Schedule]] - 日程事件 (日历事件)
- [[aggregates/ScheduleTask|ScheduleTask]] - 调度任务 (定时任务)
- [[aggregates/ScheduleStatistics|ScheduleStatistics]] - 调度统计

### 实体 (Entities)
- [[entities/ScheduleExecution|ScheduleExecution]] - 执行记录

### 值对象 (Value Objects)
- [[value-objects/ScheduleConfig|ScheduleConfig]] - 调度配置 (Cron, 时区)
- [[value-objects/ExecutionInfo|ExecutionInfo]] - 执行信息
- [[value-objects/RetryPolicy|RetryPolicy]] - 重试策略
- [[value-objects/TaskMetadata|TaskMetadata]] - 任务元数据
- [[value-objects/ConflictDetectionResult|ConflictDetectionResult]] - 冲突检测结果
- [[value-objects/ModuleStatistics|ModuleStatistics]] - 模块统计

### 枚举 (Enums)
- [[enums/Enums|Enums]] - 所有枚举类型

---

## 业务流程

- [[business/ScheduleEvent-Management|日程事件管理]] - CRUD 和查询
- [[business/ScheduleTask-Lifecycle|调度任务生命周期]] - 创建、暂停、恢复、完成
- [[business/Conflict-Detection|冲突检测]] - 时间冲突检测与解决

---

## 架构文档

- [[architecture/Architecture|模块架构]] - 整体架构设计
- [[architecture/Current-Issues|当前问题]] - 已知问题和技术债务

---

## 文件结构

```
docs/modules/schedule/
├── README.md                    # 模块概述 (现有)
├── _Index.md                    # 本文件
│
├── aggregates/                  # 聚合根文档
│   ├── Schedule.md
│   ├── ScheduleTask.md
│   └── ScheduleStatistics.md
│
├── entities/                    # 实体文档
│   └── ScheduleExecution.md
│
├── value-objects/               # 值对象文档
│   ├── ScheduleConfig.md
│   ├── ExecutionInfo.md
│   ├── RetryPolicy.md
│   ├── TaskMetadata.md
│   ├── ConflictDetectionResult.md
│   └── ModuleStatistics.md
│
├── enums/                       # 枚举文档
│   └── Enums.md
│
├── business/                    # 业务流程文档
│   ├── ScheduleEvent-Management.md
│   ├── ScheduleTask-Lifecycle.md
│   └── Conflict-Detection.md
│
└── architecture/                # 架构文档
    ├── Architecture.md
    └── Current-Issues.md
```

---

## 相关模块

- [[../task/README|Task 模块]] - 任务管理
- [[../reminder/README|Reminder 模块]] - 提醒管理
- [[../goal/README|Goal 模块]] - 目标管理
