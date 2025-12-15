# Desktop IPC Architecture Documentation

## Story 13.56: 架构文档更新

### Overview

The Desktop application follows a layered IPC (Inter-Process Communication) architecture that separates the Main process (Electron backend) from the Renderer process (React frontend).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Renderer Process                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │    Views     │  │  Components  │  │    Hooks     │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                  │                           │
│         └─────────────────┼──────────────────┘                           │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │    Stores    │  (Zustand)                           │
│                    │  (State Mgmt)│                                      │
│                    └──────┬───────┘                                      │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │ DI Container │                                      │
│                    └──────┬───────┘                                      │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │  IPC Client  │  (BaseIPCClient)                     │
│                    └──────┬───────┘                                      │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   Preload     │  (contextBridge)
                    │    Bridge     │
                    └───────┬───────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────────┐
│                           │              Main Process                    │
│                    ┌──────▼───────┐                                      │
│                    │ IPC Handlers │  (ipcMain.handle)                    │
│                    └──────┬───────┘                                      │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │  Application │                                      │
│                    │   Services   │                                      │
│                    └──────┬───────┘                                      │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │   Domain     │                                      │
│                    │   Services   │                                      │
│                    └──────┬───────┘                                      │
│                           │                                              │
│                    ┌──────▼───────┐                                      │
│                    │ Repositories │  (SQLite/Prisma)                     │
│                    └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Module Structure

Each module follows a consistent DDD-inspired structure:

```
modules/{module-name}/
├── infrastructure/          # IPC Clients, DI Container
│   ├── ipc/
│   │   ├── {module}.ipc-client.ts
│   │   └── index.ts
│   ├── di/
│   │   └── {module}.container.ts
│   └── index.ts
├── presentation/            # React Components, Stores, Views
│   ├── components/
│   │   ├── {Component}.tsx
│   │   └── index.ts
│   ├── stores/
│   │   ├── {module}Store.ts
│   │   └── index.ts
│   ├── views/
│   │   ├── {View}.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

## IPC Client Pattern

### BaseIPCClient

All module-specific IPC clients extend `BaseIPCClient`:

```typescript
import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';

export class GoalIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  async list(accountUuid: string): Promise<GoalDTO[]> {
    return this.client.invoke<GoalDTO[]>('goal:list', { accountUuid });
  }

  async get(uuid: string): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>('goal:get', { uuid });
  }

  async create(input: CreateGoalInput): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>('goal:create', input);
  }
}
```

### Features

- **Type Safety**: Full TypeScript support for request/response types
- **Error Handling**: Automatic error wrapping with `IPCError`
- **Retry Logic**: Configurable automatic retries for transient failures
- **Timeout**: Request timeout with `IPCTimeoutError`
- **Logging**: Built-in request/response logging
- **Batch Requests**: Support for batching multiple IPC calls

## DI Container Pattern

### RendererContainer

Each module has a DI container for dependency injection:

```typescript
import { RendererContainer } from '@/renderer/shared/infrastructure/di';
import { GoalIPCClient } from '../ipc';

export class GoalContainer extends RendererContainer {
  private static instance: GoalContainer | null = null;

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  constructor() {
    super();
    this.registerInstance('goalIPCClient', new GoalIPCClient());
  }

  get goalClient(): GoalIPCClient {
    return this.get<GoalIPCClient>('goalIPCClient');
  }
}

export const goalContainer = GoalContainer.getInstance();
```

## Store Pattern

### Zustand Store with IPC Integration

Stores use DI containers to access IPC clients:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { goalContainer } from '../infrastructure/di';

interface GoalState {
  goals: GoalDTO[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGoals: (accountUuid: string) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      fetchGoals: async (accountUuid) => {
        set({ isLoading: true, error: null });
        try {
          const goals = await goalContainer.goalClient.list(accountUuid);
          set({ goals, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createGoal: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const goal = await goalContainer.goalClient.create(input);
          set((state) => ({ 
            goals: [...state.goals, goal],
            isLoading: false 
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },
    }),
    {
      name: 'goal-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ goals: state.goals }),
    }
  )
);
```

## Main Process Handlers

### BaseIPCHandler

Main process handlers extend `BaseIPCHandler`:

