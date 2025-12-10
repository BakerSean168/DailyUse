/**
 * Desktop 应用重构计划
 * 
 * 目标：整理散落的代码，统一放入 shared 和 modules
 * 参考：API 和 Web 项目的架构
 */

// ============================================
// 当前结构（需要整理）
// ============================================

/*
apps/desktop/src/main/
├── database/                      ← 应该拆散到各模块
├── di/                           ← 应该集中到 infrastructure 初始化
├── events/                       ← 应该放入 shared
├── ipc/                          ← 应该拆散到各模块的 ipc 文件夹
├── services/                     ← 应该拆散到各模块
├── utils/                        ← 应该放入 shared/utils
├── account/                      ← 模块文件夹位置正确
├── ai/                           ← 模块文件夹位置正确
├── ... 其他模块
├── shared/                       ← 共享层（需要完善）
├── modules/                      ← 模块集合（已有框架）
├── main.ts                       ← 入口文件
└── ... 配置文件
*/

// ============================================
// 目标结构（重构后）
// ============================================

/*
apps/desktop/src/main/
├── shared/
│   ├── initialization/           ← 应用级初始化管理（新增）
│   │   ├── initializer.ts        ← 统一注册所有模块初始化任务
│   │   ├── infraInitialization.ts ← 基础设施初始化
│   │   └── index.ts
│   │
│   ├── infrastructure/            ← 基础设施实现
│   │   ├── database/             ← 数据库连接/初始化
│   │   ├── containers/           ← DI Container
│   │   ├── ipc/                  ← 统一 IPC 管理（ipc-registry.ts）
│   │   ├── config/               ← 应用配置
│   │   └── index.ts
│   │
│   ├── utils/                    ← 工具函数
│   │   ├── logger.ts
│   │   └── index.ts
│   │
│   ├── types/                    ← 共享类型定义
│   └── index.ts
│
├── modules/
│   ├── shared/                   ← 模块共享部分
│   │   ├── application/          ← 共享 Facade 基类
│   │   └── infrastructure/       ← 共享 Repository 基类
│   │
│   ├── ai/
│   │   ├── application/
│   │   ├── initialization/       ← 模块初始化任务
│   │   ├── ipc/                  ← IPC 处理器
│   │   └── index.ts              ← 模块导出入口
│   │
│   ├── task/
│   │   ├── application/
│   │   ├── initialization/
│   │   ├── ipc/
│   │   └── index.ts
│   │
│   ... 其他模块（统一结构）
│
├── main.ts                       ← 应用入口
├── constants.ts                  ← 应用常量
├── preload.ts                    ← Preload 脚本（如果需要）
└── ... 其他配置文件
*/

// ============================================
// 迁移清单
// ============================================

/*
PHASE 1: 基础设施整理
- [ ] 创建 shared/initialization 目录
- [ ] 创建 shared/infrastructure 目录
- [ ] 迁移 database/ → shared/infrastructure/database/
- [ ] 迁移 di/ → shared/infrastructure/containers/
- [ ] 整合 events/ → shared/infrastructure/events/
- [ ] 整合 ipc/registry → shared/infrastructure/ipc/

PHASE 2: 模块初始化层
- [ ] 为每个模块创建 initialization 文件夹
- [ ] 创建模块的 registerXxxInitializationTasks() 函数
- [ ] 创建 shared/initialization/initializer.ts 集中管理
- [ ] 实现 Electron 特有的初始化管理（APP_STARTUP 等）

PHASE 3: 模块 IPC 整理
- [ ] 将顶层 ipc/ 中的处理器分散到各模块
- [ ] 创建 modules/shared/infrastructure/ipc/ 进行统一管理
- [ ] 迁移 ipc-registry.ts 到 shared/infrastructure/ipc/

PHASE 4: 清理和验证
- [ ] 删除或合并空的文件夹
- [ ] 更新所有导入路径
- [ ] 验证应用启动流程
- [ ] 更新文档
*/

// ============================================
// 初始化流程规划（参考 API 和 Web）
// ============================================

/*
应用启动流程：

main.ts
  ├─→ registerAllInitializationTasks()  [shared/initialization/initializer.ts]
  │     ├─→ registerInfrastructureInitializationTasks()
  │     │     └─→ registerDatabaseInitTask()
  │     │     └─→ registerDIInitTask()
  │     │
  │     ├─→ registerAccountInitializationTasks()
  │     ├─→ registerSettingInitializationTasks()
  │     ├─→ registerNotificationInitializationTasks()
  │     │
  │     ├─→ registerGoalInitializationTasks()
  │     ├─→ registerTaskInitializationTasks()
  │     ├─→ registerScheduleInitializationTasks()
  │     └─→ ... 其他模块
  │
  └─→ InitializationManager.getInstance().executePhase(InitializationPhase.APP_STARTUP)
        └─→ 执行所有 APP_STARTUP 任务（按 priority 排序）
*/

// ============================================
// 模块结构规范
// ============================================

/*
每个模块应包含：

modules/MODULE_NAME/
├── application/
│   ├── services/                 ← 应用服务实现
│   │   ├── {action}-{entity}.ts
│   │   └── index.ts
│   └── ApplicationService.ts     ← Facade （可选）
│
├── initialization/               ← 新增：模块初始化
│   ├── index.ts                 ← 导出 register{ModuleName}InitializationTasks()
│   └── {entity}Initialization.ts ← 具体初始化任务（如果复杂）
│
├── ipc/                          ← IPC 处理器
│   ├── {entity}-ipc-handler.ts
│   └── index.ts                 ← 导出处理器单例
│
└── index.ts                      ← 模块导出入口
    └─ export { register{ModuleName}InitializationTasks }
*/

export const RESTRUCTURING_PLAN = {
  phases: 4,
  estimatedHours: 16,
  referenceProjects: ['apps/api', 'apps/web'],
};
