/**
 * AI 模块 - 应用层服务索引
 * DDD Architecture: Application Services
 */

// Goal Generation Application Service
export {
  GoalGenerationApplicationService,
  goalGenerationApplicationService,
} from './GoalGenerationApplicationService';

// Knowledge Generation Application Service
export {
  KnowledgeGenerationApplicationService,
  knowledgeGenerationApplicationService,
  type GenerateKnowledgeRequest,
  type GenerateKnowledgeResponse,
  type GenerateGoalKnowledgeRequest,
} from './KnowledgeGenerationApplicationService';
