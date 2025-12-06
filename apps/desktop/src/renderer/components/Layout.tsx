/**
 * App Layout with Navigation
 *
 * 应用布局组件 - 侧边栏导航
 */

import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/goals', label: '目标', icon: '🎯' },
  { path: '/tasks', label: '任务', icon: '✅' },
  { path: '/schedule', label: '日程', icon: '📅' },
  { path: '/reminders', label: '提醒', icon: '🔔' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">DailyUse</h1>
          <p className="text-xs text-muted-foreground">Desktop App</p>
        </div>
        <nav className="p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`
              }
              end={item.path === '/'}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
