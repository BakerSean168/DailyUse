# Story 13.5: IPC Client 测试基础设施

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.5 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P1 (High) |
| 复杂度 | Low |
| 预估工时 | 2h |
| 状态 | Backlog |

## 目标

建立 IPC Client 的测试基础设施，提供 mock 工具和测试 helper。

## 任务列表

- [ ] 1. 创建 IPC Mock 工具
  - [ ] `createMockElectronAPI()` - 创建 mock electronAPI
  - [ ] `mockIPCResponse()` - 模拟特定通道的响应
  - [ ] `mockIPCError()` - 模拟错误响应
- [ ] 2. 创建测试 Helper
  - [ ] `setupIPCTest()` - 测试环境设置
  - [ ] `cleanupIPCTest()` - 测试环境清理
- [ ] 3. 创建测试数据工厂
  - [ ] 各模块实体的测试数据生成器

## 技术设计

### Mock 工具

```typescript
// ipc-mock.ts
export function createMockElectronAPI(): MockElectronAPI {
  const handlers = new Map<string, jest.Mock>();
  
  return {
    invoke: jest.fn((channel, payload) => {
      const handler = handlers.get(channel);
      if (handler) {
        return handler(payload);
      }
      return Promise.reject(new Error(`No mock for channel: ${channel}`));
    }),
    
    on: jest.fn(),
    off: jest.fn(),
    
    // 辅助方法
    mockChannel: (channel: string, response: unknown) => {
      handlers.set(channel, jest.fn().mockResolvedValue(response));
    },
    mockChannelError: (channel: string, error: Error) => {
      handlers.set(channel, jest.fn().mockRejectedValue(error));
    },
    mockChannelOnce: (channel: string, response: unknown) => {
      handlers.set(channel, jest.fn().mockResolvedValueOnce(response));
    },
  };
}
```

### 测试 Helper

```typescript
// test-helpers.ts
export function setupIPCTest(): MockElectronAPI {
  const mockAPI = createMockElectronAPI();
  (window as any).electronAPI = mockAPI;
  return mockAPI;
}

export function cleanupIPCTest(): void {
  delete (window as any).electronAPI;
}

// 使用示例
describe('TaskIPCClient', () => {
  let mockAPI: MockElectronAPI;
  
  beforeEach(() => {
    mockAPI = setupIPCTest();
  });
  
  afterEach(() => {
    cleanupIPCTest();
  });
  
  it('should get task template', async () => {
    const mockTemplate = createMockTaskTemplate();
    mockAPI.mockChannel('task:template:get', mockTemplate);
    
    const client = new TaskIPCClient();
    const result = await client.getTemplate('uuid-123');
    
    expect(result).toEqual(mockTemplate);
  });
});
```

## 验收标准

- [ ] Mock 工具可正确模拟 IPC 响应
- [ ] 测试 Helper 简化测试代码编写
- [ ] 测试数据工厂可生成有效测试数据

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/shared/infrastructure/ipc/__tests__/ipc-mock.ts` | 新建 | Mock 工具 |
| `renderer/shared/infrastructure/ipc/__tests__/test-helpers.ts` | 新建 | 测试 Helper |
| `renderer/shared/infrastructure/ipc/__tests__/test-factories.ts` | 新建 | 测试数据工厂 |

## 依赖关系

- **前置依赖**: Story 13.1, 13.4
- **后续依赖**: 所有模块的单元测试
