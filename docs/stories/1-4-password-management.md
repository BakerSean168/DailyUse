# Story 1.4: 密码管理（修改/重置）

> **Story ID**: STORY-1.4  
> **Epic**: Epic 1 - Account & Authentication  
> **优先级**: P0  
> **Story Points**: 3  
> **状态**: Drafted  
> **创建时间**: 2025-10-28  
> **依赖**: Story 1.2 (用户登录与 Token 管理)

---

## 📖 User Story

**As a** 已登录用户  
**I want to** 修改我的账户密码  
**So that** 我可以维护账户安全

---

## 🎯 验收标准

### AC-1: 修改密码
```gherkin
Given 已登录用户
When 输入旧密码 "OldPass123!" 和新密码 "NewPass456!"
Then PUT /api/accounts/me/password 成功
And 使用 bcrypt 加密新密码并更新 AuthCredential
And passwordChangedAt 更新为当前时间
And 所有活跃 Session 失效（强制重新登录）
And 返回成功消息 "Password updated successfully"
```

### AC-2: 旧密码验证
```gherkin
Given 已登录用户
When 输入错误的旧密码
Then 返回 401 Unauthorized
And 错误消息为 "Current password is incorrect"
```

### AC-3: 新密码强度验证
```gherkin
Given 已登录用户
When 新密码不符合强度要求（如 "123"）
Then 返回 400 Bad Request
And 错误消息详细说明密码要求
```

### AC-4: 密码重置（Phase 2）
```gherkin
Note: Phase 1 暂不实现，需集成邮件服务
```

---

## 🔧 技术实现任务

### Backend Tasks (6 个)
1. 在 `AccountProfileApplicationService` 中实现 `changePassword(accountUuid, oldPassword, newPassword)`
2. 验证旧密码（使用 bcrypt.compare）
3. 验证新密码强度
4. 加密新密码并更新 AuthCredential
5. 使所有 Session 失效（设置 isActive = false）
6. 实现 `PUT /api/accounts/me/password` 端点

### Frontend Tasks (3 个)
1. 创建密码修改表单组件
2. 实现密码强度实时提示
3. 编写 E2E 测试

---

## 📊 DoD

- [ ] 所有测试通过（覆盖率 ≥ 80%）
- [ ] 密码加密正确（bcrypt）
- [ ] 会话失效机制验证通过
- [ ] Code Review 完成
- [ ] Sprint Status 更新为 "done"

---

**Story Owner**: Backend Team + Frontend Team  
**最后更新**: 2025-10-28  
**状态**: Drafted
