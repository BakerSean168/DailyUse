/**
 * Goal 聚合根实现 (Client)
 */

import { GoalContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  GoalMetadataClient,
  GoalTimeRangeClient,
  GoalReminderConfigClient,
} from '../value-objects';
import { KeyResultClient, GoalReviewClient } from '../entities';

// 类型别名（从命名空间导入）
type IGoalClient = GoalContracts.GoalClient;
type GoalClientDTO = GoalContracts.GoalClientDTO;
type GoalServerDTO = GoalContracts.GoalServerDTO;
type GoalStatus = GoalContracts.GoalStatus;
type ImportanceLevel = GoalContracts.ImportanceLevel;
type UrgencyLevel = GoalContracts.UrgencyLevel;

// 枚举值别名
const GoalStatus = GoalContracts.GoalStatus;
const ImportanceLevel = GoalContracts.ImportanceLevel;
const UrgencyLevel = GoalContracts.UrgencyLevel;

export class GoalClient extends AggregateRoot implements IGoalClient {
  private _accountUuid: string;
  private _title: string;
  private _description?: string | null;
  private _color?: string | null; // 主题色
  private _feasibilityAnalysis?: string | null; // 可行性分析
  private _motivation?: string | null; // 实现动机
  private _status: GoalStatus;
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _category?: string | null;
  private _tags: string[];
  private _startDate?: number | null;
  private _targetDate?: number | null;
  private _completedAt?: number | null;
  private _archivedAt?: number | null;
  private _folderUuid?: string | null;
  private _parentGoalUuid?: string | null;
  private _sortOrder: number;
  private _reminderConfig?: GoalReminderConfigClient | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  // 子实体集合
  private _keyResults: KeyResultClient[];
  private _reviews: GoalReviewClient[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    color?: string | null;
    feasibilityAnalysis?: string | null;
    motivation?: string | null;
    status: GoalStatus;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    category?: string | null;
    tags?: string[];
    startDate?: number | null;
    targetDate?: number | null;
    completedAt?: number | null;
    archivedAt?: number | null;
    folderUuid?: string | null;
    parentGoalUuid?: string | null;
    sortOrder?: number;
    reminderConfig?: GoalReminderConfigClient | null;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
    keyResults?: KeyResultClient[];
    reviews?: GoalReviewClient[];
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._color = params.color;
    this._feasibilityAnalysis = params.feasibilityAnalysis;
    this._motivation = params.motivation;
    this._status = params.status;
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._category = params.category;
    this._tags = params.tags ?? [];
    this._startDate = params.startDate;
    this._targetDate = params.targetDate;
    this._completedAt = params.completedAt;
    this._archivedAt = params.archivedAt;
    this._folderUuid = params.folderUuid;
    this._parentGoalUuid = params.parentGoalUuid;
    this._sortOrder = params.sortOrder ?? 0;
    this._reminderConfig = params.reminderConfig;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._keyResults = params.keyResults ?? [];
    this._reviews = params.reviews ?? [];
  }

