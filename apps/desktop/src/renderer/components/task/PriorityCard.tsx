/**
 * Priority Card Component
 * 优先级卡片 - 显示任务优先级分析结果
 */

import React, { useState } from 'react';
import type { PriorityScore } from '@dailyuse/application-client/goal';

interface PriorityCardProps {
  score?: PriorityScore;
  loading?: boolean;
  showDetails?: boolean;
  onReanalyze?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

const LEVEL_LABELS: Record<string, string> = {
  critical: '紧急',
  high: '高优先级',
  medium: '中等优先级',
  low: '低优先级',
};

const QUADRANT_LABELS: Record<string, string> = {
  'urgent-important': '紧急且重要',
  'not-urgent-important': '不紧急但重要',
  'urgent-not-important': '紧急但不重要',
  'not-urgent-not-important': '既不紧急也不重要',
};

/**
 * PriorityCard Component
 * Displays task priority analysis with visual indicators
 */
export const PriorityCard: React.FC<PriorityCardProps> = ({
  score,
  loading = false,
  showDetails = true,
  onReanalyze,
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  if (!score) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">未分析优先级</p>
      </div>
    );
  }

  const levelColor = LEVEL_COLORS[score.level] || LEVEL_COLORS.low;
  const levelLabel = LEVEL_LABELS[score.level] || score.level;
  const quadrantLabel = QUADRANT_LABELS[score.eisenhowerQuadrant] || score.eisenhowerQuadrant;

  // 计算因子百分比（用于可视化）
  const factorPercentages = {
    urgency: (score.factors.urgency / 10) * 100,
    importance: (score.factors.importance / 10) * 100,
    impact: (score.factors.impact / 10) * 100,
    effort: (score.factors.effort / 10) * 100,
    dependencies: (score.factors.dependencies / 10) * 100,
    momentum: (score.factors.momentum / 10) * 100,
  };

  return (
    <div className="space-y-3">
      {/* 主要优先级指标 */}
      <div className={`p-4 rounded-lg ${levelColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold opacity-75">优先级评分</p>
            <p className="text-2xl font-bold">{score.score}/100</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{levelLabel}</p>
            <p className="text-xs opacity-75 mt-1">{quadrantLabel}</p>
          </div>
        </div>
      </div>

      {/* 推荐建议 */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-1">建议</p>
        <p className="text-sm text-blue-800">{score.recommendation}</p>
      </div>

      {/* 详细因子分析 */}
      {isExpanded && (
        <div className="space-y-3">
          {/* 紧急度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">紧急度</span>
              <span className="text-xs text-gray-600">{score.factors.urgency.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${factorPercentages.urgency}%` }}
              />
            </div>
          </div>

          {/* 重要度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">重要度</span>
              <span className="text-xs text-gray-600">{score.factors.importance.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${factorPercentages.importance}%` }}
              />
            </div>
          </div>

          {/* 影响度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">影响度</span>
              <span className="text-xs text-gray-600">{score.factors.impact.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${factorPercentages.impact}%` }}
              />
            </div>
          </div>

          {/* 努力度 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">努力度</span>
              <span className="text-xs text-gray-600">{score.factors.effort.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${factorPercentages.effort}%` }}
              />
            </div>
          </div>

          {/* 依赖性 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">依赖性</span>
              <span className="text-xs text-gray-600">{score.factors.dependencies.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${factorPercentages.dependencies}%` }}
              />
            </div>
          </div>

          {/* 动量 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">动量</span>
              <span className="text-xs text-gray-600">{score.factors.momentum.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${factorPercentages.momentum}%` }}
              />
            </div>
          </div>

          {/* 分析原因 */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-1">分析原因</p>
            <p className="text-xs text-gray-600">{score.reasoning}</p>
          </div>

          {/* 分析时间 */}
          <div className="text-xs text-gray-500 pt-1">
            分析时间: {new Date(score.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? '收起详情' : '展开详情'}
        </button>
        {onReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-900 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '重新分析中...' : '重新分析'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PriorityCard;
