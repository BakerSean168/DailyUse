# Setting Module 测试快速运行指南

## 🚀 快速开始

### 一键运行所有测试

```bash
# 完整测试套件（推荐）
nx run-many --target=test:unit --projects=web,api && nx run api:test:e2e

# 或简化命令
pnpm test:all
```

---

## 📋 分类运行测试

### 前端单元测试

```bash
# 运行所有前端测试
nx run web:test:unit

# 运行 Setting 模块测试
nx run web:test:unit -- --grep "Setting"

# 运行特定文件
nx run web:test:unit -- useSettingPreview.test.ts
nx run web:test:unit -- useSettingImportExport.test.ts

# 监视模式（开发时实时运行）
nx run web:test:unit -- --watch
```

### 后端单元测试

```bash
# 运行所有后端单元测试
nx run api:test:unit

# 运行 Setting 模块测试
nx run api:test:unit -- --grep "Setting"

# 运行特定服务测试
nx run api:test:unit -- SettingCloudSyncService.test.ts

# 运行集成测试
nx run api:test:unit -- SettingController.integration.test.ts

# 监视模式
nx run api:test:unit -- --watch
```

### E2E 端到端测试

```bash
# 运行所有 E2E 测试
nx run api:test:e2e

# 运行 Setting E2E 测试
nx run api:test:e2e -- --grep "Setting"

# 运行特定 E2E 流程
nx run api:test:e2e -- setting-sync-e2e.test.ts

# 显示详细输出
nx run api:test:e2e -- --reporter=verbose

# 调试模式
nx run api:test:e2e -- --inspect-brk
```

---

## 📊 查看测试覆盖率

```bash
# 前端覆盖率
nx run web:test:unit -- --coverage

# 后端覆盖率
nx run api:test:unit -- --coverage

# 生成 HTML 报告
nx run web:test:unit -- --coverage --reporter=html
nx run api:test:unit -- --coverage --reporter=html
```

---

## 🔍 调试失败的测试

### 方法 1: 使用 Node Inspector

```bash
# 后端单元测试调试
nx run api:test:unit -- SettingCloudSyncService.test.ts --inspect-brk

# 然后在 Chrome 中打开: chrome://inspect
```

### 方法 2: 只运行一个测试

```bash
# 使用 .only
it.only('应该...', () => {})

# 或从命令行
nx run api:test:unit -- --grep "保存设置版本快照"
```

### 方法 3: 跳过测试

```bash
# 使用 .skip
it.skip('应该...', () => {})

# 或 .todo
it.todo('未来的测试')
```

---

## 📈 测试统计

```bash
# 显示测试摘要
nx run web:test:unit -- --reporter=verbose
nx run api:test:unit -- --reporter=verbose

# 获取覆盖率报告
nx run web:test:unit -- --coverage --reporter=default
```

---

## 🎯 常用命令速查表

| 命令 | 说明 | 执行时间 |
|-----|------|--------|
| `nx run web:test:unit` | 所有前端单元测试 | ~5s |
| `nx run api:test:unit` | 所有后端单元测试 | ~3s |
| `nx run api:test:e2e` | 所有 E2E 测试 | ~10s |
| `nx run web:test:unit -- --watch` | 前端监视模式 | 持续 |
| `nx run api:test:unit -- --coverage` | 后端覆盖率 | ~5s |
| `nx run api:test:unit -- --grep "Sync"` | 过滤测试 | 按需 |

---

## ✅ 测试检查清单

运行以下命令确保所有测试通过：

```bash
# 步骤 1: 运行前端单元测试
echo "🧪 运行前端单元测试..."
nx run web:test:unit

# 步骤 2: 运行后端单元测试
echo "🧪 运行后端单元测试..."
nx run api:test:unit

# 步骤 3: 运行 E2E 测试
echo "🧪 运行 E2E 测试..."
nx run api:test:e2e

# 步骤 4: 检查覆盖率
echo "📊 检查代码覆盖率..."
nx run web:test:unit -- --coverage
nx run api:test:unit -- --coverage

# 完成！
echo "✅ 所有测试完成！"
```

