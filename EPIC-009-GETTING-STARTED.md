# 🚀 EPIC-009 开发启动指南

## 📍 开始前的准备

### 1. 环境检查
```bash
# 确保已安装以下工具
node --version       # v18+ 推荐
pnpm --version      # 8.0+ 推荐
git --version       # 2.40+
```

### 2. 项目准备
```bash
cd d:\myPrograms\DailyUse

# 更新代码
git pull origin main

# 安装依赖
pnpm install

# 验证构建
pnpm build
```

### 3. 阅读关键文档
```
时间: 30 分钟

1. docs/sprint-artifacts/EPIC-009-summary.md (10 分钟)
   → 了解全局需求和工作量

2. docs/sprint-artifacts/EPIC-009-implementation-roadmap.md (10 分钟)
   → 了解实现计划和时间表

3. docs/sprint-artifacts/stories/STORY-043-sync-adapter-design.md (10 分钟)
   → 了解第一个故事的详细要求
```

---

## 📋 Day 1-2: STORY-043 开发准备

### 上午 (4h) - 接口设计

#### 任务 1: 创建文件结构
```bash
mkdir -p packages/application-client/src/sync/{interfaces,types,factory,errors}
touch packages/application-client/src/sync/interfaces/ISyncAdapter.ts
touch packages/application-client/src/sync/types/index.ts
touch packages/application-client/src/sync/factory/AdapterFactory.ts
touch packages/application-client/src/sync/errors/SyncError.ts
```

#### 任务 2: 实现 ISyncAdapter 接口
参考: [STORY-043-sync-adapter-design.md](./stories/STORY-043-sync-adapter-design.md) 中的代码示例

```bash
# 1. 复制 ISyncAdapter 完整代码
# 2. 复制所有类型定义
# 3. 复制 AdapterFactory 工厂类
# 4. 复制错误类定义
```

#### 任务 3: TypeScript 验证
```bash
pnpm tsc --noEmit

# 预期: 0 个错误
```

### 下午 (4h) - 类型检查和单元测试框架

#### 任务 4: 创建单元测试
```bash
touch packages/application-client/src/sync/__tests__/ISyncAdapter.test.ts
```

参考: STORY-055 中的测试示例

#### 任务 5: 验证代码
```bash
# 代码格式检查
pnpm lint packages/application-client/src/sync

# TypeScript 类型检查
pnpm tsc --noEmit

# 运行测试
pnpm test packages/application-client/src/sync
```

#### 任务 6: Git 提交
```bash
git add .
git commit -m "feat(epic-009): implement STORY-043 SyncAdapter interface"
git push origin feature/epic-009-story-043
```

### End of Day 2 检查清单
- [ ] ISyncAdapter 接口完整 (~400 行)
- [ ] 所有类型定义完整 (~600 行)
- [ ] AdapterFactory 工厂类完整 (~100 行)
- [ ] TypeScript 编译通过
- [ ] 单元测试框架建立
- [ ] 代码已提交到 git

---

## 🔐 STORY-044: 加密服务

### Day 3-4 任务清单

#### 上午 (4h)
```bash
# 创建文件
mkdir -p packages/infrastructure-client/src/encryption
touch packages/infrastructure-client/src/encryption/EncryptionService.ts
touch packages/infrastructure-client/src/encryption/EncryptionService.test.ts
```

参考: [STORY-044-encryption-service.md](./stories/STORY-044-encryption-service.md)

#### 关键实现点
```typescript
// 1. 导入 Node.js crypto
import crypto from 'crypto';

// 2. 实现 PBKDF2 密钥派生
// 3. 实现 AES-256-GCM 加密
// 4. 实现解密和校验
// 5. 实现密钥轮换
// 6. 实现流式加密 (可选，优先级较低)
```

#### 下午 (4h)
```bash
# 运行所有单元测试
pnpm test packages/infrastructure-client/src/encryption

# 性能测试
pnpm bench packages/infrastructure-client/src/encryption

# 确保加密 1MB 数据 < 100ms
```

### End of Day 4 检查清单
- [ ] EncryptionService 完整实现 (~300 行)
- [ ] 所有单元测试通过 (15+ 用例)
- [ ] 性能基准通过
- [ ] 密钥轮换功能测试
- [ ] 代码已提交

---

## 🌐 STORY-045: GitHub 适配器

### Day 6-8 任务清单

#### 前置条件
```bash
# 安装 Octokit
pnpm add @octokit/rest @types/node

# 创建 GitHub 测试仓库
# 1. 登录 GitHub
# 2. 创建私有仓库: dailyuse-sync-test
# 3. 生成 Personal Access Token
# 4. 保存为环境变量: GITHUB_TEST_TOKEN
```

#### Day 6 - 认证和基础操作
```typescript
// 实现 GitHubSyncAdapter 基础
class GitHubSyncAdapter extends BaseAdapter {
  // 1. 初始化 Octokit
  // 2. 实现 authenticate()
  // 3. 实现 checkHealth()
  // 4. 实现 ensureBaseDir()
}
```

