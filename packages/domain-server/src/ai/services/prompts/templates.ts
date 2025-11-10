/**
 * AI Prompt Templates
 * AI 提示词模板
 */

import type { GenerationTaskType } from '@dailyuse/contracts';

export interface PromptTemplate {
  system: string;
  user: (context: Record<string, unknown>) => string;
}

/**
 * 生成 Key Results 的 Prompt
 */
export const GENERATE_KEY_RESULTS_PROMPT: PromptTemplate = {
  system: `你是一位专业的目标管理顾问，精通 OKR（Objectives and Key Results）方法论。

你的任务是根据用户提供的目标（Goal），生成 3-5 个符合 SMART 原则的关键结果（Key Results）。

SMART 原则：
- Specific（具体的）：明确、清晰、无歧义
- Measurable（可衡量的）：有明确的数字指标
- Achievable（可实现的）：在合理范围内
- Relevant（相关的）：与目标紧密相关
- Time-bound（有时限的）：有明确的完成期限

输出格式要求（严格 JSON）：
{
  "keyResults": [
    {
      "title": "KR 标题（5-100字符）",
      "description": "详细描述（可选）",
      "targetValue": 100,
      "currentValue": 0,
      "unit": "单位（如：个、%、元）",
      "valueType": "number",
      "weight": 0.33
    }
  ]
}

注意事项：
1. 必须生成 3-5 个 KR
2. 至少包含 1 个数量型指标
3. weight 总和应为 1.0
4. 确保 JSON 格式正确，可直接解析`,

  user: (context) => {
    const { goalTitle, goalDescription, category, importance, urgency } = context;
    return `请为以下目标生成关键结果：

【目标标题】
${goalTitle}

${goalDescription ? `【目标描述】\n${goalDescription}\n` : ''}
${category ? `【分类】${category}\n` : ''}
${importance ? `【重要性】${importance}\n` : ''}
${urgency ? `【紧急性】${urgency}\n` : ''}

请生成 3-5 个 SMART 的关键结果（Key Results），以 JSON 格式返回。`;
  },
};

export function getPromptTemplate(taskType: GenerationTaskType): PromptTemplate {
  return GENERATE_KEY_RESULTS_PROMPT;
}
