# STORY-027: 智能任务分解 - 技术上下文

## 📚 Story Context

**Story ID**: STORY-027  
**Context Created**: 2025-12-08  
**Ready for Dev**: ✅ YES  

---

## 🎯 实现路径

### Phase 1: AI Service Infrastructure (Day 1)

**目标**: 建立 AI 服务基础设施

1. **创建 AI 服务接口**
   ```typescript
   // packages/application-client/src/ai/interfaces/IAIService.ts
   export interface IAIService {
     decomposeGoal(request: DecompositionRequest): Promise<DecompositionResult>;
     estimateTime(task: Task): Promise<TimeEstimate>;
     suggestPriority(tasks: Task[]): Promise<PriorityMap>;
   }
   ```

2. **实现 OpenAI Provider**
   ```typescript
   // packages/infrastructure-client/src/ai/providers/OpenAIProvider.ts
   export class OpenAIProvider implements IAIService {
     private client: OpenAI;
     
     constructor(config: AIConfig) {
       this.client = new OpenAI({ apiKey: config.apiKey });
     }
     
     async decomposeGoal(request: DecompositionRequest) {
       const completion = await this.client.chat.completions.create({
         model: "gpt-4-1106-preview",
         messages: [
           { role: "system", content: DECOMPOSITION_SYSTEM_PROMPT },
           { role: "user", content: this.buildUserPrompt(request) }
         ],
         response_format: { type: "json_object" }
       });
       
       return this.parseDecompositionResult(completion);
     }
   }
   ```

3. **创建 Prompt Templates**
   ```typescript
   // packages/infrastructure-client/src/ai/prompts/decomposition.ts
   export const DECOMPOSITION_SYSTEM_PROMPT = `
   You are an expert task planner. Given a goal, break it down into 3-8 actionable subtasks.
   
   Requirements:
   - Each task should be concrete and achievable
   - Include estimated time in minutes
   - Mark complexity (simple/medium/complex)
   - Identify dependencies between tasks
   - Provide a suggested timeline
   
   Return JSON format:
   {
     "tasks": [
       {
         "title": "string",
         "description": "string",
         "estimatedMinutes": number,
         "complexity": "simple" | "medium" | "complex",
         "dependencies": ["task title"],
         "order": number
       }
     ],
     "timeline": {
       "totalHours": number,
       "suggestedDays": number
     },
     "risks": [
       {
         "description": "string",
         "mitigation": "string"
       }
     ]
   }
   `;
   ```

4. **实现 AI Factory**
   ```typescript
   // packages/application-client/src/ai/AIServiceFactory.ts
   export class AIServiceFactory {
     private static providers = new Map<string, IAIService>();
     
     static register(name: string, provider: IAIService) {
       this.providers.set(name, provider);
     }
     
     static getProvider(name: string = 'openai'): IAIService {
       const provider = this.providers.get(name);
       if (!provider) {
         throw new AIProviderNotFoundError(name);
       }
       return provider;
     }
   }
   ```

**测试**:
- [ ] OpenAIProvider 单元测试 (mock API)
- [ ] Prompt template 格式验证
- [ ] Factory 注册和获取测试

---

### Phase 2: Domain Service Integration (Day 2)

**目标**: 集成到 Goal 领域服务

1. **扩展 Goal 聚合根**
   ```typescript
   // packages/domain-client/src/goal/aggregates/Goal.ts
   export class Goal {
     // 新增属性
     private aiAnalysisEnabled: boolean = false;
     private decompositionHistory: DecompositionResult[] = [];
     private lastAIAnalysisAt?: Date;
     
     // 新增方法
     async requestAIDecomposition(
       aiService: IAIService,
       options?: DecompositionOptions
     ): Promise<DecompositionResult> {
       if (!this.aiAnalysisEnabled) {
         throw new AIAnalysisDisabledError();
       }
       
       const result = await aiService.decomposeGoal({
         goalId: this.id.value,
         title: this.title.value,
         description: this.description?.value || '',
         deadline: this.deadline?.value,
         context: {
           existingSubgoals: this.subgoals.length,
           currentProgress: this.progress.percentage
         }
       });
       
       // 缓存结果
       this.decompositionHistory.push(result);
       this.lastAIAnalysisAt = new Date();
       
       return result;
     }
     
     createTasksFromDecomposition(
       selectedTasks: DecomposedTask[],
       taskFactory: TaskFactory
     ): Task[] {
       return selectedTasks.map(dt => 
         taskFactory.create({
           title: dt.title,
           description: dt.description,
           estimatedMinutes: dt.estimatedMinutes,
           goalId: this.id,
           complexity: dt.complexity
         })
       );
     }
   }
   ```

