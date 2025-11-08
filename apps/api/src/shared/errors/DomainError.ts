/**
 * 领域错误基类
 * 
 * 提供结构化的错误信息，便于调试和日志追踪
 */
export class DomainError extends Error {
  public readonly timestamp: number;
  public readonly operationId: string;

  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, any> = {},
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
    this.operationId = this.generateOperationId();
    
    // 保留原始错误的堆栈
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 转换为结构化日志格式
   */
  toLogFormat(): Record<string, any> {
    return {
      error: this.message,
      code: this.code,
      name: this.name,
      operationId: this.operationId,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * 转换为 API 响应格式
   */
  toResponseFormat(): Record<string, any> {
    return {
      success: false,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      operationId: this.operationId,
      // 生产环境不暴露详细上下文
      ...(process.env.NODE_ENV === 'development' ? { context: this.context } : {}),
    };
  }
}
