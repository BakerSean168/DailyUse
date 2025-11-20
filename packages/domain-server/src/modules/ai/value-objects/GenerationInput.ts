import { AIContracts } from '@dailyuse/contracts';

type GenerationTaskType = AIContracts.GenerationTaskType;
type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;
type GenerationInputPersistenceDTO = AIContracts.GenerationInputPersistenceDTO;

export class GenerationInput {
  public readonly prompt: string;
  public readonly systemPrompt?: string | null;
  public readonly taskType: GenerationTaskType;
  public readonly temperature?: number | null;
  public readonly maxTokens?: number | null;
  public readonly contextData?: Record<string, unknown> | null;

  private constructor(params: GenerationInputServerDTO) {
    this.prompt = params.prompt;
    this.systemPrompt = params.systemPrompt;
    this.taskType = params.taskType;
    this.temperature = params.temperature;
    this.maxTokens = params.maxTokens;
    this.contextData = params.contextData;
  }

  public static create(params: GenerationInputServerDTO): GenerationInput {
    return new GenerationInput(params);
  }

  public static fromPersistenceDTO(dto: GenerationInputPersistenceDTO): GenerationInput {
    return new GenerationInput({
      prompt: dto.prompt,
      systemPrompt: dto.systemPrompt,
      taskType: dto.taskType,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      contextData: dto.contextData ? JSON.parse(dto.contextData) : null,
    });
  }

  public toServerDTO(): GenerationInputServerDTO {
    return {
      prompt: this.prompt,
      systemPrompt: this.systemPrompt,
      taskType: this.taskType,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      contextData: this.contextData,
    };
  }

  public toPersistenceDTO(): GenerationInputPersistenceDTO {
    return {
      prompt: this.prompt,
      systemPrompt: this.systemPrompt,
      taskType: this.taskType,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      contextData: this.contextData ? JSON.stringify(this.contextData) : null,
    };
  }
}
