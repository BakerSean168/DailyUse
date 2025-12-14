# Story 11.7: 高级功能迁移（DAG、Timeline、FocusMode、AI 增强）

Status: ready-for-dev

## Story

作为一名**高级用户**，
我想要**在 Desktop 应用中使用目标 DAG、时间线、专注模式和 AI 增强功能**，
以便**可视化目标/任务依赖关系、追踪进度时间线、专注工作、利用 AI 提升效率**。

## 业务背景

这些高级功能是应用的核心竞争力，包括：
- **DAG 可视化**: 目标树、任务依赖图、关系网络
- **时间线**: 目标时间线、进度图表
- **专注模式**: 番茄钟、专注追踪
- **AI 增强**: 任务分解、日程建议、进度预测

## Acceptance Criteria

### AC 11.7.1: DAG 可视化
```gherkin
Given 用户需要可视化目标/任务依赖关系
When 打开 DAG 视图
Then GoalDAG.tsx 显示目标层级树
And TaskDependencyGraph.tsx 显示任务依赖图
And 支持节点展开/折叠
And 支持缩放和拖拽
```

### AC 11.7.2: 时间线功能
```gherkin
Given 用户需要查看目标进度
When 打开时间线视图
Then GoalTimeline.tsx 显示目标时间线
And ProgressChart.tsx 显示进度图表
And 支持时间范围选择
```

### AC 11.7.3: 专注模式
```gherkin
Given 用户需要专注工作
When 启动专注模式
Then FocusModePanel.tsx 显示专注面板
And PomodoroTimer.tsx 提供番茄钟计时
And FocusStatistics.tsx 显示专注统计
```

### AC 11.7.4: AI 增强功能
```gherkin
Given 用户需要 AI 辅助
When 使用 AI 功能
Then AITaskBreakdown.tsx 支持任务智能分解
And AIScheduleSuggestion.tsx 提供日程建议
And AIProgressPrediction.tsx 显示进度预测
```

## Tasks / Subtasks

