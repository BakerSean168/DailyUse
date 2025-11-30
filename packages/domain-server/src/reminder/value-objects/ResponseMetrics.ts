/**
 * ResponseMetrics 值对象
 * 响应指标 - 不可变值对象
 */

import type {
  ResponseMetricsServerDTO,
  ResponseMetricsClientDTO,
} from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ResponseMetrics 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 封装业务逻辑（效果评分、效果等级判断）
 */
export class ResponseMetrics extends ValueObject implements ResponseMetricsServerDTO {
  public readonly clickRate: number;
  public readonly ignoreRate: number;
  public readonly avgResponseTime: number;
  public readonly snoozeCount: number;
  public readonly effectivenessScore: number;
  public readonly sampleSize: number;
  public readonly lastAnalysisTime: number;

  constructor(params: {
    clickRate: number;
    ignoreRate: number;
    avgResponseTime: number;
    snoozeCount: number;
    effectivenessScore: number;
    sampleSize: number;
    lastAnalysisTime: number;
  }) {
    super();

    // 验证
    if (params.clickRate < 0 || params.clickRate > 100) {
      throw new Error('clickRate must be between 0 and 100');
    }
    if (params.ignoreRate < 0 || params.ignoreRate > 100) {
      throw new Error('ignoreRate must be between 0 and 100');
    }
    if (params.avgResponseTime < 0) {
      throw new Error('avgResponseTime must be non-negative');
    }
    if (params.effectivenessScore < 0 || params.effectivenessScore > 100) {
      throw new Error('effectivenessScore must be between 0 and 100');
    }
    if (params.sampleSize < 0) {
      throw new Error('sampleSize must be non-negative');
    }

    this.clickRate = params.clickRate;
    this.ignoreRate = params.ignoreRate;
    this.avgResponseTime = params.avgResponseTime;
    this.snoozeCount = params.snoozeCount;
    this.effectivenessScore = params.effectivenessScore;
    this.sampleSize = params.sampleSize;
    this.lastAnalysisTime = params.lastAnalysisTime;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建新的 ResponseMetrics（工厂方法）
   */
  public static create(params: {
    clickRate: number;
    ignoreRate: number;
    avgResponseTime: number;
    snoozeCount?: number;
    sampleSize: number;
  }): ResponseMetrics {
    // 计算效果评分
    const effectivenessScore = ResponseMetrics.calculateEffectivenessScore({
      clickRate: params.clickRate,
      ignoreRate: params.ignoreRate,
      avgResponseTime: params.avgResponseTime,
    });

    return new ResponseMetrics({
      clickRate: params.clickRate,
      ignoreRate: params.ignoreRate,
      avgResponseTime: params.avgResponseTime,
      snoozeCount: params.snoozeCount ?? 0,
      effectivenessScore,
      sampleSize: params.sampleSize,
      lastAnalysisTime: Date.now(),
    });
  }

  /**
   * 计算效果评分算法
   *
   * 公式：effectivenessScore = (clickRate × 0.5) + ((100 - ignoreRate) × 0.3) + (responsiveness × 0.2)
   * 其中 responsiveness = min(100, (60 / avgResponseTime) × 100)
   */
  private static calculateEffectivenessScore(params: {
    clickRate: number;
    ignoreRate: number;
    avgResponseTime: number;
  }): number {
    const clickWeight = 0.5;
    const ignoreWeight = 0.3;
    const responsivenessWeight = 0.2;

    // 响应速度得分（越快越好，60秒内响应得满分）
    const responsiveness = Math.min(100, (60 / params.avgResponseTime) * 100);

    const score =
      params.clickRate * clickWeight +
      (100 - params.ignoreRate) * ignoreWeight +
      responsiveness * responsivenessWeight;

    return Math.round(score * 10) / 10; // 保留1位小数
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      clickRate: number;
      ignoreRate: number;
      avgResponseTime: number;
      snoozeCount: number;
      effectivenessScore: number;
      sampleSize: number;
      lastAnalysisTime: number;
    }>,
  ): ResponseMetrics {
    return new ResponseMetrics({
      clickRate: changes.clickRate ?? this.clickRate,
      ignoreRate: changes.ignoreRate ?? this.ignoreRate,
      avgResponseTime: changes.avgResponseTime ?? this.avgResponseTime,
      snoozeCount: changes.snoozeCount ?? this.snoozeCount,
      effectivenessScore: changes.effectivenessScore ?? this.effectivenessScore,
      sampleSize: changes.sampleSize ?? this.sampleSize,
      lastAnalysisTime: changes.lastAnalysisTime ?? this.lastAnalysisTime,
    });
  }

