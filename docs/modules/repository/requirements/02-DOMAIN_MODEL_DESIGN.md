# 仓储模块 - 领域模型设计

> **文档类型**: BA 需求文档  
> **作者**: BA - Business Analyst  
> **日期**: 2025-11-09  
> **版本**: v1.0  
> **项目**: DailyUse - Repository Module (Obsidian-inspired)

---

## 📋 文档目标

本文档定义仓储模块（Repository）的完整领域模型，基于 DDD（领域驱动设计）原则，包括：

1. 聚合根（Aggregate Root）设计
2. 实体（Entity）设计  
3. 值对象（Value Object）设计
4. 领域服务（Domain Service）设计
5. 业务规则与不变式（Invariants）

---

## 🏗️ 领域模型概览

```
📦 Repository 聚合
├── 🔵 Repository (Aggregate Root)
│   ├── RepositoryConfig (Value Object)
│   ├── RepositoryStats (Value Object)
│   └── GitInfo (Value Object)
├── 🔵 Folder (Entity)
│   └── FolderMetadata (Value Object)
├── 🔵 Resource (Entity)
│   ├── ResourceMetadata (Value Object)
│   └── ResourceStats (Value Object)
├── 🔵 ResourceVersion (Entity)
│   └── VersionMetadata (Value Object)
└── 🔵 ResourceLink (Entity)
```

---

## 1️⃣ Repository 聚合根

### 职责

管理一个知识仓储的完整生命周期，包括：
- 仓储配置（搜索引擎、Git集成、同步设置）
- 文件夹和资源的创建
- 统计信息维护
- 状态转换（激活/归档/删除）

### TypeScript 定义

```typescript
// packages/contracts/src/modules/repository/aggregates/Repository.ts

export class RepositoryServer extends AggregateRoot {
  // === 基础属性 ===
  uuid: string;
  accountUuid: string;
  name: string;              
  type: RepositoryType;      // MARKDOWN | CODE | MIXED
  path: string;              
  description?: string;
  
  // === 值对象 ===
  config: RepositoryConfig;  
  stats: RepositoryStats;    
  git?: GitInfo;             
  
  // === 状态 ===
  status: RepositoryStatus;  // ACTIVE | ARCHIVED | DELETED
  syncStatus?: SyncStatus;   
  
  // === 审计 ===
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // === 静态工厂方法 ===
  
  static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfig>;
  }): RepositoryServer {
    // 1. 验证业务规则
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('仓储名称不能为空');
    }
    if (!params.path || !this.isValidPath(params.path)) {
      throw new Error('仓储路径格式不正确');
    }
    
    // 2. 创建实例
    const repository = new RepositoryServer();
    repository.uuid = generateUUID();
    repository.accountUuid = params.accountUuid;
    repository.name = params.name;
    repository.type = params.type;
    repository.path = params.path;
    repository.description = params.description;
    repository.config = RepositoryConfig.default(params.config);
    repository.stats = RepositoryStats.empty();
    repository.status = RepositoryStatus.ACTIVE;
    repository.createdAt = new Date();
    repository.updatedAt = new Date();
    
    // 3. 发布领域事件
    repository.addDomainEvent({
      eventType: 'RepositoryCreated',
      aggregateId: repository.uuid,
      payload: { name: repository.name, type: repository.type }
    });
    
    return repository;
  }
  
  // === 业务方法 ===
  
  // 1. 更新配置
  updateConfig(config: Partial<RepositoryConfig>): void {
    this.config = this.config.merge(config);
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'RepositoryConfigUpdated',
      aggregateId: this.uuid,
      payload: { config: this.config }
    });
  }
  
  // 2. 归档仓储
  archive(): void {
    if (this.status === RepositoryStatus.DELETED) {
      throw new Error('已删除的仓储无法归档');
    }
    
    this.status = RepositoryStatus.ARCHIVED;
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'RepositoryArchived',
      aggregateId: this.uuid
    });
  }
  
  // 3. 激活仓储
  activate(): void {
    if (this.status === RepositoryStatus.DELETED) {
      throw new Error('已删除的仓储无法激活');
    }
    
    this.status = RepositoryStatus.ACTIVE;
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'RepositoryActivated',
      aggregateId: this.uuid
    });
  }
  
  // 4. 软删除
  softDelete(): void {
    this.status = RepositoryStatus.DELETED;
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'RepositoryDeleted',
      aggregateId: this.uuid
    });
  }
  
  // 5. 更新统计
  refreshStats(stats: Partial<RepositoryStats>): void {
    this.stats = this.stats.merge(stats);
    this.markAsModified();
  }
  
  // 6. 初始化 Git
  initGit(gitUrl: string): void {
    if (!this.isValidGitUrl(gitUrl)) {
      throw new Error('Git URL 格式不正确');
    }
    
    this.git = GitInfo.create(gitUrl);
    this.markAsModified();
    
    this.addDomainEvent({
      eventType: 'RepositoryGitInitialized',
      aggregateId: this.uuid,
      payload: { gitUrl }
    });
  }
  
  // 7. 记录访问
  recordAccess(): void {
    this.lastAccessedAt = new Date();
    this.markAsModified();
  }
  
  // === 私有辅助方法 ===
  
  private static isValidPath(path: string): boolean {
    // 简化的路径验证（实际可用更严格的正则）
    return /^[a-zA-Z0-9_\-\/\.]+$/.test(path);
  }
  
  private isValidGitUrl(url: string): boolean {
    return /^(https?|git):\/\/.+\.git$/.test(url);
  }
}

// === 枚举 ===

export enum RepositoryType {
  MARKDOWN = 'MARKDOWN',  // Markdown 知识库
  CODE = 'CODE',          // 代码仓储
  MIXED = 'MIXED',        // 混合类型
}

export enum RepositoryStatus {
  ACTIVE = 'ACTIVE',      // 激活
  ARCHIVED = 'ARCHIVED',  // 归档
  DELETED = 'DELETED',    // 已删除
}
```

