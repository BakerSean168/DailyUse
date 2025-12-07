# ResolveConflictResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**resolved** | **boolean** |  | [optional] [default to undefined]
**newVersion** | **number** | 解决后的新版本号 | [optional] [default to undefined]
**remainingConflicts** | **number** | 剩余未解决冲突数 | [optional] [default to undefined]

## Example

```typescript
import { ResolveConflictResponseData } from '@dailyuse/sync-client';

const instance: ResolveConflictResponseData = {
    resolved,
    newVersion,
    remainingConflicts,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
