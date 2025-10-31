/**
 * Frequency Adjustment Value Object - Server
 * 频率调整值对象 - 服务端
 */

// ============ DTO 定义 ============

/**
 * Frequency Adjustment Server DTO
 * 提醒频率调整记录
 */
export interface FrequencyAdjustmentServerDTO {
  readonly originalInterval: number; // 原始间隔（秒）
  readonly adjustedInterval: number; // 调整后间隔（秒）
  readonly adjustmentReason: string; // 调整原因
  readonly adjustmentTime: number; // 调整时间 (epoch ms)
  readonly isAutoAdjusted: boolean; // 是否自动调整
  readonly userConfirmed: boolean; // 用户是否确认
  readonly rejectionReason?: string | null; // 拒绝原因（如果用户拒绝）
}

/**
 * Frequency Adjustment Client DTO
 */
export interface FrequencyAdjustmentClientDTO {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number;
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;
  // UI 显示文本
  readonly displayText: string; // "从每天1次调整为每2天1次"
  readonly changeRateText: string; // "频率降低50%"
  readonly statusText: string; // "已确认" | "待确认" | "已拒绝"
}

// ============ 实体接口 ============

/**
 * Frequency Adjustment 值对象接口
 */
export interface FrequencyAdjustmentServer {
  readonly originalInterval: number;
  readonly adjustedInterval: number;
  readonly adjustmentReason: string;
  readonly adjustmentTime: number;
  readonly isAutoAdjusted: boolean;
  readonly userConfirmed: boolean;
  readonly rejectionReason?: string | null;

  // 业务方法
  isIncreased(): boolean; // 频率是否增加（间隔变小）
  isDecreased(): boolean; // 频率是否减少（间隔变大）
  getChangeRate(): number; // 变化率（百分比）
  isPending(): boolean; // 是否待确认
  isRejected(): boolean; // 是否被拒绝
  getDisplayInterval(seconds: number): string; // "每天1次" | "每2天1次"

  // 转换方法
  toServerDTO(): FrequencyAdjustmentServerDTO;
  toClientDTO(): FrequencyAdjustmentClientDTO;
}

/**
 * Frequency Adjustment 静态工厂方法接口
 */
export interface FrequencyAdjustmentServerStatic {
  /**
   * 创建新的 Frequency Adjustment（静态工厂方法）
   */
  create(params: {
    originalInterval: number;
    adjustedInterval: number;
    adjustmentReason: string;
    isAutoAdjusted?: boolean;
    userConfirmed?: boolean;
    rejectionReason?: string;
  }): FrequencyAdjustmentServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: FrequencyAdjustmentServerDTO): FrequencyAdjustmentServer;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: FrequencyAdjustmentClientDTO): FrequencyAdjustmentServer;
}
