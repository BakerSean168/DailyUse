# Stories 13.29-13.38: Phase 4 系统模块

## Story 13.29: Account 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.29 |
| 优先级 | P0 (Critical) |
| 预估工时 | 4h |

### 目标
为 Account 模块创建 IPC Client。

### 任务列表
- [ ] AccountIPCClient 实现
- [ ] 账户切换功能
- [ ] 账户数据隔离
- [ ] DI 配置

---

## Story 13.30: Account Store & UI

| 属性 | 值 |
|------|-----|
| Story ID | 13.30 |
| 优先级 | P0 (Critical) |
| 预估工时 | 4h |

### 目标
重构 Account Store 并完善 UI。

### 任务列表
- [ ] Store 重构
- [ ] 账户列表 UI
- [ ] 账户切换 UI
- [ ] 账户设置 UI

---

## Story 13.31: Auth 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.31 |
| 优先级 | P0 (Critical) |
| 预估工时 | 5h |

### 目标
为 Auth 模块创建 IPC Client，支持本地认证和 OAuth。

### 任务列表
- [ ] AuthIPCClient 实现
- [ ] 本地密码认证
- [ ] OAuth 集成（Google/GitHub）
- [ ] Token 管理
- [ ] DI 配置

---

## Story 13.32: Auth Store & 登录 UI

| 属性 | 值 |
|------|-----|
| Story ID | 13.32 |
| 优先级 | P0 (Critical) |
| 预估工时 | 5h |

### 目标
重构 Auth Store 并完善登录 UI。

### 任务列表
- [ ] Store 重构
- [ ] 登录页面
- [ ] OAuth 按钮
- [ ] 记住登录状态

---

## Story 13.33: Setting 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.33 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |

### 目标
为 Setting 模块创建 IPC Client。

### 任务列表
- [ ] SettingIPCClient 实现
- [ ] 用户偏好设置
- [ ] 应用设置
- [ ] 同步设置

---

## Story 13.34: Setting Store & 设置页面

| 属性 | 值 |
|------|-----|
| Story ID | 13.34 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |

### 目标
重构 Setting Store 并创建完整的设置页面。

### 任务列表
- [ ] Store 重构
- [ ] 通用设置页面
- [ ] 外观设置（主题、字体）
- [ ] 快捷键设置
- [ ] 通知设置
- [ ] 隐私设置

---

## Story 13.35: Dashboard 模块 IPC Client

| 属性 | 值 |
|------|-----|
| Story ID | 13.35 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |

### 目标
为 Dashboard 模块创建 IPC Client。

### 任务列表
- [ ] DashboardIPCClient 实现
- [ ] 统计数据聚合
- [ ] 趋势分析
- [ ] 小部件数据

---

## Story 13.36: Dashboard Store & 组件

| 属性 | 值 |
|------|-----|
| Story ID | 13.36 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |

### 目标
重构 Dashboard Store 并创建仪表板组件。

### 任务列表
- [ ] Store 重构
- [ ] 统计卡片组件
- [ ] 趋势图表组件
- [ ] 活动时间线
- [ ] 目标进度概览

---

## Story 13.37: Dashboard 数据可视化

| 属性 | 值 |
|------|-----|
| Story ID | 13.37 |
| 优先级 | P2 (Medium) |
| 预估工时 | 5h |

### 目标
实现高级数据可视化功能。

### 任务列表
- [ ] 日历热力图
- [ ] 任务完成趋势
- [ ] 专注时长分析
- [ ] 目标达成率

---

## Story 13.38: Dashboard 自定义布局

| 属性 | 值 |
|------|-----|
| Story ID | 13.38 |
| 优先级 | P3 (Low) |
| 预估工时 | 4h |

### 目标
支持仪表板自定义布局。

### 任务列表
- [ ] 拖拽排序
- [ ] 组件显示/隐藏
- [ ] 布局保存
- [ ] 布局预设
