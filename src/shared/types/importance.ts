
export enum ImportanceLevel {
  /**
   * 极其重要 - 对生活/工作有重大影响
   * 示例: 健康检查、家人重要日子
   */
  Vital = "vital",

  /**
   * 非常重要 - 对目标实现很关键
   * 示例: 职业发展相关任务
   */
  Important = "important",

  /**
   * 中等重要 - 值得做但不是关键
   * 示例: 技能提升、社交活动
   */
  Moderate = "moderate",

  /**
   * 不太重要 - 可做可不做
   * 示例: 日常琐事
   */
  Minor = "minor",

  /**
   * 无关紧要 - 纯粹消遣
   * 示例: 游戏娱乐
   */
  Trivial = "trivial",
}
