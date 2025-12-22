# E2E 测试配置说明

## 📝 配置文件位置

所有 E2E 测试的配置都集中在：

```
/apps/web/e2e/config.ts
```

## �� 为什么需要配置文件？

在这个文件中定义了：
- ✅ **API 地址和端口** (3888, /api/v1)
- ✅ **Web 应用地址** (5173)
- ✅ **所有页面路径** (/auth, /goals 等)
- ✅ **超时配置**
- ✅ **测试用户信息**

**永远不要**在测试文件中硬编码这些值！

## 🔧 配置内容

### API 配置

```typescript
import { API_CONFIG } from './config';

// API 基础 URL: http://localhost:3888
API_CONFIG.BASE_URL

// API 前缀: /api/v1
API_CONFIG.API_PREFIX

// 完整 API URL: http://localhost:3888/api/v1
API_CONFIG.FULL_URL

// 健康检查: http://localhost:3888/healthz
// 就绪检查: http://localhost:3888/readyz
// 应用信息: http://localhost:3888/info
```

### Web 配置

```typescript
import { WEB_CONFIG } from './config';

// Web 基础 URL: http://localhost:5173
WEB_CONFIG.BASE_URL

// 登录页: /auth
WEB_CONFIG.LOGIN_PATH

// Goals 页: /goals
WEB_CONFIG.GOALS_PATH

// 获取完整 URL
WEB_CONFIG.getFullUrl('/goals')  // → http://localhost:5173/goals
```

### 超时配置

```typescript
import { TIMEOUT_CONFIG } from './config';

TIMEOUT_CONFIG.NAVIGATION      // 30000ms - 页面导航
TIMEOUT_CONFIG.ELEMENT_WAIT    // 10000ms - 元素等待
TIMEOUT_CONFIG.LOGIN           // 15000ms - 登录操作
TIMEOUT_CONFIG.SHORT_WAIT      // 500ms   - 短暂等待
TIMEOUT_CONFIG.MEDIUM_WAIT     // 1000ms  - 中等等待
TIMEOUT_CONFIG.LONG_WAIT       // 3000ms  - 长时间等待
```

### 测试用户

```typescript
import { TEST_USERS } from './config';

TEST_USERS.MAIN       // testuser / Test123456!
TEST_USERS.SECONDARY  // testuser2 / Test123456!
TEST_USERS.ADMIN      // admintest / Admin123456!
```

## 📚 使用示例

### ❌ 错误写法（硬编码）

```typescript
// 不要这样！
await page.goto('http://localhost:5173/goals');
await page.goto('http://localhost:3000/healthz');
await page.waitForTimeout(1000);
```

### ✅ 正确写法（使用配置）

```typescript
import { WEB_CONFIG, API_CONFIG, TIMEOUT_CONFIG } from '../config';

// 导航到 Goals 页面
await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.GOALS_PATH));

// 等待
await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

// 在 test helper 中验证 API
const healthUrl = `${API_CONFIG.FULL_URL}${API_CONFIG.HEALTH_ENDPOINT}`;
```

## 🌍 环境变量覆盖

可以通过环境变量覆盖默认配置：

```bash
# 自定义 API 地址
E2E_API_BASE_URL=http://192.168.1.100:3888 npm run e2e

# 自定义 Web 地址
E2E_WEB_BASE_URL=http://192.168.1.100:5173 npm run e2e

# 启用详细日志
E2E_VERBOSE=true npm run e2e
```

## 🎯 最佳实践

1. **永远使用配置常量**
   - 不要硬编码任何 URL、端口或超时值

2. **添加新配置时**
   - 更新 `/apps/web/e2e/config.ts`
   - 添加 JSDoc 注释说明用途
   - 提供合理的默认值

3. **调试时**
   - 使用 `printConfig()` 查看当前配置
   ```typescript
   import { printConfig } from '../config';
   printConfig();
   ```

## 🚨 常见错误

### 错误 1: "API 服务器未运行"
检查 API 是否在正确端口运行：
```bash
curl http://localhost:3888/api/v1/health
```

### 错误 2: "Cannot navigate to invalid URL"
确保使用 `WEB_CONFIG.getFullUrl()` 而不是相对路径：
```typescript
// ❌ 错误
await page.goto('/goals');

// ✅ 正确
await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.GOALS_PATH));
```

### 错误 3: "Login failed"
1. 确认 API 服务器在运行
2. 确认测试用户已创建: `pnpm test:seed`
3. 检查 API URL 配置是否正确

## 📖 相关文档

- [E2E 测试故障排除](/docs/E2E_TEST_TROUBLESHOOTING.md)
- [测试用户种子脚本](/tools/test/README.md)
- [Playwright 配置](/apps/web/playwright.config.ts)
