/**
 * Reminder View - Simplified Version
 *
 * 提醒视图 - 显示提醒模板列表和管理
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReminderTemplate {
  uuid: string;
  displayTitle: string;
  typeText: string;
  importanceLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  nextTriggerAt?: string;
  triggerText: string;
}

export default function ReminderView() {
  const [reminders] = useState<ReminderTemplate[]>([
    {
      uuid: '1',
      displayTitle: '每日晨会',
      typeText: 'SCHEDULE',
      importanceLevel: 'HIGH',
      isActive: true,
      nextTriggerAt: new Date(Date.now() + 3600000).toISOString(),
      triggerText: '09:00',
    },
    {
      uuid: '2',
      displayTitle: '每周计划总结',
      typeText: 'PERIODIC',
      importanceLevel: 'MEDIUM',
      isActive: true,
      nextTriggerAt: new Date(Date.now() + 86400000).toISOString(),
      triggerText: '周一 14:00',
    },
    {
      uuid: '3',
      displayTitle: '重要项目跟进',
      typeText: 'SCHEDULE',
      importanceLevel: 'CRITICAL',
      isActive: true,
      nextTriggerAt: new Date(Date.now() + 7200000).toISOString(),
      triggerText: '今天 16:00',
    },
    {
      uuid: '4',
      displayTitle: '生活用品补充',
      typeText: 'PERIODIC',
      importanceLevel: 'LOW',
      isActive: true,
      triggerText: '周末',
    },
  ]);

  const [sortBy, setSortBy] = useState<'importance' | 'nextTrigger'>('importance');
  const [filterActive, setFilterActive] = useState(true);

  const getSortedReminders = () => {
    const filtered = reminders.filter((r) =>
      filterActive ? r.isActive : true
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'importance') {
        const importanceOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return importanceOrder[a.importanceLevel] - importanceOrder[b.importanceLevel];
      } else {
        const timeA = a.nextTriggerAt ? new Date(a.nextTriggerAt).getTime() : Infinity;
        const timeB = b.nextTriggerAt ? new Date(b.nextTriggerAt).getTime() : Infinity;
        return timeA - timeB;
      }
    });
  };

  const getImportanceIcon = (level: string) => {
    const iconMap: Record<string, string> = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢',
    };
    return iconMap[level] || '⚪';
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      SCHEDULE: '日程',
      PERIODIC: '周期',
      ONCE: '一次',
      RECURRING: '重复',
    };
    return typeMap[type] || type;
  };

  const sortedReminders = getSortedReminders();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的提醒</h1>
          <p className="text-muted-foreground">
            共 {reminders.length} 个提醒模板
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          ➕ 新建提醒
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-secondary/50">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">排序：</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'importance' | 'nextTrigger')}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            <option value="importance">按重要性</option>
            <option value="nextTrigger">按下次触发时间</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">筛选：</label>
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterActive
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-secondary'
            }`}
          >
            {filterActive ? '✓ 仅显示活跃' : '显示全部'}
          </button>
        </div>

        <div className="flex-1" />

        <button className="px-4 py-1 border rounded-md hover:bg-secondary text-sm font-medium">
          🔄 刷新
        </button>
      </div>

      {/* Reminders List */}
      {sortedReminders.length > 0 ? (
        <div className="space-y-3">
          {sortedReminders.map((reminder) => (
            <div
              key={reminder.uuid}
              className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">
                  {getImportanceIcon(reminder.importanceLevel)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">
                      {reminder.displayTitle}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {getTypeLabel(reminder.typeText)}
                    </span>
                    {!reminder.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        已禁用
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      🕐 触发条件: <span className="font-medium">{reminder.triggerText}</span>
                    </span>

                    {reminder.nextTriggerAt && (
                      <span className="flex items-center gap-1">
                        📅 下次: <span className="font-medium">
                          {format(new Date(reminder.nextTriggerAt), 'M月d日 HH:mm', {
                            locale: zhCN,
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded-md hover:bg-secondary text-sm">
                    ✏️ 编辑
                  </button>
                  <button className="px-3 py-1 border rounded-md hover:bg-destructive/10 text-sm text-destructive hover:text-destructive">
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border rounded-lg border-dashed">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-muted-foreground">
            {filterActive ? '没有活跃的提醒' : '没有任何提醒'}
          </div>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            创建第一个提醒
          </button>
        </div>
      )}
    </div>
  );
}
