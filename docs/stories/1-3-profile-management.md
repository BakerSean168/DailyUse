# Story 1.3: 个人资料管理

> **Story ID**: STORY-1.3  
> **Epic**: Epic 1 - Account & Authentication  
> **优先级**: P0  
> **Story Points**: 3  
> **状态**: Drafted  
> **创建时间**: 2025-10-28  
> **依赖**: Story 1.2 (用户登录与 Token 管理)

---

## 📖 User Story

**As a** 已登录用户  
**I want to** 查看和修改我的个人资料信息  
**So that** 我可以保持信息的准确性和个性化我的账户

---

## 🎯 验收标准

### AC-1: 查看个人资料
```gherkin
Given 已登录用户
When 访问个人资料页面 GET /api/accounts/me
Then 返回完整的用户信息
And 包含: uuid, username, email, displayName, phoneNumber, accountType, status
And 不包含敏感信息: hashedPassword, emailVerificationToken
```

### AC-2: 修改基本信息
```gherkin
Given 已登录用户
When 修改 displayName 为 "New Name"
Then PUT /api/accounts/me 成功
And 数据库更新 displayName
And 返回更新后的用户信息
```

### AC-3: 修改邮箱（需验证）
```gherkin
Given 已登录用户
When 修改邮箱为 "new@example.com"
Then 生成新的 emailVerificationToken
And isEmailVerified 设置为 false
And 返回成功消息 "Email updated. Please verify your new email."
```

### AC-4: 上传头像（Phase 2）
```gherkin
Note: Phase 1 暂不实现，预留 avatarUrl 字段
```

---

## 🔧 技术实现任务

### Backend Tasks (6 个)
1. 实现 `AccountProfileApplicationService.getProfile(accountUuid)`
2. 实现 `AccountProfileApplicationService.updateProfile(accountUuid, data)`
3. 实现 `GET /api/accounts/me` 端点（需认证）
4. 实现 `PUT /api/accounts/me` 端点（需认证）
5. 编写集成测试
6. 添加字段验证（displayName 最长50字符）

### Frontend Tasks (4 个)
1. 创建 `ProfilePage.vue` 组件
2. 实现查看模式和编辑模式切换
3. 实现个人资料 API 调用
4. 编写 E2E 测试

---

## 📊 DoD

- [ ] 所有测试通过（覆盖率 ≥ 80%）
- [ ] API 端点手动测试通过
- [ ] 前端组件功能完整
- [ ] Code Review 完成
- [ ] Sprint Status 更新为 "done"

---

**Story Owner**: Backend Team + Frontend Team  
**最后更新**: 2025-10-28  
**状态**: Drafted
