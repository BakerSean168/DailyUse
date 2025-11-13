# Dashboard 功能产品需求文档（PRD）

**文档版本**: v2.0 ✅ **已基于现有代码重构**  
**创建日期**: 2024-01-XX  
**修订日期**: 2024-01-XX  
**产品经理**: Bmad Master Agent - PO  
**项目**: DailyUse Dashboard 完善

---

## ⚠️ **重要变更说明（v2.0）**

### 代码库现状发现

经过代码审查，发现以下**已实现**的基础设施：

✅ **Task/Goal/Reminder/Schedule Statistics 聚合根已存在**  
✅ **DDD 架构 + 事件驱动模式已成熟**  
✅ **Server/Client/Persistence DTO 分层已完善**  
✅ **recalculate() 和事件处理器已实现**

### 本次修订重点

- ❌ **删除冗余需求**：不再创建已存在的 Statistics 服务
- 🎯 **聚焦缺失功能**：Dashboard 聚合层、Widget 系统、缓存层
- 📉 **降低工作量**：从 130 SP → 预计 85 SP

---

## 1. 背景与目标

### 1.1 项目背景

DailyUse 是一个综合性的日常管理应用，目前已经实现了以下核心功能模块：

- **任务管理（Task）**：✅ 已有 `TaskStatistics` 聚合根（模板/实例/完成/时间/分布统计）
- **目标管理（Goal）**：✅ 已有 `GoalStatistics` 聚合根（目标/关键结果/进度/分类统计）
- **提醒管理（Reminder）**：✅ 已有 `ReminderStatistics` 聚合根（模板/分组/触发统计）
- **日程管理（Schedule）**：✅ 已有 `ScheduleStatistics` 聚合根（任务/执行/模块级统计）

**现有统计基础设施完善度：90%**

当前 Dashboard 页面功能较为简单，**缺失的核心功能**：

1. **跨模块数据聚合**：各模块 Statistics 独立存在，无 Dashboard 级别汇总
2. **模块化 Widget 系统**：无法将统计数据展示为可复用组件
3. **缓存与性能优化**：每次查询都重算，无 Redis 缓存层
4. **用户体验提升**：无骨架屏、无加载状态、无自定义布局
