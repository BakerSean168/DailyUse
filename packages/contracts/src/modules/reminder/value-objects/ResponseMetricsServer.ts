/**
 * Response Metrics Value Object - Server
 * 响应指标值对象 - 服务端
 */

// ============ DTO 定义 ============

/**
 * Response Metrics Server DTO
 * 提醒响应指标
 */
export interface ResponseMetricsServerDTO {
  readonly clickRate: number; // 点击率 (0-100)
  readonly ignoreRate: number; // 忽略率 (0-100)
  readonly avgResponseTime: number; // 平均响应时间（秒）
  readonly snoozeCount: number; // 延迟次数
  readonly effectivenessScore: number; // 效果评分 (0-100)
  readonly sampleSize: number; // 样本数量（最近 N 次）
  readonly lastAnalysisTime: number; // 最后分析时间 (epoch ms)
}

/**
 * Response Metrics Client DTO (转换后传给前端)
 */
export interface ResponseMetricsClientDTO {
  readonly clickRate: number;
  readonly ignoreRate: number;
  readonly avgResponseTime: number;
  readonly snoozeCount: number;
  readonly effectivenessScore: number;
  readonly sampleSize: number;
  readonly lastAnalysisTime: number;
  // UI 显示文本
  readonly displayText: string; // "点击率 65%，效果良好"
  readonly effectivenessLabel: string; // "高效" | "中效" | "低效"
  readonly effectivenessColor: string; // "success" | "warning" | "error"
}

// ============ 实体接口 ============

/**
 * Response Metrics 值对象接口
 */
export interface ResponseMetricsServer {
  readonly clickRate: number;
  readonly ignoreRate: number;
  readonly avgResponseTime: number;
  readonly snoozeCount: number;
  readonly effectivenessScore: number;
  readonly sampleSize: number;
  readonly lastAnalysisTime: number;

  // 业务方法
  isHighEffective(): boolean; // 效果评分 > 70
  isMediumEffective(): boolean; // 效果评分 30-70
  isLowEffective(): boolean; // 效果评分 < 30
  needsAdjustment(): boolean; // 是否需要调整频率
  getEffectivenessLabel(): 'HIGH' | 'MEDIUM' | 'LOW';

  // 转换方法
  toServerDTO(): ResponseMetricsServerDTO;
  toClientDTO(): ResponseMetricsClientDTO;
}

/**
 * Response Metrics 静态工厂方法接口
 */
export interface ResponseMetricsServerStatic {
  /**
   * 创建新的 Response Metrics（静态工厂方法）
   */
  create(params: {
    clickRate: number;
    ignoreRate: number;
    avgResponseTime: number;
    snoozeCount?: number;
    sampleSize: number;
  }): ResponseMetricsServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ResponseMetricsServerDTO): ResponseMetricsServer;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: ResponseMetricsClientDTO): ResponseMetricsServer;
}
