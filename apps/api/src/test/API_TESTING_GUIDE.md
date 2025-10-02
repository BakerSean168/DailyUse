# API 接口完整测试指南

## 🎯 测试目标
为每个 API 接口建立全面的测试覆盖，确保：
- ✅ **CRUD 操作正确性**
- ✅ **业务逻辑正确触发**
- ✅ **数据验证有效性**
- ✅ **错误处理完整性**
- ✅ **性能表现符合预期**
- ✅ **安全权限控制**

## 📋 测试分层策略

### 1. **基础 CRUD 测试** (必须)
```typescript
describe('CRUD 操作测试', () => {
  // 创建测试
  describe('POST /api/v1/resources', () => {
    it('应该成功创建有效资源');
    it('应该拒绝无效数据');
    it('应该验证必填字段');
    it('应该验证数据格式');
  });

  // 查询测试
  describe('GET /api/v1/resources', () => {
    it('应该返回用户的所有资源');
    it('应该支持分页查询');
    it('应该支持条件筛选');
    it('应该支持排序');
  });

  // 更新测试
  describe('PUT /api/v1/resources/:id', () => {
    it('应该成功更新资源');
    it('应该拒绝更新不存在的资源');
    it('应该验证权限');
  });

  // 删除测试
  describe('DELETE /api/v1/resources/:id', () => {
    it('应该成功删除资源');
    it('应该拒绝删除不存在的资源');
    it('应该验证权限');
  });
});
```

### 2. **业务逻辑测试** (核心)
```typescript
describe('业务逻辑测试', () => {
  describe('权限验证', () => {
    it('应该拒绝访问其他用户的资源');
    it('应该验证角色权限');
    it('应该检查操作权限');
  });

  describe('业务规则验证', () => {
    it('应该验证唯一性约束');
    it('应该验证数量限制');
    it('应该验证状态转换规则');
    it('应该验证关联关系');
  });

  describe('数据完整性', () => {
    it('应该维护关联数据一致性');
    it('应该正确处理级联操作');
    it('应该验证外键约束');
  });
});
```

### 3. **错误处理测试** (重要)
```typescript
describe('错误处理测试', () => {
  describe('认证错误', () => {
    it('应该返回401错误当没有认证时');
    it('应该返回401错误当token无效时');
    it('应该返回401错误当token过期时');
  });

  describe('授权错误', () => {
    it('应该返回403错误当权限不足时');
    it('应该返回403错误当访问被禁止资源时');
  });

  describe('数据验证错误', () => {
    it('应该返回400错误当数据无效时');
    it('应该返回详细的验证错误信息');
    it('应该验证请求格式');
  });

  describe('系统错误', () => {
    it('应该处理数据库连接错误');
    it('应该处理第三方服务错误');
    it('应该返回适当的错误码和信息');
  });
});
```

### 4. **性能测试** (可选但推荐)
```typescript
describe('性能测试', () => {
  describe('响应时间', () => {
    it('应该在合理时间内响应查询请求');
    it('应该在合理时间内响应创建请求');
    it('应该在合理时间内响应更新请求');
  });

  describe('并发处理', () => {
    it('应该能处理并发查询请求');
    it('应该能处理并发创建请求');
    it('应该正确处理资源竞争');
  });

  describe('数据量测试', () => {
    it('应该处理大量数据查询');
    it('应该支持分页性能优化');
    it('应该处理复杂查询条件');
  });
});
```

### 5. **数据一致性测试** (关键)
```typescript
describe('数据一致性测试', () => {
  describe('操作一致性', () => {
    it('创建资源后应该能立即查询到');
    it('更新资源后应该反映最新状态');
    it('删除资源后应该无法查询到');
  });

  describe('事务一致性', () => {
    it('应该正确处理事务回滚');
    it('应该维护数据完整性约束');
    it('应该处理并发事务冲突');
  });
});
```

## 🛠️ 实际使用方法

### 1. **快速创建测试**
```bash
# 运行单个模块测试
pnpm test goal.integration.test.ts

# 运行所有集成测试
pnpm test:run --grep "integration"

# 生成覆盖率报告
pnpm test:coverage
```

