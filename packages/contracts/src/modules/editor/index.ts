/**
 * Editor Module - Explicit Exports
 * 编辑器模块 - 显式导出
 */

// ============ Enums ============
export {
  ProjectType,
  DocumentLanguage,
  VersionChangeType,
  TabType,
  SplitDirection,
  IndexStatus,
  LinkedSourceType,
  LinkedTargetType,
  ViewMode,
  SidebarActiveTab,
} from './enums';

// ============ Value Objects ============
export type {
  // WorkspaceLayout
  IWorkspaceLayoutServer,
  IWorkspaceLayoutClient,
  WorkspaceLayoutServerDTO,
  WorkspaceLayoutClientDTO,
  WorkspaceLayoutPersistenceDTO,
  WorkspaceLayoutServer,
  WorkspaceLayoutClient,
} from './valueObjects/WorkspaceLayout';
export { DEFAULT_WORKSPACE_LAYOUT } from './valueObjects/WorkspaceLayout';

export type {
  // WorkspaceSettings
  IWorkspaceSettingsServer,
  IWorkspaceSettingsClient,
  WorkspaceSettingsServerDTO,
  WorkspaceSettingsClientDTO,
  WorkspaceSettingsPersistenceDTO,
  WorkspaceSettingsServer,
  WorkspaceSettingsClient,
} from './valueObjects/WorkspaceSettings';
export { DEFAULT_WORKSPACE_SETTINGS } from './valueObjects/WorkspaceSettings';

export type {
  // SessionLayout
  ISessionLayoutServer,
  ISessionLayoutClient,
  SessionLayoutServerDTO,
  SessionLayoutClientDTO,
  SessionLayoutPersistenceDTO,
  SessionLayoutServer,
  SessionLayoutClient,
} from './valueObjects/SessionLayout';
export { DEFAULT_SESSION_LAYOUT } from './valueObjects/SessionLayout';

export type {
  // TabViewState
  ITabViewStateServer,
  ITabViewStateClient,
  TabViewStateServerDTO,
  TabViewStateClientDTO,
  TabViewStatePersistenceDTO,
  TabViewStateServer,
  TabViewStateClient,
} from './valueObjects/TabViewState';

export type {
  // DocumentMetadata
  IDocumentMetadataServer,
  IDocumentMetadataClient,
  DocumentMetadataServerDTO,
  DocumentMetadataClientDTO,
  DocumentMetadataPersistenceDTO,
  DocumentMetadataServer,
  DocumentMetadataClient,
} from './valueObjects/DocumentMetadata';

// ============ Aggregates ============
export type {
  EditorWorkspaceClientDTO,
  EditorWorkspaceClient,
} from './aggregates/EditorWorkspaceClient';

export type {
  EditorWorkspaceServerDTO,
  EditorWorkspacePersistenceDTO,
  EditorWorkspaceCreatedEvent,
  EditorWorkspaceUpdatedEvent,
  EditorWorkspaceDeletedEvent,
  EditorWorkspaceActivatedEvent,
  EditorWorkspaceServer,
  WorkspaceLayout,
  WorkspaceSettings,
} from './aggregates/EditorWorkspaceServer';

// ============ Entities ============
export type { DocumentClientDTO, DocumentClient } from './entities/DocumentClient';

export type {
  DocumentServerDTO,
  DocumentPersistenceDTO,
  DocumentServer,
} from './entities/DocumentServer';

export type {
  DocumentVersionClientDTO,
  DocumentVersionClient,
} from './entities/DocumentVersionClient';

export type {
  DocumentVersionServerDTO,
  DocumentVersionPersistenceDTO,
  DocumentVersionServer,
} from './entities/DocumentVersionServer';

export type { EditorSessionClientDTO } from './entities/EditorSessionClient';

export type {
  EditorSessionServerDTO,
  EditorSessionPersistenceDTO,
} from './entities/EditorSessionServer';

export type { EditorGroupClientDTO, EditorGroupClient } from './entities/EditorGroupClient';

export type {
  EditorGroupServerDTO,
  EditorGroupPersistenceDTO,
  EditorGroupServer,
} from './entities/EditorGroupServer';

export type { EditorTabClientDTO, EditorTabClient } from './entities/EditorTabClient';

export type {
  EditorTabServerDTO,
  EditorTabPersistenceDTO,
  EditorTabServer,
} from './entities/EditorTabServer';

export type { SearchEngineClientDTO, SearchEngineClient } from './entities/SearchEngineClient';

export type {
  SearchEngineServerDTO,
  SearchEnginePersistenceDTO,
  SearchEngineServer,
} from './entities/SearchEngineServer';

export type {
  LinkedResourceClientDTO,
  LinkedResourceClient,
} from './entities/LinkedResourceClient';

export type {
  LinkedResourceServerDTO,
  LinkedResourcePersistenceDTO,
  LinkedResourceServer,
} from './entities/LinkedResourceServer';

// ============ API Requests ============
export type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  ListEditorWorkspacesResponse,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  ListEditorSessionsResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ListDocumentsResponse,
  ListDocumentVersionsResponse,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  ListEditorGroupsResponse,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
  ListEditorTabsResponse,
  CreateSearchEngineRequest,
  UpdateSearchEngineProgressRequest,
  SearchRequest,
  SearchResponse,
  CreateLinkedResourceRequest,
  UpdateLinkedResourceRequest,
  ListLinkedResourcesResponse,
  ValidateLinksRequest,
  ValidateLinksResponse,
} from './api-requests';
