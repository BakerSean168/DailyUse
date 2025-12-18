# 📦 Release Workflow - 发布工作流最佳实践

## 概述

本项目使用 **GitHub Flow (Trunk-Based Development)** + **Release Please** 实现自动化版本发布。

> ⚠️ **重要**: 我们不使用传统的 Git Flow (main/develop/release 分支模型)，因为它与自动化发布工具不兼容。

---

## 🌳 分支策略

### GitHub Flow (推荐)

```
main (受保护的主干分支)
  ├── feat/login-system    # 功能分支
  ├── fix/memory-leak      # 修复分支
  ├── refactor/api-layer   # 重构分支
  └── docs/update-readme   # 文档分支
```

### 核心原则

1. **`main` 分支永远可部署**
   - 所有合并到 main 的代码都必须通过 CI 测试
   - Release Please 只监听 main 分支
   - 所有版本标签 (v1.0.0) 都在 main 上创建

2. **短生命周期的功能分支**
   - 从 main 创建 feat/xxx 或 fix/xxx 分支
   - 开发完成后提 PR 合并回 main
   - 合并后立即删除功能分支

3. **不要创建长期的 develop 分支**
   - ❌ 错误做法: feat → develop → main (多次合并，混乱的 commit 历史)
   - ✅ 正确做法: feat → main (原子化的 commit，清晰的版本历史)

---

## 🚀 发布流程

### 1. 日常开发 (积累变更)

```bash
# 1. 创建功能分支
git checkout -b feat/add-dark-mode main

# 2. 开发并提交 (使用 Conventional Commits)
git commit -m "feat(ui): add dark mode toggle"
git commit -m "fix(ui): dark mode button alignment"

# 3. 推送并创建 PR
git push origin feat/add-dark-mode
# 在 GitHub 上创建 PR to main

# 4. 合并 PR
# 点击 GitHub PR 页面的 "Merge" 按钮
```

### 2. Release Please 自动工作

当你合并 PR 到 main 后，Release Please 会自动：

1. **扫描 Commit 记录**
   ```
   feat(ui): add dark mode toggle        → 触发 minor 版本升级 (0.1.10 → 0.2.0)
   fix(api): memory leak in websocket    → 触发 patch 版本升级 (0.1.10 → 0.1.11)
   feat!: breaking API changes           → 触发 major 版本升级 (0.1.10 → 1.0.0)
   ```

2. **创建/更新 Release PR**
   - PR 标题: `chore(main): release 0.2.0`
   - 自动更新 20 个 package.json 的版本号
   - 自动生成 CHANGELOG.md
   - 每次新合并都会更新这个 PR

3. **等待你决定发布时机**
   - Release PR 会持续积累变更
   - 你可以继续开发和合并其他功能
   - 想发布时，合并 Release PR

### 3. 正式发布 (一键完成)

```bash
# 1. 在 GitHub 上合并 Release PR
# 点击 "chore(main): release 0.2.0" PR 的 Merge 按钮

# 2. Release Please 自动执行:
# - 在 main 上打标签 v0.2.0
# - 创建 GitHub Release 页面
# - 填入自动生成的 Changelog

# 3. Release Workflow 自动触发:
# - 检测到 v0.2.0 标签
# - 构建 Windows/macOS/Linux 安装包
# - 上传到 Release 页面 (不覆盖 Changelog)
```

### 4. 最终结果

用户访问 GitHub Release 页面时看到：

```markdown
## v0.2.0 (2025-12-18)

### Features

* **ui**: add dark mode toggle (#123) (abc1234)
* **api**: add real-time sync support (#125) (def5678)

### Bug Fixes

* **api**: memory leak in websocket (#124) (ghi9012)

### Downloads

- DailyUse-0.2.0-Setup.exe (Windows)
- DailyUse-0.2.0.dmg (macOS)
- DailyUse-0.2.0.AppImage (Linux)
```

---

## 📝 Commit 规范 (Conventional Commits)

Release Please 依赖规范的 commit message 来判断版本升级类型：

### 基础格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Type 类型

