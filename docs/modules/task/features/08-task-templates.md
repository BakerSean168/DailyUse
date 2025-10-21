# Feature Spec: 任务模板

> **功能编号**: TASK-008  
> **RICE 评分**: 91 (Reach: 5, Impact: 5, Confidence: 7, Effort: 1.9)  
> **优先级**: P3  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

- ❌ 重复创建相似任务（周报、代码评审）
- ❌ 新人不知道如何拆解任务
- ❌ 团队任务格式不统一

### 价值主张

**核心收益**:
- ✅ 20+ 常用任务模板
- ✅ 一键应用并自定义
- ✅ 团队模板共享

---

## 2. 核心场景

### 场景 1: 应用任务模板

```
📋 任务模板库
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 热门模板

📝 周报撰写
└─ 包含: 工作总结 + 下周计划 + 问题跟进
⭐ 523 次使用
[使用]

🐛 Bug 修复流程
└─ 包含: 问题重现 + 根因分析 + 修复验证
⭐ 412 次使用
[使用]

📊 代码评审检查清单
└─ 包含: 功能 + 性能 + 安全 + 规范
⭐ 356 次使用
[使用]
```

---

### 场景 2: 创建自定义模板

用户将常用任务保存为模板，供团队复用。

```typescript
export interface TaskTemplateServerDTO {
  readonly uuid: string;
  readonly name: string;
  readonly description?: string;
  readonly category: 'work' | 'personal' | 'team';
  
  // 模板内容
  readonly titleTemplate: string;
  readonly checklist?: ChecklistItem[];
  readonly tags?: string[];
  readonly estimatedDuration?: number;
  
  readonly usageCount: number;
  readonly createdBy: string;
  readonly visibility: 'private' | 'team';
  readonly createdAt: number;
}
```

---

## 3. 内置模板

| 模板名称 | 检查项 | 适用场景 |
|---------|-------|---------|
| 周报撰写 | 5 项 | 工作总结 |
| Bug 修复 | 6 项 | 问题排查 |
| 代码评审 | 8 项 | 质量保证 |
| 新功能开发 | 10 项 | 功能迭代 |
| 会议准备 | 4 项 | 会议管理 |

---

## 4. MVP 范围

- ✅ 20 个内置模板
- ✅ 应用模板创建任务
- ✅ 自定义模板
- ✅ 团队模板共享

---

**文档状态**: ✅ Ready

