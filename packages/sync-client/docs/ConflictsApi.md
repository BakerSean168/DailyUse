# ConflictsApi

All URIs are relative to *https://api.dailyuse.app/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getConflict**](#getconflict) | **GET** /sync/conflicts/{conflictId} | 获取冲突详情|
|[**getConflictHistory**](#getconflicthistory) | **GET** /sync/conflicts/history | 获取冲突历史|
|[**listConflicts**](#listconflicts) | **GET** /sync/conflicts | 获取未解决冲突列表|
|[**resolveConflict**](#resolveconflict) | **POST** /sync/conflicts/{conflictId}/resolve | 解决冲突|

# **getConflict**
> ConflictDetailResponse getConflict()

获取特定冲突的详细信息，包括本地和服务端版本对比

### Example

```typescript
import {
    ConflictsApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new ConflictsApi(configuration);

let conflictId: string; // (default to undefined)

const { status, data } = await apiInstance.getConflict(
    conflictId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **conflictId** | [**string**] |  | defaults to undefined|


### Return type

**ConflictDetailResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 冲突详情 |  -  |
|**404** | 冲突不存在 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getConflictHistory**
> ConflictHistoryResponse getConflictHistory()

获取已解决冲突的历史记录

### Example

```typescript
import {
    ConflictsApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new ConflictsApi(configuration);

let entityId: string; //按实体ID过滤 (optional) (default to undefined)
let from: string; //开始日期 (YYYY-MM-DD) (optional) (default to undefined)
let to: string; //结束日期 (YYYY-MM-DD) (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let limit: number; // (optional) (default to 20)

const { status, data } = await apiInstance.getConflictHistory(
    entityId,
    from,
    to,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **entityId** | [**string**] | 按实体ID过滤 | (optional) defaults to undefined|
| **from** | [**string**] | 开始日期 (YYYY-MM-DD) | (optional) defaults to undefined|
| **to** | [**string**] | 结束日期 (YYYY-MM-DD) | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **limit** | [**number**] |  | (optional) defaults to 20|


### Return type

**ConflictHistoryResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 历史记录 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listConflicts**
> ConflictListResponse listConflicts()

获取当前用户的所有未解决冲突

### Example

```typescript
import {
    ConflictsApi,
    Configuration
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new ConflictsApi(configuration);

let entityType: EntityType; //按实体类型过滤 (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let limit: number; // (optional) (default to 20)

const { status, data } = await apiInstance.listConflicts(
    entityType,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **entityType** | **EntityType** | 按实体类型过滤 | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **limit** | [**number**] |  | (optional) defaults to 20|


### Return type

**ConflictListResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 冲突列表 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **resolveConflict**
> ResolveConflictResponse resolveConflict(resolveConflictRequest)

解决特定冲突。  **解决策略：** - `local`: 使用本地版本 - `remote`: 使用服务端版本 - `manual`: 手动合并（需提供 resolvedData） 

### Example

```typescript
import {
    ConflictsApi,
    Configuration,
    ResolveConflictRequest
} from '@dailyuse/sync-client';

const configuration = new Configuration();
const apiInstance = new ConflictsApi(configuration);

let conflictId: string; // (default to undefined)
let xDeviceID: string; //设备唯一标识 (default to undefined)
let resolveConflictRequest: ResolveConflictRequest; //

const { status, data } = await apiInstance.resolveConflict(
    conflictId,
    xDeviceID,
    resolveConflictRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resolveConflictRequest** | **ResolveConflictRequest**|  | |
| **conflictId** | [**string**] |  | defaults to undefined|
| **xDeviceID** | [**string**] | 设备唯一标识 | defaults to undefined|


### Return type

**ResolveConflictResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 解决成功 |  -  |
|**400** | 手动策略缺少 resolvedData |  -  |
|**404** | 冲突不存在或已解决 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

