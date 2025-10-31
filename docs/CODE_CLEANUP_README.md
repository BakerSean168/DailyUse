# 代码错误清理计划 - 使用指南

## 📁 文件说明

### 1. `CODE_ERROR_CLEANUP_PLAN.md`
**详细执行计划** - 包含完整的 3 周清理计划

- 📊 错误统计分析
- 🎯 分阶段清理策略
- 📋 每日详细任务清单
- 🛠️ 工具和脚本说明
- 📝 注意事项和最佳实践

### 2. `CODE_CLEANUP_PROGRESS.yaml`
**进度追踪文件** - YAML 格式，用于记录实时进度

- 基线和当前错误数
- 每日工作记录
- 里程碑追踪
- 任务完成状态

### 3. `tools/scripts/validate-types.sh`
**自动化验证脚本** - 检查 TypeScript 错误

- 统计 Web 端和 API 端错误数
- 按模块分组显示错误
- 按错误类型分组统计
- 进度可视化

---

## 🚀 快速开始

### 1. 运行类型检查
```bash
# 使用验证脚本（推荐）
bash tools/scripts/validate-types.sh

# 或手动检查 Web 端
npx tsc --noEmit --project apps/web/tsconfig.json

# 或手动检查 API 端
npx tsc --noEmit --project apps/api/tsconfig.json
```

### 2. 查看当前进度
```bash
# 查看进度追踪文件
cat docs/CODE_CLEANUP_PROGRESS.yaml

# 或使用编辑器打开
code docs/CODE_CLEANUP_PROGRESS.yaml
```

### 3. 开始清理工作
1. 阅读 `CODE_ERROR_CLEANUP_PLAN.md` 了解详细计划
2. 按照计划执行每天的任务
3. 完成后更新 `CODE_CLEANUP_PROGRESS.yaml`
4. 运行验证脚本确认进度

---

## 📝 工作流程

### 每日工作流程

#### 步骤 1: 查看当天任务
```bash
# 打开计划文档
code docs/CODE_ERROR_CLEANUP_PLAN.md
# 找到对应的 Day X 部分
```

#### 步骤 2: 执行任务
按照计划执行当天的任务，例如 Day 1:
```bash
# 1. 分析错误
npx tsc --noEmit --project apps/api/tsconfig.json 2>&1 | grep "modules/document"

# 2. 修复代码
# 编辑相关文件...

# 3. 验证修复
npx tsc --noEmit --project apps/api/tsconfig.json

# 4. 提交代码
git add .
git commit -m "fix(document): 修复 Document 模块类型错误 (Day 1)"
```

#### 步骤 3: 更新进度
编辑 `docs/CODE_CLEANUP_PROGRESS.yaml`:
```yaml
  day_1:
    date: 2025-11-01  # 更新日期
    sprint: 1.1
    module: Document (API)
    errors_before: 106
    errors_after: 0  # 更新结果
    errors_fixed: 106  # 计算修复数
    time_spent: 5.5h  # 记录耗时
    status: completed  # 更新状态
    tasks:
      - task: "分析 DocumentContracts 导出问题"
        status: completed  # 更新任务状态
      - task: "修复 Document.ts domain 类型"
        status: completed
      # ... 其他任务
    notes: |
      - 主要问题是 Contracts 缺少导出
      - Document domain 缺少两个必需属性
      - Repository 映射需要添加新字段
```

#### 步骤 4: 更新当前统计
更新 `CODE_CLEANUP_PROGRESS.yaml` 的 current 部分:
```yaml
current:
  date: 2025-11-01
  web_errors: 389
  api_errors: 366  # 472 - 106 = 366
  total_errors: 755  # 861 - 106 = 755
  progress_percentage: 12%  # 106/861 ≈ 12%
```

#### 步骤 5: 验证进度
```bash
# 运行验证脚本
bash tools/scripts/validate-types.sh

# 应该看到错误数减少
```

---

## 📊 进度追踪示例

### Week 1 进度示例
```yaml
week_1:
  target_errors_fixed: 430
  target_percentage: 50%
  actual_errors_fixed: 453
  actual_percentage: 52.6%
  status: completed
  
  day_1:
    date: 2025-11-01
    module: Document (API)
    errors_fixed: 106
    time_spent: 5.5h
    status: completed
  
  day_2:
    date: 2025-11-02
    module: Document (Web) + Task (API 开始)
    errors_fixed: 45
    time_spent: 5.5h
    status: completed
  
  # ... 其他天
```

### 里程碑示例
```yaml
milestones:
  milestone_1:
    name: "Week 1 完成"
    target_date: 2025-11-08
    target_progress: 50%
    target_errors_fixed: 430
    actual_date: 2025-11-07  # 提前完成！
    actual_progress: 52.6%
    actual_errors_fixed: 453
    status: completed  # ✅
```

---

## 🛠️ 常用命令