| Type | 说明 | 版本影响 |
|------|------|----------|
| `feat` | 新功能 | **minor** (0.1.0 → 0.2.0) |
| `fix` | Bug 修复 | **patch** (0.1.0 → 0.1.1) |
| `feat!` | 破坏性变更 | **major** (0.1.0 → 1.0.0) |
| `docs` | 文档修改 | 无 |
| `style` | 代码格式 | 无 |
| `refactor` | 重构 | 无 |
| `perf` | 性能优化 | **patch** |
| `test` | 测试 | 无 |
| `chore` | 构建工具 | 无 |

### Scope 范围 (可选)

根据模块划分：

```bash
feat(goal): add goal priority filter
fix(task): recurring task timezone bug
feat(api): add GraphQL support
```

### 示例

```bash
# 新功能 (minor 升级)
git commit -m "feat(reminder): add snooze functionality"

# Bug 修复 (patch 升级)
git commit -m "fix(sync): resolve conflict merge strategy"

# 破坏性变更 (major 升级)
git commit -m "feat(api)!: change REST API to GraphQL

BREAKING CHANGE: All REST endpoints are removed. Use GraphQL API instead."

# 不影响版本的提交
git commit -m "docs: update installation guide"
git commit -m "chore: upgrade dependencies"
```

---

## ⚙️ 配置文件说明

### 1. Release Please 配置

**`release-please-config.json`** - 定义发布策略

```json
{
  "packages": {
    ".": { "release-type": "node", "package-name": "daily-use" },
    "apps/api": { "release-type": "node", "package-name": "@dailyuse/api" },
    "apps/web": { "release-type": "node", "package-name": "@dailyuse/web" },
    // ... 其他 17 个包
  }
}
```

**`.release-please-manifest.json`** - 版本追踪文件

```json
{
  ".": "0.1.10",
  "apps/api": "0.1.10",
  "apps/web": "0.1.10",
  // ... 其他包的当前版本
}
```

### 2. GitHub Actions Workflow

**`.github/workflows/release-please.yml`**

```yaml
on:
  push:
    branches: [main]  # 只监听 main 分支

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

**`.github/workflows/release.yml`**

```yaml
on:
  push:
    tags: ['v[0-9]+.[0-9]+.[0-9]+']  # 监听版本标签

jobs:
  build-and-release:
    # 构建 Windows/macOS/Linux 安装包

  upload-assets:
    # 上传构建产物到 Release 页面
    # ⚠️ 不创建新 Release，避免覆盖 Release Please 的 Changelog
```

---

## 🔧 常见问题

### Q1: 如何回滚错误的发布？

```bash
# 1. 在 GitHub Release 页面删除错误的 Release
# 2. 删除本地和远程标签
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# 3. 如果版本号已经更新到 package.json
git revert <commit-hash>  # 回滚 Release PR 的合并
```

### Q2: 如何发布 Pre-release (Beta/Alpha)?

修改 `release-please-config.json`:

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "prerelease": true,
      "prerelease-type": "beta"
    }
  }
}
```

### Q3: 如何跳过某次提交不触发版本更新？

在 commit message 中添加:

```bash
git commit -m "chore: update README [skip ci]"
```

### Q4: Release Please PR 一直不出现？

检查：

1. Commit message 是否符合 Conventional Commits 规范
2. 是否合并到了 main 分支
3. GitHub Action 是否运行成功
4. `release-please-config.json` 配置是否正确

### Q5: 如何测试 Release Workflow 不发布？

```bash
# 1. 创建测试标签 (不推送)
git tag v0.0.0-test

# 2. 本地测试构建
pnpm run build

# 3. 删除测试标签
git tag -d v0.0.0-test
```

---

## 📚 参考资源

- [Release Please 官方文档](https://github.com/googleapis/release-please)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [GitHub Flow 最佳实践](https://docs.github.com/en/get-started/using-github/github-flow)
- [Semantic Versioning](https://semver.org/)

---

## ✅ Checklist

**开发阶段:**

- [ ] 使用 Conventional Commits 格式提交
- [ ] 功能完成后提 PR 到 main
- [ ] 确保 CI 测试通过
- [ ] Code Review 通过后合并

**发布阶段:**

- [ ] 检查 Release Please PR 的 Changelog
- [ ] 确认版本号正确 (major/minor/patch)
- [ ] 合并 Release Please PR
- [ ] 等待 Release Workflow 完成构建
- [ ] 测试 GitHub Release 页面的下载链接
- [ ] 通知用户更新可用

---

**最后更新**: 2025-12-18
**维护者**: @bakersean