### 值对象

```typescript
// RepositoryConfig
export class RepositoryConfig extends ValueObject {
  searchEngine: 'postgres' | 'meilisearch' | 'elasticsearch';
  enableGit: boolean;
  autoSync: boolean;
  syncInterval: number;  // 分钟
  
  static default(partial?: Partial<RepositoryConfig>): RepositoryConfig {
    return new RepositoryConfig({
      searchEngine: 'postgres',
      enableGit: false,
      autoSync: false,
      syncInterval: 30,
      ...partial,
    });
  }
  
  merge(partial: Partial<RepositoryConfig>): RepositoryConfig {
    return new RepositoryConfig({ ...this, ...partial });
  }
}

// RepositoryStats
export class RepositoryStats extends ValueObject {
  resourceCount: number;
  folderCount: number;
  totalSize: number;  // 字节
  linkCount: number;
  
  static empty(): RepositoryStats {
    return new RepositoryStats({
      resourceCount: 0,
      folderCount: 0,
      totalSize: 0,
      linkCount: 0,
    });
  }
  
  merge(partial: Partial<RepositoryStats>): RepositoryStats {
    return new RepositoryStats({ ...this, ...partial });
  }
}

// GitInfo
export class GitInfo extends ValueObject {
  remoteUrl: string;
  branch: string;
  lastCommit?: string;
  lastPush?: Date;
  
  static create(remoteUrl: string): GitInfo {
    return new GitInfo({
      remoteUrl,
      branch: 'main',
    });
  }
}
```

---

## 2️⃣ Folder 实体

### 职责

管理文件夹的树形层级结构

### TypeScript 定义

