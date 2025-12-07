# Device


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | 数据库 ID | [optional] [default to undefined]
**deviceId** | **string** | 客户端设备 ID | [optional] [default to undefined]
**deviceName** | **string** |  | [optional] [default to undefined]
**platform** | [**Platform**](Platform.md) |  | [optional] [default to undefined]
**appVersion** | **string** |  | [optional] [default to undefined]
**lastSyncVersion** | **number** | 该设备已同步到的版本 | [optional] [default to undefined]
**lastSyncAt** | **number** |  | [optional] [default to undefined]
**lastSeenAt** | **number** |  | [optional] [default to undefined]
**isOnline** | **boolean** | 当前是否在线 | [optional] [default to undefined]
**isCurrent** | **boolean** | 是否是当前请求的设备 | [optional] [default to undefined]
**isActive** | **boolean** | 是否活跃 | [optional] [default to undefined]
**createdAt** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { Device } from '@dailyuse/sync-client';

const instance: Device = {
    id,
    deviceId,
    deviceName,
    platform,
    appVersion,
    lastSyncVersion,
    lastSyncAt,
    lastSeenAt,
    isOnline,
    isCurrent,
    isActive,
    createdAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
