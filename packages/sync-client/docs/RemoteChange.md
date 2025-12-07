# RemoteChange


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**eventId** | **string** |  | [optional] [default to undefined]
**entityType** | [**EntityType**](EntityType.md) |  | [optional] [default to undefined]
**entityId** | **string** |  | [optional] [default to undefined]
**operation** | [**OperationType**](OperationType.md) |  | [optional] [default to undefined]
**payload** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**version** | **number** | 变更版本号 | [optional] [default to undefined]
**sourceDeviceId** | **string** | 产生此变更的设备 | [optional] [default to undefined]
**serverTimestamp** | **number** | 服务端时间戳 | [optional] [default to undefined]

## Example

```typescript
import { RemoteChange } from '@dailyuse/sync-client';

const instance: RemoteChange = {
    eventId,
    entityType,
    entityId,
    operation,
    payload,
    version,
    sourceDeviceId,
    serverTimestamp,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
