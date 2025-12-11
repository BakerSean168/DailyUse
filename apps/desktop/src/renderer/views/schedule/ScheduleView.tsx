/**
 * Schedule View - Simplified Version
 *
 * 日程视图 - 显示每日任务和日程安排
 */

import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ScheduleDay {
  date: Date;
  taskCount: number;
  eventCount: number;
  notes: string;
}

export default function ScheduleView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<ScheduleDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // 初始化周视图日期
  useState(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days: ScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      days.push({
        date,
        taskCount: Math.floor(Math.random() * 5),
        eventCount: Math.floor(Math.random() * 3),
        notes: '',
      });
    }
    setWeekDays(days);
  });

  const handlePreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDayData = weekDays.find(
    (d) => format(d.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的日程</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'yyyy年M月', { locale: zhCN })} - 周视图
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 border rounded-md hover:bg-secondary"
          >
            今天
          </button>
          <button
            onClick={handlePreviousWeek}
            className="px-4 py-2 border rounded-md hover:bg-secondary"
          >
            ← 上周
          </button>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 border rounded-md hover:bg-secondary"
          >
            下周 →
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'week'
              ? 'bg-primary text-primary-foreground'
              : 'border hover:bg-secondary'
          }`}
        >
          📅 周视图
        </button>
        <button
          onClick={() => setViewMode('day')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'day'
              ? 'bg-primary text-primary-foreground'
              : 'border hover:bg-secondary'
          }`}
        >
          📋 日视图
        </button>
      </div>

      {viewMode === 'week' ? (
        // 周视图
        <div className="grid grid-cols-7 gap-2 border rounded-lg overflow-hidden">
          {weekDays.map((day, idx) => {
            const isToday =
              format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isSelected =
              format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day.date)}
                className={`p-4 min-h-40 border-r cursor-pointer transition-colors ${
                  isToday ? 'bg-primary/10' : 'bg-background'
                } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                  idx === 6 ? 'border-r-0' : ''
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isToday ? 'text-primary' : ''
                  }`}
                >
                  {format(day.date, 'EEE', { locale: zhCN })}
                </div>
                <div className={`text-2xl font-bold mb-3 ${isToday ? 'text-primary' : ''}`}>
                  {format(day.date, 'd')}
                </div>
                <div className="space-y-1 text-xs">
                  {day.taskCount > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <span>✓</span>
                      <span>{day.taskCount} 个任务</span>
                    </div>
                  )}
                  {day.eventCount > 0 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <span>📌</span>
                      <span>{day.eventCount} 个事件</span>
                    </div>
                  )}
                  {day.taskCount === 0 && day.eventCount === 0 && (
                    <div className="text-muted-foreground italic">无安排</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 日视图
        <div className="space-y-6">
          {selectedDayData && (
            <>
              {/* 日期标题 */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">
                  {format(selectedDayData.date, 'yyyy年M月d日', { locale: zhCN })}
                </h2>
                <p className="text-muted-foreground">
                  {format(selectedDayData.date, 'EEEE', { locale: zhCN })}
                </p>
              </div>

              {/* 任务部分 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>✓</span> 今日任务 ({selectedDayData.taskCount})
                </h3>
                {selectedDayData.taskCount > 0 ? (
                  <div className="space-y-2">
                    {[...Array(selectedDayData.taskCount)].map((_, i) => (
                      <div
                        key={i}
                        className="p-4 border rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              示例任务 {i + 1}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              这是今天的任务描述
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              ⏱️ 预计 30 分钟
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary whitespace-nowrap">
                            高
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg border-dashed">
                    <div className="text-muted-foreground">
                      🎉 今天没有任务安排
                    </div>
                  </div>
                )}
              </div>

              {/* 日程事件部分 */}
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>📌</span> 日程事件 ({selectedDayData.eventCount})
                </h3>
                {selectedDayData.eventCount > 0 ? (
                  <div className="space-y-2">
                    {[...Array(selectedDayData.eventCount)].map((_, i) => (
                      <div
                        key={i}
                        className="p-4 border border-l-4 border-l-orange-500 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">示例事件 {i + 1}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              这是事件描述
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              🕐 14:30 - 15:30
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-700 whitespace-nowrap">
                            进行中
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg border-dashed">
                    <div className="text-muted-foreground">
                      📅 今天没有日程事件
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
