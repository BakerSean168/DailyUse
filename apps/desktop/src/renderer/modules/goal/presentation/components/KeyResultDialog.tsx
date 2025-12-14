/**
 * KeyResultDialog Component
 *
 * 关键结果对话框 - 用于创建/编辑关键结果
 */

import { useState, useEffect, useMemo } from 'react';
import type { KeyResultClientDTO, GoalClientDTO } from '@dailyuse/contracts/goal';
import { AggregationMethod } from '@dailyuse/contracts/goal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-shadcn';
import { Button } from '@dailyuse/ui-shadcn';
import { Input } from '@dailyuse/ui-shadcn';
import { Label } from '@dailyuse/ui-shadcn';
import { Textarea } from '@dailyuse/ui-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-shadcn';
import { Progress } from '@dailyuse/ui-shadcn';
import { Target } from 'lucide-react';

interface KeyResultDialogProps {
  open: boolean;
  goalUuid: string;
  goal?: GoalClientDTO | null;
  keyResult?: KeyResultClientDTO | null;
  onClose: () => void;
  onSave: (data: KeyResultFormData) => Promise<void>;
}

export interface KeyResultFormData {
  title: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;
  aggregationMethod: AggregationMethod;
}

// 聚合方法选项
const AGGREGATION_METHODS = [
  { value: AggregationMethod.SUM, label: '求和', hint: '适合累计型指标' },
  { value: AggregationMethod.AVERAGE, label: '求平均', hint: '适合平均值型指标' },
  { value: AggregationMethod.MAX, label: '取最大值', hint: '适合峰值型指标' },
  { value: AggregationMethod.MIN, label: '取最小值', hint: '适合低值型指标' },
  { value: AggregationMethod.LAST, label: '取最后一次', hint: '适合绝对值型指标' },
];

const DEFAULT_FORM_DATA: KeyResultFormData = {
  title: '',
  description: '',
  startValue: 0,
  targetValue: 100,
  currentValue: 0,
  weight: 1,
  aggregationMethod: AggregationMethod.SUM,
};

export function KeyResultDialog({
  open,
  goalUuid,
  goal,
  keyResult,
  onClose,
  onSave,
}: KeyResultDialogProps) {
  const [formData, setFormData] = useState<KeyResultFormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!keyResult;
  const goalColor = goal?.color || '#3b82f6';

  // 重置表单
  useEffect(() => {
    if (open) {
      if (keyResult) {
        setFormData({
          title: keyResult.title,
          description: keyResult.description || '',
          startValue: 0, // 初始值默认为0
          targetValue: keyResult.progress.targetValue,
          currentValue: keyResult.progress.currentValue,
          weight: keyResult.weight,
          aggregationMethod: keyResult.progress.aggregationMethod || AggregationMethod.SUM,
        });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
      setError(null);
    }
  }, [open, keyResult]);

  // 计算预览进度
  const progressPreview = useMemo(() => {
    const { startValue, currentValue, targetValue } = formData;
    const range = targetValue - startValue;
    if (range <= 0) return 0;
    const progress = ((currentValue - startValue) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [formData.startValue, formData.currentValue, formData.targetValue]);

  // 表单验证
  const isValid = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.targetValue > formData.startValue &&
      formData.weight >= 1 &&
      formData.weight <= 10
    );
  }, [formData]);

  const handleChange = <K extends keyof KeyResultFormData>(
    key: K,
    value: KeyResultFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!isValid) {
      setError('请检查表单填写是否正确');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      console.error('[KeyResultDialog] Failed to save:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: goalColor }} />
            {isEditing ? '编辑关键结果' : '创建关键结果'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '修改关键结果的信息'
              : '为目标添加一个新的关键结果，用于衡量目标进度'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h4 className="font-medium">基本信息</h4>

            <div className="space-y-2">
              <Label htmlFor="title">名称 *</Label>
              <Input
                id="title"
                placeholder="例如：新增活跃用户数量"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="描述这个关键结果..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* 数值配置 */}
          <div className="space-y-4">
            <h4 className="font-medium">数值配置</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startValue">起始值</Label>
                <Input
                  id="startValue"
                  type="number"
                  value={formData.startValue}
                  onChange={(e) => handleChange('startValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">初始数值</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">目标值 *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => handleChange('targetValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">期望达到的数值</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">当前值</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => handleChange('currentValue', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">目前的实际数值</p>
              </div>
            </div>
          </div>

          {/* 高级配置 */}
          <div className="space-y-4">
            <h4 className="font-medium">高级配置</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aggregationMethod">进度计算方法</Label>
                <Select
                  value={formData.aggregationMethod}
                  onValueChange={(value) =>
                    handleChange('aggregationMethod', value as AggregationMethod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择计算方法" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex flex-col">
                          <span>{method.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {method.hint}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">权重 (1-10)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  该关键结果在目标中的重要程度
                </p>
              </div>
            </div>
          </div>

          {/* 进度预览 */}
          {formData.title && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">进度预览</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm truncate max-w-[70%]">
                  {formData.title || '关键结果名称'}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: goalColor }}
                >
                  {progressPreview.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={progressPreview}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formData.startValue}</span>
                <span>
                  {formData.currentValue} / {formData.targetValue}
                </span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || loading}
            style={{ backgroundColor: isValid ? goalColor : undefined }}
          >
            {loading ? '保存中...' : isEditing ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KeyResultDialog;
