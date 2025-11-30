import type { TokenUsageClientDTO, TokenUsagePersistenceDTO, TokenUsageServerDTO } from '@dailyuse/contracts/ai';

export class TokenUsage {
  public readonly promptTokens: number;
  public readonly completionTokens: number;
  public readonly totalTokens: number;

  private constructor(params: TokenUsageServerDTO) {
    this.promptTokens = params.promptTokens;
    this.completionTokens = params.completionTokens;
    this.totalTokens = params.totalTokens;
  }

  public static create(params: TokenUsageServerDTO): TokenUsage {
    return new TokenUsage(params);
  }

  public static fromPersistenceDTO(dto: TokenUsagePersistenceDTO): TokenUsage {
    return new TokenUsage(dto);
  }

  public toServerDTO(): TokenUsageServerDTO {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
    };
  }

  public toClientDTO(): TokenUsageClientDTO {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
    };
  }

  public toPersistenceDTO(): TokenUsagePersistenceDTO {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
    };
  }
}
