# SyncPullResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**changes** | [**Array&lt;RemoteChange&gt;**](RemoteChange.md) |  | [optional] [default to undefined]
**currentVersion** | **number** | 服务端当前最新版本号 | [optional] [default to undefined]
**hasMore** | **boolean** | 是否还有更多变更 | [optional] [default to undefined]

## Example

```typescript
import { SyncPullResponseData } from '@dailyuse/sync-client';

const instance: SyncPullResponseData = {
    changes,
    currentVersion,
    hasMore,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
