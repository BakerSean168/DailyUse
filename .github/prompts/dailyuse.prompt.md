---
mode: agent
---

Define the task to achieve, including specific requirements, constraints, and success criteria.

github/prompts 文件夹下的 prompt 文件

- dailyuse.applications.prompt.md: 应用详细说明
- dailyuse.architecture.prompt.md: 架构设计
- dailyuse.development.prompt.md: 开发规范
- dailyuse.migration.prompt.md: 迁移指南
- dailyuse.overview.prompt.md: 项目概述

## 项目环境

### api

- 运行在 3888 端口
- 接口样例`http://localhost:3888/api/v1/auth/register`, **有 api/v1 前缀**

### web

- 运行在 5173 端口

## 当前阶段



## 开发规范

1. 尽量使用 pnpm 命令
2. 测试接口时先模拟登录获取 token
   Account：Test1；
   Password：Llh123123

## API 配置规范

### axios 基础配置

- axios 实例已经预配置了 `http://localhost:3888/api/v1` 作为 baseURL
- **所有API客户端的 baseUrl 只需配置相对路径，不要重复添加 `/api/v1` 前缀**
- 示例：

  ```typescript
  // ✅ 正确
  private readonly baseUrl = '/schedules';

  // ❌ 错误 - 会导致重复路径 /api/v1/api/v1/schedules
  private readonly baseUrl = '/api/v1/schedules';
  ```

## API 响应结构规范

### 前端数据需求

所有 API 响应必须遵循以下结构，确保前端 axios 能正确获取所需数据：

```json
{
  "success": true,
  "data": {
    "reminders": [...], // 实际数据列表
    "total": 100,       // 总记录数
    "page": 1,          // 当前页码
    "limit": 50,        // 每页限制
    "hasMore": true,    // 是否有更多数据
    "query": "search"   // 搜索查询 (搜索接口专用)
  },
  "message": "操作成功"
}
```

### 关键要求

- **所有列表数据和分页信息必须放在 `data` 对象内**
- **不要在根级别放置 `total`、`limit`、`page` 等字段**
- axios 默认只返回 `response.data`，所以前端需要的所有信息都要在 `data` 字段中
- 确保分页、统计、查询等信息都嵌套在 `data` 对象内

## 新模块开发流程

1. **定义类型**: 在 `packages/contracts/src/modules/{module}` 下创建或更新类型定义
2. **核心逻辑**: 在 `packages/domain-core/src/{module}` 下实现核心抽象类
3. **服务端实现**: 在 `packages/domain-server/src/{module}` 下实现服务端业务逻辑
4. **客户端实现**: 在 `packages/domain-client/src/{module}` 下实现客户端状态管理
5. **前端集成**: 在 `apps/web/src/modules/{module}` 下集成前端组件和视图
6. **测试验证**: 编写测试脚本，确保各层功能正确
7. **文档更新**: 更新相关文档，确保使用说明完整
8. **代码审查**: 提交代码并进行审查，确保符合规范和质量要求
