/**
 * MiniTrendChart Component
 *
 * 迷你趋势图组件（使用纯 SVG 实现）
 * Story-007: Dashboard UI
 */

export interface TrendDataPoint {
  /** 标签（如日期） */
  label: string;
  /** 数值 */
  value: number;
}

export interface MiniTrendChartProps {
  /** 数据点 */
  data: TrendDataPoint[];
  /** 图表颜色 */
  color?: string;
  /** 高度 */
  height?: number;
  /** 是否显示区域填充 */
  showArea?: boolean;
  /** 加载状态 */
  loading?: boolean;
}

export function MiniTrendChart({
  data,
  color = '#3b82f6',
  height = 40,
  showArea = true,
  loading = false,
}: MiniTrendChartProps) {
  if (loading) {
    return (
      <div
        className="w-full bg-muted rounded animate-pulse"
        style={{ height }}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  // 计算路径
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = ((maxValue - d.value) / range) * (height - 8) + 4;
    return { x, y };
  });

  // 生成 SVG 路径
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaPath = showArea
    ? `${linePath} L 100 ${height} L 0 ${height} Z`
    : '';

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {/* 区域填充 */}
      {showArea && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
          className="transition-all duration-300"
        />
      )}

      {/* 线条 */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="transition-all duration-300"
      />

      {/* 数据点 */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={color}
          className="transition-all duration-300"
        >
          <title>
            {data[i].label}: {data[i].value}
          </title>
        </circle>
      ))}
    </svg>
  );
}

export default MiniTrendChart;
