# DevicesApi

All URIs are relative to *https://api.dailyuse.app/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**deviceHeartbeat**](#deviceheartbeat) | **POST** /sync/devices/{deviceId}/heartbeat | 设备心跳|
|[**listDevices**](#listdevices) | **GET** /sync/devices | 获取设备列表|
|[**logoutDevice**](#logoutdevice) | **DELETE** /sync/devices/{deviceId} | 远程登出设备|
|[**registerDevice**](#registerdevice) | **POST** /sync/devices | 注册设备|
|[**updateDevice**](#updatedevice) | **PUT** /sync/devices/{deviceId} | 更新设备信息|

# **deviceHeartbeat**
> DeviceHeartbeat200Response deviceHeartbeat()

更新设备在线状态和最后活跃时间

### Example

```typescript
import {
    DevicesApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new DevicesApi(configuration);

let deviceId: string; // (default to undefined)

const { status, data } = await apiInstance.deviceHeartbeat(
    deviceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deviceId** | [**string**] |  | defaults to undefined|


### Return type

**DeviceHeartbeat200Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 心跳成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listDevices**
> DeviceListResponse listDevices()

获取当前用户的所有注册设备

### Example

```typescript
import {
    DevicesApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new DevicesApi(configuration);

const { status, data } = await apiInstance.listDevices();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DeviceListResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 设备列表 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logoutDevice**
> LogoutDevice200Response logoutDevice()

将设备标记为非活跃，清除同步游标。 可用于远程登出丢失的设备。 

### Example

```typescript
import {
    DevicesApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new DevicesApi(configuration);

let deviceId: string; //设备数据库 ID (default to undefined)

const { status, data } = await apiInstance.logoutDevice(
    deviceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deviceId** | [**string**] | 设备数据库 ID | defaults to undefined|


### Return type

**LogoutDevice200Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 登出成功 |  -  |
|**404** | 设备不存在 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **registerDevice**
> DeviceResponse registerDevice(registerDeviceRequest)

注册新设备用于同步。  **限制：** - 每用户最多 10 个活跃设备 - 90 天不活跃自动标记为非活跃 

### Example

```typescript
import {
    DevicesApi,
    Configuration,
    RegisterDeviceRequest
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new DevicesApi(configuration);

let registerDeviceRequest: RegisterDeviceRequest; //

const { status, data } = await apiInstance.registerDevice(
    registerDeviceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **registerDeviceRequest** | **RegisterDeviceRequest**|  | |


### Return type

**DeviceResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 注册成功 |  -  |
|**400** | 设备数量超限 |  -  |
|**409** | 设备已注册 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateDevice**
> DeviceResponse updateDevice(updateDeviceRequest)

更新设备名称或推送 token

### Example

```typescript
import {
    DevicesApi,
    Configuration,
    UpdateDeviceRequest
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new DevicesApi(configuration);

let deviceId: string; //设备数据库 ID (default to undefined)
let updateDeviceRequest: UpdateDeviceRequest; //

const { status, data } = await apiInstance.updateDevice(
    deviceId,
    updateDeviceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateDeviceRequest** | **UpdateDeviceRequest**|  | |
| **deviceId** | [**string**] | 设备数据库 ID | defaults to undefined|


### Return type

**DeviceResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 更新成功 |  -  |
|**404** | 设备不存在 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