### 2. **使用测试助手**
```typescript
// 基础 CRUD 测试
const result = await ApiTestHelpers.crud.testCreate(
  request(app),
  '/api/v1/goals',
  authToken,
  goalData
);

// 业务逻辑测试
const result = await ApiTestHelpers.business.testValidation(
  request(app),
  '/api/v1/goals',
  authToken,
  invalidData
);

// 性能测试
const duration = await ApiTestHelpers.performance.testResponseTime(
  request(app),
  '/api/v1/goals',
  authToken
);
```

### 3. **Mock 数据设置**
```typescript
beforeEach(() => {
  // 重置数据
  resetMockData();
  
  // 设置测试数据
  setMockData('goal', [
    {
      uuid: 'test-goal-123',
      accountUuid: testAccountUuid,
      name: '测试目标',
      // ... 其他字段
    }
  ]);
});
```

## 📊 测试覆盖率目标

### **最低要求** (必须达到)
- **行覆盖率**: 80%+
- **分支覆盖率**: 75%+
- **函数覆盖率**: 90%+

### **理想目标** (努力方向)
- **行覆盖率**: 90%+
- **分支覆盖率**: 85%+
- **函数覆盖率**: 95%+

### **关键测试场景** (100% 必须覆盖)
- ✅ 所有 CRUD 操作的成功路径
- ✅ 所有错误处理路径
- ✅ 所有权限验证场景
- ✅ 所有业务规则验证

## 🎯 具体测试清单

### 对于每个 API 端点，确保测试：

#### **创建接口 (POST)**
- [ ] 成功创建有效资源
- [ ] 拒绝无效/缺失数据
- [ ] 验证数据格式和类型
- [ ] 检查唯一性约束
- [ ] 验证权限控制
- [ ] 检查数量限制
- [ ] 测试并发创建

#### **查询接口 (GET)**
- [ ] 返回正确的数据列表
- [ ] 支持分页参数
- [ ] 支持过滤条件
- [ ] 支持排序参数
- [ ] 验证权限隔离
- [ ] 处理空结果集
- [ ] 测试性能表现

#### **更新接口 (PUT/PATCH)**
- [ ] 成功更新有效数据
- [ ] 拒绝无效数据
- [ ] 验证资源存在性
- [ ] 检查权限控制
- [ ] 维护数据一致性
- [ ] 处理并发更新

#### **删除接口 (DELETE)**
- [ ] 成功删除资源
- [ ] 验证资源存在性
- [ ] 检查权限控制
- [ ] 处理级联删除
- [ ] 维护数据完整性

## 🔧 测试工具使用建议

### **1. Vitest 配置优化**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 使用单进程避免数据库冲突
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true }
    },
    // 增加超时时间处理数据库操作
    testTimeout: 30000,
    // 覆盖率配置
    coverage: {
      thresholds: {
        global: {
          branches: 75,
          functions: 90,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### **2. Mock 数据管理**
```typescript
// 在每个测试文件中
beforeEach(async () => {
  resetMockData();
  // 设置基础测试数据
  setMockData('account', [testAccount]);
  authToken = await ApiTestHelpers.createTestToken();
});
```

### **3. 错误验证模式**
```typescript
// 验证错误响应的标准模式
const response = await request(app)
  .post('/api/v1/resources')
  .set('Authorization', `Bearer ${authToken}`)
  .send(invalidData)
  .expect(400);

expect(response.body.success).toBe(false);
expect(response.body.code).toBe('VALIDATION_ERROR');
expect(response.body.message).toContain('expected error');
```

## 📈 持续改进建议

### **1. 定期测试审查**
- 每月检查测试覆盖率
- 分析失败测试的根本原因
- 更新测试用例以反映新需求

### **2. 测试性能监控**
- 跟踪测试执行时间
- 识别慢速测试并优化
- 监控测试环境稳定性

### **3. 测试数据管理**
- 维护现实的测试数据集
- 定期清理无用的测试数据
- 确保测试数据的隐私性

这套完整的测试策略将确保你的 API 接口具有高质量和可靠性！ 🚀