```typescript
export class FolderServer extends Entity {
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string;      
  name: string;             
  path: string;             // 完整路径 /docs/tech/vue
  order: number;            
  isExpanded: boolean;      
  
  metadata: FolderMetadata; 
  
  createdAt: Date;
  updatedAt: Date;
  
  // === 静态工厂方法 ===
  
  static create(params: {
    repositoryUuid: string;
    name: string;
    parentUuid?: string;
    parentPath?: string;
    order?: number;
  }): FolderServer {
    // 验证
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('文件夹名称不能为空');
    }
    
    const folder = new FolderServer();
    folder.uuid = generateUUID();
    folder.repositoryUuid = params.repositoryUuid;
    folder.parentUuid = params.parentUuid;
    folder.name = params.name;
    folder.path = folder.generatePath(params.parentPath);
    folder.order = params.order ?? 0;
    folder.isExpanded = true;
    folder.metadata = FolderMetadata.default();
    folder.createdAt = new Date();
    folder.updatedAt = new Date();
    
    return folder;
  }
  
  // === 业务方法 ===
  
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('文件夹名称不能为空');
    }
    
    this.name = newName;
    // 注意：重命名后需要更新 path，并递归更新所有子文件夹的 path
    this.markAsModified();
  }
  
  moveTo(newParentUuid: string | null, newParentPath?: string): void {
    this.parentUuid = newParentUuid ?? undefined;
    this.path = this.generatePath(newParentPath);
    this.markAsModified();
  }
  
  updateOrder(newOrder: number): void {
    this.order = newOrder;
    this.markAsModified();
  }
  
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.markAsModified();
  }
  
  updateMetadata(metadata: Partial<FolderMetadata>): void {
    this.metadata = this.metadata.merge(metadata);
    this.markAsModified();
  }
  
  // === 私有辅助方法 ===
  
  private generatePath(parentPath?: string): string {
    if (!parentPath) {
      return `/${this.name}`;
    }
    return `${parentPath}/${this.name}`;
  }
}

// 值对象
export class FolderMetadata extends ValueObject {
  icon?: string;       
  color?: string;      
  description?: string;
  
  static default(): FolderMetadata {
    return new FolderMetadata({});
  }
  
  merge(partial: Partial<FolderMetadata>): FolderMetadata {
    return new FolderMetadata({ ...this, ...partial });
  }
}
```

---

## 3️⃣ Resource 实体

### 职责

管理知识库中的各类资源（Markdown、图片、视频等）

### TypeScript 定义