```typescript
import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';

export class GoalIPCHandler extends BaseIPCHandler {
  private goalService: GoalDesktopApplicationService;

  constructor() {
    super('GoalIPCHandler');
    this.goalService = new GoalDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcMain.handle('goal:list', async (_, params: { accountUuid: string }) => {
      return this.handleRequest(
        'goal:list',
        () => this.goalService.listGoals(params.accountUuid),
        { accountUuid: params.accountUuid }
      );
    });

    ipcMain.handle('goal:get', async (_, params: { uuid: string }) => {
      return this.handleRequest(
        'goal:get',
        () => this.goalService.getGoal(params.uuid)
      );
    });

    ipcMain.handle('goal:create', async (_, input: CreateGoalInput) => {
      return this.handleRequest(
        'goal:create',
        () => this.goalService.createGoal(input),
        { accountUuid: input.accountUuid }
      );
    });
  }
}
```

## IPC Channels

### Naming Convention

All IPC channels follow the pattern: `{module}:{entity}:{action}`

Examples:
- `goal:list` - List goals
- `goal:create` - Create a goal
- `task:instance:complete` - Complete a task instance
- `reminder:group:list` - List reminder groups

### Channel Registry

Channels are defined in `src/shared/types/ipc-channels.ts`:

```typescript
export const IPC_CHANNELS = {
  GOAL: {
    LIST: 'goal:list',
    GET: 'goal:get',
    CREATE: 'goal:create',
    UPDATE: 'goal:update',
    DELETE: 'goal:delete',
  },
  TASK: {
    TEMPLATE_LIST: 'task:template:list',
    INSTANCE_COMPLETE: 'task:instance:complete',
    // ...
  },
  // ...
} as const;
```

## Testing

### IPC Client Testing

Use `MockIPCClient` for unit testing:

```typescript
import { MockIPCClient } from '@/renderer/shared/testing';

describe('GoalIPCClient', () => {
  let mockClient: MockIPCClient;

  beforeEach(() => {
    mockClient = new MockIPCClient();
  });

  it('should list goals', async () => {
    const mockGoals = [{ uuid: '1', title: 'Goal 1' }];
    mockClient.mockResponse('goal:list', mockGoals);

    const goalClient = new GoalIPCClient(mockClient as any);
    const result = await goalClient.list('account-123');

    expect(result).toEqual(mockGoals);
    expect(mockClient.wasCalledWith('goal:list', { accountUuid: 'account-123' })).toBe(true);
  });
});
```

### Store Testing

Use store testing utilities:

```typescript
import { act } from '@testing-library/react';
import { useGoalStore } from './goalStore';

describe('useGoalStore', () => {
  beforeEach(() => {
    act(() => {
      useGoalStore.setState({ goals: [], isLoading: false, error: null }, true);
    });
  });

  it('should fetch goals', async () => {
    // Mock IPC client response
    // ...

    await act(async () => {
      await useGoalStore.getState().fetchGoals('account-123');
    });

    const state = useGoalStore.getState();
    expect(state.goals).toHaveLength(1);
  });
});
```

## Module List

### Core Modules (P0)
- **Goal**: Goal management with focus sessions
- **Task**: Task templates and instances
- **Schedule**: Schedule planning and recurring tasks
- **Reminder**: Reminders and notifications

### Content Modules (P1)
- **Repository**: Backup, sync, and data management
- **Editor**: Document editing

### System Modules (P1)
- **Account**: User account management
- **Auth**: Authentication and authorization
- **Setting**: Application settings
- **Dashboard**: Dashboard widgets

### Feature Modules (P2)
- **AI**: AI-powered features
- **Notification**: In-app notifications
- **Auto-Update**: Application updates

### Platform Modules
- **Shortcuts**: Global keyboard shortcuts
- **Window**: Window management
- **Tray**: System tray integration
- **AutoLaunch**: Startup configuration

## Best Practices

1. **Single Responsibility**: Each IPC client handles one entity type
2. **Error Handling**: Always handle errors at the store level
3. **Loading States**: Track loading states for UI feedback
4. **Caching**: Use Zustand persist for offline support
5. **Type Safety**: Define DTOs for all IPC payloads
6. **Testing**: Write unit tests for both IPC clients and stores
