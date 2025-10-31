# 代码错误清理 - 快速参考

## 📊 当前状态
- **总错误数**: 735 (Web: 369, API: 366)
- **跳过模块**: Document (126 错误) - 等待重构
- **目标**: 0 错误 (不含 Document)
- **预计时间**: 2.5 周 (35-50 小时)
- **开始日期**: 2025-11-01 (预计)
- **起始模块**: Task 模块 (183 错误)

## 🎯 2.5 周计划概览

### Week 1: 核心模块 (47% 目标)
- Day 1: Task (API 分析) - 88 错误
- Day 2: Task (API 完成 + Web 开始) - 88 错误
- Day 3: Task (Web 完成) - 95 错误
- Day 4: Setting - 73 错误
- Day 5-6: Goal - 91 错误
- **目标**: 修复 347 错误 (47%)

### Week 2: 次要模块 (78% 目标)
- Day 7-8: Notification + Reminder - 144 错误
- Day 9: Repository + Schedule - 79 错误
- **目标**: 再修复 223 错误 (累计 78%)

### Week 3: 收尾清理 (100% 目标)
- Day 10: Authentication + Account - 87 错误
- Day 11: Editor + 其他 - 14 错误
- Day 12: 全局验证 - 达到 0 错误
- **目标**: 修复剩余 165 错误 (累计 100%)

**备注**: Document 模块 (126 错误) 跳过，等待重构

## 🔧 常用命令速查

```bash
# 运行验证脚本
bash tools/scripts/validate-types.sh

# 检查 Web 端
npx tsc --noEmit --project apps/web/tsconfig.json

# 检查 API 端
npx tsc --noEmit --project apps/api/tsconfig.json

# 检查特定模块
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "modules/task"

# 统计错误
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "error TS" | wc -l

# 提交代码
git add .
git commit -m "fix(module): 描述"
git push
```

## 📋 每日工作流

1. **查看任务**: 打开 `CODE_ERROR_CLEANUP_PLAN.md`
2. **执行修复**: 按计划修复错误
3. **验证结果**: 运行 `validate-types.sh`
4. **更新进度**: 编辑 `CODE_CLEANUP_PROGRESS.yaml`
5. **提交代码**: git commit & push

## 📁 关键文件

- `docs/CODE_ERROR_CLEANUP_PLAN.md` - 详细计划
- `docs/CODE_CLEANUP_PROGRESS.yaml` - 进度追踪
- `docs/CODE_CLEANUP_README.md` - 使用指南
- `tools/scripts/validate-types.sh` - 验证脚本

## 🎯 优先级模块

### P0 (最高) - Week 1 优先
- **Task (183 错误)** ⭐ 从这里开始！
- Setting (73 错误)
- Goal (91 错误)

### P1 (高) - Week 2
- Notification (86 错误)
- Repository (79 错误)
- Reminder (58 错误)

### P2 (中) - Week 2
- Reminder (58 错误)
- Authentication (62 错误)

### P3 (低) - Week 3
- Account (25 错误)
- Editor (14 错误)
- 其他 (14 错误)

### ⏭️ 跳过 (待重构)
- **Document (126 错误)** - 需要架构重构，暂时跳过

## 🚨 常见错误类型

| 代码 | 数量 | 解决方案 |
|------|------|----------|
| TS2339 | 145 | 更新类型定义 |
| TS2694 | 55 | 修复 Contracts 导出 |
| TS2724 | 32 | 修正导入方式 |
| TS2304 | 25 | 添加类型导入 |
| TS7006 | 20 | 添加类型注解 |

## ✅ 成功标准

- [ ] Web 端: 0 错误
- [ ] API 端: 0 错误
- [ ] ESLint: 0 错误
- [ ] 所有测试通过
- [ ] 文档更新完成

## 🎉 里程碑

- [ ] Week 1 完成: 47% (347/735)
- [ ] Week 2 完成: 78% (570/735)
- [ ] Week 3 完成: 100% (735/735) 🎯 不含 Document

---

**快速开始**: `bash tools/scripts/validate-types.sh`  
**详细文档**: `docs/CODE_ERROR_CLEANUP_PLAN.md`  
**进度追踪**: `docs/CODE_CLEANUP_PROGRESS.yaml`
