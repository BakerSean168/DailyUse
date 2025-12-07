# ResolveConflictRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deviceId** | **string** |  | [default to undefined]
**strategy** | [**ResolutionStrategy**](ResolutionStrategy.md) |  | [default to undefined]
**resolvedData** | **{ [key: string]: any; }** | 手动合并时的最终数据（strategy&#x3D;manual 时必填） | [optional] [default to undefined]

## Example

```typescript
import { ResolveConflictRequest } from '@dailyuse/sync-client';

const instance: ResolveConflictRequest = {
    deviceId,
    strategy,
    resolvedData,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