```typescript
export class ResourceServer extends Entity {
  uuid: string;
  repositoryUuid: string;
  folderUuid?: string;      
  name: string;             
  type: ResourceType;       
  path: string;             
  size: number;             
  content?: string;         // Markdown 内容
  description?: string;
  author?: string;
  version?: string;         
  tags: string[];
  category?: string;
  status: ResourceStatus;   
  
  metadata: ResourceMetadata;
  stats: ResourceStats;     
  
  createdAt: Date;
  updatedAt: Date;
  modifiedAt?: Date;        
  
  // === 静态工厂方法 ===
  
  static create(params: {
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    folderUuid?: string;
    content?: string;
    tags?: string[];
  }): ResourceServer {
    // 验证
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('资源名称不能为空');
    }
    
    const resource = new ResourceServer();
    resource.uuid = generateUUID();
    resource.repositoryUuid = params.repositoryUuid;
    resource.folderUuid = params.folderUuid;
    resource.name = params.name;
    resource.type = params.type;
    resource.path = resource.generatePath();
    resource.size = params.content ? params.content.length : 0;
    resource.content = params.content;
    resource.tags = params.tags ?? [];
    resource.status = ResourceStatus.ACTIVE;
    resource.metadata = ResourceMetadata.fromContent(params.content ?? '');
    resource.stats = ResourceStats.empty();
    resource.createdAt = new Date();
    resource.updatedAt = new Date();
    
    return resource;
  }
  
  // === 业务方法 ===
  
  // 1. 更新内容（仅 Markdown）
  updateContent(content: string, changedBy: string): void {
    if (this.type !== ResourceType.MARKDOWN) {
      throw new Error('只有 Markdown 类型的资源可以更新内容');
    }
    
    this.content = content;
    this.size = content.length;
    this.modifiedAt = new Date();
    this.refreshMetadata();
    this.markAsModified();
    
    // 发布内容更新事件（触发版本创建）
    this.addDomainEvent({
      eventType: 'ResourceContentUpdated',
      aggregateId: this.uuid,
      payload: { changedBy, content }
    });
  }
  
  // 2. 添加/删除标签
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.markAsModified();
    }
  }
  
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.markAsModified();
    }
  }
  
  // 3. 移动到新文件夹
  moveTo(folderUuid: string | null): void {
    this.folderUuid = folderUuid ?? undefined;
    this.path = this.generatePath();
    this.markAsModified();
  }
  
  // 4. 重命名
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('资源名称不能为空');
    }
    
    this.name = newName;
    this.path = this.generatePath();
    this.markAsModified();
  }
  
  // 5. 归档/激活
  archive(): void {
    this.status = ResourceStatus.ARCHIVED;
    this.markAsModified();
  }
  
  activate(): void {
    this.status = ResourceStatus.ACTIVE;
    this.markAsModified();
  }
  
  // 6. 记录访问和编辑
  recordView(): void {
    this.stats = this.stats.incrementView();
    this.markAsModified();
  }
  
  recordEdit(): void {
    this.stats = this.stats.incrementEdit();
    this.markAsModified();
  }
  
  // 7. 刷新元数据
  refreshMetadata(): void {
    if (this.content) {
      this.metadata = ResourceMetadata.fromContent(this.content);
    }
  }
  
  // === 私有辅助方法 ===
  
  private generatePath(): string {
    // 简化实现：实际需要查询 folder 的完整路径
    return `${this.folderUuid ? '/folder/' + this.folderUuid : ''}/${this.name}`;
  }
}

// 枚举
export enum ResourceType {
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  LINK = 'link',
  CODE = 'code',
  OTHER = 'other',
}

export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  DRAFT = 'DRAFT',
}

// 值对象
export class ResourceMetadata extends ValueObject {
  wordCount?: number;       
  readingTime?: number;     
  lastEditor?: string;      
  thumbnail?: string;       
  duration?: number;        
  fileHash?: string;        
  
  static fromContent(content: string): ResourceMetadata {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // 假设每分钟 200 字
    
    return new ResourceMetadata({ wordCount, readingTime });
  }
  
  static empty(): ResourceMetadata {
    return new ResourceMetadata({});
  }
}

export class ResourceStats extends ValueObject {
  viewCount: number = 0;    
  editCount: number = 0;    
  linkCount: number = 0;    
  commentCount: number = 0; 
  lastViewedAt?: Date;
  lastEditedAt?: Date;
  
  static empty(): ResourceStats {
    return new ResourceStats({
      viewCount: 0,
      editCount: 0,
      linkCount: 0,
      commentCount: 0,
    });
  }
  
  incrementView(): ResourceStats {
    return new ResourceStats({
      ...this,
      viewCount: this.viewCount + 1,
      lastViewedAt: new Date(),
    });
  }
  
  incrementEdit(): ResourceStats {
    return new ResourceStats({
      ...this,
      editCount: this.editCount + 1,
      lastEditedAt: new Date(),
    });
  }
}
```

继续创建第2个文档的剩余部分...

---

## 4️⃣ ResourceVersion 实体

### 职责

管理资源的历史版本（Git 风格）

### TypeScript 定义

```typescript
export class ResourceVersionServer extends Entity {
  uuid: string;
  resourceUuid: string;
  versionNumber: number;        
  content: string;              
  changeType: VersionChangeType;
  changeDescription?: string;   // Commit Message
  changedBy: string;            
  restoredFrom?: string;        
  
  metadata: VersionMetadata;    
  
  createdAt: Date;
  
  // === 静态工厂方法 ===
  
  static create(params: {
    resourceUuid: string;
    versionNumber: number;
    content: string;
    changeType: VersionChangeType;
    changedBy: string;
    changeDescription?: string;
    oldContent?: string;
  }): ResourceVersionServer {
    const version = new ResourceVersionServer();
    version.uuid = generateUUID();
    version.resourceUuid = params.resourceUuid;
    version.versionNumber = params.versionNumber;
    version.content = params.content;
    version.changeType = params.changeType;
    version.changedBy = params.changedBy;
    version.changeDescription = params.changeDescription;
    version.metadata = VersionMetadata.fromDiff(
      params.oldContent ?? '',
      params.content
    );
    version.createdAt = new Date();
    
    return version;
  }
  
  // === 业务方法 ===
  
  restore(): ResourceVersionServer {
    // 创建一个新版本，类型为 RESTORE
    return ResourceVersionServer.create({
      resourceUuid: this.resourceUuid,
      versionNumber: this.versionNumber + 1,
      content: this.content,
      changeType: VersionChangeType.RESTORE,
      changedBy: this.changedBy,
      changeDescription: `恢复到版本 ${this.versionNumber}`,
    });
  }
}

export enum VersionChangeType {
  INITIAL = 'initial',
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  RESTORE = 'restore',
}

export class VersionMetadata extends ValueObject {
  addedChars: number = 0;
  deletedChars: number = 0;
  modifiedLines: number = 0;
  
  static fromDiff(oldContent: string, newContent: string): VersionMetadata {
    // 简化实现：实际应使用 diff 算法（如 diff-match-patch）
    const added = Math.max(newContent.length - oldContent.length, 0);
    const deleted = Math.max(oldContent.length - newContent.length, 0);
    
    return new VersionMetadata({
      addedChars: added,
      deletedChars: deleted,
      modifiedLines: 1, // 简化
    });
  }
}
```