### 错误检查
```bash
# 完整检查（推荐）
bash tools/scripts/validate-types.sh

# 检查特定模块
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "modules/task"

# 统计错误数
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "error TS" | wc -l

# 按模块统计
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "error TS" | grep -oE "apps/web/src/modules/[^/]+" | sort | uniq -c | sort -rn

# 按错误类型统计
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep "error TS" | grep -oE "TS[0-9]+" | sort | uniq -c | sort -rn
```

### 代码提交
```bash
# 每完成一个文件/组件
git add <file>
git commit -m "fix(module): 修复某个具体问题"

# 每完成一个模块
git add .
git commit -m "fix(module): 完成 Module 模块类型修复 (Day X)"
git push

# 每完成一周
git tag -a "v0.x-week1-cleanup" -m "Week 1 清理完成: 修复 430 错误"
git push --tags
```

### 进度查看
```bash
# 查看总进度
cat docs/CODE_CLEANUP_PROGRESS.yaml | grep -A 5 "^current:"

# 查看某周进度
cat docs/CODE_CLEANUP_PROGRESS.yaml | grep -A 50 "^week_1:"

# 查看里程碑
cat docs/CODE_CLEANUP_PROGRESS.yaml | grep -A 30 "^milestones:"
```

---

## 📈 进度可视化

### 命令行进度条
可以创建一个简单的进度脚本：

```bash
# tools/scripts/show-progress.sh
#!/bin/bash

BASELINE=861
CURRENT=$(bash tools/scripts/validate-types.sh 2>&1 | grep "总错误数:" | awk '{print $3}')
FIXED=$((BASELINE - CURRENT))
PERCENTAGE=$((FIXED * 100 / BASELINE))

echo "================================"
echo "🎯 代码清理进度"
echo "================================"
echo "基线错误数: $BASELINE"
echo "当前错误数: $CURRENT"
echo "已修复: $FIXED ($PERCENTAGE%)"
echo ""
echo -n "进度: ["
for i in {1..50}; do
    if [ $i -le $((PERCENTAGE / 2)) ]; then
        echo -n "█"
    else
        echo -n "░"
    fi
done
echo "] $PERCENTAGE%"
echo "================================"
```

---

## ⚠️ 注意事项

### DO ✅
1. **按计划执行**: 按照 Day 1 → Day 2 → ... 的顺序
2. **小步提交**: 每修复一个文件就提交
3. **写注释**: 在 progress.yaml 中记录遇到的问题
4. **运行验证**: 每完成一个模块就运行验证脚本
5. **更新文档**: 同步更新类型定义文档

### DON'T ❌
1. **跳过验证**: 不要在没验证的情况下继续下一个模块
2. **跨模块修改**: 一次只处理一个模块
3. **忽略测试**: 修复后要运行相关测试
4. **遗漏记录**: 不要忘记更新 progress.yaml
5. **大批量提交**: 避免一次提交太多文件

---

## 🎯 成功标准

### 每日完成标准
- ✅ 当日计划任务全部完成
- ✅ 错误数按预期减少
- ✅ 类型检查通过
- ✅ 相关测试通过
- ✅ 代码已提交
- ✅ 进度已记录

### 每周完成标准
- ✅ 达到该周目标错误修复数
- ✅ 所有模块验证通过
- ✅ 里程碑标记为 completed
- ✅ 创建 week tag
- ✅ 更新文档

### 最终完成标准
- ✅ Web 端: 0 错误
- ✅ API 端: 0 错误
- ✅ ESLint: 0 错误
- ✅ 所有测试通过
- ✅ 文档更新完成
- ✅ 代码审查通过

---

## 🆘 遇到问题？

### 错误修复困难
1. 查看 `CODE_ERROR_CLEANUP_PLAN.md` 的"常见陷阱"部分
2. 检查类似模块的修复方式
3. 查看 DTO 定义和 Domain 层类型
4. 使用 IDE 的类型提示

### 进度落后
1. 检查是否有 blocker
2. 调整每日任务量
3. 寻求技术支持
4. 考虑并行处理某些独立模块

### 回滚代码
```bash
# 回到上一个 commit
git reset --hard HEAD~1

# 回到某个 tag
git reset --hard v0.x-week1-cleanup

# 创建回滚分支保留当前工作
git checkout -b backup-branch
git checkout main
git reset --hard <commit>
```

---

## 🎉 完成庆祝

当达到 0 错误时：

```bash
# 运行最终验证
bash tools/scripts/validate-types.sh
# 应该看到: ✅ 恭喜！达到 0 错误！🎉

# 创建完成 tag
git tag -a "v1.0-zero-errors" -m "🎉 达到 0 TypeScript 错误！"
git push --tags

# 更新最终里程碑
# 编辑 CODE_CLEANUP_PROGRESS.yaml
milestones:
  milestone_4:
    name: "达到 0 错误"
    actual_date: 2025-11-XX
    actual_progress: 100%
    actual_errors_fixed: 861
    status: completed  # 🎉
```

---

**开始日期**: 2025-11-01 (预计)  
**目标日期**: 2025-11-21  
**总工时**: 42-61 小时  
**预期结果**: 0 TypeScript 错误 🎯
