---
mode: agent
---

# DailyUse - 应用详细说明

## 阶段性

现在是开发阶段，核心功能已经初步完成，需要进行代码优化和完善，**实现优雅实现，让代码简洁优雅**，所以再修改时**不需要兼容，直接彻底修改**。

## 应用详细说明

### apps/web (Vue3 Web应用)

**技术栈**: Vue3 + TypeScript + Vite + Vue Router + Pinia + Vuetify

#### 模块结构

```bash
ModuleName/
├── presentation/                # 表示层
│   ├── views/                  # 页面视图
│   ├── components/             # 页面组件
│   ├── composables/            # 组合函数 (业务逻辑封装)
│   └── stores/                 # Pinia状态管理
├── application/                 # 应用层
│   └── services/               # 应用服务 (业务用例)
├── infrastructure/              # 基础设施层
│   └── api/                    # HTTP客户端实现
└── domain/                      # 领域层
    ├── services/               # 领域服务
    └── repositories/           # 仓储接口
```

#### 核心系统

**路由系统** (`apps/web/src/shared/router/`)

- **技术**: Vue Router 4 + TypeScript
- **特性**:
  - 路由守卫和权限管理
  - 认证状态检查
  - 页面标题管理
  - 嵌套路由和懒加载
  - 自动导航菜单生成

**路由权限管理**:

- `guards.ts`: 认证守卫、权限守卫、页面标题守卫
- `routes.ts`: 统一路由配置，支持元信息标记
- 支持 `requiresAuth`、`permissions`、`title`、`showInNav` 等元信息
- 自动重定向未认证用户到登录页
- 403/404/500 错误页面处理

**路由结构**:

```
/                               # 仪表盘 (需要认证)
├── /tasks/*                    # 任务管理模块
├── /goals/*                    # 目标管理模块
├── /reminders/*                # 提醒管理模块
├── /editor/*                   # 编辑器模块
├── /repositories/*             # 仓储管理模块
├── /account/*                  # 账户设置模块
├── /auth                       # 认证页面 (无需认证)
├── /unauthorized               # 无权限页面
├── /error                      # 错误页面
└── /404                        # 页面不存在
```

**API系统** (`apps/web/src/shared/api/`)

- **功能**: 统一的HTTP客户端管理
- **技术**: 基于Axios封装
- **特性**:
  - 请求/响应拦截器
  - 错误处理
  - 认证Token管理
  - 请求重试机制
  - **自动响应数据提取**：封装了标准API响应格式的自动解包

```bash
api/
├── core/
│   ├── client.ts              # Axios客户端封装
│   ├── interceptors.ts        # 拦截器配置
│   ├── config.ts              # 配置管理
│   └── types.ts               # 类型定义
├── instances/
│   └── index.ts               # 客户端实例
└── composables/
    ├── useAuth.ts             # 认证相关组合函数
    └── useRequest.ts          # 请求相关组合函数
```

#### API响应系统设计

**标准API响应格式**：

```typescript
// 后端统一返回格式
{
  "success": true,
  "data": {
    // 实际业务数据
    "GoalFolders": [...],
    "total": 2
  },
  "message": "Goal directories retrieved successfully"
}
```

**自动响应解包机制**：

```typescript
// core/client.ts 中的 extractData 方法
private extractData<T>(responseData: any): T {
  // 自动提取标准API响应中的 data 字段
  if (responseData && typeof responseData === 'object' && 'success' in responseData) {
    const apiResponse = responseData as SuccessResponse<T> | ErrorResponse;

    if (apiResponse.success === true) {
      return (apiResponse as SuccessResponse<T>).data; // 直接返回 data 内容
    } else {
      throw new Error(apiResponse.message || '请求失败');
    }
  }

  return responseData as T; // 非标准格式直接返回
}
```

**API客户端使用规范**：

