# STORY-029: Smart Priority Analysis

**Epic**: EPIC-006: Smart Productivity  
**Priority**: P2 (Medium)  
**Estimated Duration**: 2 days  
**Status**: Drafted  

## 📋 Story Description

实现智能优先级分析系统，利用 AI 根据多个维度（紧急性、重要性、依赖关系、用户目标等）自动分析和建议任务优先级，帮助用户专注于最重要的工作。

## 🎯 Acceptance Criteria

### 1. Priority Analysis Service
- [ ] Create `TaskPriorityAnalysisService` with singleton pattern
- [ ] Implement `analyzePriority(tasks, context)` method that:
  - Analyzes multiple task dimensions
  - Returns priority score (1-10) for each task
  - Provides reasoning for priority assignment
  - Considers user preferences and goals
- [ ] Support real-time priority updates
- [ ] Handle priority conflicts and dependencies

### 2. Multi-Dimensional Analysis
- [ ] **Urgency**: Time-based priority (deadline proximity)
- [ ] **Importance**: Impact-based priority (goal alignment)
- [ ] **Dependencies**: Task dependency analysis
- [ ] **Effort**: Effort vs impact ratio
- [ ] **Value**: Expected value delivery
- [ ] **User Preference**: Custom priority rules

### 3. AI-Powered Priority Suggestion
- [ ] Create priority analysis prompts in Chinese
- [ ] Use AI to suggest optimal task ordering
- [ ] Generate detailed reasoning for each task
- [ ] Provide alternative priority schemes
- [ ] Learn from user's manual priority adjustments

### 4. Priority Management UI
- [ ] Create `PriorityScoreCard` component
  - Display priority score with visual indicator
  - Show component breakdown (urgency, importance, etc.)
  - Display reasoning tooltip
- [ ] Create `PriorityAnalysisPanel` component
  - Show all tasks with priority scores
  - Allow drag-to-reorder
  - Show priority reason on hover
- [ ] Integrate into `GoalDetailDialog` and `TaskListView`
  - Add priority analysis button
  - Show AI-suggested order
  - Allow accept/reject/customize

### 5. Dependency Visualization
- [ ] Create dependency graph visualization
- [ ] Show critical path analysis
- [ ] Highlight blocking tasks
- [ ] Suggest optimal execution order based on dependencies

### 6. Priority Learning
- [ ] Track user's priority adjustments
- [ ] Learn user's priority preferences over time
- [ ] Adjust AI suggestions based on patterns
- [ ] Provide feedback on priority accuracy

### 7. Testing & Validation
- [ ] Unit tests for priority service (15+ tests)
- [ ] Unit tests for UI components (20+ tests)
- [ ] Integration tests with TaskDecompositionService
- [ ] Dependency graph algorithm tests
- [ ] Learning mechanism validation

## 📝 Implementation Notes

### Priority Scoring Algorithm
```
Priority Score = (Urgency * 0.3) + (Importance * 0.3) + 
                 (Value * 0.2) + (Effort_Ratio * 0.1) + 
                 (Dependencies * 0.1)

Score Range: 1-10 (higher = more urgent)
```

### Data Model
```typescript
TaskPriority {
  taskId: string
  taskTitle: string
  priorityScore: number (1-10)
  reasoning: string
  dimensions: {
    urgency: number (0-1)
    importance: number (0-1)
    value: number (0-1)
    effortRatio: number (0-1)
    dependencies: number (0-1)
  }
  suggestedOrder: number
  userAdjustment?: number
  confidence: number (0-1)
  createdAt: Date
}
```

## 🔗 Dependencies

### Related Stories
- STORY-027: Smart Task Decomposition
- STORY-028: Smart Time Estimation
- STORY-030: Daily Planning

### Related Services
- `TaskTimeEstimationService`
- `TaskDecompositionService`
- OpenAI Provider

## 📊 Estimation Breakdown

| Component | Days | Notes |
|-----------|------|-------|
| Service Layer | 0.5 | Service + algorithm |
| AI Integration | 0.5 | Prompts + analysis |
| UI Components | 0.7 | Cards + panels |
| Testing | 0.3 | Unit + integration |
| Total | 2.0 | Two working days |

---

**Story Created**: 2025-01-15  
**Status**: Drafted
