# SyncApi

All URIs are relative to *https://api.dailyuse.app/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**pullChanges**](#pullchanges) | **POST** /sync/pull | 拉取远程变更|
|[**pushChanges**](#pushchanges) | **POST** /sync/push | 推送本地变更|

# **pullChanges**
> SyncPullResponse pullChanges(syncPullRequest)

从服务端拉取自上次同步后的变更。  **流程说明：** 1. 验证设备身份 2. 查询 lastSyncVersion 之后的变更 3. 排除当前设备产生的变更 4. 分页返回结果 5. 更新同步游标  **分页说明：** - 默认每次返回 100 条 - 最大 500 条 - hasMore=true 时继续拉取 

### Example

```typescript
import {
    SyncApi,
    Configuration,
    SyncPullRequest
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new SyncApi(configuration);

let xDeviceID: string; //设备唯一标识 (default to undefined)
let syncPullRequest: SyncPullRequest; //

const { status, data } = await apiInstance.pullChanges(
    xDeviceID,
    syncPullRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **syncPullRequest** | **SyncPullRequest**|  | |
| **xDeviceID** | [**string**] | 设备唯一标识 | defaults to undefined|


### Return type

**SyncPullResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 拉取成功 |  * Content-Encoding - 响应压缩方式 <br>  |
|**401** | 未认证或认证失败 |  -  |
|**404** | 设备未注册 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pushChanges**
> SyncPushResponse pushChanges(syncPushRequest)

将客户端的变更推送到服务端。  **流程说明：** 1. 验证设备身份 2. 获取用户同步锁（防止并发） 3. 逐个处理变更，检查版本冲突 4. 写入事件表，更新实体版本 5. 返回处理结果  **注意事项：** - 单次最多推送 100 个变更 - 使用 eventId 实现幂等性 - 版本冲突时返回 conflicts 数组 

### Example

```typescript
import {
    SyncApi,
    Configuration,
    SyncPushRequest
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new SyncApi(configuration);

let xDeviceID: string; //设备唯一标识 (default to undefined)
let syncPushRequest: SyncPushRequest; //
let xAppVersion: string; //客户端应用版本 (optional) (default to undefined)

const { status, data } = await apiInstance.pushChanges(
    xDeviceID,
    syncPushRequest,
    xAppVersion
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **syncPushRequest** | **SyncPushRequest**|  | |
| **xDeviceID** | [**string**] | 设备唯一标识 | defaults to undefined|
| **xAppVersion** | [**string**] | 客户端应用版本 | (optional) defaults to undefined|


### Return type

**SyncPushResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 推送成功（可能包含冲突） |  -  |
|**400** | 请求参数错误 |  -  |
|**401** | 未认证或认证失败 |  -  |
|**404** | 设备未注册 |  -  |
|**413** | 请求体过大 |  -  |
|**423** | 同步锁超时 |  -  |
|**429** | 请求频率超限 |  * Retry-After - 建议等待秒数 <br>  * X-RateLimit-Limit - 限制次数 <br>  * X-RateLimit-Remaining - 剩余次数 <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

