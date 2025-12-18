# 🚀 快速开始 - Release 工作流

## TL;DR (太长不看版)

```bash
# 1. 创建功能分支
git checkout -b feat/my-feature main

# 2. 开发并提交 (使用规范格式)
git commit -m "feat: add awesome feature"

# 3. 推送并提 PR 到 main
git push origin feat/my-feature
# 在 GitHub 创建 PR → 合并

# 4. Release Please 自动创建/更新 Release PR
# 等待积累足够功能后，合并 Release PR

# 5. 自动发布完成！
# - 版本标签自动创建
# - Changelog 自动生成
# - 安装包自动构建并上传
```

## ✅ 核心要点

1. **只有一个主分支**: `main`
2. **短生命周期分支**: `feat/xxx` → PR → `main` → 删除
3. **规范提交格式**: `feat:` `fix:` `feat!:`
4. **合并 Release PR 即发布**: 一键完成版本更新

## 📖 详细文档

完整工作流说明: [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)

## 🎯 Commit 格式速查

| 格式 | 用途 | 版本影响 |
|------|------|----------|
| `feat: xxx` | 新功能 | 0.1.0 → 0.2.0 |
| `fix: xxx` | Bug 修复 | 0.1.0 → 0.1.1 |
| `feat!: xxx` | 破坏性变更 | 0.1.0 → 1.0.0 |
| `docs: xxx` | 文档 | 无 |
| `chore: xxx` | 杂项 | 无 |

## ❓ 常见问题

**Q: 为什么没有 develop 分支？**
A: GitHub Flow 更简单、更适合自动化发布。详见文档。

**Q: 如何测试不发布？**
A: 在功能分支测试，只有合并到 main 才会触发发布流程。

**Q: Release PR 什么时候合并？**
A: 随时！积累够功能就合并，Release Please 会自动处理版本号。

---

**完整文档**: [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)
