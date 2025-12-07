# SyncPullRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deviceId** | **string** |  | [default to undefined]
**lastSyncVersion** | **number** | 客户端已同步到的版本号 | [default to undefined]
**entityTypes** | [**Array&lt;EntityType&gt;**](EntityType.md) | 可选，只拉取指定类型 | [optional] [default to undefined]
**limit** | **number** | 每次拉取数量 | [optional] [default to 100]

## Example

```typescript
import { SyncPullRequest } from '@dailyuse/sync-client';

const instance: SyncPullRequest = {
    deviceId,
    lastSyncVersion,
    entityTypes,
    limit,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
