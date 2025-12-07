# ConflictDetailResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**conflictId** | **string** |  | [optional] [default to undefined]
**entityType** | [**EntityType**](EntityType.md) |  | [optional] [default to undefined]
**entityId** | **string** |  | [optional] [default to undefined]
**localEventId** | **string** | 触发冲突的本地事件ID | [optional] [default to undefined]
**conflictingFields** | **Array&lt;string&gt;** | 冲突字段列表 | [optional] [default to undefined]
**localVersion** | **{ [key: string]: any; }** | 本地版本数据 | [optional] [default to undefined]
**serverVersion** | **{ [key: string]: any; }** | 服务端版本数据 | [optional] [default to undefined]
**serverVersionNumber** | **number** | 服务端版本号 | [optional] [default to undefined]
**createdAt** | **number** |  | [optional] [default to undefined]
**localFullData** | **{ [key: string]: any; }** | 本地完整数据 | [optional] [default to undefined]
**serverFullData** | **{ [key: string]: any; }** | 服务端完整数据 | [optional] [default to undefined]

## Example

```typescript
import { ConflictDetailResponseData } from '@dailyuse/sync-client';

const instance: ConflictDetailResponseData = {
    conflictId,
    entityType,
    entityId,
    localEventId,
    conflictingFields,
    localVersion,
    serverVersion,
    serverVersionNumber,
    createdAt,
    localFullData,
    serverFullData,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