  // Getters - 基础属性
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get color(): string | null | undefined {
    return this._color;
  }
  public get feasibilityAnalysis(): string | null | undefined {
    return this._feasibilityAnalysis;
  }
  public get motivation(): string | null | undefined {
    return this._motivation;
  }
  public get status(): GoalStatus {
    return this._status;
  }
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get urgency(): UrgencyLevel {
    return this._urgency;
  }
  public get category(): string | null | undefined {
    return this._category;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get startDate(): number | null | undefined {
    return this._startDate;
  }
  public get targetDate(): number | null | undefined {
    return this._targetDate;
  }
  public get completedAt(): number | null | undefined {
    return this._completedAt;
  }
  public get archivedAt(): number | null | undefined {
    return this._archivedAt;
  }
  public get folderUuid(): string | null | undefined {
    return this._folderUuid;
  }
  public get parentGoalUuid(): string | null | undefined {
    return this._parentGoalUuid;
  }
  public get sortOrder(): number {
    return this._sortOrder;
  }
  public get reminderConfig(): GoalContracts.GoalReminderConfigClientDTO | null | undefined {
    return this._reminderConfig?.toClientDTO() ?? null;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // 子实体访问
  public get keyResults(): GoalContracts.KeyResultClient[] | null {
    return this._keyResults.length > 0 ? [...this._keyResults] : null;
  }
  public get reviews(): GoalContracts.GoalReviewClient[] | null {
    return this._reviews.length > 0 ? [...this._reviews] : null;
  }

  // UI 计算属性
  public get overallProgress(): number {
    if (this._keyResults.length === 0) return 0;
    const total = this._keyResults.reduce((sum, kr) => sum + kr.progressPercentage, 0);
    return Math.round(total / this._keyResults.length);
  }

  public get isDeleted(): boolean {
    return !!this._deletedAt;
  }

  public get isCompleted(): boolean {
    return this._status === GoalStatus.COMPLETED;
  }

  public get isArchived(): boolean {
    return this._status === GoalStatus.ARCHIVED;
  }

  public get isOverdue(): boolean {
    if (!this._targetDate || this.isCompleted) return false;
    return Date.now() > this._targetDate;
  }

  public get daysRemaining(): number | null {
    if (!this._targetDate || this.isCompleted) return null;
    const days = Math.ceil((this._targetDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  public get statusText(): string {
    const statusLabels: Record<GoalStatus, string> = {
      [GoalStatus.DRAFT]: '草稿',
      [GoalStatus.ACTIVE]: '进行中',
      [GoalStatus.COMPLETED]: '已完成',
      [GoalStatus.ARCHIVED]: '已归档',
    };
    return statusLabels[this._status];
  }

  public get importanceText(): string {
    return this._importance || '未知';
  }

  public get urgencyText(): string {
    return this._urgency || '未知';
  }

  public get priorityScore(): number {
    const ImportanceLevelMap = {
      [ImportanceLevel.Trivial]: 1,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Vital]: 5,
    };
    const UrgencyLevelMap = {
      [UrgencyLevel.None]: 1,
      [UrgencyLevel.Low]: 2,
      [UrgencyLevel.Medium]: 3,
      [UrgencyLevel.High]: 4,
      [UrgencyLevel.Critical]: 5,
    };
    return (ImportanceLevelMap[this._importance] || 0) + (UrgencyLevelMap[this._urgency] || 0);
  }

  public get keyResultCount(): number {
    return this._keyResults.length;
  }

  public get completedKeyResultCount(): number {
    return this._keyResults.filter((kr) => kr.isCompleted).length;
  }

  public get reviewCount(): number {
    return this._reviews.length;
  }

  public get hasActiveReminders(): boolean {
    return !!this._reminderConfig?.hasActiveTriggers();
  }

  public get reminderSummary(): string | null {
    return this._reminderConfig?.triggerSummary ?? null;
  }

  /**
   * 分析信息（兼容前端 UI 使用的属性结构）
   * 将 motivation 和 feasibilityAnalysis 映射为 analysis 对象
   */
  public get analysis(): { motive?: string; feasibility?: string } {
    return {
      motive: this._motivation || undefined,
      feasibility: this._feasibilityAnalysis || undefined,
    };
  }

  // 子实体工厂方法
  public createKeyResult(params: {
    title: string;
    description?: string;
    valueType: string;
    targetValue: number;
    unit?: string;
    weight: number;
  }): GoalContracts.KeyResultClient {
    const keyResult = KeyResultClient.forCreate(this._uuid);
    // 这里应该设置参数，但由于 forCreate 返回的是预设的实例
    // 在实际使用中需要支持参数传递或在创建后更新
    return keyResult;
  }

  public createReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalContracts.GoalReviewClient {
    const review = GoalReviewClient.forCreate(this._uuid);
    return review;
  }

  // 子实体管理方法
  public addKeyResult(keyResult: GoalContracts.KeyResultClient): void {
    if (!(keyResult instanceof KeyResultClient)) {
      throw new Error('keyResult must be an instance of KeyResultClient');
    }
    this._keyResults.push(keyResult);
    this._updatedAt = Date.now();
  }

  public removeKeyResult(keyResultUuid: string): GoalContracts.KeyResultClient | null {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) return null;
    const removed = this._keyResults.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public updateKeyResult(
    keyResultUuid: string,
    updates: Partial<GoalContracts.KeyResultClient>,
  ): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) throw new Error('KeyResult not found');
    // 由于 KeyResult 是不可变的，需要重新创建
    const current = this._keyResults[index];
    const dto = current.toClientDTO();
    const updated = KeyResultClient.fromClientDTO({ ...dto, ...updates });
    this._keyResults[index] = updated;
    this._updatedAt = Date.now();
  }

  public reorderKeyResults(keyResultUuids: string[]): void {
    const reordered = keyResultUuids
      .map((uuid) => this._keyResults.find((kr) => kr.uuid === uuid))
      .filter((kr): kr is KeyResultClient => !!kr);
    this._keyResults = reordered;
    this._updatedAt = Date.now();
  }

  public getKeyResult(uuid: string): GoalContracts.KeyResultClient | null {
    return this._keyResults.find((kr) => kr.uuid === uuid) ?? null;
  }

  public getAllKeyResults(): GoalContracts.KeyResultClient[] {
    return [...this._keyResults];
  }

  // 属性修改方法
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = title.trim();
    this._updatedAt = Date.now();
  }

  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  public updateColor(color: string | null): void {
    this._color = color;
    this._updatedAt = Date.now();
  }

  public updateMotivation(motivation: string | null): void {
    this._motivation = motivation;
    this._updatedAt = Date.now();
  }

  public updateFeasibilityAnalysis(feasibilityAnalysis: string | null): void {
    this._feasibilityAnalysis = feasibilityAnalysis;
    this._updatedAt = Date.now();
  }

  public updateImportance(importance: ImportanceLevel): void {
    this._importance = importance;
    this._updatedAt = Date.now();
  }

  public updateUrgency(urgency: UrgencyLevel): void {
    this._urgency = urgency;
    this._updatedAt = Date.now();
  }

  public updateCategory(category: string | null): void {
    this._category = category;
    this._updatedAt = Date.now();
  }

  public updateTags(tags: string[]): void {
    this._tags = [...tags];
    this._updatedAt = Date.now();
  }

  public updateTimeRange(startDate: number | null, targetDate: number | null): void {
    if (startDate && targetDate && startDate > targetDate) {
      throw new Error('Start date cannot be after target date');
    }
    this._startDate = startDate;
    this._targetDate = targetDate;
    this._updatedAt = Date.now();
  }

  public updateStartDate(startDate: number | null): void {
    if (startDate && this._targetDate && startDate > this._targetDate) {
      throw new Error('Start date cannot be after target date');
    }
    this._startDate = startDate;
    this._updatedAt = Date.now();
  }

  public updateTargetDate(targetDate: number | null): void {
    if (this._startDate && targetDate && this._startDate > targetDate) {
      throw new Error('Target date cannot be before start date');
    }
    this._targetDate = targetDate;
    this._updatedAt = Date.now();
  }

  public updateFolder(folderUuid: string | null): void {
    this._folderUuid = folderUuid;
    this._updatedAt = Date.now();
  }

  public updateParentGoal(parentGoalUuid: string | null): void {
    this._parentGoalUuid = parentGoalUuid;
    this._updatedAt = Date.now();
  }

  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = Date.now();
  }