2. **创建 TaskDecompositionService**
   ```typescript
   // packages/application-client/src/goal/services/TaskDecompositionService.ts
   @injectable()
   export class TaskDecompositionService {
     constructor(
       @inject(TYPES.GoalRepository) private goalRepo: IGoalRepository,
       @inject(TYPES.TaskRepository) private taskRepo: ITaskRepository,
       @inject(TYPES.AIServiceFactory) private aiFactory: AIServiceFactory
     ) {}
     
     async decomposeGoal(
       goalId: string,
       options?: DecompositionOptions
     ): Promise<DecompositionResult> {
       // 1. 获取 Goal
       const goal = await this.goalRepo.findById(new GoalId(goalId));
       if (!goal) throw new GoalNotFoundError(goalId);
       
       // 2. 获取 AI 服务
       const aiService = this.aiFactory.getProvider(options?.provider);
       
       // 3. 执行分解
       const result = await goal.requestAIDecomposition(aiService, options);
       
       // 4. 保存 Goal (更新 AI 历史)
       await this.goalRepo.save(goal);
       
       return result;
     }
     
     async createTasksFromDecomposition(
       goalId: string,
       selectedTasks: DecomposedTask[]
     ): Promise<Task[]> {
       const goal = await this.goalRepo.findById(new GoalId(goalId));
       if (!goal) throw new GoalNotFoundError(goalId);
       
       const tasks = goal.createTasksFromDecomposition(
         selectedTasks,
         this.taskFactory
       );
       
       // 批量保存任务
       await this.taskRepo.saveBatch(tasks);
       
       return tasks;
     }
   }
   ```

**测试**:
- [ ] Goal.requestAIDecomposition() 测试
- [ ] TaskDecompositionService 集成测试
- [ ] 缓存和历史记录测试

---

### Phase 3: UI Implementation (Day 3)

**目标**: 实现用户界面

1. **创建分解对话框组件**
   ```typescript
   // apps/desktop/src/renderer/components/goal/TaskDecompositionDialog.tsx
   export const TaskDecompositionDialog: React.FC<Props> = ({ 
     goalId, 
     open, 
     onClose 
   }) => {
     const [loading, setLoading] = useState(false);
     const [result, setResult] = useState<DecompositionResult | null>(null);
     const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
     
     const handleDecompose = async () => {
       setLoading(true);
       try {
         const decompositionService = container.get(TaskDecompositionService);
         const result = await decompositionService.decomposeGoal(goalId);
         setResult(result);
         // 默认全选
         setSelectedTasks(new Set(result.tasks.map((_, i) => i)));
       } catch (error) {
         toast.error('AI 分解失败: ' + error.message);
       } finally {
         setLoading(false);
       }
     };
     
     const handleCreate = async () => {
       const tasksToCreate = result!.tasks.filter((_, i) => 
         selectedTasks.has(i)
       );
       
       await decompositionService.createTasksFromDecomposition(
         goalId,
         tasksToCreate
       );
       
       toast.success(`成功创建 ${tasksToCreate.length} 个任务！`);
       onClose();
     };
     
     return (
       <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>🤖 AI 智能任务分解</DialogTitle>
         <DialogContent>
           {loading && <CircularProgress />}
           
           {result && (
             <>
               <DecomposedTaskList 
                 tasks={result.tasks}
                 selectedTasks={selectedTasks}
                 onToggleTask={(index) => {
                   const newSet = new Set(selectedTasks);
                   if (newSet.has(index)) {
                     newSet.delete(index);
                   } else {
                     newSet.add(index);
                   }
                   setSelectedTasks(newSet);
                 }}
               />
               
               <TimelineSummary timeline={result.timeline} />
               <RiskWarnings risks={result.risks} />
             </>
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={onClose}>取消</Button>
           {!result && (
             <Button 
               onClick={handleDecompose} 
               variant="contained"
               disabled={loading}
             >
               开始分解
             </Button>
           )}
           {result && (
             <Button 
               onClick={handleCreate}
               variant="contained"
               disabled={selectedTasks.size === 0}
             >
               创建选中的 {selectedTasks.size} 个任务
             </Button>
           )}
         </DialogActions>
       </Dialog>
     );
   };
   ```

