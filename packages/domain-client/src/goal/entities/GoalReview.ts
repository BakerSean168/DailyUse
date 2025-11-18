/**
 * GoalReview 实体实现 (Client)
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { GoalContracts as GC } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { KeyResultSnapshot } from '../value-objects/KeyResultSnapshot';

type IGoalReview = GoalContracts.GoalReviewClient;
type GoalReviewDTO = GoalContracts.GoalReviewClientDTO;
type GoalReviewServerDTO = GoalContracts.GoalReviewServerDTO;
type KeyResultSnapshotDTO = GoalContracts.KeyResultSnapshotClientDTO;
type ReviewType = GoalContracts.ReviewType;

export class GoalReview extends Entity implements IGoalReview {
  private _goalUuid: string;
  private _type: ReviewType;
  private _rating: number;
  private _summary: string;
  private _achievements?: string | null;
  private _challenges?: string | null;
  private _improvements?: string | null;
  private _keyResultSnapshots: KeyResultSnapshot[];
  private _reviewedAt: number;
  private _createdAt: number;

  private constructor(params: {
    uuid?: string;
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string | null;
    challenges?: string | null;
    improvements?: string | null;
    keyResultSnapshots: KeyResultSnapshot[];
    reviewedAt: number;
    createdAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._goalUuid = params.goalUuid;
    this._type = params.type;
    this._rating = params.rating;
    this._summary = params.summary;
    this._achievements = params.achievements;
    this._challenges = params.challenges;
    this._improvements = params.improvements;
    this._keyResultSnapshots = params.keyResultSnapshots;
    this._reviewedAt = params.reviewedAt;
    this._createdAt = params.createdAt;
  }

  // Getters
  public override get uuid(): string {
    return this._uuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get type(): ReviewType {
    return this._type;
  }
  public get rating(): number {
    return this._rating;
  }
  public get summary(): string {
    return this._summary;
  }
  public get achievements(): string | null | undefined {
    return this._achievements;
  }
  public get challenges(): string | null | undefined {
    return this._challenges;
  }
  public get improvements(): string | null | undefined {
    return this._improvements;
  }
  public get keyResultSnapshots(): KeyResultSnapshotDTO[] {
    return this._keyResultSnapshots.map((s) => s.toClientDTO());
  }
  public get reviewedAt(): number {
    return this._reviewedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // UI 辅助属性
  public get typeText(): string {
    const typeLabels: Record<ReviewType, string> = {
      [GC.ReviewType.WEEKLY]: '周复盘',
      [GC.ReviewType.MONTHLY]: '月复盘',
      [GC.ReviewType.QUARTERLY]: '季度复盘',
      [GC.ReviewType.ANNUAL]: '年度复盘',
      [GC.ReviewType.ADHOC]: '临时复盘',
    };
    return typeLabels[this._type] || '未知类型';
  }

  public get ratingText(): string {
    if (this._rating >= 9) return '优秀';
    if (this._rating >= 7) return '良好';
    if (this._rating >= 5) return '一般';
    if (this._rating >= 3) return '待改进';
    return '不满意';
  }

  public get formattedReviewedAt(): string {
    return new Date(this._reviewedAt).toLocaleDateString('zh-CN');
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleDateString('zh-CN');
  }

  public get ratingStars(): string {
    const fullStars = Math.floor(this._rating);
    const hasHalfStar = this._rating % 1 >= 0.5;
    return (
      '★'.repeat(fullStars) +
      (hasHalfStar ? '☆' : '') +
      '☆'.repeat(10 - fullStars - (hasHalfStar ? 1 : 0))
    );
  }

  public get displaySummary(): string {
    const maxLength = 100;
    if (this._summary.length <= maxLength) return this._summary;
    return `${this._summary.substring(0, maxLength)}...`;
  }

  // 实体方法
  public getRatingColor(): string {
    if (this._rating >= 8) return 'green';
    if (this._rating >= 6) return 'blue';
    if (this._rating >= 4) return 'amber';
    return 'red';
  }

  public getRatingIcon(): string {
    if (this._rating >= 8) return '😊';
    if (this._rating >= 6) return '🙂';
    if (this._rating >= 4) return '😐';
    return '😢';
  }

  public hasAchievements(): boolean {
    return !!this._achievements && this._achievements.trim().length > 0;
  }

  public hasChallenges(): boolean {
    return !!this._challenges && this._challenges.trim().length > 0;
  }

  public hasImprovements(): boolean {
    return !!this._improvements && this._improvements.trim().length > 0;
  }

  public getSnapshotCount(): number {
    return this._keyResultSnapshots.length;
  }

  // 更新方法（参考 Goal 实体实现）
  public updateRating(rating: number): boolean {
    if (rating < 0 || rating > 10) {
      console.error('Rating must be between 0 and 10');
      return false;
    }
    this._rating = rating;
    return true;
  }

  public updateSummary(summary: string): boolean {
    this._summary = summary;
    return true;
  }

  public updateAchievements(achievements: string): boolean {
    this._achievements = achievements;
    return true;
  }

  public updateChallenges(challenges: string): boolean {
    this._challenges = challenges;
    return true;
  }

  public updateImprovements(improvements: string): boolean {
    this._improvements = improvements;
    return true;
  }

  public updateType(type: ReviewType): boolean {
    this._type = type;
    return true;
  }

  public updateReviewedAt(reviewedAt: number): boolean {
    this._reviewedAt = reviewedAt;
    return true;
  }

  // DTO 转换
  public toClientDTO(): GoalReviewDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this.keyResultSnapshots,
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt,
      typeText: this.typeText,
      ratingText: this.ratingText,
      formattedReviewedAt: this.formattedReviewedAt,
      formattedCreatedAt: this.formattedCreatedAt,
      ratingStars: this.ratingStars,
      displaySummary: this.displaySummary,
    };
  }

  public toServerDTO(): GoalReviewServerDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      type: this._type,
      rating: this._rating,
      summary: this._summary,
      achievements: this._achievements,
      challenges: this._challenges,
      improvements: this._improvements,
      keyResultSnapshots: this._keyResultSnapshots.map((s) => s.toServerDTO()),
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalReviewDTO): GoalReview {
    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: dto.keyResultSnapshots.map((s) =>
        KeyResultSnapshot.fromClientDTO(s),
      ),
      reviewedAt: dto.reviewedAt,
      createdAt: dto.createdAt,
    });
  }

  public static fromServerDTO(dto: GoalReviewServerDTO): GoalReview {
    return new GoalReview({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      type: dto.type,
      rating: dto.rating,
      summary: dto.summary,
      achievements: dto.achievements,
      challenges: dto.challenges,
      improvements: dto.improvements,
      keyResultSnapshots: dto.keyResultSnapshots.map((s) =>
        KeyResultSnapshot.fromServerDTO(s),
      ),
      reviewedAt: dto.reviewedAt,
      createdAt: dto.createdAt,
    });
  }

  public static forCreate(goalUuid: string): GoalReview {
    const now = Date.now();
    return new GoalReview({
      uuid: crypto.randomUUID(),
      goalUuid,
      type: GC.ReviewType.ADHOC,
      rating: 5,
      summary: '',
      keyResultSnapshots: [],
      reviewedAt: now,
      createdAt: now,
    });
  }

  public clone(): GoalReview {
    return GoalReview.fromClientDTO(this.toClientDTO());
  }
}