  public updateReminderConfig(reminderConfig: GoalReminderConfigClient | null): void {
    this._reminderConfig = reminderConfig;
    this._updatedAt = Date.now();
  }

  /**
   * 设置 accountUuid（用于保存前注入）
   * 仅在新建目标保存时调用
   */
  public setAccountUuid(accountUuid: string): void {
    if (this._accountUuid && this._accountUuid !== '') {
      throw new Error('AccountUuid is already set');
    }
    this._accountUuid = accountUuid;
  }

  // 状态变更方法
  public activate(): void {
    if (!this.canActivate()) {
      throw new Error('Goal cannot be activated in current status');
    }
    this._status = GoalStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  public complete(): void {
    if (!this.canComplete()) {
      throw new Error('Goal cannot be completed in current status');
    }
    this._status = GoalStatus.COMPLETED;
    this._completedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public archive(): void {
    if (!this.canArchive()) {
      throw new Error('Goal cannot be archived in current status');
    }
    this._status = GoalStatus.ARCHIVED;
    this._archivedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public reopen(): void {
    if (this._status !== GoalStatus.COMPLETED && this._status !== GoalStatus.ARCHIVED) {
      throw new Error('Only completed or archived goals can be reopened');
    }
    this._status = GoalStatus.ACTIVE;
    this._completedAt = null;
    this._archivedAt = null;
    this._updatedAt = Date.now();
  }

  public addReview(review: GoalContracts.GoalReviewClient): void {
    if (!(review instanceof GoalReviewClient)) {
      throw new Error('review must be an instance of GoalReviewClient');
    }
    this._reviews.push(review);
    this._updatedAt = Date.now();
  }

  public removeReview(reviewUuid: string): GoalContracts.GoalReviewClient | null {
    const index = this._reviews.findIndex((r) => r.uuid === reviewUuid);
    if (index === -1) return null;
    const removed = this._reviews.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getReviews(): GoalContracts.GoalReviewClient[] {
    return [...this._reviews];
  }

  public getLatestReview(): GoalContracts.GoalReviewClient | null {
    if (this._reviews.length === 0) return null;
    return this._reviews.sort((a, b) => b.reviewedAt - a.reviewedAt)[0];
  }

  // UI 业务方法
  public getDisplayTitle(): string {
    const maxLength = 50;
    if (this._title.length <= maxLength) return this._title;
    return `${this._title.substring(0, maxLength)}...`;
  }

  public getStatusBadge(): { text: string; color: string } {
    const badges: Record<GoalStatus, { text: string; color: string }> = {
      [GoalStatus.DRAFT]: { text: '草稿', color: 'gray' },
      [GoalStatus.ACTIVE]: { text: '进行中', color: 'blue' },
      [GoalStatus.COMPLETED]: { text: '已完成', color: 'green' },
      [GoalStatus.ARCHIVED]: { text: '已归档', color: 'amber' },
    };
    return badges[this._status];
  }

  public getPriorityBadge(): { text: string; color: string } {
    const score = this.priorityScore;
    if (score >= 7) return { text: '高优先级', color: 'red' };
    if (score >= 5) return { text: '中优先级', color: 'amber' };
    return { text: '低优先级', color: 'blue' };
  }

  public getProgressText(): string {
    const completed = this.completedKeyResultCount;
    const total = this.keyResultCount;
    const percentage = this.overallProgress;
    return `${completed}/${total} (${percentage}%)`;
  }

  public getDateRangeText(): string {
    if (!this._startDate && !this._targetDate) return '未设置时间';
    const start = this._startDate
      ? new Date(this._startDate).toLocaleDateString('zh-CN')
      : '未设置';
    const target = this._targetDate
      ? new Date(this._targetDate).toLocaleDateString('zh-CN')
      : '未设置';
    return `${start} 至 ${target}`;
  }

  public getReminderStatusText(): string {
    if (!this._reminderConfig) return '未设置提醒';
    return this._reminderConfig.statusText;
  }

  public getReminderIcon(): string {
    if (!this.hasActiveReminders) return '🔕';
    return '🔔';
  }

  public shouldShowReminderBadge(): boolean {
    return this.hasActiveReminders;
  }

  // 操作判断方法
  public canActivate(): boolean {
    return this._status === GoalStatus.DRAFT;
  }

  public canComplete(): boolean {
    return this._status === GoalStatus.ACTIVE;
  }

  public canArchive(): boolean {
    return this._status === GoalStatus.COMPLETED;
  }

  public canDelete(): boolean {
    return !this.isDeleted;
  }

  public canAddKeyResult(): boolean {
    return this._status === GoalStatus.DRAFT || this._status === GoalStatus.ACTIVE;
  }

  public canAddReview(): boolean {
    return true;
  }

  // DTO 转换
  public toServerDTO(includeChildren = false): GoalServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      status: this._status,
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults: includeChildren ? this._keyResults.map((kr) => kr.toServerDTO()) : undefined,
      reviews: includeChildren ? this._reviews.map((r) => r.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren = false): GoalClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults: includeChildren ? this._keyResults.map((kr) => kr.toClientDTO()) : undefined,
      reviews: includeChildren ? this._reviews.map((r) => r.toClientDTO()) : undefined,
      overallProgress: this.overallProgress,
      isDeleted: this.isDeleted,
      isCompleted: this.isCompleted,
      isArchived: this.isArchived,
      isOverdue: this.isOverdue,
      daysRemaining: this.daysRemaining,
      statusText: this.statusText,
      importanceText: this.importanceText,
      urgencyText: this.urgencyText,
      priorityScore: this.priorityScore,
      keyResultCount: this.keyResultCount,
      completedKeyResultCount: this.completedKeyResultCount,
      reviewCount: this.reviewCount,
      hasActiveReminders: this.hasActiveReminders,
      reminderSummary: this.reminderSummary,
    };
  }

  // 静态工厂方法
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    category?: string;
    tags?: string[];
    startDate?: number;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
  }): GoalClient {
    const now = Date.now();
    return new GoalClient({
      uuid: crypto.randomUUID(),
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      status: GoalStatus.DRAFT,
      importance: params.importance,
      urgency: params.urgency,
      category: params.category,
      tags: params.tags,
      startDate: params.startDate,
      targetDate: params.targetDate,
      folderUuid: params.folderUuid,
      parentGoalUuid: params.parentGoalUuid,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建新目标（用于前端表单）
   * accountUuid 会在保存时注入
   */
  public static forCreate(): GoalClient {
    const now = Date.now();
    return new GoalClient({
      uuid: crypto.randomUUID(), // 前端生成 UUID（乐观更新）
      accountUuid: '', // 占位符，保存时会被替换
      title: '',
      status: GoalStatus.DRAFT,
      importance: ImportanceLevel.Moderate,
      urgency: UrgencyLevel.Medium,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: GoalServerDTO): GoalClient {
    return new GoalClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status,
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category,
      tags: dto.tags,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
      folderUuid: dto.folderUuid,
      parentGoalUuid: dto.parentGoalUuid,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig
        ? GoalReminderConfigClient.fromServerDTO(dto.reminderConfig)
        : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      keyResults: dto.keyResults?.map((kr) => KeyResultClient.fromServerDTO(kr)),
      reviews: dto.reviews?.map((r) => GoalReviewClient.fromServerDTO(r)),
    });
  }

  public static fromClientDTO(dto: GoalClientDTO): GoalClient {
    return new GoalClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status,
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category,
      tags: dto.tags,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
      folderUuid: dto.folderUuid,
      parentGoalUuid: dto.parentGoalUuid,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig
        ? GoalReminderConfigClient.fromClientDTO(dto.reminderConfig)
        : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      keyResults: dto.keyResults?.map((kr) => KeyResultClient.fromClientDTO(kr)),
      reviews: dto.reviews?.map((r) => GoalReviewClient.fromClientDTO(r)),
    });
  }

  public clone(): GoalClient {
    return GoalClient.fromClientDTO(this.toClientDTO(true));
  }
}
