## @dailyuse/sync-client@1.0.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install @dailyuse/sync-client@1.0.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *https://api.dailyuse.app/api/v1*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ConflictsApi* | [**getConflict**](docs/ConflictsApi.md#getconflict) | **GET** /sync/conflicts/{conflictId} | 获取冲突详情
*ConflictsApi* | [**getConflictHistory**](docs/ConflictsApi.md#getconflicthistory) | **GET** /sync/conflicts/history | 获取冲突历史
*ConflictsApi* | [**listConflicts**](docs/ConflictsApi.md#listconflicts) | **GET** /sync/conflicts | 获取未解决冲突列表
*ConflictsApi* | [**resolveConflict**](docs/ConflictsApi.md#resolveconflict) | **POST** /sync/conflicts/{conflictId}/resolve | 解决冲突
*DevicesApi* | [**deviceHeartbeat**](docs/DevicesApi.md#deviceheartbeat) | **POST** /sync/devices/{deviceId}/heartbeat | 设备心跳
*DevicesApi* | [**listDevices**](docs/DevicesApi.md#listdevices) | **GET** /sync/devices | 获取设备列表
*DevicesApi* | [**logoutDevice**](docs/DevicesApi.md#logoutdevice) | **DELETE** /sync/devices/{deviceId} | 远程登出设备
*DevicesApi* | [**registerDevice**](docs/DevicesApi.md#registerdevice) | **POST** /sync/devices | 注册设备
*DevicesApi* | [**updateDevice**](docs/DevicesApi.md#updatedevice) | **PUT** /sync/devices/{deviceId} | 更新设备信息
*SyncApi* | [**pullChanges**](docs/SyncApi.md#pullchanges) | **POST** /sync/pull | 拉取远程变更
*SyncApi* | [**pushChanges**](docs/SyncApi.md#pushchanges) | **POST** /sync/push | 推送本地变更


### Documentation For Models

 - [ConflictDetailResponse](docs/ConflictDetailResponse.md)
 - [ConflictDetailResponseData](docs/ConflictDetailResponseData.md)
 - [ConflictHistoryResponse](docs/ConflictHistoryResponse.md)
 - [ConflictHistoryResponseDataInner](docs/ConflictHistoryResponseDataInner.md)
 - [ConflictInfo](docs/ConflictInfo.md)
 - [ConflictListResponse](docs/ConflictListResponse.md)
 - [Device](docs/Device.md)
 - [DeviceHeartbeat200Response](docs/DeviceHeartbeat200Response.md)
 - [DeviceHeartbeat200ResponseData](docs/DeviceHeartbeat200ResponseData.md)
 - [DeviceListResponse](docs/DeviceListResponse.md)
 - [DeviceResponse](docs/DeviceResponse.md)
 - [EntityType](docs/EntityType.md)
 - [ErrorResponse](docs/ErrorResponse.md)
 - [ErrorResponseError](docs/ErrorResponseError.md)
 - [ErrorResponseErrorDetailsInner](docs/ErrorResponseErrorDetailsInner.md)
 - [LogoutDevice200Response](docs/LogoutDevice200Response.md)
 - [OperationType](docs/OperationType.md)
 - [PaginationMeta](docs/PaginationMeta.md)
 - [Platform](docs/Platform.md)
 - [RegisterDeviceRequest](docs/RegisterDeviceRequest.md)
 - [RemoteChange](docs/RemoteChange.md)
 - [ResolutionStrategy](docs/ResolutionStrategy.md)
 - [ResolveConflictRequest](docs/ResolveConflictRequest.md)
 - [ResolveConflictResponse](docs/ResolveConflictResponse.md)
 - [ResolveConflictResponseData](docs/ResolveConflictResponseData.md)
 - [SyncChange](docs/SyncChange.md)
 - [SyncPullRequest](docs/SyncPullRequest.md)
 - [SyncPullResponse](docs/SyncPullResponse.md)
 - [SyncPullResponseData](docs/SyncPullResponseData.md)
 - [SyncPushRequest](docs/SyncPushRequest.md)
 - [SyncPushResponse](docs/SyncPushResponse.md)
 - [SyncPushResponseData](docs/SyncPushResponseData.md)
 - [UpdateDeviceRequest](docs/UpdateDeviceRequest.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization


Authentication schemes defined for the API:
<a id="bearerAuth"></a>
### bearerAuth

- **Type**: Bearer authentication (JWT)

