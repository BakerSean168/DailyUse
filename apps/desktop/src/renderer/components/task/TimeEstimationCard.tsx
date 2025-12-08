/**
 * 时间预估卡片组件
 * 显示任务时间预估信息、置信度和调整明细
 * @module TimeEstimationCard
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimeEstimate } from '@dailyuse/contracts/goal';

export interface TimeEstimationCardProps {
  /** 时间估算结果 */
  estimate: TimeEstimate;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否显示调整明细 */
  showDetails?: boolean;
  /** 重新估算回调 */
  onReEstimate?: () => Promise<void>;
  /** 用户修改估算值的回调 */
  onEstimateChange?: (minutes: number) => void;
}

export const TimeEstimationCard: React.FC<TimeEstimationCardProps> = ({
  estimate,
  loading = false,
  showDetails = true,
  onReEstimate,
  onEstimateChange,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(
    estimate.estimatedMinutes.toString()
  );
  const [reEstimating, setReEstimating] = React.useState(false);

  const handleReEstimate = async () => {
    if (!onReEstimate) return;
    setReEstimating(true);
    try {
      await onReEstimate();
    } finally {
      setReEstimating(false);
    }
  };

  const handleSaveEdit = () => {
    const value = parseInt(editValue, 10);
    if (!isNaN(value) && value > 0) {
      onEstimateChange?.(value);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(estimate.estimatedMinutes.toString());
    setIsEditing(false);
  };

  // 置信度指示器
  const confidenceLevel =
    estimate.confidenceScore >= 0.8
      ? 'high'
      : estimate.confidenceScore >= 0.5
        ? 'medium'
        : 'low';

  const confidenceColor =
    confidenceLevel === 'high'
      ? 'text-green-600'
      : confidenceLevel === 'medium'
        ? 'text-yellow-600'
        : 'text-red-600';

  const confidenceLabel =
    confidenceLevel === 'high'
      ? '高置信度'
      : confidenceLevel === 'medium'
        ? '中等置信度'
        : '低置信度';

  // 调整情况
  const hasAdjustment =
    estimate.adjustedMinutes &&
    estimate.adjustedMinutes !== estimate.estimatedMinutes;
  const adjustmentPercent = hasAdjustment
    ? (
        ((estimate.adjustedMinutes - estimate.estimatedMinutes) /
          estimate.estimatedMinutes) *
        100
      ).toFixed(0)
    : '0';

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      {/* 头部：标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">时间预估</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReEstimate}
          disabled={loading || reEstimating || !onReEstimate}
          className="h-8 w-8 p-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${reEstimating ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* 主要信息：预估时间和置信度 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">预估时长</p>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm font-semibold"
                autoFocus
              />
              <span className="text-sm text-gray-600 leading-7">分钟</span>
            </div>
          ) : (
            <div
              className="flex items-baseline gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
              onClick={() => setIsEditing(true)}
            >
              <span className="text-2xl font-bold text-blue-600">
                {estimate.estimatedMinutes}
              </span>
              <span className="text-sm text-gray-600">分钟</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">置信度</p>
          <div className="flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  confidenceLevel === 'high'
                    ? 'bg-green-600'
                    : confidenceLevel === 'medium'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                }`}
                style={{
                  width: `${estimate.confidenceScore * 100}%`,
                }}
              />
            </div>
            <span className={`text-xs font-semibold ${confidenceColor}`}>
              {(estimate.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{confidenceLabel}</p>
        </div>
      </div>

      {/* 预估理由 */}
      {estimate.reasoning && (
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">预估说明</p>
          <p className="text-sm text-gray-700">{estimate.reasoning}</p>
        </div>
      )}

      {/* 调整明细（可选） */}
      {showDetails && hasAdjustment && (
        <div className="bg-white rounded-lg p-3 border-l-4 border-orange-400">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">历史数据调整</p>
              <p className="text-sm font-semibold text-orange-700">
                基础估算: {estimate.estimatedMinutes}
                分钟
                {estimate.adjustmentReason && (
                  <>
                    <br />
                    <span className="font-normal text-orange-600">
                      调整: {adjustmentPercent > 0 ? '+' : ''}
                      {adjustmentPercent}%
                    </span>
                    <br />
                    <span className="font-normal text-gray-600">
                      {estimate.adjustmentReason}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 编辑操作按钮 */}
      {isEditing && (
        <div className="flex gap-2 pt-2 border-t border-blue-200">
          <Button
            size="sm"
            onClick={handleSaveEdit}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            保存
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            className="flex-1"
          >
            取消
          </Button>
        </div>
      )}

      {/* 加载状态指示 */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span>正在生成预估...</span>
        </div>
      )}
    </Card>
  );
};

export default TimeEstimationCard;
