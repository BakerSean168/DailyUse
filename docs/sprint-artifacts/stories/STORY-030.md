# STORY-030: Daily Planning

**Epic**: EPIC-006: Smart Productivity  
**Priority**: P1 (High)  
**Estimated Duration**: 3 days  
**Status**: Drafted  

## 📋 Story Description

创建智能日计划系统，整合 AI 分解、时间估算、优先级分析等功能，帮助用户为每一天生成优化的任务计划。系统根据用户的日程、可用时间、优先级和复杂度，自动生成最优的日计划。

## 🎯 Acceptance Criteria

### 1. Daily Planning Service
- [ ] Create `DailyPlanningService` with singleton pattern
- [ ] Implement `generateDailyPlan(date, options)` method that:
  - Collects all active goals and tasks
  - Filters tasks for the specified date
  - Applies priority and time estimates
  - Generates optimized task schedule
  - Returns plan with time slots and break recommendations
- [ ] Support plan regeneration and adjustment
- [ ] Handle scheduling conflicts

### 2. Schedule Optimization
- [ ] **Time Slot Allocation**: Assign tasks to time slots
  - Consider available working hours (default 8 hours/day)
  - Respect task dependencies (do prerequisites first)
  - Add buffer time (10-15%) for context switching
  - Include break times (every 25-90 minutes)
- [ ] **Complexity Distribution**: Balance task complexity
  - Mix simple, medium, complex tasks
  - Place harder tasks during peak hours
  - Place easier tasks during low energy
- [ ] **Priority Optimization**: Ensure priorities are met
  - High priority tasks first
  - Critical path tasks before dependent tasks
  - Value-to-time ratio optimization

### 3. Daily Plan UI
- [ ] Create `DailyPlanView` component
  - Timeline view of scheduled tasks
  - Color-coded by complexity/priority
  - Show estimated duration and break times
- [ ] Create `PlanOptimization` component
  - Show schedule before/after optimization
  - Allow manual task reordering
  - Display optimization metrics (coverage, priority fulfillment)
- [ ] Create `DailyPlannerDialog` for interactive planning
  - Drag-to-reschedule tasks
  - Add/remove tasks from daily plan
  - Adjust time slots manually
  - Preview optimizations

### 4. Adaptive Planning
- [ ] **Work Pattern Recognition**:
  - Analyze user's typical work patterns
  - Learn optimal task ordering for user
  - Adjust plans based on user's actual pace
- [ ] **Real-time Adjustment**:
  - Track actual vs planned time
  - Adjust remaining plan if behind schedule
  - Suggest task rescheduling when needed
  - Provide progress notifications
- [ ] **User Preferences**:
  - Allow setting peak productivity hours
  - Configure break preferences
  - Set preferred task complexity mix
  - Define working hours by day

### 5. Plan Recommendations
- [ ] Suggest focus blocks (uninterrupted work time)
- [ ] Recommend break times based on task complexity
- [ ] Suggest collaboration slots
- [ ] Recommend task grouping by context

### 6. Plan Analytics
- [ ] Track plan execution accuracy
- [ ] Calculate plan completion rate
- [ ] Analyze time estimation accuracy
- [ ] Generate recommendations for future plans

### 7. Integration Points
- [ ] Integrate with existing Goal Management
- [ ] Connect with Task Management
- [ ] Use TaskDecompositionService results
- [ ] Use TaskTimeEstimationService
- [ ] Use TaskPriorityAnalysisService
- [ ] Show daily plan in dashboard

### 8. Testing & Validation
- [ ] Unit tests for planning service (20+ tests)
- [ ] Unit tests for UI components (25+ tests)
- [ ] Integration tests with related services
- [ ] Schedule optimization algorithm tests
- [ ] Edge case handling (no tasks, overbooked day, etc.)

## 📝 Implementation Notes

### Daily Plan Algorithm
```
1. Collect all active tasks for the day
2. Sort by priority and dependencies
3. Allocate time slots:
   - Respect task duration
   - Consider dependencies
   - Add buffer between tasks
   - Include break times
4. Check for conflicts
5. Optimize distribution
6. Return schedule with recommendations
```

### Daily Plan Data Model
```typescript
DailyPlan {
  id: string
  date: Date
  plannedTasks: ScheduledTask[]
  workingHours: {
    startTime: string (e.g., "09:00")
    endTime: string (e.g., "18:00")
    breaks: TimeBlock[]
  }
  metrics: {
    totalPlannedMinutes: number
    utilizationRate: number (0-1)
    priorityFulfillment: number (0-1)
    complexity_distribution: {
      simple: number
      medium: number
      complex: number
    }
  }
  recommendations: string[]
  executionMetrics?: {
    actualStartTime?: Date
    actualEndTime?: Date
    completedTasks: number
    completionRate: number (0-1)
  }
  createdAt: Date
}

ScheduledTask {
  taskId: string
  taskTitle: string
  plannedStartTime: Date
  plannedEndTime: Date
  estimatedMinutes: number
  actualMinutes?: number
  priority: number
  complexity: 'simple' | 'medium' | 'complex'
  status: 'planned' | 'in-progress' | 'completed' | 'skipped'
  dependencies: string[]
}
```

### Time Slot Management
```
08:00 - 08:30: Morning review (15 min) + buffer (15 min)
08:30 - 10:00: Focus Block 1 (High complexity task)
10:00 - 10:15: Break
10:15 - 12:00: Focus Block 2 (Medium complexity tasks)
12:00 - 13:00: Lunch break
13:00 - 14:30: Focus Block 3 (Low complexity tasks)
14:30 - 14:45: Break
14:45 - 16:30: Focus Block 4 (Collaboration/review tasks)
16:30 - 17:00: Daily review & planning
```

## 🔗 Dependencies

### Related Stories
- STORY-027: Smart Task Decomposition
- STORY-028: Smart Time Estimation
- STORY-029: Smart Priority Analysis

### Required Services
- `TaskDecompositionService`
- `TaskTimeEstimationService`
- `TaskPriorityAnalysisService`
- Goal & Task repositories

## 📊 Estimation Breakdown

| Component | Days | Notes |
|-----------|------|-------|
| Service Layer | 1.0 | Service + algorithm + optimization |
| Schedule Optimization | 0.7 | Algorithm + conflict resolution |
| UI Components | 0.8 | Timeline + planner + analytics |
| Testing | 0.5 | Unit + integration + edge cases |
| Total | 3.0 | Three working days |

## 🚀 Success Metrics

- ✅ All acceptance criteria met
- ✅ 45+ unit tests passing
- ✅ Plan generation < 2 seconds
- ✅ Schedule conflict detection 100% accurate
- ✅ Plan completion tracking working
- ✅ UI responsive and intuitive
- ✅ Full TypeScript type safety

---

**Story Created**: 2025-01-15  
**Status**: Drafted
