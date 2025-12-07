/**
 * QuickActions Component
 *
 * 快捷操作按钮组件
 * Story-007: Dashboard UI
 */

export interface QuickAction {
  /** 操作 ID */
  id: string;
  /** 显示标签 */
  label: string;
  /** 图标 emoji */
  icon: string;
  /** 点击事件 */
  onClick: () => void;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'outline';
  /** 是否禁用 */
  disabled?: boolean;
}

export interface QuickActionsProps {
  /** 操作列表 */
  actions: QuickAction[];
  /** 布局方式 */
  layout?: 'horizontal' | 'vertical' | 'grid';
  /** 自定义类名 */
  className?: string;
}

/**
 * 获取按钮样式
 */
function getButtonStyle(variant: QuickAction['variant'] = 'secondary') {
  switch (variant) {
    case 'primary':
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'outline':
      return 'border bg-background hover:bg-muted';
    default:
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  }
}

export function QuickActions({
  actions,
  layout = 'horizontal',
  className = '',
}: QuickActionsProps) {
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 sm:grid-cols-4 gap-2',
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <span>⚡</span>
        <span>快捷操作</span>
      </h3>

      <div className={layoutClasses[layout]}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md 
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getButtonStyle(action.variant)}
            `}
          >
            <span>{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
