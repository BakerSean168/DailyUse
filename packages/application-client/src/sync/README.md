# Cloud Sync Adapter Interface

This module provides a unified interface for cloud synchronization adapters, enabling DailyUse to support multiple cloud platforms (GitHub, Nutstore, Dropbox, self-hosted) with consistent API.

## Features

✅ **Unified Interface**: Single `ISyncAdapter` interface for all providers  
✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions  
✅ **Factory Pattern**: Easy adapter creation and registration  
✅ **Error Handling**: Specific error types for different failure scenarios  
✅ **Extensible**: Easy to add new cloud providers  

## Quick Start

```typescript
import { SyncAdapterFactory, type AdapterCredentials } from '@dailyuse/application-client/sync';

// Create an adapter
const adapter = SyncAdapterFactory.create('github', {
  provider: 'github',
  token: process.env.GITHUB_TOKEN!,
  repoPath: 'user/daily-use-sync',
  encryptionKey: userPassword,
});

// Authenticate
await adapter.authenticate(credentials);

// Push data
const result = await adapter.push('goal', goalId, encryptedData, 1);

// Pull changes
const pullResult = await adapter.pull('goal', lastSyncTime);
```

## Architecture

```
sync/
├── interfaces/
│   └── ISyncAdapter.ts       # Core interface definition
├── types/
│   └── index.ts              # Type definitions
├── factory/
│   └── AdapterFactory.ts     # Factory for creating adapters
├── errors/
│   └── index.ts              # Error types
└── __tests__/
    ├── AdapterFactory.test.ts
    └── errors.test.ts
```

## Core Concepts

### ISyncAdapter Interface

The main interface that all cloud providers must implement. Key methods:

- **authenticate()**: Initialize and verify connection
- **push()**: Upload encrypted data
- **pull()**: Download encrypted data
- **batchPush()**: Optimize batch operations
- **resolveConflict()**: Handle version conflicts
- **getQuota()**: Check storage usage
- **exportAll()/importData()**: Backup and restore

### Encryption

All data is encrypted before upload:

```typescript
interface EncryptedSyncData {
  encryptedPayload: string;  // Base64 encoded AES-256-GCM
  iv: string;                // Initialization vector
  authTag: string;           // Authentication tag
  algorithm: 'AES-256-GCM';
}
```

### Conflict Resolution

Supports multiple conflict resolution strategies:

- `local`: Use local version
- `remote`: Use remote version
- `manual`: User-provided merge
- `merge`: Field-level merge

## Error Handling

Specific error types for different scenarios:

```typescript
import {
  AuthenticationError,
  NetworkError,
  ConflictError,
  QuotaExceededError,
  NotFoundError,
  ValidationError,
} from '@dailyuse/application-client/sync';

try {
  await adapter.push('goal', id, data, version);
} catch (error) {
  if (error instanceof ConflictError) {
    // Handle version conflict
  } else if (error instanceof QuotaExceededError) {
    // Handle storage quota exceeded
  }
}
```

## Adding New Providers

To add a new cloud provider:

1. Implement `ISyncAdapter` interface
2. Register with factory:

```typescript
import { SyncAdapterFactory } from '@dailyuse/application-client/sync';
import { MyCloudAdapter } from './adapters/MyCloudAdapter';

SyncAdapterFactory.register('mycloud', MyCloudAdapter);
```

3. Use the new adapter:

```typescript
const adapter = SyncAdapterFactory.create('mycloud', credentials);
```

## Type Definitions

### AdapterCredentials

```typescript
interface AdapterCredentials {
  provider: 'github' | 'nutstore' | 'dropbox' | 'self-hosted';
  token?: string;
  username?: string;
  repoPath?: string;
  encryptionKey: string;
  serverUrl?: string;
}
```

### PushResult

```typescript
interface PushResult {
  success: boolean;
  version: number;
  timestamp: number;
  error?: string;
  conflictDetected?: boolean;
  conflict?: ConflictInfo;
}
```

### PullResult

```typescript
interface PullResult {
  success: boolean;
  items: Array<{
    entityType: string;
    entityId: string;
    data: EncryptedSyncData;
    version: number;
    timestamp: number;
  }>;
  cursor: SyncCursor;
  hasMore: boolean;
  totalItems?: number;
}
```

## Testing

Run tests:

```bash
pnpm test src/sync/__tests__
```

Coverage:
- ✅ Factory pattern tests
- ✅ Error type tests
- ✅ Type validation tests

## Next Steps

- [ ] Implement `EncryptionService` (STORY-044)
- [ ] Implement `GitHubSyncAdapter` (STORY-045)
- [ ] Implement `NutstoreSyncAdapter` (STORY-046)
- [ ] Implement `DropboxSyncAdapter` (STORY-047)

## Related

- [EPIC-009: Cloud Sync Integration](../../../docs/sprint-artifacts/EPIC-009-cloud-sync.md)
- [STORY-043: SyncAdapter Architecture](../../../docs/sprint-artifacts/stories/STORY-043-sync-adapter-design.md)
- [sync-provider-strategy.md](../../../docs/architecture/sync-provider-strategy.md)
