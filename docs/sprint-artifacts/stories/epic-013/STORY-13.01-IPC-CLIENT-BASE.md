# Story 13.1: 创建统一的 IPC Client 基础架构

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.1 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

建立类似 Web `apiClient` 的统一 IPC 调用层，为所有 Renderer 端模块提供标准化的 IPC 通信基础。

## 背景

当前 Desktop Renderer 端存在的问题：
1. IPC 调用分散在各个 Store 和组件中
2. 没有统一的错误处理机制
3. 缺少类型安全保障
4. 没有请求日志和调试支持

## 任务列表

- [ ] 1. 创建 `renderer/shared/infrastructure/ipc/` 目录结构
- [ ] 2. 实现 `BaseIPCClient` 基类
  - [ ] 封装 `window.electronAPI.invoke` 调用
  - [ ] 添加泛型类型支持
  - [ ] 实现请求超时机制（默认 30s，可配置）
  - [ ] 实现重试机制（可选，默认关闭）
- [ ] 3. 实现 `IPCError` 错误类型体系
  - [ ] `IPCTimeoutError` - 超时错误
  - [ ] `IPCConnectionError` - 连接错误
  - [ ] `IPCValidationError` - 数据验证错误
  - [ ] `IPCBusinessError` - 业务逻辑错误
- [ ] 4. 实现请求/响应日志（开发模式）
  - [ ] 请求开始日志（channel, payload）
  - [ ] 请求完成日志（duration, result summary）
  - [ ] 错误日志（完整错误信息）
- [ ] 5. 实现批量请求支持
  - [ ] `batch()` 方法并行执行多个请求
  - [ ] 结果按原顺序返回
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/shared/infrastructure/ipc/
├── base-ipc-client.ts      # BaseIPCClient 基类
├── ipc-error.ts            # 错误类型定义
├── ipc-types.ts            # 通用类型定义
├── ipc-logger.ts           # 日志工具
├── ipc-config.ts           # 配置项
└── index.ts                # 导出
```

### BaseIPCClient 接口设计

```typescript
export interface IPCClientConfig {
  timeout?: number;          // 默认 30000ms
  retryCount?: number;       // 默认 0
  retryDelay?: number;       // 默认 1000ms
  enableLogging?: boolean;   // 默认 DEV 模式开启
}

export abstract class BaseIPCClient {
  protected config: IPCClientConfig;
  
  constructor(config?: Partial<IPCClientConfig>);
  
  protected async invoke<TResult, TPayload = unknown>(
    channel: string,
    payload?: TPayload
  ): Promise<TResult>;
  
  async batch<T extends readonly IPCRequest[]>(
    requests: T
  ): Promise<IPCBatchResult<T>>;
}
```

### 使用示例

```typescript
// 继承实现
class TaskIPCClient extends BaseIPCClient {
  async getTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.invoke('task:get-template', { uuid });
  }
}

// 批量调用
const [tasks, goals] = await ipcClient.batch([
  { channel: 'task:list', payload: { accountUuid } },
  { channel: 'goal:list', payload: { accountUuid } },
]);
```

## 验收标准

- [ ] `BaseIPCClient` 可被正确继承和使用
- [ ] 所有 IPC 调用都有完整的 TypeScript 类型
- [ ] 错误被正确分类和处理
- [ ] 开发模式下有清晰的日志输出
- [ ] 批量请求功能正常工作
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/shared/infrastructure/ipc/base-ipc-client.ts` | 新建 | BaseIPCClient 基类 |
| `renderer/shared/infrastructure/ipc/ipc-error.ts` | 新建 | 错误类型定义 |
| `renderer/shared/infrastructure/ipc/ipc-types.ts` | 新建 | 通用类型 |
| `renderer/shared/infrastructure/ipc/ipc-logger.ts` | 新建 | 日志工具 |
| `renderer/shared/infrastructure/ipc/ipc-config.ts` | 新建 | 配置项 |
| `renderer/shared/infrastructure/ipc/index.ts` | 新建 | 导出 |
| `renderer/shared/infrastructure/ipc/__tests__/` | 新建 | 测试文件 |

## 依赖关系

- **前置依赖**: 无
- **后续依赖**: 所有模块的 IPC Client (Stories 13.6, 13.9, 13.12 等)

## 风险与注意事项

1. **类型安全**: 需要确保 `window.electronAPI` 的类型定义完整
2. **错误边界**: IPC 错误不应导致整个应用崩溃
3. **性能**: 批量请求需要合理控制并发数量

## 参考资料

- [Electron IPC 文档](https://www.electronjs.org/docs/latest/tutorial/ipc)
- Web 端 `apiClient` 实现: `apps/web/src/infrastructure/api/`
