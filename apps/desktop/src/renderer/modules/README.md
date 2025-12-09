# Desktop Renderer Modules

渲染进程业务模块 - 遵循 DDD 分层架构

## 架构概览

```
modules/
├── {module-name}/
│   ├── application/          # 应用层
│   │   ├── services/        # 应用服务（调用 Use Cases）
│   │   └── events/          # 事件处理器
│   ├── presentation/         # 展示层
│   │   ├── components/      # React 组件
│   │   ├── hooks/           # React Hooks（Composables）
│   │   ├── stores/          # 状态管理（Zustand）
│   │   └── views/           # 页面视图
│   ├── initialization/       # 模块初始化
│   │   └── index.ts         # 注册初始化任务
│   └── index.ts             # 模块导出入口
```

## 分层职责

### Application Layer（应用层）
- **ApplicationService**: 编排 Use Cases，不含业务逻辑
- 调用 `@dailyuse/application-client` 的 Use Cases
- 处理跨模块事件

### Presentation Layer（展示层）
- **Components**: 可复用的 React 组件
- **Hooks**: 封装状态和业务调用
- **Stores**: Zustand 状态管理（可选）
- **Views**: 页面级组件

### Initialization（初始化）
- 模块启动时的初始化逻辑
- 注册到 InitializationManager

## 依赖规则

```
Presentation → Application → @dailyuse/application-client → @dailyuse/infrastructure-client
```

- Presentation 只能调用 Application 层或直接调用 `@dailyuse/application-client`
- 禁止直接调用 Infrastructure 层（Container.getApiClient()）

## 模块列表

| 模块 | 描述 | 状态 |
|------|------|------|
| account | 账户管理 | 🚧 迁移中 |
| authentication | 认证授权 | 🚧 迁移中 |
| goal | 目标管理 | 📋 待迁移 |
| task | 任务管理 | 📋 待迁移 |
| schedule | 日程管理 | 📋 待迁移 |
| reminder | 提醒管理 | 📋 待迁移 |
| dashboard | 仪表盘 | 📋 待迁移 |
| ai | AI 功能 | 📋 待迁移 |
| notification | 通知管理 | 📋 待迁移 |
| repository | 仓库管理 | 📋 待迁移 |
| setting | 设置管理 | 📋 待迁移 |

## 使用示例

### 在组件中使用

```tsx
// ✅ 正确：使用模块导出的 Hook
import { useAccount } from '@/modules/account';

function ProfilePage() {
  const { account, loading, updateProfile } = useAccount();
  // ...
}

// ❌ 错误：直接调用 Infrastructure
import { AccountContainer } from '@dailyuse/infrastructure-client';

function ProfilePage() {
  const apiClient = AccountContainer.getInstance().getApiClient();
  // 违反分层原则！
}
```

### 模块初始化

```tsx
// main.tsx
import { initializeModules } from '@/modules';

async function bootstrap() {
  await initializeModules();
  // ...
}
```