---

## 5️⃣ ResourceLink 实体

### 职责

管理资源之间的双向链接关系（Obsidian `[[]]` 语法）

### TypeScript 定义

```typescript
export class ResourceLinkServer extends Entity {
  uuid: string;
  sourceResourceUuid: string;   
  targetResourceUuid?: string;  // null = 断链
  linkType: ResourceLinkType;   
  linkText: string;             // "[[项目计划]]"
  lineNumber?: number;          
  context?: string;             // 上下文片段
  isBroken: boolean;            
  
  createdAt: Date;
  updatedAt: Date;
  
  // === 静态工厂方法 ===
  
  static create(params: {
    sourceResourceUuid: string;
    targetResourceUuid?: string;
    linkType: ResourceLinkType;
    linkText: string;
    lineNumber?: number;
    context?: string;
  }): ResourceLinkServer {
    const link = new ResourceLinkServer();
    link.uuid = generateUUID();
    link.sourceResourceUuid = params.sourceResourceUuid;
    link.targetResourceUuid = params.targetResourceUuid;
    link.linkType = params.linkType;
    link.linkText = params.linkText;
    link.lineNumber = params.lineNumber;
    link.context = params.context;
    link.isBroken = !params.targetResourceUuid;
    link.createdAt = new Date();
    link.updatedAt = new Date();
    
    return link;
  }
  
  // === 业务方法 ===
  
  markAsBroken(): void {
    this.isBroken = true;
    this.targetResourceUuid = undefined;
    this.markAsModified();
  }
  
  repairLink(newTargetUuid: string): void {
    this.targetResourceUuid = newTargetUuid;
    this.isBroken = false;
    this.markAsModified();
  }
  
  updateContext(context: string, lineNumber: number): void {
    this.context = context;
    this.lineNumber = lineNumber;
    this.markAsModified();
  }
  
  validate(targetExists: boolean): void {
    if (!targetExists && !this.isBroken) {
      this.markAsBroken();
    } else if (targetExists && this.isBroken) {
      this.isBroken = false;
      this.markAsModified();
    }
  }
}

export enum ResourceLinkType {
  BIDIRECTIONAL = 'BIDIRECTIONAL',  // [[目标]]
  EMBED = 'EMBED',                  // ![[图片]]
  REFERENCE = 'REFERENCE',          // [链接](url)
}
```

---

## 6️⃣ 领域服务设计

### LinkParserService（链接解析服务）

```typescript
export class LinkParserService {
  /**
   * 解析 Markdown 内容中的链接
   * 支持 Obsidian 语法：[[链接]] 和 ![[嵌入]]
   */
  parseLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    const lines = content.split('\n');
    
    // 正则匹配 [[xxx]] 和 ![[xxx]]
    const linkRegex = /(!?)\[\[([^\]]+)\]\]/g;
    
    lines.forEach((line, index) => {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        const isEmbed = match[1] === '!';
        const linkText = match[2];
        const position = match.index;
        const context = this.extractContext(line, position, 50);
        
        links.push({
          linkType: isEmbed ? ResourceLinkType.EMBED : ResourceLinkType.BIDIRECTIONAL,
          linkText,
          lineNumber: index + 1,
          context,
        });
      }
    });
    
    return links;
  }
  
  private extractContext(line: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(line.length, position + radius);
    return line.substring(start, end);
  }
}

interface ParsedLink {
  linkType: ResourceLinkType;
  linkText: string;
  lineNumber: number;
  context: string;
}
```

