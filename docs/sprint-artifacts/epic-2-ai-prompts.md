# Epic 2: AI Prompt Templates

**Date:** 2025-11-20  
**Epic:** Epic 2 - Intelligent Goal & Task Planning  
**Owner:** Alice (Product Owner)

---

## KR Generation Prompt Template

### System Prompt

```
You are an expert goal-setting consultant specialized in OKR (Objectives and Key Results) methodology. Your task is to generate 3-5 measurable Key Results for a given goal.

Key Result Requirements:
- Must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Must be quantifiable with clear metrics
- Should represent outcomes, not tasks or activities
- Must directly contribute to achieving the goal
- Should be challenging but achievable

Output Format (JSON Array):
[
  {
    "title": "Clear, specific key result title",
    "description": "Detailed description explaining the key result",
    "valueType": "NUMBER|PERCENTAGE|BOOLEAN|CURRENCY",
    "targetValue": <number>,
    "unit": "optional unit (e.g., 'users', 'hours', '%')",
    "weight": <number 0-100>,
    "aggregationMethod": "LAST|SUM|AVERAGE|MAX|MIN"
  }
]
```

### User Prompt Template

```
Goal Title: {{goalTitle}}
Goal Description: {{goalDescription}}
Goal Time Range: {{startDate}} to {{endDate}}
Goal Context: {{goalContext}}

Generate 3-5 Key Results that will indicate successful achievement of this goal. Ensure they are:
1. Measurable with specific metrics
2. Aligned with the goal's purpose
3. Balanced between leading and lagging indicators
4. Appropriately weighted (total weight should sum to 100)

Return only the JSON array without any additional text.
```

### Example Input

```json
{
  "goalTitle": "Improve Product Quality",
  "goalDescription": "Reduce bugs and improve user satisfaction",
  "startDate": "2025-Q1",
  "endDate": "2025-Q2",
  "goalContext": "SaaS product with 10k users"
}
```

### Example Output

```json
[
  {
    "title": "Reduce Critical Bugs",
    "description": "Decrease P0/P1 bugs from 15 to less than 3 per sprint",
    "valueType": "NUMBER",
    "targetValue": 3,
    "unit": "bugs",
    "weight": 35,
    "aggregationMethod": "LAST"
  },
  {
    "title": "Improve User Satisfaction Score",
    "description": "Increase NPS score from 45 to 70+",
    "valueType": "NUMBER",
    "targetValue": 70,
    "unit": "points",
    "weight": 30,
    "aggregationMethod": "LAST"
  },
  {
    "title": "Achieve 99.5% Uptime",
    "description": "Maintain system availability above 99.5%",
    "valueType": "PERCENTAGE",
    "targetValue": 99.5,
    "unit": "%",
    "weight": 25,
    "aggregationMethod": "AVERAGE"
  },
  {
    "title": "Zero Data Loss Incidents",
    "description": "No data loss or corruption incidents",
    "valueType": "BOOLEAN",
    "targetValue": 1,
    "weight": 10,
    "aggregationMethod": "LAST"
  }
]
```

---

## Task Generation Prompt Template

### System Prompt

```
You are an expert project manager specializing in task breakdown and planning. Your task is to generate 5-10 executable tasks for a given Key Result.

Task Requirements:
- Must be specific, actionable work items
- Should include realistic time estimates
- Must have clear completion criteria
- Should be prioritized appropriately
- Must contribute directly to achieving the Key Result

Output Format (JSON Array):
[
  {
    "title": "Clear, actionable task title (verb-led)",
    "description": "Detailed description with acceptance criteria",
    "estimatedHours": <number>,
    "priority": "HIGH|MEDIUM|LOW",
    "dependencies": ["task uuid if any"],
    "tags": ["relevant", "tags"]
  }
]
```

### User Prompt Template

```
Key Result: {{krTitle}}
KR Description: {{krDescription}}
Target Value: {{targetValue}} {{unit}}
Current Value: {{currentValue}} {{unit}}
Time Frame: {{timeRemaining}} days remaining

Generate 5-10 tasks that will help achieve this Key Result. Consider:
1. Breaking down work into manageable chunks (4-16 hours each)
2. Identifying dependencies between tasks
3. Prioritizing based on impact and urgency
4. Including both implementation and validation tasks

Return only the JSON array without any additional text.
```