---

## 🐛 常见问题

### Q1: 测试超时怎么办？

```bash
# 增加超时时间
nx run api:test:e2e -- --testTimeout=60000
```

### Q2: 如何只运行一个测试套件？

```bash
# 运行单个描述块
nx run api:test:unit -- --grep "resolveConflict"
```

### Q3: 如何清除测试缓存？

```bash
# 删除缓存
rm -rf .vitest
nx run web:test:unit -- --clearCache
```

### Q4: 测试输出太多怎么办？

```bash
# 简化输出
nx run api:test:unit -- --reporter=dot

# 只显示摘要
nx run api:test:unit -- --reporter=tap
```

---

## 📁 测试文件位置

```
apps/web/src/modules/setting/
├── presentation/composables/__tests__/
│   ├── useSettingPreview.test.ts           (220+ 行, 15 测试)
│   └── useSettingImportExport.test.ts      (280+ 行, 18 测试)
└── ...

apps/api/src/modules/setting/
├── application/services/__tests__/
│   └── SettingCloudSyncService.test.ts     (420+ 行, 25 测试)
├── interface/http/__tests__/
│   └── SettingController.integration.test.ts (150+ 行, 12 测试)
└── __tests__/
    └── setting-sync-e2e.test.ts             (120+ 行, 8 测试)
```

---

## 🎬 实时监视模式（开发推荐）

### 开启多个终端标签

```bash
# 标签 1: 前端监视
nx run web:test:unit -- --watch

# 标签 2: 后端监视
nx run api:test:unit -- --watch

# 标签 3: 查看覆盖率
nx run web:test:unit -- --coverage
```

---

## 🚀 CI/CD 集成

### GitHub Actions 示例

创建 `.github/workflows/test.yml`:

```yaml
name: Test Setting Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install
        run: pnpm install
      
      - name: Unit Tests
        run: nx run web:test:unit && nx run api:test:unit
      
      - name: E2E Tests
        run: nx run api:test:e2e
      
      - name: Coverage
        run: nx run web:test:unit -- --coverage
```

---

## 📊 期望的输出示例

### 成功运行

```
✓ useSettingPreview (15)
  ✓ applyThemePreview
    ✓ 应该应用 DARK 主题类
    ✓ 应该应用 LIGHT 主题类
    ... (13 more tests)
  
  ✓ applyFontSizePreview
    ... (4 tests)
  
  ... (more suites)

Test Files  5 passed (5)
     Tests  78 passed (78)
```

### 失败示例

```
✗ resolveConflict
  ✗ 应该使用 merge 策略进行深度合并

Expected: {...}
Received: {...}

at resolveConflict.test.ts:123:15
```

---

## ⚡ 性能优化提示

### 并行运行测试

```bash
# 使用 nx run-many 并行运行
nx run-many --target=test:unit --projects=web,api --parallel
```

### 只运行改变的模块

```bash
# 只测试改变的文件
nx affected --target=test:unit
```

### 增量测试

```bash
# 跳过未改变的测试
nx run api:test:unit -- --changed
```

---

## 📝 日志记录

### 查看详细日志

```bash
# 详细模式
nx run api:test:unit -- --reporter=verbose

# 生成日志文件
nx run api:test:unit -- 2>&1 | tee test.log
```

---

## ✨ 总结

**最常用的三个命令：**

```bash
# 1. 快速检查
nx run web:test:unit && nx run api:test:unit

# 2. 完整测试
nx run web:test:unit && nx run api:test:unit && nx run api:test:e2e

# 3. 监视模式（开发）
nx run web:test:unit -- --watch
```

**目标：** ✅ 所有 78+ 个测试通过，覆盖率 > 90%

---

**最后更新**: 2025-11-06
**版本**: 1.0
**状态**: 就绪
