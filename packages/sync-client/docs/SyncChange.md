# SyncChange


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**eventId** | **string** | 事件唯一标识（客户端生成，用于幂等） | [default to undefined]
**entityType** | [**EntityType**](EntityType.md) |  | [default to undefined]
**entityId** | **string** | 实体唯一标识 | [default to undefined]
**operation** | [**OperationType**](OperationType.md) |  | [default to undefined]
**payload** | **{ [key: string]: any; }** | 变更内容（创建时为完整数据，更新时为差异） | [default to undefined]
**baseVersion** | **number** | 客户端认为的当前版本（用于冲突检测） | [default to undefined]
**clientTimestamp** | **number** | 客户端时间戳（Unix 毫秒） | [default to undefined]

## Example

```typescript
import { SyncChange } from '@dailyuse/sync-client';

const instance: SyncChange = {
    eventId,
    entityType,
    entityId,
    operation,
    payload,
    baseVersion,
    clientTimestamp,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
