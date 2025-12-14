/**
 * AIProgressPrediction Component
 *
 * AI 进度预测组件
 * Story 11-7: Advanced Features
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Types
interface Goal {
  id: string;
  name: string;
  progress: number; // 0-100
  startDate: Date;
  targetDate: Date;
  milestones?: {
    id: string;
    name: string;
    targetDate: Date;
    completed: boolean;
  }[];
}

interface ProgressHistory {
  date: Date;
  progress: number;
}

interface PredictionResult {
  goalId: string;
  goalName: string;
  currentProgress: number;
  predictedProgress: number;
  predictedCompletionDate: Date | null;
  onTrack: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  velocity: number; // progress points per day
  recommendations: string[];
  confidence: number; // 0-100
}

interface AIPrediction {
  predictions: PredictionResult[];
  summary: {
    onTrack: number;
    atRisk: number;
    behindSchedule: number;
  };
  insights: string[];
  generatedAt: Date;
}

interface AIProgressPredictionProps {
  goals: Goal[];
  history?: Map<string, ProgressHistory[]>;
  onViewGoal?: (goalId: string) => void;
  className?: string;
}

// Risk level configurations
const riskConfig = {
  low: {
    label: '低风险',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
  medium: {
    label: '中等风险',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
    iconColor: 'text-yellow-500',
  },
  high: {
    label: '高风险',
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
};

// Trend configurations
const trendConfig = {
  improving: { label: '上升', icon: TrendingUp, color: 'text-green-500' },
  stable: { label: '稳定', icon: ArrowRight, color: 'text-blue-500' },
  declining: { label: '下降', icon: TrendingDown, color: 'text-red-500' },
};

// Mock AI prediction (in real app, would call AI service)
async function generatePrediction(
  goals: Goal[],
  history?: Map<string, ProgressHistory[]>
): Promise<AIPrediction> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const today = new Date();
  const predictions: PredictionResult[] = [];

  for (const goal of goals) {
    const daysTotal = differenceInDays(goal.targetDate, goal.startDate);
    const daysElapsed = differenceInDays(today, goal.startDate);
    const daysRemaining = differenceInDays(goal.targetDate, today);

    // Calculate expected progress
    const expectedProgress = Math.min(100, (daysElapsed / daysTotal) * 100);
    const progressDiff = goal.progress - expectedProgress;

    // Determine risk level
    let riskLevel: PredictionResult['riskLevel'] = 'low';
    if (progressDiff < -20) {
      riskLevel = 'high';
    } else if (progressDiff < -10) {
      riskLevel = 'medium';
    }

    // Calculate velocity (mock based on current progress)
    const velocity = daysElapsed > 0 ? goal.progress / daysElapsed : 0;

    // Determine trend
    let trend: PredictionResult['trend'] = 'stable';
    if (progressDiff > 5) {
      trend = 'improving';
    } else if (progressDiff < -5) {
      trend = 'declining';
    }

    // Predict completion date
    let predictedCompletionDate: Date | null = null;
    if (velocity > 0) {
      const daysToComplete = (100 - goal.progress) / velocity;
      predictedCompletionDate = addDays(today, Math.ceil(daysToComplete));
    }

    // Determine if on track
    const onTrack = predictedCompletionDate
      ? isBefore(predictedCompletionDate, goal.targetDate) || 
        differenceInDays(predictedCompletionDate, goal.targetDate) <= 3
      : false;

    // Predict progress at target date
    const predictedProgress = Math.min(100, Math.round(velocity * (daysElapsed + daysRemaining)));

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('建议增加每日投入时间');
      recommendations.push('考虑缩减目标范围或延长截止日期');
      recommendations.push('识别并消除主要阻碍因素');
    } else if (riskLevel === 'medium') {
      recommendations.push('保持当前进度，稍微加速');
      recommendations.push('确保关键里程碑按时完成');
    } else {
      recommendations.push('保持当前良好势头');
      if (trend === 'improving') {
        recommendations.push('考虑挑战更高目标');
      }
    }

    predictions.push({
      goalId: goal.id,
      goalName: goal.name,
      currentProgress: goal.progress,
      predictedProgress,
      predictedCompletionDate,
      onTrack,
      riskLevel,
      trend,
      velocity: Math.round(velocity * 10) / 10,
      recommendations,
      confidence: riskLevel === 'low' ? 90 : riskLevel === 'medium' ? 75 : 60,
    });
  }

  // Calculate summary
  const summary = {
    onTrack: predictions.filter((p) => p.onTrack).length,
    atRisk: predictions.filter((p) => p.riskLevel === 'medium').length,
    behindSchedule: predictions.filter((p) => p.riskLevel === 'high').length,
  };

  // Generate insights
  const insights: string[] = [];
  if (summary.behindSchedule > 0) {
    insights.push(`${summary.behindSchedule} 个目标需要立即关注，存在延期风险`);
  }
  if (summary.onTrack === predictions.length) {
    insights.push('🎉 所有目标都在正轨上，继续保持!');
  }
  const avgVelocity = predictions.reduce((sum, p) => sum + p.velocity, 0) / predictions.length;
  insights.push(`平均日进度: ${avgVelocity.toFixed(1)}%，${avgVelocity > 3 ? '效率较高' : '建议提升效率'}`);

  return {
    predictions,
    summary,
    insights,
    generatedAt: new Date(),
  };
}

// Prediction Card Component
interface PredictionCardProps {
  prediction: PredictionResult;
  onViewGoal?: () => void;
}

function PredictionCard({ prediction, onViewGoal }: PredictionCardProps) {
  const risk = riskConfig[prediction.riskLevel];
  const trend = trendConfig[prediction.trend];
  const RiskIcon = risk.icon;
  const TrendIcon = trend.icon;

  return (
    <Card className={cn(!prediction.onTrack && 'border-l-4 border-l-yellow-500')}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{prediction.goalName}</h3>
              <Badge variant="secondary" className={risk.color}>
                {risk.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <TrendIcon className={cn('h-4 w-4', trend.color)} />
              <span className="text-xs text-muted-foreground">趋势: {trend.label}</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground">
                日均 {prediction.velocity}%
              </span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">{prediction.confidence}% 置信度</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI 预测的可信度</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress comparison */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">当前进度</span>
            <span className="font-medium">{prediction.currentProgress}%</span>
          </div>
          <Progress value={prediction.currentProgress} className="h-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">预测进度 (截止日)</span>
            <span className={cn('font-medium', prediction.predictedProgress < 100 && 'text-yellow-600')}>
              {prediction.predictedProgress}%
            </span>
          </div>
          <Progress
            value={prediction.predictedProgress}
            className={cn('h-2', prediction.predictedProgress < 100 && '[&>div]:bg-yellow-500')}
          />
        </div>

        {/* Completion prediction */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">预计完成:</span>
            {prediction.predictedCompletionDate ? (
              <span className={cn(prediction.onTrack ? 'text-green-600' : 'text-yellow-600')}>
                {format(prediction.predictedCompletionDate, 'MM月dd日', { locale: zhCN })}
              </span>
            ) : (
              <span className="text-muted-foreground">无法预测</span>
            )}
          </div>
          {onViewGoal && (
            <Button variant="ghost" size="sm" onClick={onViewGoal}>
              查看详情
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Recommendations */}
        {prediction.recommendations.length > 0 && (
          <div className="mt-3 p-2 rounded-md bg-muted/50">
            <p className="text-xs font-medium mb-1">AI 建议:</p>
            {prediction.recommendations.slice(0, 2).map((rec, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
export function AIProgressPrediction({
  goals,
  history,
  onViewGoal,
  className,
}: AIProgressPredictionProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);

  // Generate prediction
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generatePrediction(goals, history);
      setPrediction(result);
    } catch (error) {
      console.error('Failed to generate prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [goals, history]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI 进度预测</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || goals.length === 0}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : prediction ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          <span className="ml-2">{prediction ? '刷新预测' : '开始分析'}</span>
        </Button>
      </div>

      {/* No data state */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>没有可分析的目标</p>
            <p className="text-sm">创建目标后即可使用 AI 预测功能</p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">AI 正在分析你的目标进度...</p>
          </CardContent>
        </Card>
      )}

      {/* Prediction result */}
      {prediction && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{prediction.summary.onTrack}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">正轨中</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{prediction.summary.atRisk}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">存在风险</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{prediction.summary.behindSchedule}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">落后进度</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {prediction.insights.map((insight, i) => (
                    <p key={i} className="text-sm">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictions list */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {prediction.predictions
                .sort((a, b) => {
                  // Sort by risk level (high first)
                  const riskOrder = { high: 0, medium: 1, low: 2 };
                  return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                })
                .map((pred) => (
                  <PredictionCard
                    key={pred.goalId}
                    prediction={pred}
                    onViewGoal={onViewGoal ? () => onViewGoal(pred.goalId) : undefined}
                  />
                ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center">
            预测生成于 {format(prediction.generatedAt, 'HH:mm:ss', { locale: zhCN })}
            ，基于历史数据和 AI 分析
          </p>
        </>
      )}
    </div>
  );
}

export default AIProgressPrediction;
