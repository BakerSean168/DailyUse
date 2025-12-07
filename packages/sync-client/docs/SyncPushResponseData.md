# SyncPushResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accepted** | **Array&lt;string&gt;** | 已接受的事件ID列表 | [optional] [default to undefined]
**conflicts** | [**Array&lt;ConflictInfo&gt;**](ConflictInfo.md) | 检测到的冲突列表 | [optional] [default to undefined]
**newVersion** | **number** | 服务端当前最新版本号 | [optional] [default to undefined]

## Example

```typescript
import { SyncPushResponseData } from '@dailyuse/sync-client';

const instance: SyncPushResponseData = {
    accepted,
    conflicts,
    newVersion,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