#### Day 7 - Push/Pull 核心操作
```typescript
// 1. 实现 push() 方法
// 2. 实现 pull() 方法
// 3. 实现 batchPush() 方法
// 4. 实现冲突检测
```

#### Day 8 - 高级功能和测试
```typescript
// 1. 实现 getQuota()
// 2. 实现 exportAll() / importData()
// 3. 完整的单元测试
// 4. 集成测试
```

### 测试 GitHub 适配器
```bash
# 单元测试 (使用 mock)
pnpm test packages/infrastructure-client/src/adapters/GitHubSyncAdapter.test.ts

# 集成测试 (需要真实 token)
GITHUB_TEST_TOKEN=ghp_xxx pnpm test:integration

# 验证 API 调用
```

### End of Week 2 检查清单
- [ ] GitHubSyncAdapter 完整 (~350 行)
- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 性能测试通过
- [ ] GitHub API 限流处理正确

---

## 🎨 STORY-048: 配置向导 UI

### Day 11-12 任务清单

#### 前置条件
```bash
# 检查 React 版本
pnpm list react

# 检查 Tailwind/样式库
pnpm list tailwind-css
```

#### Day 11 - 向导框架和 Step 1-2
```bash
# 创建组件目录
mkdir -p apps/desktop/src/renderer/components/sync

# 创建文件
touch apps/desktop/src/renderer/components/sync/SyncConfigWizard.tsx
touch apps/desktop/src/renderer/components/sync/Step1SelectProvider.tsx
touch apps/desktop/src/renderer/components/sync/Step2Authentication.tsx
touch apps/desktop/src/renderer/components/sync/styles/wizard.module.css
```

参考: [STORY-048-sync-config-wizard.md](./stories/STORY-048-sync-config-wizard.md)

#### 关键需求
```typescript
// 1. 步骤导航逻辑
// 2. 平台选择卡片 (GitHub/Nutstore/Dropbox/Self-hosted)
// 3. 认证表单集成
// 4. 错误处理和反馈
// 5. 过渡动画 (Framer Motion)
```

#### Day 12 - Step 3-4 和样式
```bash
# 创建文件
touch apps/desktop/src/renderer/components/sync/Step3EncryptionKey.tsx
touch apps/desktop/src/renderer/components/sync/Step4SyncOptions.tsx

# 实现内容
# 1. 密码强度指示
# 2. 同步选项预览
# 3. 完整的样式表
# 4. 响应式设计
```

### 测试向导 UI
```bash
# 组件测试
pnpm test apps/desktop/src/renderer/components/sync

# Storybook 测试 (可选)
pnpm storybook

# 验证界面
```

### End of Week 3 检查清单
- [ ] SyncConfigWizard 完整 (~400 行 React)
- [ ] 所有 4 个 Step 组件完成
- [ ] 样式和主题支持完成
- [ ] 组件测试通过
- [ ] 无障碍检查通过

---

## 🧪 STORY-055: 集成测试

### Day 19-21 测试任务

#### 单元测试 (Day 19)
```bash
# 加密服务单元测试
pnpm test packages/infrastructure-client/src/encryption

# 适配器接口测试
pnpm test packages/application-client/src/sync

# 覆盖率检查
pnpm test:coverage

# 目标: > 85% 覆盖率
```

#### 集成测试 (Day 20)
```bash
# 创建集成测试套件
touch packages/infrastructure-client/src/adapters/__tests__/integration.test.ts

# 运行集成测试
GITHUB_TEST_TOKEN=xxx pnpm test:integration

# 验证:
# - Push/Pull 流程
# - 冲突检测
# - 批量操作
# - 网络错误重试
```

#### E2E 和性能测试 (Day 21)
```bash
# E2E 测试 (需要浏览器)
pnpm test:e2e apps/desktop/e2e/sync.e2e.test.ts

# 性能基准测试
pnpm bench packages/infrastructure-client/src

# 验证:
# - 加密 1MB < 100ms
# - 推送 100 项 < 5s
# - 拉取 1000 项 < 10s
```

### 测试检查清单
- [ ] 单元测试覆盖率 > 85%
- [ ] 所有集成测试通过
- [ ] E2E 测试通过
- [ ] 性能基准通过
- [ ] 安全测试通过

---

## 📝 开发工作流程

### 每日开发流程
```
1. 早晨 (9:00-12:00)
   - 查看今日任务清单
   - 编写代码
   - 运行本地测试
   
2. 午餐 (12:00-13:00)
   
3. 下午 (13:00-17:00)
   - 继续开发
   - 代码审查 (自己和团队)
   - 提交代码
   
4. 晚间 (17:00-18:00)
   - 文档更新
   - 明日计划
```