2. **创建任务列表组件**
   ```typescript
   // apps/desktop/src/renderer/components/goal/DecomposedTaskList.tsx
   export const DecomposedTaskList: React.FC<Props> = ({
     tasks,
     selectedTasks,
     onToggleTask
   }) => {
     return (
       <List>
         {tasks.map((task, index) => (
           <ListItem key={index}>
             <ListItemIcon>
               <Checkbox
                 checked={selectedTasks.has(index)}
                 onChange={() => onToggleTask(index)}
               />
             </ListItemIcon>
             <ListItemText
               primary={
                 <Box display="flex" alignItems="center" gap={1}>
                   <Typography variant="body1">{task.title}</Typography>
                   <Chip 
                     label={task.complexity} 
                     size="small"
                     color={
                       task.complexity === 'simple' ? 'success' :
                       task.complexity === 'medium' ? 'warning' : 'error'
                     }
                   />
                   <Typography variant="caption" color="textSecondary">
                     {task.estimatedMinutes}分钟
                   </Typography>
                 </Box>
               }
               secondary={
                 <>
                   <Typography variant="body2">{task.description}</Typography>
                   {task.dependencies.length > 0 && (
                     <Typography variant="caption" color="textSecondary">
                       依赖: {task.dependencies.join(', ')}
                     </Typography>
                   )}
                 </>
               }
             />
           </ListItem>
         ))}
       </List>
     );
   };
   ```

3. **在 GoalDetailView 添加触发按钮**
   ```typescript
   // apps/desktop/src/renderer/views/goal/GoalDetailView.tsx
   export const GoalDetailView: React.FC = () => {
     const [decompositionOpen, setDecompositionOpen] = useState(false);
     
     return (
       <Box>
         <Box display="flex" justifyContent="space-between" mb={2}>
           <Typography variant="h4">{goal.title}</Typography>
           <Button
             variant="outlined"
             startIcon={<AutoAwesomeIcon />}
             onClick={() => setDecompositionOpen(true)}
           >
             AI 智能分解
           </Button>
         </Box>
         
         {/* 现有内容 */}
         
         <TaskDecompositionDialog
           goalId={goal.id}
           open={decompositionOpen}
           onClose={() => setDecompositionOpen(false)}
         />
       </Box>
     );
   };
   ```

**测试**:
- [ ] 对话框打开/关闭
- [ ] 加载状态显示
- [ ] 任务选择交互
- [ ] 创建任务成功

---

## 🔄 Integration Points

### 1. DI Container Registration

```typescript
// apps/desktop/src/main/di/container.ts
container.bind<IAIService>(TYPES.AIService)
  .toDynamicValue(() => {
    const config = container.get<IConfigService>(TYPES.ConfigService);
    const apiKey = config.get('ai.openai.apiKey');
    return new OpenAIProvider({ apiKey });
  })
  .inSingletonScope();

container.bind<TaskDecompositionService>(TYPES.TaskDecompositionService)
  .toSelf()
  .inSingletonScope();
```

### 2. Configuration

```typescript
// packages/contracts/src/config/ai-config.ts
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  openai?: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
  };
}
```

### 3. Environment Variables

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-xxx
VITE_AI_PROVIDER=openai
VITE_AI_CACHE_ENABLED=true
VITE_AI_CACHE_TTL=3600
```

---

## 📦 Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "openai": "^4.65.0"
  }
}
```

### Existing Dependencies (No Changes Needed)

- `inversify`: DI container
- `react`: UI framework
- `@mui/material`: UI components
- `zustand`: State management

---

## ✅ Definition of Done

### Code Complete
- [ ] All 3 phases implemented
- [ ] DI container configured
- [ ] Environment variables documented

### Testing Complete
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

### Documentation Complete
- [ ] Code comments added
- [ ] README updated with AI setup instructions
- [ ] User guide created

### Quality Checks
- [ ] ESLint passes
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No console errors

---

## 🚀 Ready to Start!

**Start Command**:
```bash
git checkout -b feature/STORY-027-ai-task-decomposition
pnpm install openai
```

**First Task**: Implement Phase 1 - AI Service Infrastructure
