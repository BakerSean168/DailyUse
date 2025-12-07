# RegisterDeviceRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deviceId** | **string** | 客户端生成的设备唯一ID | [default to undefined]
**deviceName** | **string** |  | [default to undefined]
**platform** | [**Platform**](Platform.md) |  | [default to undefined]
**appVersion** | **string** |  | [default to undefined]
**pushToken** | **string** | 推送通知 token（FCM/APNs） | [optional] [default to undefined]

## Example

```typescript
import { RegisterDeviceRequest } from '@dailyuse/sync-client';

const instance: RegisterDeviceRequest = {
    deviceId,
    deviceName,
    platform,
    appVersion,
    pushToken,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
