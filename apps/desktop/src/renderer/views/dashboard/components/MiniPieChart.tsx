/**
 * MiniPieChart Component
 *
 * 迷你饼图组件（使用纯 SVG 实现）
 * Story-007: Dashboard UI
 */

export interface PieDataItem {
  /** 标签 */
  label: string;
  /** 数值 */
  value: number;
  /** 颜色 */
  color: string;
}

export interface MiniPieChartProps {
  /** 数据项 */
  data: PieDataItem[];
  /** 图表尺寸 */
  size?: number;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 内环比例（0-1，0 为实心饼图） */
  innerRadius?: number;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 计算饼图扇形的 SVG 路径
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  if (innerRadius === 0) {
    // 实心饼图
    return [
      'M',
      cx,
      cy,
      'L',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ');
  }

  // 环形图
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    innerEnd.x,
    innerEnd.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    innerStart.x,
    innerStart.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

export function MiniPieChart({
  data,
  size = 80,
  showLegend = true,
  innerRadius = 0.5,
  loading = false,
}: MiniPieChartProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div
          className="rounded-full bg-muted animate-pulse"
          style={{ width: size, height: size }}
        />
        {showLegend && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted animate-pulse" />
                <div className="w-16 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center gap-4">
        <div
          className="rounded-full bg-muted flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-muted-foreground">无数据</span>
        </div>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const actualInnerRadius = radius * innerRadius;

  let currentAngle = 0;
  const arcs = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      percentage: Math.round((item.value / total) * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      {/* SVG 饼图 */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={describeArc(
              cx,
              cy,
              radius,
              actualInnerRadius,
              arc.startAngle,
              arc.endAngle - 0.5, // 留一点间隙
            )}
            fill={arc.color}
            className="transition-all duration-300 hover:opacity-80"
          >
            <title>
              {arc.label}: {arc.value} ({arc.percentage}%)
            </title>
          </path>
        ))}

        {/* 中心文字 */}
        {innerRadius > 0 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-foreground"
          >
            {total}
          </text>
        )}
      </svg>

      {/* 图例 */}
      {showLegend && (
        <div className="space-y-1">
          {arcs.map((arc, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-muted-foreground">{arc.label}</span>
              <span className="font-medium">{arc.value}</span>
              <span className="text-xs text-muted-foreground">
                ({arc.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MiniPieChart;