```typescript
// ✅ 推荐使用方式
async getGoals(): Promise<GoalListResponse> {
  const data = await goalApiClient.getGoals();
  return data; // data 已经是解包后的业务数据
}

// ❌ 错误使用方式
async getGoals(): Promise<GoalListResponse> {
  const response = await goalApiClient.getGoals();
  return response.data; // 会导致 undefined，因为 data 已被自动提取
}
```

**响应数据流**：

```
后端API响应 → HTTP拦截器 → extractData() → 自动提取data字段 → 返回业务数据
{success, data, message} → 拦截处理 → 自动解包 → {GoalFolders, total} → 直接使用
```

**认证系统** (`src/modules/authentication/presentation/stores/`)

- **技术**: Pinia + 持久化插件（刷新自动重新认证还是用的 AuthManager 类，基于localStorage，因为 pinia 初始化太慢了）
- **功能**: 登录状态管理、Token管理、权限控制
- **特性**:
  - 自动Token刷新
  - 持久化存储
  - 认证状态同步
  - 路由权限集成

### apps/api (Express API服务)

**技术栈**: Node.js + Express + TypeScript + Prisma ORM

#### 模块结构

```bash
ModuleName/
├── interface/                   # 接口层
│   └── http/
│       ├── routes.ts           # 路由定义
│       ├── controller.ts       # 控制器
│       └── middlewares/        # 中间件
├── application/                 # 应用层
│   ├── services/               # 应用服务
│   ├── controllers/            # 应用控制器
│   └── events/                 # 事件处理
├── infrastructure/              # 基础设施层
│   ├── repositories/           # 仓储实现
│   │   └── prisma/             # Prisma实现
│   ├── di/                     # 依赖注入容器
│   └── validation/             # 数据验证
├── domain/                      # 领域层
│   └── services/               # 领域服务
└── initialization/              # 模块初始化
    └── moduleInitialization.ts
```

#### 核心特性

- **RESTful API**: 标准REST接口设计
- **数据库**: Prisma ORM + PostgreSQL/SQLite
- **认证**: JWT Token + 刷新Token机制
- **验证**: 请求参数验证和业务规则验证
- **错误处理**: 统一错误响应格式
- **依赖注入**: 模块化依赖管理

#### API路由规范

```
/api/v1/
├── /auth/*                     # 认证相关
├── /accounts/*                 # 账户管理
├── /tasks/*                    # 任务管理
└── /goals/*                    # 目标管理
```

#### 数据库结构

在 `apps/api/prisma/schema.prisma` 中定义，包含用户、任务、目标等核心表。

**要将数据展开来存储**

```
lifecycle: {
    createAt: '2024-01-01',
    updateAt: '2024-09-01',
    status: 'active'
}

- createAt
- updateAt
- status

不直接存储 JSON lifecycle，而是拆分成独立字段
```

**在仓储层内部实现DTO和展开数据的映射函数**

### apps/desktop (Electron + Vue3 桌面应用)

**技术栈**: Electron + Vue3 + TypeScript + Vite

#### 目录结构

```bash
apps/desktop/
├── index.html                  # 渲染进程入口 HTML
├── vite.config.ts             # Vite 配置
├── project.json               # Nx 项目配置
├── package.json               # 项目依赖
├── src/
│   ├── main/                  # 主进程
│   │   ├── main.ts           # 主进程入口
│   │   ├── modules/          # 业务模块
│   │   ├── shared/           # 共享功能
│   │   └── windows/          # 窗口管理
│   ├── preload/              # 预加载脚本
│   │   ├── main.ts          # 主预加载脚本
│   │   └── loginPreload.ts  # 登录预加载脚本
│   └── renderer/             # 渲染进程
│       ├── main.ts          # 渲染进程入口
│       ├── App.vue          # 根组件
│       ├── assets/          # 静态资源
│       ├── modules/         # 业务模块
│       ├── shared/          # 共享组件
│       └── views/           # 页面视图
└── dist-electron/            # 构建输出目录
```

**特性**:

- 多窗口管理
- 系统托盘
- 本地数据库 (better-sqlite3)
- 系统通知
- 定时提醒
- Nx 集成构建