  // ===== 业务方法 =====

  /**
   * 是否高效（效果评分 > 70）
   */
  public isHighEffective(): boolean {
    return this.effectivenessScore > 70;
  }

  /**
   * 是否中效（效果评分 30-70）
   */
  public isMediumEffective(): boolean {
    return this.effectivenessScore >= 30 && this.effectivenessScore <= 70;
  }

  /**
   * 是否低效（效果评分 < 30）
   */
  public isLowEffective(): boolean {
    return this.effectivenessScore < 30;
  }

  /**
   * 是否需要调整频率
   */
  public needsAdjustment(): boolean {
    // 低效且样本量足够（至少10次）
    return this.isLowEffective() && this.sampleSize >= 10;
  }

  /**
   * 获取效果等级标签
   */
  public getEffectivenessLabel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this.isHighEffective()) return 'HIGH';
    if (this.isLowEffective()) return 'LOW';
    return 'MEDIUM';
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ResponseMetrics)) {
      return false;
    }

    return (
      this.clickRate === other.clickRate &&
      this.ignoreRate === other.ignoreRate &&
      this.avgResponseTime === other.avgResponseTime &&
      this.snoozeCount === other.snoozeCount &&
      this.effectivenessScore === other.effectivenessScore &&
      this.sampleSize === other.sampleSize &&
      this.lastAnalysisTime === other.lastAnalysisTime
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ResponseMetricsServerDTO {
    return {
      clickRate: this.clickRate,
      ignoreRate: this.ignoreRate,
      avgResponseTime: this.avgResponseTime,
      snoozeCount: this.snoozeCount,
      effectivenessScore: this.effectivenessScore,
      sampleSize: this.sampleSize,
      lastAnalysisTime: this.lastAnalysisTime,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ResponseMetricsClientDTO {
    const label = this.getEffectivenessLabel();
    const effectivenessLabel = label === 'HIGH' ? '高效' : label === 'LOW' ? '低效' : '中效';
    const effectivenessColor = label === 'HIGH' ? 'success' : label === 'LOW' ? 'error' : 'warning';

    const displayText = `点击率 ${this.clickRate.toFixed(1)}%，${effectivenessLabel}`;

    return {
      clickRate: this.clickRate,
      ignoreRate: this.ignoreRate,
      avgResponseTime: this.avgResponseTime,
      snoozeCount: this.snoozeCount,
      effectivenessScore: this.effectivenessScore,
      sampleSize: this.sampleSize,
      lastAnalysisTime: this.lastAnalysisTime,
      displayText,
      effectivenessLabel,
      effectivenessColor,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: ResponseMetricsServerDTO): ResponseMetrics {
    return new ResponseMetrics(dto);
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: ResponseMetricsClientDTO): ResponseMetrics {
    return new ResponseMetrics({
      clickRate: dto.clickRate,
      ignoreRate: dto.ignoreRate,
      avgResponseTime: dto.avgResponseTime,
      snoozeCount: dto.snoozeCount,
      effectivenessScore: dto.effectivenessScore,
      sampleSize: dto.sampleSize,
      lastAnalysisTime: dto.lastAnalysisTime,
    });
  }

  /**
   * 转换为 Persistence DTO（扁平化字段对象）
   * 用于直接传给 Prisma，无需JSON序列化
   */
  public toPersistenceDTO(): {
    clickRate: number | null;
    ignoreRate: number | null;
    avgResponseTime: number | null;
    snoozeCount: number;
    effectivenessScore: number | null;
    sampleSize: number;
    lastAnalysisTime: number | null;
  } {
    return {
      clickRate: this.clickRate || null,
      ignoreRate: this.ignoreRate || null,
      avgResponseTime: this.avgResponseTime || null,
      snoozeCount: this.snoozeCount,
      effectivenessScore: this.effectivenessScore || null,
      sampleSize: this.sampleSize,
      lastAnalysisTime: this.lastAnalysisTime || null,
    };
  }
}