### 每个故事完成流程
```
1. 代码完成
   □ 所有功能实现
   □ 所有单元测试通过
   □ 代码覆盖率 > 80%

2. 代码审查
   □ 自我审查
   □ 检查编码规范
   □ 检查性能

3. 提交代码
   pnpm lint
   pnpm test
   git add .
   git commit -m "feat(epic-009): implement STORY-XXX"
   git push origin feature/epic-009-story-xxx

4. 创建 PR
   - 标题: "EPIC-009: Implement STORY-XXX"
   - 描述: 引用故事文件
   - 检查清单: 所有项都通过
```

---

## 🔗 重要资源

### 文档
- 📄 [EPIC-009 总结](./EPIC-009-summary.md)
- 📄 [实现路线图](./EPIC-009-implementation-roadmap.md)
- 📄 [所有故事](./stories/)
- 📄 [同步架构](../architecture/sync-provider-strategy.md)

### 环境变量
```bash
# .env 或 .env.local
GITHUB_TEST_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_TEST_REPO=your-username/dailyuse-sync-test
NUTSTORE_USERNAME=your-username
NUTSTORE_PASSWORD=your-password
DROPBOX_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

### 有用的命令
```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建项目
pnpm test                   # 运行测试
pnpm lint                   # 代码检查
pnpm test:coverage         # 覆盖率报告

# Git
git log --oneline           # 查看提交历史
git branch -a              # 查看所有分支
git status                 # 查看工作状态

# 调试
pnpm debug <script>        # 调试脚本
node --inspect             # Node 调试
```

---

## ⚠️ 常见问题

### Q: 如何处理 GitHub API 限流？
A: 在 GitHubSyncAdapter 中实现：
```typescript
// 批量操作时：
// 1. 分批处理 (每批 10 个)
// 2. 批次间延迟 (500ms)
// 3. 检查 API 限制
// 4. 显示警告给用户
```

### Q: 密钥管理的最佳实践？
A: 
```typescript
// 1. 密钥仅在内存中存储
// 2. 使用后立即清理 (fill(0))
// 3. 支持密钥轮换
// 4. 不要记录敏感信息
```

### Q: 如何测试冲突解决？
A: 
```typescript
// 1. 创建两个版本
// 2. 模拟服务端更新
// 3. 尝试推送旧版本
// 4. 验证冲突检测
// 5. 测试冲突解决
```

### Q: 加密性能不达标怎么办？
A:
```typescript
// 1. 检查 PBKDF2 参数 (可降低迭代次数)
// 2. 使用异步加密 (不阻塞 UI)
// 3. 使用流式加密 (大文件)
// 4. 考虑使用 Web Workers
```

---

## 📞 需要帮助？

### 文档
- 📖 查看 STORY 文件中的代码示例
- 📖 查看 implementation-roadmap.md 的详细计划
- 📖 查看 sync-provider-strategy.md 的架构

### 讨论
- 💬 GitHub Issues 讨论技术问题
- 💬 代码审查时提出问题
- 💬 Daily standup 讨论进度

### 资源
- 🔗 [Octokit 文档](https://octokit.github.io/)
- 🔗 [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- 🔗 [Node.js Crypto](https://nodejs.org/api/crypto.html)

---

## 🎯 成功指标

### Day 5 (Week 1 结束)
- ✅ STORY-043 完成
- ✅ STORY-044 完成
- ✅ 代码覆盖率 > 80%
- ✅ 无遗留错误

### Day 10 (Week 2 结束)
- ✅ STORY-045 完成
- ✅ STORY-046 完成
- ✅ STORY-047 完成
- ✅ GitHub API 集成测试通过

### Day 16 (Week 3 结束)
- ✅ STORY-048 完成
- ✅ STORY-049 完成
- ✅ STORY-050/051/052 完成
- ✅ 所有 UI 组件测试通过

### Day 21 (Week 4 结束)
- ✅ STORY-053 完成
- ✅ STORY-054 完成
- ✅ STORY-055 完成
- ✅ 代码覆盖率 > 85%
- ✅ 所有集成和 E2E 测试通过
- ✅ MVP 发布就绪

---

## 🚀 启动！

现在你已经准备好开始开发 EPIC-009 了！

**下一步**:
1. ✅ 阅读 EPIC-009-summary.md (10 分钟)
2. ✅ 阅读 EPIC-009-implementation-roadmap.md (10 分钟)
3. ✅ 阅读 STORY-043-sync-adapter-design.md (15 分钟)
4. 🚀 创建分支: `git checkout -b feature/epic-009-story-043`
5. 🚀 开始编码！

**预计周期**: 6-7 周交付 MVP
**开始日期**: 现在！
**预期结果**: 完整的云同步功能，所有测试通过

---

**祝你开发顺利！** 🎉

有任何问题，请参考文档或联系架构团队。

---

**最后更新**: 2024-01-XX  
**Git Hash**: 5e3d887c
