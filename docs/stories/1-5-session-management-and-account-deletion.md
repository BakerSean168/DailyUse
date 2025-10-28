# Story 1.5: 会话管理与账户注销

> **Story ID**: STORY-1.5  
> **Epic**: Epic 1 - Account & Authentication  
> **优先级**: P0  
> **Story Points**: 2  
> **状态**: Drafted  
> **创建时间**: 2025-10-28  
> **依赖**: Story 1.2 (用户登录与 Token 管理)

---

## 📖 User Story

**As a** 已登录用户  
**I want to** 查看我的活跃会话并能够登出特定设备，以及注销账户  
**So that** 我可以管理我的账户安全

---

## 🎯 验收标准

### AC-1: 查看活跃会话
```gherkin
Given 已登录用户有 3 个活跃会话
When 访问 GET /api/accounts/me/sessions
Then 返回所有活跃会话列表
And 每个会话包含: sessionId, deviceType, deviceName, ipAddress, lastAccessedAt, isCurrent
And isCurrent 标识当前请求的会话
```

### AC-2: 登出特定设备
```gherkin
Given 用户有多个活跃会话
When 选择某个会话并点击"登出此设备"
Then DELETE /api/accounts/me/sessions/:sessionId 成功
And 该会话的 isActive 设置为 false
And 该设备的 refreshToken 失效
```

### AC-3: 登出所有其他设备
```gherkin
Given 用户有多个活跃会话
When 点击"登出所有其他设备"
Then POST /api/accounts/me/sessions/revoke-others 成功
And 除当前会话外，所有会话 isActive = false
```

### AC-4: 账户注销（软删除）
```gherkin
Given 已登录用户
When 确认注销账户并输入密码验证
Then DELETE /api/accounts/me 成功
And Account.deletedAt 设置为当前时间
And Account.status 更新为 "DELETED"
And 所有 Session 失效
And 前端清除 Token 并跳转到登录页
And 显示消息 "Account deleted successfully"
```

### AC-5: 账户注销后禁止登录
```gherkin
Given 账户已注销（deletedAt 不为空）
When 尝试登录
Then 返回 403 Forbidden
And 错误消息为 "Account has been deleted"
```

---

## 🔧 技术实现任务

### Backend Tasks (6 个)
1. 实现 `SessionApplicationService.getActiveSessions(accountUuid)`
2. 实现 `SessionApplicationService.revokeSession(accountUuid, sessionId)`
3. 实现 `SessionApplicationService.revokeOtherSessions(accountUuid, currentSessionId)`
4. 实现 `AccountApplicationService.deleteAccount(accountUuid, password)`
5. 实现相关 API 端点
6. 在登录流程中添加账户注销检查

### Frontend Tasks (4 个)
1. 创建会话管理页面组件
2. 实现账户注销确认对话框
3. 实现 logout 流程（清除 localStorage）
4. 编写 E2E 测试

---

## 📊 DoD

- [ ] 所有测试通过（覆盖率 ≥ 80%）
- [ ] 会话管理功能完整
- [ ] 账户注销（软删除）机制验证通过
- [ ] 注销后禁止登录验证通过
- [ ] Code Review 完成
- [ ] Sprint Status 更新为 "done"

---

**Story Owner**: Backend Team + Frontend Team  
**最后更新**: 2025-10-28  
**状态**: Drafted