### Example Input

```json
{
  "krTitle": "Reduce Critical Bugs",
  "krDescription": "Decrease P0/P1 bugs from 15 to less than 3 per sprint",
  "targetValue": 3,
  "currentValue": 15,
  "unit": "bugs",
  "timeRemaining": 90
}
```

### Example Output

```json
[
  {
    "title": "Audit Current P0/P1 Bugs",
    "description": "Review and categorize all existing critical bugs by root cause. Identify patterns and common failure points.",
    "estimatedHours": 8,
    "priority": "HIGH",
    "dependencies": [],
    "tags": ["analysis", "audit"]
  },
  {
    "title": "Implement Automated Integration Tests",
    "description": "Add comprehensive integration test suite covering top 10 critical paths identified in audit.",
    "estimatedHours": 16,
    "priority": "HIGH",
    "dependencies": ["task-1-uuid"],
    "tags": ["testing", "automation"]
  },
  {
    "title": "Set Up Pre-Production Testing Environment",
    "description": "Configure staging environment that mirrors production for catching bugs before deployment.",
    "estimatedHours": 12,
    "priority": "MEDIUM",
    "dependencies": [],
    "tags": ["infrastructure", "devops"]
  },
  {
    "title": "Implement Code Review Checklist",
    "description": "Create and enforce checklist specifically targeting common bug patterns from audit.",
    "estimatedHours": 4,
    "priority": "MEDIUM",
    "dependencies": ["task-1-uuid"],
    "tags": ["process", "quality"]
  },
  {
    "title": "Add Error Monitoring & Alerting",
    "description": "Implement Sentry/DataDog alerts for critical errors with immediate notification.",
    "estimatedHours": 6,
    "priority": "HIGH",
    "dependencies": [],
    "tags": ["monitoring", "alerting"]
  },
  {
    "title": "Conduct Bug Bash Session",
    "description": "Organize team-wide bug hunting session focused on critical paths.",
    "estimatedHours": 8,
    "priority": "LOW",
    "dependencies": ["task-2-uuid"],
    "tags": ["testing", "team"]
  },
  {
    "title": "Document Bug Prevention Guidelines",
    "description": "Create comprehensive guide based on lessons learned from bug audit.",
    "estimatedHours": 4,
    "priority": "LOW",
    "dependencies": ["task-1-uuid", "task-4-uuid"],
    "tags": ["documentation"]
  }
]
```

---

## Configuration

### AI Model Settings

- **Model:** gpt-4-turbo-preview (or gpt-4o)
- **Temperature:** 0.7 (balanced creativity and consistency)
- **Max Tokens:** 2000 (sufficient for 5-10 items)
- **Top P:** 0.9

### Validation Rules

**KR Generation:**

- Must return 3-5 items
- Total weight must sum to 100 (±5 tolerance)
- All required fields present
- valueType matches valid enum
- targetValue is numeric and > 0

**Task Generation:**

- Must return 5-10 items
- estimatedHours between 1-40
- priority matches valid enum
- No circular dependencies

---

## Usage in Code

```typescript
// Example: Generate KRs
const krPrompt = generateKRPrompt({
  goalTitle: goal.title,
  goalDescription: goal.description,
  startDate: goal.timeRange.startDate,
  endDate: goal.timeRange.endDate,
  goalContext: goal.context || '',
});

const result = await aiGenerationService.generateText({
  accountUuid: user.accountUuid,
  userMessage: krPrompt,
  systemPrompt: KR_SYSTEM_PROMPT,
  temperature: 0.7,
  maxTokens: 2000,
});

const keyResults = JSON.parse(result.content);
```

---

## Notes

- These prompts are **v1** and will be refined based on real-world usage
- Consider A/B testing different prompt variations
- Monitor token usage and adjust maxTokens if needed
- Collect user feedback on generated results quality
