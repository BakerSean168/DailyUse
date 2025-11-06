# Setting Module - 快速开始指南

## �� 快速启动

### 1. 启动应用

```bash
# 启动 API 服务器（3888 端口）
cd /home/sean/my_program/DailyUse
pnpm nx run api:dev

# 启动 Web 应用（5173 端口）
pnpm nx run web:vite:dev
```

### 2. 启动数据库

```bash
# 启动 PostgreSQL Docker 容器
docker compose -f docker-compose.test.yml up -d

# 验证连接
pg_isready -U test_user -d dailyuse_test -h localhost -p 5433
```

### 3. 数据库初始化

```bash
# 迁移 Schema
cd apps/api
pnpm prisma db push

# 查看数据库状态
pnpm prisma studio
```

---

## 📝 API 使用示例

### 注册和登录

```bash
# 1. 注册用户
curl -X POST http://localhost:3888/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "Pass@123456"
  }'

# 2. 登录
RESPONSE=$(curl -s -X POST http://localhost:3888/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john",
    "password": "Pass@123456",
    "deviceInfo": {
      "deviceId": "dev-1",
      "deviceName": "My Device",
      "deviceType": "WEB",
      "platform": "Linux",
      "browser": "curl"
    },
    "ipAddress": "127.0.0.1"
  }')

# 3. 提取 token
TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
```

### 获取设置

```bash
curl -X GET http://localhost:3888/api/v1/settings/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq .
```

### 更新设置

```bash
# 更新主题为深色
curl -X PUT http://localhost:3888/api/v1/settings/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appearance": {
      "theme": "DARK"
    }
  }' | jq .

# 更新语言和时区
curl -X PUT http://localhost:3888/api/v1/settings/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locale": {
      "language": "en-US",
      "timezone": "America/New_York"
    }
  }' | jq .

# 更新多个设置
curl -X PUT http://localhost:3888/api/v1/settings/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appearance": {
      "theme": "LIGHT",
      "fontSize": "LARGE"
    },
    "locale": {
      "language": "zh-CN"
    },
    "workflow": {
      "autoSave": true,
      "autoSaveInterval": 60000
    }
  }' | jq .
```

### 获取默认设置

```bash
curl -X GET http://localhost:3888/api/v1/settings/defaults \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq .
```

### 重置为默认值

```bash
curl -X POST http://localhost:3888/api/v1/settings/reset \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq .
```

---

## 🎨 前端使用

### 访问设置页面

1. 打开 http://localhost:5173
2. 登录账户
3. 导航到 **设置** 或 **Preferences**
4. 选择需要配置的设置面板

### 可用的设置面板

| 面板 | URL | 说明 |
|------|-----|------|
| 外观设置 | /settings/appearance | 主题、字体、颜色 |
| 语言设置 | /settings/locale | 语言、时区、日期格式 |
| 工作流设置 | /settings/workflow | 默认视图、自动保存 |
| 快捷键设置 | /settings/shortcuts | 快捷键配置 |
| 隐私设置 | /settings/privacy | 隐私和可见性 |
| 通知设置 | /settings/notifications | 通知偏好 |
| 实验功能 | /settings/experimental | 测试功能 |
| 编辑器设置 | /settings/editor | 编辑器配置 |

---

## 🔧 配置选项

### 主题 (theme)
```
AUTO    - 跟随系统
LIGHT   - 亮色模式
DARK    - 深色模式
```

### 字体大小 (fontSize)
```
SMALL   - 小
MEDIUM  - 中（默认）
LARGE   - 大
```

### 语言 (language)
```
zh-CN   - 简体中文（默认）
en-US   - 英文（美国）
```

### 时区 (timezone)
```
所有 IANA 时区均支持
如: Asia/Shanghai, America/New_York, Europe/London
```

### 时间格式 (timeFormat)
```
12H     - 12 小时制
24H     - 24 小时制（默认）
```

### 资料可见性 (profileVisibility)
```
PRIVATE       - 私密（默认）
PUBLIC        - 公开
FRIENDS_ONLY  - 仅朋友
```

---

## 📊 数据库查询

### 查看用户的设置

```sql
SELECT uuid, accountUuid, appearanceTheme, 
       localeLanguage, localeTimezone, 
       createdAt, updatedAt 
FROM user_settings 
WHERE accountUuid = '你的账户UUID';
```

### 查看所有用户的设置统计

```sql
SELECT COUNT(*) as total_users,
       COUNT(DISTINCT appearanceTheme) as theme_variants,
       COUNT(DISTINCT localeLanguage) as language_variants
FROM user_settings;
```

### 查看最近修改的设置

```sql
SELECT accountUuid, appearanceTheme, 
       updatedAt 
FROM user_settings 
ORDER BY updatedAt DESC 
LIMIT 10;
```

---

## 🧪 测试

### 运行集成测试

```bash
cd apps/api

# 运行所有 Setting 测试
pnpm test -- --run src/modules/setting/tests/

# 运行特定测试
pnpm test -- --run src/modules/setting/tests/SettingApplicationService.integration.test.ts

# 运行时关闭 CI 模式（获得更详细的输出）
pnpm test src/modules/setting/tests/ --reporter=verbose
```

### 手动测试检查清单

- [ ] 创建新用户时自动生成默认设置
- [ ] 获取用户设置返回完整数据
- [ ] 部分更新只修改指定字段
- [ ] 重置后所有字段恢复默认值
- [ ] 默认设置与新用户设置一致
- [ ] 多用户之间设置隔离
- [ ] 无认证的请求返回 401
- [ ] 错误请求返回 400
- [ ] 不存在的用户重置返回错误

---

## 🐛 常见问题

### Q: 获取设置时返回 401？
A: 确保传递了有效的 Bearer token。使用 `Authorization: Bearer <token>` 格式。

### Q: 更新设置后没有生效？
A: 刷新页面或重新调用 GET /settings/me 端点获取最新数据。

### Q: 如何自定义默认值？
A: 编辑 `packages/domain-server/src/setting/aggregates/UserSettingServer.ts` 中的 `create()` 方法。

### Q: 支持哪些语言？
A: 当前支持 zh-CN 和 en-US。可在合约中添加更多语言。

### Q: 如何导出/导入设置？
A: 使用 GET /settings/me 获取 JSON，然后用 PUT /settings/me 导入。

---

## 📚 文件位置

| 文件 | 路径 |
|------|------|
| API 路由 | `apps/api/src/app.ts` (line 150) |
| 控制器 | `apps/api/src/modules/setting/interface/http/SettingController.ts` |
| 服务 | `apps/api/src/modules/setting/application/services/SettingApplicationService.ts` |
| 仓储 | `apps/api/src/modules/setting/infrastructure/repositories/PrismaUserSettingRepository.ts` |
| 领域模型 | `packages/domain-server/src/setting/aggregates/UserSettingServer.ts` |
| 合约 | `packages/contracts/src/modules/setting/setting.contracts.ts` |

---

## �� 相关资源

- [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
- [RESTful API Design](https://restfulapi.net/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vue 3 Guide](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**最后更新**: 2025-11-06
**版本**: 1.0.0
**状态**: ✅ Ready for Production
