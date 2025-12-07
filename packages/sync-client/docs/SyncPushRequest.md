# SyncPushRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deviceId** | **string** | 设备唯一标识 | [default to undefined]
**changes** | [**Array&lt;SyncChange&gt;**](SyncChange.md) | 变更列表（最多100条） | [default to undefined]

## Example

```typescript
import { SyncPushRequest } from '@dailyuse/sync-client';

const instance: SyncPushRequest = {
    deviceId,
    changes,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