### Task 1: DAG 可视化 (AC: 11.7.1)
- [ ] T7.1.1: 创建 GoalDAG.tsx (6h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/GoalDAG.tsx`
  - 功能: 使用 React Flow 或 D3.js 实现目标层级树
  - 支持展开/折叠、缩放、拖拽
- [ ] T7.1.2: 创建 TaskDependencyGraph.tsx (5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/TaskDependencyGraph.tsx`
  - 功能: 任务依赖关系图
  - 支持依赖线绘制、循环检测高亮
- [ ] T7.1.3: 创建 DAGControls.tsx (2h)
  - 路径: `apps/desktop/src/renderer/shared/components/dag/DAGControls.tsx`
  - 功能: 缩放控制、布局切换、导出图片

### Task 2: 时间线功能 (AC: 11.7.2)
- [ ] T7.2.1: 创建 GoalTimeline.tsx (4h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/GoalTimeline.tsx`
  - 功能: 目标时间线视图，显示里程碑和进度
- [ ] T7.2.2: 创建 ProgressChart.tsx (3h)
  - 路径: `apps/desktop/src/renderer/shared/components/charts/ProgressChart.tsx`
  - 功能: 进度环形/条形图表
- [ ] T7.2.3: 创建 TimeRangeSelector.tsx (2h)
  - 路径: `apps/desktop/src/renderer/shared/components/selectors/TimeRangeSelector.tsx`
  - 功能: 日/周/月/季度时间范围选择

### Task 3: 专注模式 (AC: 11.7.3)
- [ ] T7.3.1: 创建 FocusModePanel.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/focus/presentation/components/FocusModePanel.tsx`
  - 功能: 专注模式主面板，任务选择、计时控制
- [ ] T7.3.2: 创建 PomodoroTimer.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/focus/presentation/components/PomodoroTimer.tsx`
  - 功能: 番茄钟计时器，25分钟工作+5分钟休息
- [ ] T7.3.3: 创建 FocusStatistics.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/focus/presentation/components/FocusStatistics.tsx`
  - 功能: 专注时长统计、完成任务数
- [ ] T7.3.4: 创建 useFocus.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/focus/presentation/hooks/useFocus.ts`
  - 功能: 专注模式状态和操作

### Task 4: AI 增强功能 (AC: 11.7.4)
- [ ] T7.4.1: 创建 AITaskBreakdown.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/components/AITaskBreakdown.tsx`
  - 功能: AI 任务分解，输入目标自动生成子任务
- [ ] T7.4.2: 创建 AIScheduleSuggestion.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/components/AIScheduleSuggestion.tsx`
  - 功能: AI 日程建议，根据任务和偏好推荐时间
- [ ] T7.4.3: 创建 AIProgressPrediction.tsx (2.5h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/components/AIProgressPrediction.tsx`
  - 功能: AI 进度预测，预测完成时间和风险

## Dev Notes

### DAG 可视化实现

推荐使用 **React Flow** 库实现 DAG：

```tsx
// GoalDAG.tsx
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GoalDAGProps {
  rootGoalId: string;
}

function GoalDAG({ rootGoalId }: GoalDAGProps) {
  const { goals, getChildGoals } = useGoalStore();
  
  const { nodes, edges } = useMemo(() => {
    const buildTree = (goalId: string, level = 0, position = { x: 0, y: 0 }) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return { nodes: [], edges: [] };
      
      const node: Node = {
        id: goal.id,
        type: 'goalNode',
        position,
        data: { goal },
      };
      
      const children = getChildGoals(goalId);
      const childResults = children.map((child, i) => 
        buildTree(child.id, level + 1, { 
          x: position.x + i * 200 - (children.length - 1) * 100, 
          y: position.y + 150 
        })
      );
      
      const childEdges: Edge[] = children.map(child => ({
        id: `${goalId}-${child.id}`,
        source: goalId,
        target: child.id,
        animated: true,
      }));
      
      return {
        nodes: [node, ...childResults.flatMap(r => r.nodes)],
        edges: [...childEdges, ...childResults.flatMap(r => r.edges)],
      };
    };
    
    return buildTree(rootGoalId);
  }, [rootGoalId, goals]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

// 自定义节点组件
const GoalNode = ({ data }: { data: { goal: Goal } }) => (
  <Card className="w-48 p-2">
    <div className="font-medium truncate">{data.goal.name}</div>
    <Progress value={data.goal.progress} className="h-1 mt-1" />
    <Badge variant="outline" className="mt-1">
      {data.goal.status}
    </Badge>
  </Card>
);

const nodeTypes = { goalNode: GoalNode };
```

### 番茄钟实现

```tsx
// PomodoroTimer.tsx
interface PomodoroTimerProps {
  taskId?: string;
  onComplete?: () => void;
}

function PomodoroTimer({ taskId, onComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'work') {
            setMode('break');
            onComplete?.();
            return 5 * 60; // 5分钟休息
          } else {
            setMode('work');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, mode, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 text-center">
      <div className="text-sm text-muted-foreground mb-2">
        {mode === 'work' ? '专注工作' : '休息时间'}
      </div>
      <div className="text-6xl font-mono mb-4">
        {formatTime(timeLeft)}
      </div>
      <div className="flex justify-center gap-2">
        <Button 
          onClick={() => setIsRunning(!isRunning)}
          variant={isRunning ? 'outline' : 'default'}
        >
          {isRunning ? '暂停' : '开始'}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
          }}
        >
          重置
        </Button>
      </div>
    </Card>
  );
}
```

### 依赖包

需要安装以下依赖：
- `reactflow`: DAG 可视化
- `recharts` 或 `chart.js`: 图表组件

```bash
pnpm add reactflow recharts
```

### 目录结构

```
apps/desktop/src/renderer/modules/
├── goal/presentation/components/
│   ├── GoalDAG.tsx
│   └── GoalTimeline.tsx
├── task/presentation/components/
│   └── TaskDependencyGraph.tsx
├── focus/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│       ├── components/
│       │   ├── FocusModePanel.tsx
│       │   ├── PomodoroTimer.tsx
│       │   └── FocusStatistics.tsx
│       └── hooks/
│           └── useFocus.ts
├── ai/presentation/components/
│   ├── AITaskBreakdown.tsx
│   ├── AIScheduleSuggestion.tsx
│   └── AIProgressPrediction.tsx
└── shared/components/
    ├── dag/
    │   └── DAGControls.tsx
    ├── charts/
    │   └── ProgressChart.tsx
    └── selectors/
        └── TimeRangeSelector.tsx
```

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- React Flow 官方文档: https://reactflow.dev/
- Recharts 文档: https://recharts.org/

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| DAG 可视化 | 13h |
| 时间线功能 | 9h |
| 专注模式 | 10h |
| AI 增强功能 | 8.5h |
| **总计** | **40.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