### FolderHierarchyService（文件夹层级服务）

```typescript
export class FolderHierarchyService {
  /**
   * 获取文件夹的完整路径
   */
  async getFullPath(
    folderUuid: string,
    folderRepository: IFolderRepository
  ): Promise<string> {
    const pathSegments: string[] = [];
    let currentUuid: string | undefined = folderUuid;
    
    while (currentUuid) {
      const folder = await folderRepository.findByUuid(currentUuid);
      if (!folder) break;
      
      pathSegments.unshift(folder.name);
      currentUuid = folder.parentUuid;
    }
    
    return '/' + pathSegments.join('/');
  }
  
  /**
   * 检测循环引用
   */
  async detectCycle(
    folderUuid: string,
    newParentUuid: string,
    folderRepository: IFolderRepository
  ): Promise<boolean> {
    let currentUuid: string | undefined = newParentUuid;
    
    while (currentUuid) {
      if (currentUuid === folderUuid) {
        return true; // 检测到循环
      }
      
      const folder = await folderRepository.findByUuid(currentUuid);
      currentUuid = folder?.parentUuid;
    }
    
    return false;
  }
}
```

---

## 7️⃣ 业务规则与不变式

### Repository 聚合根

| 业务规则 | 类型 | 验证时机 |
|---------|------|---------|
| 仓储名称不能为空 | 必填 | 创建、更新 |
| 仓储名称在同一账户下唯一 | 唯一性 | 创建、更新 |
| 仓储路径格式正确 | 格式 | 创建 |
| 已删除的仓储无法归档或激活 | 状态转换 | 归档、激活 |
| Git URL 格式正确 | 格式 | 初始化 Git |

### Folder 实体

| 业务规则 | 类型 | 验证时机 |
|---------|------|---------|
| 文件夹名称不能为空 | 必填 | 创建、重命名 |
| 文件夹名称在同一父文件夹下唯一 | 唯一性 | 创建、重命名 |
| 移动文件夹时不能产生循环引用 | 引用完整性 | 移动 |
| 删除文件夹时级联删除所有子文件夹和资源 | 级联删除 | 删除 |

### Resource 实体

| 业务规则 | 类型 | 验证时机 |
|---------|------|---------|
| 资源名称不能为空 | 必填 | 创建、重命名 |
| 资源名称在同一文件夹下唯一 | 唯一性 | 创建、重命名 |
| 只有 MARKDOWN 类型可以更新 content | 类型约束 | 更新内容 |
| 更新内容时自动创建版本 | 自动化 | 更新内容 |
| 删除资源时检测断链并标记 | 引用完整性 | 删除 |

### ResourceLink 实体

| 业务规则 | 类型 | 验证时机 |
|---------|------|---------|
| 目标资源不存在时标记为断链 | 引用完整性 | 创建、验证 |
| 修复断链时验证目标资源存在 | 引用完整性 | 修复 |
| 解析 Markdown 时自动创建链接记录 | 自动化 | 资源内容更新 |

---

## 📝 总结

本文档完整定义了仓储模块的领域模型，包括：

| 组件类型 | 数量 | 说明 |
|---------|------|------|
| 聚合根 | 1 | Repository |
| 实体 | 4 | Folder, Resource, ResourceVersion, ResourceLink |
| 值对象 | 7 | RepositoryConfig, RepositoryStats, GitInfo, FolderMetadata, ResourceMetadata, ResourceStats, VersionMetadata |
| 领域服务 | 2 | LinkParserService, FolderHierarchyService |
| 业务规则 | 15+ | 覆盖创建、更新、删除、状态转换等场景 |

### 下一步

1. ✅ 数据库架构设计（见 01-DATABASE_SCHEMA_DESIGN.md）
2. ✅ 领域模型设计（本文档）
3. ⏭️ 应用服务接口设计（见 03-APPLICATION_SERVICE_DESIGN.md）
4. ⏭️ RESTful API 设计（见 04-API_ENDPOINT_DESIGN.md）
5. ⏭️ 前端交互设计（见 05-FRONTEND_UX_DESIGN.md）

---

**文档作者**: BA - Business Analyst  
**审核人员**: PM - John  
**最后更新**: 2025-11-09
